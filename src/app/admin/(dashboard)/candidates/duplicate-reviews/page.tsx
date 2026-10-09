"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminApi, RegistrationItem, viTime } from "@/lib/admin/api";
import { duplicateFieldLabel, findDuplicates, type DuplicateField } from "@/lib/admin/duplicates";
import { useResource, useOperations, Notice, Button, inputClass } from "@/components/admin/operations/common";
import { Callout, EmptyState, Icon, PageHeader, Pill, Skeleton, StatCard, Tabs, useConfirm } from "@/components/admin/ui/kit";
import { tr } from "@/lib/i18n/tr";

const compareRows: [string, (r: RegistrationItem) => string | null][] = [
  ["Mã thí sinh", (r) => r.candidateCode],
  ["MSSV", (r) => r.studentId],
  ["Email", (r) => r.email],
  ["Điện thoại", (r) => r.phone],
  ["Facebook", (r) => r.facebook],
  ["Trường", (r) => r.school],
  ["Hồ sơ", (r) => (r.state === "SUBMITTED" ? tr("Đã nộp") : r.state === "DRAFT" ? tr("Bản nháp") : tr("Chưa đăng ký"))],
  ["Tài khoản", (r) => (!r.userId ? tr("Chưa có") : r.accountStatus === "ACTIVE" ? tr("Hoạt động") : r.accountStatus === "DISABLED" ? tr("Đã khoá") : tr("Chưa kích hoạt"))],
  ["Video", (r) => (r.videoId ? tr("Đã nộp") : tr("Chưa có"))],
  ["Thời điểm nộp", (r) => (r.submittedAt ? viTime(r.submittedAt) : null)],
];

