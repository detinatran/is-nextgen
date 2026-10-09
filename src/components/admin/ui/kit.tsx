"use client";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* Bộ icon nét (24x24, stroke) dùng chung cho admin */
const paths: Record<string, ReactNode> = {
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>,
  fileCheck: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 15l2 2 4-4" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  clipboard: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h4" /></>,
  clipboardCheck: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 14l2 2 4-4" /></>,
  video: <><path d="m22 8-6 4 6 4V8z" /><rect x="2" y="6" width="14" height="12" rx="2" /></>,
  monitor: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M7 16v-4M12 16V8M17 16v-7" /></>,
  bars: <><path d="M12 20V10M18 20V4M6 20v-4" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  help: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>,
  alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></>,
  check: <><path d="M20 6 9 17l-5-5" /></>,
  checkCircle: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></>,
  crown: <><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" /><path d="M5 20h14" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></>,
  phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></>,
  id: <><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="12" r="2" /><path d="M14 10h4M14 14h4" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  layers: <><path d="m12 2 10 5-10 5L2 7z" /><path d="m2 17 10 5 10-5M2 12l10 5 10-5" /></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
  folder: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></>,
  filter: <><path d="M22 3H2l8 9.46V19l4 2v-8.54z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  arrowRight: <><path d="M5 12h14M12 5l7 7-7 7" /></>,
  arrowLeft: <><path d="M19 12H5M12 19l-7-7 7-7" /></>,
  chevronLeft: <><path d="m15 18-6-6 6-6" /></>,
  chevronRight: <><path d="m9 18 6-6-6-6" /></>,
  chevronDown: <><path d="m6 9 6 6 6-6" /></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22" /></>,
  more: <><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>,
  maximize: <><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" /></>,
  bulb: <><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z" /></>,
  sparkle: <><path d="m12 3 1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" /></>,
  team: <><circle cx="9" cy="7" r="3" /><circle cx="17" cy="8" r="2.5" /><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M15 14h1a4 4 0 0 1 4 4v2" /></>,
  facebook: <><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></>,
  graduation: <><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></>,
};
export type IconName = keyof typeof paths;

export function Icon({ name, className, strokeWidth = 1.75 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4 shrink-0", className)} aria-hidden>
      {paths[name]}
    </svg>
  );
}

/* ───────── Bố cục trang ───────── */

