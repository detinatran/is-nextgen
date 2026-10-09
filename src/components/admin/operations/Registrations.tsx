"use client";
import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ADMIN_API_BASE, adminApi, downloadAdmin, RegistrationItem, viTime } from "@/lib/admin/api";
import { Button, Field, inputClass, Notice, Table, useOperations, useResource } from "./common";
import { Callout, DetailList, Drawer, Icon, PageHeader, Pagination, RowMenu, status, useConfirm } from "@/components/admin/ui/kit";
import { useDebounce } from "@/hooks/useDebounce";
import { tr } from "@/lib/i18n/tr";

type Account = "ACTIVE" | "PENDING" | "NONE" | "DISABLED" | "DELETED";
const accountOf = (r: RegistrationItem): Account =>
  r.deleted ? "DELETED" : !r.userId ? "NONE" : r.accountStatus === "ACTIVE" ? "ACTIVE" : r.accountStatus === "DISABLED" ? "DISABLED" : "PENDING";
// getter: nhãn được dịch theo ngôn ngữ lúc render, không cố định lúc nạp file
const accountPill = {
  get ACTIVE() { return status.active; },
  get PENDING() { return status.pendingActivation; },
  get NONE() { return status.noAccount; },
  get DISABLED() { return status.locked; },
  get DELETED() { return status.deleted; },
};
const statePill = (r: RegistrationItem) => (r.state === "SUBMITTED" ? status.submitted : r.state === "DRAFT" ? status.draft : <span className="text-[13px] text-adm-muted">{tr("Chưa đăng ký")}</span>);

type Credentials = { identifier: string; email: string; password: string };