function DuplicateReviewsPage() {
  const params = useSearchParams();
  const search = params.get("search") ?? "";
  const school = params.get("school") ?? "";
  const registrations = useResource<RegistrationItem[]>(`admin/registrations?search=${encodeURIComponent(search)}&school=${encodeURIComponent(school)}`, []);
  const confirm = useConfirm();
  const [tab, setTab] = useState<"" | DuplicateField>("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  // Quyết định giữ hồ sơ được lưu trong hệ thống (bảng admin_duplicate_decisions), cả BTC cùng thấy
  const saved = useResource<Record<string, { candidateId: string }>>("admin/duplicate-decisions", {});
  const decisions = useMemo(() => Object.fromEntries(Object.entries(saved.data).map(([k, v]) => [k, v.candidateId])), [saved.data]);
  const op = useOperations();

  const groups = useMemo(() => findDuplicates(registrations.data), [registrations.data]);
  const counts = groups.reduce<Record<string, number>>((m, g) => ({ ...m, [g.field]: (m[g.field] ?? 0) + 1 }), {});
  const reviewed = groups.filter((g) => g.candidates.some((c) => c.id === decisions[g.id])).length;
  const needle = query.trim().toLowerCase();
  const shown = groups.filter(
    (g) => (!tab || g.field === tab) && (!needle || g.value.includes(needle) || g.candidates.some((c) => [c.fullName, c.email, c.studentId, c.candidateCode].some((v) => v?.toLowerCase().includes(needle)))),
  );

  async function keep(groupId: string, c: RegistrationItem) {
    const r = await confirm({
      title: tr("Chọn hồ sơ giữ lại"),
      description: (
        <>
          {tr("Đánh dấu")}{" "}<strong className="text-adm-text">{c.fullName}</strong> ({c.candidateCode || c.email}{tr(") là hồ sơ chính thức của nhóm này. Lựa chọn được lưu trong hệ thống để cả Ban Tổ chức cùng thấy; hồ sơ và tài khoản thí sinh không thay đổi.")}</>
      ),
      confirmText: tr("Giữ hồ sơ này"),
    });
    if (!r.ok) return;
    void op.run(async () => {
      await adminApi("admin/duplicate-decisions", { method: "PUT", body: JSON.stringify({ groupKey: groupId, candidateId: c.id }) });
      await saved.reload();
    }, tr("Đã ghi nhận giữ hồ sơ {0}.", c.fullName));
  }
  function undo(groupId: string) {
    void op.run(async () => {
      await adminApi(`admin/duplicate-decisions?groupKey=${encodeURIComponent(groupId)}`, { method: "DELETE" });
      await saved.reload();
    }, tr("Đã bỏ chọn."));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr("Kiểm tra trùng lặp")}
        icon="search"
        tone="red"
        description={tr("Hồ sơ có cùng MSSV, email, số điện thoại hoặc Facebook. So sánh và đánh dấu hồ sơ chính thức; khoá hoặc xoá tài khoản thừa ở trang Hồ sơ đăng ký.")}
        actions={
          <Link href="/admin/candidates" className="inline-flex h-10 items-center gap-2 rounded-lg border border-adm-border bg-white px-4 text-sm font-medium text-adm-text hover:bg-slate-50">
            <Icon name="arrowLeft" /> {" "}{tr("Hồ sơ đăng ký")}</Link>
        }
      />
      <Notice message={registrations.error || saved.error || op.error} error onRetry={registrations.reload} />
      <Notice message={op.message} />
      {(search || school) && (
        <Callout title={tr("Đang rà soát trong phạm vi bộ lọc")}>
          {search && <>{tr("Từ khoá “")}{search}”. </>}
          {school && <>{tr("Trường “")}{school}”. </>}
          <Link href="/admin/candidates/duplicate-reviews" className="font-medium text-adm-primary hover:underline">
            {tr("Xem toàn bộ")}</Link>
        </Callout>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard loading={registrations.loading} icon="layers" tone="red" label={tr("Nhóm trùng")} value={groups.length} hint={tr("trên {0} hồ sơ", registrations.data.length)} />
        <StatCard loading={registrations.loading} icon="checkCircle" tone="green" label={tr("Đã rà soát")} value={reviewed} hint={tr("Đã chọn hồ sơ giữ lại")} />
        <StatCard loading={registrations.loading} icon="alert" tone="amber" label={tr("Chưa xử lý")} value={groups.length - reviewed} />
      </div>

      <section className="rounded-xl border border-adm-border bg-white">
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-3">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[{ value: "" as const, label: tr("Tất cả"), count: groups.length }, ...(["studentId", "email", "phone", "facebook"] as const).map((f) => ({ value: f, label: tr(duplicateFieldLabel[f]), count: counts[f] ?? 0 }))]}
          />
          <label className="relative mb-3 w-full sm:w-72">
            <span className="sr-only">{tr("Tìm trong nhóm trùng")}</span>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-adm-muted" />
            <input className={`${inputClass} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("Tìm MSSV, email, họ tên…")} />
          </label>
        </div>

        {registrations.loading && !groups.length ? (
          <div className="space-y-2 border-t border-adm-border p-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !shown.length ? (
          <div className="border-t border-adm-border">
            <EmptyState icon="checkCircle" title={groups.length ? tr("Không có nhóm phù hợp") : tr("Không có hồ sơ trùng")} description={groups.length ? tr("Thử đổi tab hoặc từ khoá.") : tr("Chưa phát hiện hồ sơ trùng theo các tiêu chí hiện tại.")} />
          </div>
        ) : (
          <ul className="divide-y divide-adm-border border-t border-adm-border">
            {shown.map((g) => {
              const kept = g.candidates.find((c) => c.id === decisions[g.id]);
              const isOpen = !!open[g.id];
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen((m) => ({ ...m, [g.id]: !isOpen }))}
                    className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-adm-primary/40"
                  >
                    <Icon name="chevronRight" className={`text-adm-muted transition motion-reduce:transition-none ${isOpen ? "rotate-90" : ""}`} />
                    <span className="w-28 shrink-0 text-[13px] text-adm-sub">{tr(duplicateFieldLabel[g.field])}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-adm-text">{g.value}</span>
                    <span className="hidden text-[13px] text-adm-sub tabular-nums sm:block">{g.candidates.length} {" "}{tr("hồ sơ")}</span>
                    {kept ? <Pill tone="green">{tr("Đã chọn giữ lại")}</Pill> : <Pill tone="amber">{tr("Chưa xử lý")}</Pill>}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5">
                      <div className="overflow-x-auto rounded-lg border border-adm-border">
                        <table className="w-full min-w-[560px] text-left text-sm">
                          <thead className="bg-adm-bg text-xs font-semibold text-adm-sub">
                            <tr>
                              <th scope="col" className="w-36 px-4 py-2.5">
                                {tr("Thông tin")}</th>
                              {g.candidates.map((c) => (
                                <th key={c.id} scope="col" className={`px-4 py-2.5 ${kept?.id === c.id ? "bg-emerald-50/70" : ""}`}>
                                  <span className="block text-sm font-semibold text-adm-text">{c.fullName}</span>
                                  {kept?.id === c.id && <span className="font-medium text-adm-success">{tr("Hồ sơ giữ lại")}</span>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {compareRows.map(([label, get]) => {
                              const values = g.candidates.map(get);
                              const differs = new Set(values.map((v) => v ?? "")).size > 1;
                              return (
                                <tr key={label} className="border-t border-adm-border">
                                  <th scope="row" className="px-4 py-2 text-[13px] font-medium text-adm-sub">
                                    {tr(label)}
                                  </th>
                                  {values.map((v, i) => (
                                    <td key={g.candidates[i].id} className={`px-4 py-2 break-all text-[13px] ${differs ? "text-adm-text" : "text-adm-sub"} ${kept?.id === g.candidates[i].id ? "bg-emerald-50/40" : ""}`}>
                                      {v || "—"}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                            <tr className="border-t border-adm-border">
                              <td />
                              {g.candidates.map((c) => (
                                <td key={c.id} className="px-4 py-3">
                                  {kept?.id === c.id ? (
                                    <Button size="sm" variant="ghost" disabled={op.busy} onClick={() => undo(g.id)}>
                                      {tr("Bỏ chọn")}</Button>
                                  ) : (
                                    <Button size="sm" variant="secondary" disabled={op.busy} onClick={() => void keep(g.id, c)}>
                                      {tr("Giữ hồ sơ này")}</Button>
                                  )}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-xs text-adm-muted">{tr("Lựa chọn được lưu trong hệ thống; hồ sơ và tài khoản thí sinh không thay đổi. Khoá/xoá tài khoản thừa ở trang Hồ sơ đăng ký.")}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <DuplicateReviewsPage />
    </Suspense>
  );
}
