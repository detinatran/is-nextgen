"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminError, adminCall, adminUrl, type AdminList, type AdminRow } from "@/lib/adminApi";
import { asset } from "@/lib/paths";
import Icon from "../Icon";

type Stage = "checking" | "login" | "otp" | "ready";

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

function messageOf(err: unknown) {
  if (err instanceof AdminError) {
    if (err.status === 401) return "Sai email hoặc mật khẩu, hoặc mã OTP không đúng / đã hết hạn.";
    if (err.status === 403) return "Tài khoản này không có quyền quản trị.";
    if (err.status === 429) return "Thử quá nhiều lần, vui lòng đợi một phút.";
    return err.message;
  }
  return "Không kết nối được máy chủ.";
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }) : "";
const fmtDuration = (s: number | null) => (s === null ? "" : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`);

export default function AdminApp() {
  const [stage, setStage] = useState<Stage>("checking");
  const [error, setError] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminCall("/admin/session")
      .then(() => setStage("ready"))
      .catch(() => setStage("login"));
  }, []);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await adminCall<{ status?: string; challengeId?: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: String(data.get("email")).trim(), password: String(data.get("password")) }),
      });
      if (res.status === "MFA_REQUIRED" && res.challengeId) {
        setChallengeId(res.challengeId);
        setStage("otp");
      } else {
        await adminCall("/admin/session");
        setStage("ready");
      }
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code")).trim();
    setBusy(true);
    setError("");
    try {
      await adminCall(`/auth/admin/mfa-challenges/${challengeId}/verification`, { method: "POST", body: JSON.stringify({ code }) });
      setStage("ready");
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await adminCall("/auth/logout", { method: "POST" }).catch(() => undefined);
    setStage("login");
  }

  if (stage === "ready") return <Dashboard onLogout={logout} />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-card ring-1 ring-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/images/logo.png")} alt="NextGen Manager" className="h-11 w-auto" />
        <h1 className="mt-6 text-xl font-bold text-navy">Quản trị Ban Tổ chức</h1>
        {stage === "checking" && <p className="mt-4 text-sm text-muted">Đang kiểm tra phiên đăng nhập...</p>}
        {stage === "login" && (
          <form onSubmit={login} className="mt-5 space-y-3">
            <input name="email" type="email" required autoComplete="username" placeholder="Email quản trị" className={field} />
            <input name="password" type="password" required autoComplete="current-password" placeholder="Mật khẩu" className={field} />
            <button disabled={busy} className="btn-primary w-full py-3 disabled:opacity-60">
              {busy ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        )}
        {stage === "otp" && (
          <form onSubmit={verify} className="mt-5 space-y-3">
            <p className="text-sm text-muted">Mã xác minh 6 số đã được gửi tới email quản trị. Mã có hiệu lực 15 phút.</p>
            <input
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              placeholder="Mã OTP"
              className={`${field} text-center text-lg tracking-[0.4em]`}
            />
            <button disabled={busy} className="btn-primary w-full py-3 disabled:opacity-60">
              {busy ? "Đang xác minh..." : "Xác minh"}
            </button>
            <button type="button" onClick={() => setStage("login")} className="w-full text-sm text-muted hover:text-navy">
              Quay lại
            </button>
          </form>
        )}
        {error && (
          <p className="mt-4 text-sm font-medium text-orange-ink" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [filters, setFilters] = useState({ q: "", school: "", state: "SUBMITTED", page: 1 });
  const [query, setQuery] = useState("");
  const [data, setData] = useState<AdminList | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminRow | null>(null);

  const params = useCallback(
    (extra: Record<string, string> = {}) =>
      new URLSearchParams({
        state: filters.state,
        ...(filters.q ? { q: filters.q } : {}),
        ...(filters.school ? { school: filters.school } : {}),
        ...extra,
      }).toString(),
    [filters],
  );

  useEffect(() => {
    let alive = true;
    adminCall<AdminList>(`/admin/registrations?${params({ page: String(filters.page), pageSize: "50" })}`)
      .then((d) => alive && (setData(d), setError("")))
      .catch((err) => {
        if (err instanceof AdminError && err.status === 401) onLogout();
        else if (alive) setError(messageOf(err));
      });
    return () => {
      alive = false;
    };
  }, [filters, params, onLogout]);

  // Tìm kiếm: đợi người dùng ngừng gõ 300ms mới gọi API
  useEffect(() => {
    const id = window.setTimeout(() => setFilters((f) => (f.q === query ? f : { ...f, q: query, page: 1 })), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <main className="min-h-screen bg-mist">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/images/logo.png")} alt="" className="h-8 w-auto" />
            <span className="hidden text-sm font-semibold text-navy sm:inline">Quản trị · Hồ sơ đăng ký</span>
          </div>
          <button onClick={onLogout} className="btn-outline px-4 py-2 text-sm">
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-56 flex-1">
            <span className="text-xs font-semibold text-muted">Tìm kiếm</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tên, email, MSSV, SĐT, mã thí sinh" className={`${field} mt-1`} />
          </label>
          <label className="w-64">
            <span className="text-xs font-semibold text-muted">Trường</span>
            <select value={filters.school} onChange={(e) => setFilters({ ...filters, school: e.target.value, page: 1 })} className={`${field} mt-1`}>
              <option value="">Tất cả trường</option>
              {data?.schools.map((s) => (
                <option key={s.school} value={s.school}>
                  {s.school || "(chưa ghi)"} · {s.total}
                </option>
              ))}
            </select>
          </label>
          <label className="w-44">
            <span className="text-xs font-semibold text-muted">Trạng thái</span>
            <select value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value, page: 1 })} className={`${field} mt-1`}>
              <option value="SUBMITTED">Đã nộp</option>
              <option value="DRAFT">Nháp (chưa nộp xong)</option>
              <option value="ALL">Tất cả</option>
            </select>
          </label>
          <a href={adminUrl(`/admin/registrations/export?${params()}`)} className="btn-primary px-5 py-2.5 text-sm">
            <Icon name="arrowUp" className="h-4 w-4 rotate-180" strokeWidth={2.2} /> Xuất Excel
          </a>
        </div>

        <p className="mt-4 text-sm text-muted">
          {data ? (
            <>
              <strong className="text-navy">{data.total}</strong> hồ sơ
            </>
          ) : (
            "Đang tải..."
          )}
        </p>
        {error && <p className="mt-2 text-sm font-medium text-orange-ink">{error}</p>}

        <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-line">
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="bg-mist/70 text-xs font-semibold tracking-wide text-muted uppercase">
              <tr>
                {["Mã thí sinh", "Họ và tên", "Trường", "Ngành", "Liên hệ", "Video", "Nộp lúc", ""].map((h) => (
                  <th key={h} className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.items.map((r) => (
                <tr key={r.registrationId} onClick={() => setSelected(r)} className="cursor-pointer border-t border-line hover:bg-cream/60">
                  <td className="px-4 py-3 font-mono text-[13px] text-navy">{r.candidateCode ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-navy">
                    {r.fullName}
                    <div className="mt-1 flex gap-1.5">
                      {r.duplicateFlagged && <span className="rounded-full bg-orange/10 px-2 py-0.5 text-[11px] font-semibold text-orange-ink">Nghi trùng</span>}
                      {r.mediaConsent === false && <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-semibold text-muted">Không đồng ý hình ảnh</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.school}</td>
                  <td className="px-4 py-3">{r.major}</td>
                  <td className="px-4 py-3 text-[13px]">
                    {r.email}
                    <br />
                    <span className="text-muted">{r.phone}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.hasVideo ? fmtDuration(r.videoDurationSeconds) : <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-3 text-[13px] text-muted">{fmtDate(r.submittedAt ?? r.createdAt)}</td>
                  <td className="px-4 py-3 text-right text-brand">Xem</td>
                </tr>
              ))}
              {data && data.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    Chưa có hồ sơ phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2 text-sm">
            <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="btn-outline px-3 py-1.5 disabled:opacity-40">
              Trước
            </button>
            <span className="px-2 text-muted">
              Trang {filters.page}/{pages}
            </span>
            <button disabled={filters.page >= pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="btn-outline px-3 py-1.5 disabled:opacity-40">
              Sau
            </button>
          </div>
        )}
      </div>

      {selected && <Detail row={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function Detail({ row, onClose }: { row: AdminRow; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const media = (kind: string) => adminUrl(`/admin/registrations/${row.registrationId}/${kind}`);
  const facts: [string, React.ReactNode][] = [
    ["Mã thí sinh", row.candidateCode ?? "—"],
    ["Trạng thái", row.state === "SUBMITTED" ? "Đã nộp" : "Nháp"],
    ["Ngày sinh", row.dateOfBirth],
    ["MSSV", row.studentId],
    ["Trường", row.school],
    ["Khoa/Viện", row.department],
    ["Ngành", row.major],
    ["Email", <a key="e" href={`mailto:${row.email}`} className="text-brand hover:underline">{row.email}</a>],
    ["Số điện thoại", row.phone],
    [
      "Facebook",
      row.facebook ? (
        <a key="f" href={row.facebook} target="_blank" rel="noopener noreferrer" className="break-all text-brand hover:underline">
          {row.facebook}
        </a>
      ) : null,
    ],
    ["Dùng hình ảnh", row.mediaConsent === null ? "—" : row.mediaConsent ? "Đồng ý" : "Không đồng ý (không xét giải yêu thích nhất)"],
    ["Nghi trùng", row.duplicateFlagged ? "Có, cần rà soát" : "Không"],
    ["Nộp lúc", fmtDate(row.submittedAt)],
  ];
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-navy-deep/40" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl" role="dialog" aria-label={row.fullName}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {row.hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media("photo")} alt={row.fullName} className="h-20 w-20 rounded-2xl object-cover ring-1 ring-line" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-mist text-muted">
                <Icon name="users" className="h-7 w-7" />
              </span>
            )}
            <div>
              <h2 className="text-xl font-bold text-navy">{row.fullName}</h2>
              <p className="font-mono text-[13px] text-muted">{row.candidateCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-muted hover:bg-mist" aria-label="Đóng">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        {row.hasVideo && (
          <div className="mt-6">
            <video src={media("video")} controls preload="metadata" className="aspect-video w-full rounded-2xl bg-navy-deep" />
            <a href={media("video")} download className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              <Icon name="arrowUp" className="h-4 w-4 rotate-180" strokeWidth={2.2} /> Tải video ({fmtDuration(row.videoDurationSeconds)})
            </a>
          </div>
        )}

        <dl className="mt-6 divide-y divide-line rounded-2xl ring-1 ring-line">
          {facts.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 px-4 py-2.5 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="text-ink">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
