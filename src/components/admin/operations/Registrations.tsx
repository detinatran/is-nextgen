"use client";
import { FormEvent, useState, useMemo, useCallback } from "react";
import { ADMIN_API_BASE, adminApi, downloadAdmin, RegistrationItem, viTime } from "@/lib/admin/api";
import {
  Button,
  Field,
  inputClass,
  Notice,
  Panel,
  Table,
  useOperations,
  useResource,
} from "./common";
import AdminButton from "@/components/admin/ui/AdminButton";
import { Icon, IconTile, Pagination, Pill } from "@/components/admin/ui/kit";
import VideoReviewModal from "@/components/admin/candidate/VideoReviewModal";
import { useDebounce } from "@/hooks/useDebounce";


export default function Registrations() {
  const [search, setSearch] = useState(""),
    [school, setSchool] = useState(""),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10),
    [advanced, setAdvanced] = useState(false),
    [stateFilter, setStateFilter] = useState(""),
    [accountFilter, setAccountFilter] = useState(""),
    [videoFilter, setVideoFilter] = useState(""),
    [menuFor, setMenuFor] = useState<string | null>(null),
    [videoModalOpen, setVideoModalOpen] = useState(false),
    [selectedVideo, setSelectedVideo] = useState<{ candidateName: string; candidateCode: string; videoUrl: string } | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedSchool = useDebounce(school, 300);

  // Fetch all registrations (backend returns full array, we paginate client-side)
  const allRegistrations = useResource<RegistrationItem[]>(
    `admin/registrations?search=${encodeURIComponent(debouncedSearch)}&school=${encodeURIComponent(debouncedSchool)}`,
    [],
  );

  const [detail, setDetail] = useState<RegistrationItem | null>(null),
    [credentials, setCredentials] = useState<{
      identifier: string;
      email: string;
      password: string;
    } | null>(null);
  const op = useOperations(),
    [create, setCreate] = useState(false);

  // Lọc nâng cao (phía trình duyệt) + phân trang
  const accountOf = (r: RegistrationItem) =>
    r.deleted ? "DELETED" : !r.userId ? "NONE" : r.accountStatus === "ACTIVE" ? "ACTIVE" : r.accountStatus === "DISABLED" ? "DISABLED" : "PENDING";
  const filtered = useMemo(
    () =>
      allRegistrations.data.filter(
        (r) =>
          (!stateFilter || (r.state ?? "NONE") === stateFilter) &&
          (!accountFilter || accountOf(r) === accountFilter) &&
          (!videoFilter || (videoFilter === "yes") === !!r.videoId),
      ),
    [allRegistrations.data, stateFilter, accountFilter, videoFilter],
  );
  const totalItems = filtered.length;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Reset to page 1 when search/school changes
  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  const [prevSchool, setPrevSchool] = useState(debouncedSchool);
  if (debouncedSearch !== prevSearch || debouncedSchool !== prevSchool) {
    setPage(1);
    setPrevSearch(debouncedSearch);
    setPrevSchool(debouncedSchool);
  }

  // Unique schools for filter dropdown (from all data)
  const schools = useMemo(
    () => [...new Set(allRegistrations.data.map((r) => r.school).filter(Boolean))] as string[],
    [allRegistrations.data]
  );

  async function account(row: RegistrationItem, action: string) {
    let reason: string | undefined;
    if (action === "DELETE") {
      reason = window.prompt(`Lý do xoá tài khoản ${row.fullName}:`) ?? undefined;
      if (!reason?.trim()) return;
    }
    if (
      ["DISABLE", "RESET"].includes(action) &&
      !window.confirm(
        `${action === "RESET" ? "Cấp lại mật khẩu và huỷ phiên cũ" : "Khoá tài khoản"} cho ${row.fullName}?`,
      )
    )
      return;
    await op.run(async () => {
      const result = await adminApi<{
        identifier: string;
        email: string;
        password?: string;
      }>(`admin/candidates/${row.id}/account`, {
        method: "POST",
        body: JSON.stringify({ action, reason }),
      });
      setCredentials(
        result.password ? { ...result, password: result.password } : null,
      );
      await allRegistrations.reload();
    });
  }

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      fields = new FormData(form);
    void op.run(async () => {
      setCredentials(
        await adminApi("admin/candidates", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(fields)),
        }),
      );
      form.reset();
      setCreate(false);
      await allRegistrations.reload();
    });
  }

  const handleVideoReview = (row: RegistrationItem) => {
    if (row.videoId && row.registrationId) {
      setSelectedVideo({
        candidateName: row.fullName,
        candidateCode: row.candidateCode || "N/A",
        videoUrl: `${ADMIN_API_BASE}/admin/registrations/${row.registrationId}/video`,
      });
      setVideoModalOpen(true);
    }
  };

  const handleDuplicateCheck = () => {
    // Navigate to duplicate reviews page with current filtered data
    const params = new URLSearchParams({
      search: debouncedSearch,
      school: debouncedSchool,
    });
    window.location.href = `/admin/candidates/duplicate-reviews?${params.toString()}`;
  };

  const statePill = (r: RegistrationItem) =>
    r.state === "SUBMITTED" ? <Pill tone="green">Đã nộp</Pill> : r.state === "DRAFT" ? <Pill tone="slate">Bản nháp</Pill> : <Pill tone="slate">Chưa đăng ký</Pill>;
  const accountPill = (r: RegistrationItem) => {
    const a = accountOf(r);
    return a === "ACTIVE" ? <Pill tone="green">Hoạt động</Pill> : a === "DISABLED" ? <Pill tone="red">Đã khoá</Pill> : a === "DELETED" ? <Pill tone="red">Đã xoá</Pill> : a === "PENDING" ? <Pill tone="amber">Chưa kích hoạt</Pill> : <Pill tone="slate">Chưa có</Pill>;
  };
  const exportFile = (format: "csv" | "xlsx") =>
    void op.run(
      () =>
        downloadAdmin(
          `registrations/export?format=${format}&search=${encodeURIComponent(debouncedSearch)}&school=${encodeURIComponent(debouncedSchool)}`,
          `registrations.${format}`,
        ),
      format === "csv" ? "Đã xuất CSV." : "Đã xuất Excel.",
    );
  const clearFilters = () => {
    setSearch("");
    setSchool("");
    setStateFilter("");
    setAccountFilter("");
    setVideoFilter("");
    setPage(1);
  };
  const menuItem = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="space-y-6">
      <Notice message={allRegistrations.error || op.error} error />
      <Notice message={op.message} />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
          }}
        >
          <span className="hidden sm:block">
            <IconTile name="search" tone="blue" />
          </span>
          <div className="min-w-60 flex-1">
            <Field label="Tìm theo MSSV, họ tên, email hoặc mã thí sinh">
              <input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} maxLength={200} placeholder="Nhập từ khoá tìm kiếm..." />
            </Field>
          </div>
          <div className="w-full sm:w-56">
            <Field label="Trường">
              <select className={inputClass} value={school} onChange={(e) => setSchool(e.target.value)}>
                <option value="">Tất cả</option>
                {schools.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <Button type="submit" variant="dark" icon="search">
            Tìm kiếm
          </Button>
          <Button variant="outline" icon="refresh" onClick={clearFilters}>
            Xoá bộ lọc
          </Button>
        </form>
        <button type="button" onClick={() => setAdvanced((v) => !v)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F5BE0]">
          <Icon name="filter" className="h-4 w-4" /> Lọc nâng cao (tuỳ chọn)
          <Icon name="chevronDown" className={`h-4 w-4 transition ${advanced ? "rotate-180" : ""}`} />
        </button>
        {advanced && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Trạng thái hồ sơ">
              <select className={inputClass} value={stateFilter} onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}>
                <option value="">Tất cả</option>
                <option value="SUBMITTED">Đã nộp</option>
                <option value="DRAFT">Bản nháp</option>
              </select>
            </Field>
            <Field label="Tài khoản">
              <select className={inputClass} value={accountFilter} onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}>
                <option value="">Tất cả</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="PENDING">Chưa kích hoạt</option>
                <option value="NONE">Chưa có tài khoản</option>
                <option value="DISABLED">Đã khoá</option>
                <option value="DELETED">Đã xoá</option>
              </select>
            </Field>
            <Field label="Có video">
              <select className={inputClass} value={videoFilter} onChange={(e) => { setVideoFilter(e.target.value); setPage(1); }}>
                <option value="">Tất cả</option>
                <option value="yes">Có video</option>
                <option value="no">Chưa có video</option>
              </select>
            </Field>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button icon="plus" onClick={() => setCreate(!create)}>
          Cấp tài khoản mới
        </Button>
        <Button variant="outline" icon="users" onClick={handleDuplicateCheck} disabled={allRegistrations.loading}>
          Kiểm tra trùng lặp
        </Button>
        <span className="flex-1" />
        <Button variant="outline" icon="download" disabled={op.busy || allRegistrations.loading} onClick={() => exportFile("csv")}>
          Xuất CSV
        </Button>
        <Button variant="outline" icon="file" disabled={op.busy || allRegistrations.loading} onClick={() => exportFile("xlsx")}>
          Xuất Excel
        </Button>
      </div>

      <Panel
        title="Danh sách hồ sơ đăng ký"
        description={allRegistrations.loading ? "Đang tải hồ sơ…" : `Tổng ${totalItems} hồ sơ`}
      >
        <Table
          headers={["#", "Mã thí sinh / MSSV", "Họ tên / Email", "Trường", "Hồ sơ", "Tài khoản", "Video", "Thao tác"]}
          empty={{ icon: "users", title: "Không có hồ sơ phù hợp", description: "Thử đổi từ khoá hoặc bộ lọc." }}
          rows={paginatedData.map((r, i) => [
            <span key="n" className="text-slate-400 tabular-nums">{(page - 1) * pageSize + i + 1}</span>,
            <div key={r.id}>
              <span className="whitespace-nowrap font-mono text-[13px] font-semibold text-[#0B1F4D]">{r.candidateCode || "Chưa cấp mã"}</span>
              <div className="text-xs text-slate-500">{r.studentId}</div>
            </div>,
            <div key={r.id}>
              <span className="font-semibold text-[#0B1F4D]">{r.fullName}</span>
              <div className="text-xs text-slate-500">{r.email}</div>
            </div>,
            <span key="s" className="text-[13px]">{r.school}</span>,
            statePill(r),
            accountPill(r),
            r.videoId && r.registrationId ? (
              <button key="v" type="button" onClick={() => handleVideoReview(r)} disabled={op.busy} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#1F5BE0]/40 hover:text-[#1F5BE0]">
                <Icon name="video" className="h-4 w-4" /> Xem video
              </button>
            ) : (
              <span key="v" className="text-xs text-slate-400">Chưa có</span>
            ),
            <div key={r.id} className="relative flex items-center gap-2">
              <button type="button" onClick={() => setDetail(r)} className="whitespace-nowrap rounded-lg bg-[#1F5BE0] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#184bc0]">
                Chi tiết
              </button>
              {!r.deleted && (
                <button
                  type="button"
                  aria-label="Thao tác tài khoản"
                  onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                >
                  <Icon name="more" className="h-4 w-4" />
                </button>
              )}
              {menuFor === r.id && (
                <div className="absolute top-full right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl" onMouseLeave={() => setMenuFor(null)}>
                  {!r.userId ? (
                    <button type="button" className={menuItem} disabled={op.busy} onClick={() => { setMenuFor(null); void account(r, "PROVISION"); }}>
                      <Icon name="plus" className="h-4 w-4" /> Cấp tài khoản
                    </button>
                  ) : (
                    <>
                      <button type="button" className={menuItem} disabled={op.busy} onClick={() => { setMenuFor(null); void account(r, r.accountStatus === "ACTIVE" ? "DISABLE" : "ENABLE"); }}>
                        <Icon name="lock" className="h-4 w-4" /> {r.accountStatus === "ACTIVE" ? "Khoá tài khoản" : "Mở khoá"}
                      </button>
                      <button type="button" className={menuItem} disabled={op.busy} onClick={() => { setMenuFor(null); void account(r, "RESET"); }}>
                        <Icon name="refresh" className="h-4 w-4" /> Cấp lại mật khẩu
                      </button>
                      <button type="button" className={`${menuItem} text-rose-600`} disabled={op.busy} onClick={() => { setMenuFor(null); void account(r, "DELETE"); }}>
                        <Icon name="alert" className="h-4 w-4" /> Xoá tài khoản
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>,
          ])}
          footer={
            totalItems > 0 && (
              <Pagination
                page={page}
                pageSize={pageSize}
                total={totalItems}
                label="hồ sơ"
                onPage={setPage}
                onPageSize={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
              />
            )
          }
        />
      </Panel>

      {create && (
        <Panel title="Cấp tài khoản thí sinh" icon="plus">
          <form onSubmit={add} className="grid sm:grid-cols-2 gap-4">
            {[
              ["fullName", "Họ tên"],
              ["email", "Email"],
              ["studentId", "MSSV"],
              ["school", "Trường"],
            ].map(([name, label]) => (
              <Field label={label} key={name}>
                <input
                  required
                  type={name === "email" ? "email" : "text"}
                  className={inputClass}
                  name={name}
                  maxLength={name === "email" ? 255 : 200}
                />
              </Field>
            ))}
            <AdminButton type="submit" disabled={op.busy}>
              Cấp tài khoản
            </AdminButton>
          </form>
        </Panel>
      )}

      {credentials && (
        <Panel title="Thông tin đăng nhập vừa cấp" icon="lock" tone="amber">
          <p className="text-sm text-slate-500">
            Lưu thông tin để chuyển cho thí sinh. Mật khẩu chỉ xuất hiện trong
            lần cấp này.
          </p>
          <p>
            Tài khoản: <strong>{credentials.identifier}</strong>
          </p>
          <p>Email: {credentials.email}</p>
          <p className="break-all font-mono">
            Mật khẩu: {credentials.password}
          </p>
          <div className="flex gap-2">
            <AdminButton
              onClick={() =>
                void op.run(
                  () =>
                    navigator.clipboard.writeText(
                      `Tài khoản: ${credentials.identifier}\nEmail: ${credentials.email}\nMật khẩu: ${credentials.password}`,
                    ),
                  "Đã sao chép.",
                )
              }
            >
              Sao chép
            </AdminButton>
            <AdminButton onClick={() => setCredentials(null)}>Ẩn thông tin</AdminButton>
          </div>
        </Panel>
      )}

      {detail && (
        <Panel title={`Hồ sơ · ${detail.fullName}`} icon="id" actions={<Button variant="outline" onClick={() => setDetail(null)}>Đóng</Button>}>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            {[
              ["Mã thí sinh", detail.candidateCode],
              ["MSSV", detail.studentId],
              ["Ngày sinh", detail.dateOfBirth?.slice(0, 10)],
              ["Trường", detail.school],
              ["Khoa/viện", detail.department],
              ["Ngành", detail.major],
              ["Email", detail.email],
              ["Điện thoại", detail.phone],
              ["Facebook", detail.facebook],
              ["Nộp lúc", viTime(detail.submittedAt)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium break-all">{v || "—"}</dd>
              </div>
            ))}
          </dl>
          {detail.videoId && detail.registrationId ? (
            <video
              key={detail.videoId}
              controls
              preload="metadata"
              className="w-full max-h-96 rounded-lg bg-black"
              src={`${ADMIN_API_BASE}/admin/registrations/${detail.registrationId}/video`}
            />
          ) : (
            <p className="text-sm text-slate-500">Chưa có video đã nộp.</p>
          )}
          <AdminButton onClick={() => setDetail(null)}>Đóng</AdminButton>
        </Panel>
      )}

      {/* Video Review Modal */}
      <VideoReviewModal
        isOpen={videoModalOpen}
        onClose={() => {
          setVideoModalOpen(false);
          setSelectedVideo(null);
        }}
        candidateName={selectedVideo?.candidateName || ""}
        candidateCode={selectedVideo?.candidateCode || ""}
        videoUrl={selectedVideo?.videoUrl}
        media={selectedVideo
          ? {
              id: "temp",
              upload_id: "temp",
              registration_id: "temp",
              object_key: "",
              mime_type: "video/mp4",
              size_bytes: 0,
              duration_seconds: 0,
              checksum_sha256: "",
              is_private: true,
              validated_at: new Date().toISOString(),
              sealed_at: new Date().toISOString(),
            }
          : null}
      />
    </div>
  );
}