/** Tiêu đề trang: H1 24px, mô tả ngắn, thao tác chính bên phải. */
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-adm-text">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-adm-sub">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Thẻ KPI: số lớn, nhãn nhỏ, ngữ cảnh tuỳ chọn. Không dùng icon màu. */
export function StatCard({ label, value, hint, loading = false }: { label: string; value: ReactNode; hint?: ReactNode; loading?: boolean }) {
  return (
    <div className="rounded-xl border border-adm-border bg-white px-5 py-4">
      <p className="text-[13px] font-medium text-adm-sub">{label}</p>
      {loading ? <Skeleton className="mt-2 h-8 w-16" /> : <p className="mt-1 text-[30px] leading-tight font-bold tabular-nums text-adm-text">{value}</p>}
      {hint && <p className="mt-1 text-xs text-adm-muted">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded-md bg-slate-200/70 motion-reduce:animate-none", className)} />;
}

/* ───────── Trạng thái ───────── */

export type PillTone = "green" | "amber" | "slate" | "red" | "blue";
const pillTone: Record<PillTone, string> = {
  green: "bg-emerald-50 text-[#047857] ring-emerald-600/15",
  amber: "bg-amber-50 text-[#B45309] ring-amber-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/15",
  red: "bg-red-50 text-[#B91C1C] ring-red-600/15",
  blue: "bg-blue-50 text-[#1D4ED8] ring-blue-600/15",
};
/** Nhãn trạng thái: có chấm màu + chữ (không chỉ dựa vào màu). */
export function Pill({ tone = "slate", children }: { tone?: PillTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", pillTone[tone])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {children}
    </span>
  );
}

/** Quy ước màu trạng thái dùng chung toàn hệ thống. */
export const status = {
  submitted: <Pill tone="green">Đã nộp</Pill>,
  draft: <Pill tone="slate">Bản nháp</Pill>,
  pendingActivation: <Pill tone="amber">Chưa kích hoạt</Pill>,
  active: <Pill tone="green">Hoạt động</Pill>,
  noAccount: <Pill tone="slate">Chưa có tài khoản</Pill>,
  locked: <Pill tone="red">Đã khoá</Pill>,
  deleted: <Pill tone="red">Đã xoá</Pill>,
  inProgress: <Pill tone="blue">Đang làm bài</Pill>,
  completed: <Pill tone="green">Đã nộp bài</Pill>,
  notStarted: <Pill tone="slate">Chưa vào thi</Pill>,
  needsReview: <Pill tone="red">Cần xử lý</Pill>,
  graded: <Pill tone="green">Đã chấm</Pill>,
};

export function EmptyState({ icon = "folder", title, description, action }: { icon?: IconName; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-adm-border bg-adm-bg text-adm-muted">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-adm-text">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-adm-sub">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Hộp ghi chú gọn (thông tin / cảnh báo / lỗi). */
export function Callout({ tone = "info", title, children, action }: { tone?: "info" | "warning" | "error"; title?: string; children: ReactNode; action?: ReactNode }) {
  const cls = tone === "warning" ? "border-amber-200 bg-amber-50/60" : tone === "error" ? "border-red-200 bg-red-50/60" : "border-adm-border bg-adm-bg";
  const ic = tone === "warning" ? "text-adm-warning" : tone === "error" ? "text-adm-error" : "text-adm-sub";
  return (
    <div className={cn("flex gap-3 rounded-lg border px-4 py-3 text-[13px] leading-relaxed text-adm-text", cls)} role={tone === "error" ? "alert" : undefined}>
      <Icon name={tone === "info" ? "info" : "alert"} className={cn("mt-0.5 h-4 w-4", ic)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-adm-sub">{children}</div>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

/* ───────── Bảng ───────── */

/** Phân trang + chọn số dòng mỗi trang. */
export function Pagination({ page, pageSize, total, onPage, onPageSize, label = "mục" }: { page: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize?: (n: number) => void; label?: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const btn = "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adm-primary/40 disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-adm-border px-4 py-2.5 text-[13px] text-adm-sub">
      <span className="tabular-nums">
        {from}–{to} / {total} {label}
      </span>
      <div className="flex items-center gap-3">
        {onPageSize && (
          <label className="flex items-center gap-2">
            Số dòng
            <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="h-8 rounded-md border border-adm-border bg-white px-2 text-[13px] text-adm-text">
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <nav className="flex items-center gap-0.5" aria-label="Phân trang">
          <button type="button" className={cn(btn, "text-adm-sub hover:bg-slate-100")} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Trang trước">
            <Icon name="chevronLeft" />
          </button>
          {nums.map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} className="px-1">
                …
              </span>
            ) : (
              <button key={n} type="button" onClick={() => onPage(n)} aria-current={n === page ? "page" : undefined} className={cn(btn, n === page ? "bg-adm-navy text-white" : "text-adm-text hover:bg-slate-100")}>
                {n}
              </button>
            ),
          )}
          <button type="button" className={cn(btn, "text-adm-sub hover:bg-slate-100")} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Trang sau">
            <Icon name="chevronRight" />
          </button>
        </nav>
      </div>
    </div>
  );
}

/** Menu thao tác phụ (nút …). Đóng khi bấm ra ngoài hoặc Esc. */
export function RowMenu({ items, label = "Thao tác khác" }: { items: { label: string; onClick: () => void; danger?: boolean; disabled?: boolean }[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  if (!items.length) return null;
  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-adm-sub transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adm-primary/40"
      >
        <Icon name="more" />
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-30 mt-1 w-52 overflow-hidden rounded-lg border border-adm-border bg-white py-1 shadow-lg shadow-slate-900/5">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className={cn("block w-full px-3 py-2 text-left text-[13px] transition hover:bg-slate-50 disabled:opacity-50", it.danger ? "text-adm-error" : "text-adm-text")}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── Hộp xác nhận ───────── */

type ConfirmOptions = { title: string; description?: ReactNode; confirmText?: string; danger?: boolean; reason?: { label: string; required?: boolean } };
type ConfirmResult = { ok: boolean; reason?: string };
const ConfirmCtx = createContext<(o: ConfirmOptions) => Promise<ConfirmResult>>(async () => ({ ok: window.confirm("Xác nhận?") }));

/** Bọc ứng dụng để dùng useConfirm(): hộp xác nhận thay cho window.confirm/prompt. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (r: ConfirmResult) => void }) | null>(null);
  const [reason, setReason] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const ask = useCallback(
    (o: ConfirmOptions) =>
      new Promise<ConfirmResult>((resolve) => {
        setReason("");
        setState({ ...o, resolve });
      }),
    [],
  );
  const close = (ok: boolean) => {
    state?.resolve({ ok, reason: reason.trim() || undefined });
    setState(null);
  };
  useEffect(() => {
    if (!state) return;
    if (!state.reason) confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const blocked = !!state?.reason?.required && !reason.trim();
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-xl border border-adm-border bg-white p-6 shadow-xl">
            <h2 id="confirm-title" className="text-base font-semibold text-adm-text">
              {state.title}
            </h2>
            {state.description && <div className="mt-2 text-sm leading-relaxed text-adm-sub">{state.description}</div>}
            {state.reason && (
              <label className="mt-4 block text-[13px] font-medium text-adm-text">
                {state.reason.label}
                {state.reason.required && <span className="text-adm-error"> *</span>}
                <textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} className="mt-1.5 w-full rounded-lg border border-adm-border px-3 py-2 text-sm focus:border-adm-primary focus:ring-2 focus:ring-adm-primary/20 focus:outline-none" />
              </label>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => close(false)} className="h-10 rounded-lg px-4 text-sm font-medium text-adm-sub hover:bg-slate-100">
                Huỷ
              </button>
              <button
                ref={confirmRef}
                type="button"
                disabled={blocked}
                onClick={() => close(true)}
                className={cn("h-10 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50", state.danger ? "bg-adm-error hover:bg-red-700" : "bg-adm-primary hover:bg-adm-primary-hover")}
              >
                {state.confirmText ?? "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}
export const useConfirm = () => useContext(ConfirmCtx);

/* ───────── Tải tệp ───────── */

const fmtSize = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

/** Vùng chọn/kéo-thả tệp: hiện tên, dung lượng, bỏ chọn; kiểm tra định dạng và dung lượng tối đa. */
export function FileUpload({ file, onChange, accept, maxBytes, hint }: { file: File | null; onChange: (f: File | null) => void; accept: string; maxBytes: number; hint?: string }) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const take = (f: File | null | undefined) => {
    setError("");
    if (!f) return;
    const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
    if (!accept.split(",").includes(ext)) return setError(`Định dạng không hỗ trợ. Chỉ nhận ${accept.replaceAll(",", ", ")}.`);
    if (f.size > maxBytes) return setError(`Tệp lớn hơn giới hạn ${fmtSize(maxBytes)}.`);
    onChange(f);
  };
  if (file)
    return (
      <div className="flex items-center gap-3 rounded-lg border border-adm-border bg-white px-4 py-3">
        <Icon name="file" className="h-5 w-5 text-adm-sub" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-adm-text">{file.name}</p>
          <p className="text-xs text-adm-muted">{fmtSize(file.size)}</p>
        </div>
        <button type="button" onClick={() => onChange(null)} className="rounded-md px-2 py-1 text-[13px] font-medium text-adm-sub hover:bg-slate-100">
          Chọn tệp khác
        </button>
      </div>
    );
  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          take(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adm-primary/40",
          drag ? "border-adm-primary bg-blue-50/50" : "border-slate-300 bg-adm-bg hover:border-slate-400",
        )}
      >
        <Icon name="upload" className="h-5 w-5 text-adm-sub" />
        <span className="mt-2 text-sm font-medium text-adm-text">
          Kéo thả tệp vào đây hoặc <span className="text-adm-primary">chọn tệp</span>
        </span>
        <span className="mt-1 text-xs text-adm-muted">{hint ?? `${accept.replaceAll(",", ", ")} · tối đa ${fmtSize(maxBytes)}`}</span>
      </button>
      <input ref={input} type="file" accept={accept} className="hidden" aria-label="Chọn tệp" onChange={(e) => take(e.target.files?.[0])} />
      {error && (
        <p className="mt-2 text-[13px] text-adm-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ───────── Ngăn kéo chi tiết & tab ───────── */

/** Ngăn chi tiết trượt từ bên phải (Esc hoặc bấm nền để đóng). */
export function Drawer({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-900/30" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="drawer-title" className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl outline-none">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-adm-border px-6">
          <div className="min-w-0 flex-1">
            <h2 id="drawer-title" className="truncate text-base font-semibold text-adm-text">
              {title}
            </h2>
            {subtitle && <p className="truncate text-xs text-adm-sub">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="flex h-8 w-8 items-center justify-center rounded-md text-adm-sub hover:bg-slate-100">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex shrink-0 justify-end gap-2 border-t border-adm-border px-6 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Tab gạch chân (Linear/Vercel), có số đếm tuỳ chọn. */
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-adm-border">
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(it.value)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adm-primary/40",
              on ? "border-adm-primary text-adm-text" : "border-transparent text-adm-sub hover:text-adm-text",
            )}
          >
            {it.label}
            {it.count !== undefined && <span className={cn("rounded px-1.5 text-[11px] tabular-nums", on ? "bg-blue-50 text-adm-primary" : "bg-slate-100 text-adm-sub")}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Danh sách nhãn – giá trị (thông tin hồ sơ). */
export function DetailList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs text-adm-sub">{k}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-adm-text">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