export default function Registrations() {
  const [search, setSearch] = useState(""),
    [school, setSchool] = useState(""),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(20),
    [advanced, setAdvanced] = useState(false),
    [stateFilter, setStateFilter] = useState(""),
    [accountFilter, setAccountFilter] = useState(""),
    [videoFilter, setVideoFilter] = useState(""),
    [detail, setDetail] = useState<RegistrationItem | null>(null),
    [create, setCreate] = useState(false),
    [credentials, setCredentials] = useState<Credentials | null>(null);
  const confirm = useConfirm();
  const op = useOperations();

  const debouncedSearch = useDebounce(search, 300);
  const debouncedSchool = useDebounce(school, 300);
  const all = useResource<RegistrationItem[]>(`admin/registrations?search=${encodeURIComponent(debouncedSearch)}&school=${encodeURIComponent(debouncedSchool)}`, []);

  const filtered = useMemo(
    () =>
      all.data.filter(
        (r) => (!stateFilter || (r.state ?? "NONE") === stateFilter) && (!accountFilter || accountOf(r) === accountFilter) && (!videoFilter || (videoFilter === "yes") === !!r.videoId),
      ),
    [all.data, stateFilter, accountFilter, videoFilter],
  );
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const [schools, setSchools] = useState<string[]>([]);
  // Danh sách trường lấy từ lần tải không lọc trường để không mất lựa chọn khi đã chọn một trường
  if (!debouncedSchool && all.data.length) {
    const s = [...new Set(all.data.map((r) => r.school).filter(Boolean))].sort() as string[];
    if (s.join("|") !== schools.join("|")) setSchools(s);
  }
  const filtering = !!(search || school || stateFilter || accountFilter || videoFilter);
  const advancedCount = [stateFilter, accountFilter, videoFilter].filter(Boolean).length;

  async function account(row: RegistrationItem, action: "PROVISION" | "ENABLE" | "DISABLE" | "RESET" | "DELETE") {
    const copy = {
      PROVISION: { title: tr("Cấp tài khoản"), description: tr("Tạo tài khoản đăng nhập cho {0} và hiển thị mật khẩu một lần.", row.fullName), confirmText: tr("Cấp tài khoản") },
      ENABLE: { title: tr("Mở khoá tài khoản"), description: tr("{0} sẽ đăng nhập lại được.", row.fullName), confirmText: tr("Mở khoá") },
      DISABLE: { title: tr("Khoá tài khoản"), description: tr("{0} sẽ không đăng nhập được cho tới khi mở khoá. Phiên đang đăng nhập bị huỷ.", row.fullName), confirmText: tr("Khoá tài khoản"), danger: true },
      RESET: { title: tr("Cấp lại mật khẩu"), description: tr("Tạo mật khẩu mới cho {0} và huỷ mọi phiên đăng nhập cũ.", row.fullName), confirmText: tr("Cấp lại mật khẩu") },
      DELETE: { title: tr("Xoá tài khoản"), description: tr("Tài khoản của {0} sẽ bị vô hiệu vĩnh viễn. Hồ sơ đăng ký vẫn được giữ.", row.fullName), confirmText: tr("Xoá tài khoản"), danger: true, reason: { label: tr("Lý do xoá"), required: true } },
    }[action];
    const r = await confirm(copy);
    if (!r.ok) return;
    await op.run(
      async () => {
        const result = await adminApi<{ identifier: string; email: string; password?: string }>(`admin/candidates/${row.id}/account`, {
          method: "POST",
          body: JSON.stringify({ action, reason: r.reason }),
        });
        setCredentials(result.password ? { ...result, password: result.password } : null);
        await all.reload();
      },
      { PROVISION: tr("Đã cấp tài khoản."), ENABLE: tr("Đã mở khoá tài khoản."), DISABLE: tr("Đã khoá tài khoản."), RESET: tr("Đã cấp lại mật khẩu."), DELETE: tr("Đã xoá tài khoản.") }[action],
    );
  }

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      fields = new FormData(form);
    void op.run(async () => {
      setCredentials(await adminApi("admin/candidates", { method: "POST", body: JSON.stringify(Object.fromEntries(fields)) }));
      form.reset();
      setCreate(false);
      await all.reload();
    }, tr("Đã cấp tài khoản mới."));
  }

  const exportFile = (format: "csv" | "xlsx") =>
    void op.run(
      () => downloadAdmin(`registrations/export?format=${format}&search=${encodeURIComponent(debouncedSearch)}&school=${encodeURIComponent(debouncedSchool)}`, `registrations.${format}`),
      format === "csv" ? tr("Đã xuất CSV.") : tr("Đã xuất Excel."),
    );
  const clearFilters = () => {
    setSearch("");
    setSchool("");
    setStateFilter("");
    setAccountFilter("");
    setVideoFilter("");
    setPage(1);
  };
  const menuFor = (r: RegistrationItem) => {
    if (r.deleted) return [];
    if (!r.userId) return [{ label: tr("Cấp tài khoản"), onClick: () => void account(r, "PROVISION"), disabled: op.busy }];
    return [
      { label: r.accountStatus === "DISABLED" ? tr("Mở khoá tài khoản") : tr("Khoá tài khoản"), onClick: () => void account(r, r.accountStatus === "DISABLED" ? "ENABLE" : "DISABLE"), disabled: op.busy },
      { label: tr("Cấp lại mật khẩu"), onClick: () => void account(r, "RESET"), disabled: op.busy },
      { label: tr("Xoá tài khoản"), onClick: () => void account(r, "DELETE"), danger: true, disabled: op.busy },
    ];
  };
  const dupHref = `/admin/candidates/duplicate-reviews?${new URLSearchParams({ search: debouncedSearch, school: debouncedSchool })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr("Hồ sơ đăng ký")}
        icon="users"
        description={tr("Tra cứu hồ sơ thí sinh, xem video giới thiệu và quản lý tài khoản dự thi.")}
        actions={
          <>
            <Link href={dupHref} className="inline-flex h-10 items-center rounded-lg border border-adm-border bg-white px-4 text-sm font-medium text-adm-text hover:bg-slate-50">
              {tr("Kiểm tra trùng lặp")}</Link>
            <Button variant="secondary" icon="download" disabled={op.busy || all.loading} onClick={() => exportFile("xlsx")}>
              Excel
            </Button>
            <Button variant="secondary" disabled={op.busy || all.loading} onClick={() => exportFile("csv")}>
              CSV
            </Button>
            <Button icon="plus" onClick={() => setCreate(true)}>
              {tr("Cấp tài khoản mới")}</Button>
          </>
        }
      />

      <Notice message={op.error} error />
      <Notice message={op.message} />
      {credentials && (
        <Callout
          tone="warning"
          title={tr("Thông tin đăng nhập vừa cấp — chỉ hiển thị một lần")}
          action={
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void op.run(() => navigator.clipboard.writeText(tr("Tài khoản: {0}\nEmail: {1}\nMật khẩu: {2}", credentials.identifier, credentials.email, credentials.password)), tr("Đã sao chép."))}
              >
                {tr("Sao chép")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setCredentials(null)}>
                {tr("Ẩn")}</Button>
            </div>
          }
        >
          <span className="text-adm-text">
            {tr("Tài khoản")}{" "}<strong>{credentials.identifier}</strong> · {credentials.email} {" "}{tr("· Mật khẩu")}{" "}<code className="rounded bg-white px-1.5 py-0.5 font-mono">{credentials.password}</code>
          </span>
        </Callout>
      )}

      <section className="rounded-xl border border-adm-border bg-white">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <label className="relative min-w-60 flex-1">
            <span className="sr-only">{tr("Tìm kiếm hồ sơ")}</span>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-adm-muted" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} maxLength={200} placeholder={tr("Tìm theo họ tên, MSSV, email hoặc mã thí sinh")} />
          </label>
          <label className="w-full sm:w-60">
            <span className="sr-only">{tr("Trường")}</span>
            <select className={inputClass} value={school} onChange={(e) => { setSchool(e.target.value); setPage(1); }}>
              <option value="">{tr("Tất cả trường")}</option>
              {schools.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <Button variant="secondary" icon="filter" onClick={() => setAdvanced((v) => !v)}>
            {tr("Bộ lọc")}{advancedCount ? ` (${advancedCount})` : ""}
          </Button>
          {filtering && (
            <Button variant="ghost" onClick={clearFilters}>
              {tr("Xoá lọc")}</Button>
          )}
        </div>
        {advanced && (
          <div className="grid gap-3 border-t border-adm-border p-4 sm:grid-cols-3">
            <Field label={tr("Trạng thái hồ sơ")}>
              <select className={inputClass} value={stateFilter} onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}>
                <option value="">{tr("Tất cả")}</option>
                <option value="SUBMITTED">{tr("Đã nộp")}</option>
                <option value="DRAFT">{tr("Bản nháp")}</option>
              </select>
            </Field>
            <Field label={tr("Tài khoản")}>
              <select className={inputClass} value={accountFilter} onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}>
                <option value="">{tr("Tất cả")}</option>
                <option value="ACTIVE">{tr("Hoạt động")}</option>
                <option value="PENDING">{tr("Chưa kích hoạt")}</option>
                <option value="NONE">{tr("Chưa có tài khoản")}</option>
                <option value="DISABLED">{tr("Đã khoá")}</option>
                <option value="DELETED">{tr("Đã xoá")}</option>
              </select>
            </Field>
            <Field label={tr("Video giới thiệu")}>
              <select className={inputClass} value={videoFilter} onChange={(e) => { setVideoFilter(e.target.value); setPage(1); }}>
                <option value="">{tr("Tất cả")}</option>
                <option value="yes">{tr("Đã nộp video")}</option>
                <option value="no">{tr("Chưa có video")}</option>
              </select>
            </Field>
          </div>
        )}
      </section>

      {all.error ? (
        <Notice message={tr("Không tải được hồ sơ: {0}", all.error)} error onRetry={all.reload} />
      ) : (
        <Table
          loading={all.loading}
          headers={[tr("Mã thí sinh"), tr("Họ tên"), tr("Trường"), tr("Hồ sơ"), tr("Tài khoản"), "Video", ""]}
          empty={
            filtering
              ? { icon: "search", title: tr("Không có hồ sơ phù hợp"), description: tr("Thử đổi từ khoá hoặc bộ lọc."), action: <Button variant="secondary" onClick={clearFilters}>{tr("Xoá bộ lọc")}</Button> }
              : { icon: "users", title: tr("Chưa có hồ sơ đăng ký"), description: tr("Hồ sơ sẽ xuất hiện khi thí sinh đăng ký trên trang chính.") }
          }
          rows={pageRows.map((r) => [
            <div key="c">
              <span className="font-mono text-[13px] font-medium whitespace-nowrap text-adm-text">{r.candidateCode || "—"}</span>
              <div className="text-xs text-adm-sub">{r.studentId}</div>
            </div>,
            <div key="n" className="min-w-0">
              <span className="font-medium text-adm-text">{r.fullName}</span>
              <div className="max-w-[260px] truncate text-xs text-adm-sub">{r.email}</div>
            </div>,
            <span key="s" className="line-clamp-2 max-w-[220px] text-[13px] text-adm-sub">
              {r.school || "—"}
            </span>,
            statePill(r),
            accountPill[accountOf(r)],
            r.videoId && r.registrationId ? (
              <button key="v" type="button" onClick={() => setDetail(r)} className="text-[13px] font-medium whitespace-nowrap text-adm-primary hover:underline">
                {tr("Xem video")}
              </button>
            ) : (
              <span key="v" className="text-[13px] text-adm-muted">{tr("Chưa có")}</span>
            ),
            <div key="a" className="flex items-center justify-end gap-1">
              <Button size="sm" variant="secondary" onClick={() => setDetail(r)}>
                {tr("Chi tiết")}</Button>
              <RowMenu label={tr("Thao tác tài khoản {0}", r.fullName)} items={menuFor(r)} />
            </div>,
          ])}
          footer={
            filtered.length > 0 && (
              <Pagination
                page={page}
                pageSize={pageSize}
                total={filtered.length}
                label={tr("hồ sơ")}
                onPage={setPage}
                onPageSize={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
              />
            )
          }
        />
      )}

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.fullName ?? ""}
        subtitle={detail ? [detail.candidateCode, detail.email].filter(Boolean).join(" · ") : undefined}
        footer={
          detail && (
            <>
              <RowMenu label={tr("Thao tác tài khoản")} items={menuFor(detail).map((it) => ({ ...it, onClick: () => { setDetail(null); it.onClick(); } }))} />
              <Button variant="secondary" onClick={() => setDetail(null)}>
                {tr("Đóng")}</Button>
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {statePill(detail)}
              {accountPill[accountOf(detail)]}
            </div>
            <DetailList
              items={[
                [tr("Mã thí sinh"), detail.candidateCode],
                [tr("MSSV"), detail.studentId],
                [tr("Ngày sinh"), detail.dateOfBirth ? new Date(detail.dateOfBirth).toLocaleDateString("vi-VN") : null],
                [tr("Điện thoại"), detail.phone],
                [tr("Trường"), detail.school],
                [tr("Khoa/Viện"), detail.department],
                [tr("Ngành"), detail.major],
                ["Facebook", detail.facebook],
                ["Email", detail.email],
                [tr("Nộp hồ sơ lúc"), detail.submittedAt ? viTime(detail.submittedAt) : null],
              ]}
            />
            <div>
              <h3 className="mb-2 text-sm font-semibold text-adm-text">{tr("Video giới thiệu")}</h3>
              {detail.videoId && detail.registrationId ? (
                <video key={detail.videoId} controls preload="metadata" className="aspect-video w-full rounded-lg bg-black" src={`${ADMIN_API_BASE}/admin/registrations/${detail.registrationId}/video`} />
              ) : (
                <p className="rounded-lg border border-dashed border-adm-border px-4 py-6 text-center text-[13px] text-adm-sub">{tr("Thí sinh chưa nộp video.")}</p>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        open={create}
        onClose={() => setCreate(false)}
        title={tr("Cấp tài khoản mới")}
        subtitle={tr("Tạo hồ sơ và tài khoản cho thí sinh đăng ký trực tiếp với BTC")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreate(false)}>
              {tr("Huỷ")}</Button>
            <Button type="submit" form="create-candidate" loading={op.busy}>
              {tr("Cấp tài khoản")}</Button>
          </>
        }
      >
        <form id="create-candidate" onSubmit={add} className="space-y-4">
          {[
            ["fullName", tr("Họ tên")],
            ["email", "Email"],
            ["studentId", tr("MSSV")],
            ["school", tr("Trường")],
          ].map(([name, label]) => (
            <Field label={label} key={name} required>
              <input required type={name === "email" ? "email" : "text"} className={inputClass} name={name} maxLength={name === "email" ? 255 : 200} />
            </Field>
          ))}
          <p className="text-xs text-adm-sub">{tr("Mật khẩu được tạo tự động và chỉ hiển thị một lần sau khi cấp.")}</p>
        </form>
      </Drawer>
    </div>
  );
}
