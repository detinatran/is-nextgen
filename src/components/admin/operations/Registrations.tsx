"use client";
import { FormEvent, useState, useMemo, useCallback } from "react";
import { adminApi, downloadAdmin, RegistrationItem, viTime } from "@/lib/admin/api";
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
import VideoReviewModal from "@/components/admin/candidate/VideoReviewModal";
import { useDebounce } from "@/hooks/useDebounce";

const ITEMS_PER_PAGE = 20;

export default function Registrations() {
  const [search, setSearch] = useState(""),
    [school, setSchool] = useState(""),
    [page, setPage] = useState(1),
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

  // Client-side pagination
  const totalItems = allRegistrations.data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedData = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return allRegistrations.data.slice(start, start + ITEMS_PER_PAGE);
  }, [allRegistrations.data, page]);

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
        videoUrl: `/api/v1/admin/registrations/${row.registrationId}/video`,
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

  return (
    <div className="space-y-6">
      <Notice message={allRegistrations.error || op.error} error />
      <Notice message={op.message} />

      <Panel title="Hồ sơ đăng ký & tài khoản thí sinh">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
          }}
        >
          <div className="flex-1 min-w-60">
            <Field label="Tìm theo MSSV, họ tên, email hoặc mã thí sinh">
              <input
                className={inputClass}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={200}
                placeholder="Nhập từ khóa tìm kiếm..."
              />
            </Field>
          </div>
          <Field label="Trường">
            <select
              className={inputClass}
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            >
              <option value="">Tất cả</option>
              {schools.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <AdminButton type="submit">Tìm kiếm</AdminButton>
          <AdminButton onClick={() => setCreate(!create)}>Cấp tài khoản mới</AdminButton>
          <AdminButton variant="outline" onClick={handleDuplicateCheck} disabled={allRegistrations.loading}>
            Kiểm tra trùng lặp
          </AdminButton>
        </form>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={op.busy || allRegistrations.loading}
            onClick={() =>
              void op.run(
                () =>
                  downloadAdmin(
                    `registrations/export?format=csv&search=${encodeURIComponent(debouncedSearch)}&school=${encodeURIComponent(debouncedSchool)}`,
                    "registrations.csv",
                  ),
                "Đã xuất CSV.",
              )
            }
          >
            Xuất CSV
          </Button>
          <Button
            disabled={op.busy || allRegistrations.loading}
            onClick={() =>
              void op.run(
                () =>
                  downloadAdmin(
                    `registrations/export?format=xlsx&search=${encodeURIComponent(debouncedSearch)}&school=${encodeURIComponent(debouncedSchool)}`,
                    "registrations.xlsx",
                  ),
                "Đã xuất Excel.",
              )
            }
          >
            Xuất Excel
          </Button>
        </div>

        {allRegistrations.loading && (
          <p role="status" className="text-sm text-slate-500">
            Đang tải hồ sơ…
          </p>
        )}

        <Table
          headers={[
            "Mã thí sinh / MSSV",
            "Họ tên / Email",
            "Trường",
            "Hồ sơ",
            "Tài khoản",
            "Video",
            "Thao tác",
          ]}
          rows={paginatedData.map((r) => [
            <div key={r.id}>
              {r.candidateCode || "Chưa cấp mã"}
              <div className="text-slate-500">{r.studentId}</div>
            </div>,
            <div key={r.id}>
              {r.fullName}
              <div className="text-slate-500">{r.email}</div>
            </div>,
            r.school,
            r.state === "SUBMITTED"
              ? "Đã nộp"
              : r.state === "DRAFT"
                ? "Bản nháp"
                : "Chưa đăng ký",
            r.deleted
              ? "Đã xoá"
              : r.accountStatus === "ACTIVE"
                ? "Hoạt động"
                : r.accountStatus === "DISABLED"
                  ? "Đã khoá"
                  : "Chưa kích hoạt",
            <div className="flex items-center gap-2">
              {r.videoId && r.registrationId ? (
                <AdminButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleVideoReview(r)}
                  disabled={op.busy}
                >
                  Xem video
                </AdminButton>
              ) : (
                <span className="text-slate-400 text-xs">Chưa có</span>
              )}
            </div>,
            <div key={r.id} className="flex flex-wrap gap-2 min-w-60">
              <AdminButton onClick={() => setDetail(r)}>Chi tiết</AdminButton>
              {!r.deleted && (
                <>
                  {!r.userId ? (
                    <AdminButton
                      disabled={op.busy}
                      onClick={() => void account(r, "PROVISION")}
                    >
                      Cấp tài khoản
                    </AdminButton>
                  ) : (
                    <>
                      <AdminButton
                        disabled={op.busy}
                        onClick={() =>
                          void account(
                            r,
                            r.accountStatus === "ACTIVE" ? "DISABLE" : "ENABLE",
                          )
                        }
                      >
                        {r.accountStatus === "ACTIVE" ? "Khoá" : "Mở khoá"}
                      </AdminButton>
                      <AdminButton
                        disabled={op.busy}
                        onClick={() => void account(r, "RESET")}
                      >
                        Cấp lại
                      </AdminButton>
                      <AdminButton
                        variant="danger"
                        disabled={op.busy}
                        onClick={() => void account(r, "DELETE")}
                      >
                        Xoá
                      </AdminButton>
                    </>
                  )}
                </>
              )}
            </div>,
          ])}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">
              Hiển thị {Math.min((page - 1) * ITEMS_PER_PAGE + 1, totalItems)}–{Math.min(page * ITEMS_PER_PAGE, totalItems)} của {totalItems} kết quả
            </p>
            <div className="flex items-center gap-2">
              <AdminButton
                size="sm"
                variant="outline"
                disabled={page === 1 || allRegistrations.loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </AdminButton>
              <span className="text-sm text-slate-700 px-2">
                Trang {page} / {totalPages}
              </span>
              <AdminButton
                size="sm"
                variant="outline"
                disabled={page === totalPages || allRegistrations.loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </AdminButton>
            </div>
          </div>
        )}
      </Panel>

      {create && (
        <Panel title="Cấp tài khoản thí sinh">
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
        <Panel title="Thông tin đăng nhập vừa cấp">
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
        <Panel title={`Hồ sơ · ${detail.fullName}`}>
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
              src={`/api/v1/admin/registrations/${detail.registrationId}/video`}
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