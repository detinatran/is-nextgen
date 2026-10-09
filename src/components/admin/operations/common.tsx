"use client";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { adminApi, Configuration } from "@/lib/admin/api";

import { cn } from "@/lib/utils";
import { EmptyState, Icon, IconTile, Skeleton, type IconName, type Tone } from "@/components/admin/ui/kit";

export const inputClass =
  "h-[42px] w-full rounded-lg border border-adm-border bg-white px-3 text-sm text-adm-text placeholder:text-adm-muted transition focus:border-adm-primary focus:outline-none focus:ring-2 focus:ring-adm-primary/20 disabled:cursor-not-allowed disabled:bg-adm-bg aria-[invalid=true]:border-adm-error aria-[invalid=true]:focus:ring-adm-error/20";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "navy";
/** Nút chuẩn: primary (thao tác chính), secondary (hỗ trợ), ghost (huỷ/quay lại), danger (xoá/thu hồi). */
export function Button({
  children,
  onClick,
  disabled,
  type = "button",
  danger = false,
  variant,
  icon,
  loading = false,
  size = "md",
  form,
}: {
  children: ReactNode;
  form?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  danger?: boolean;
  variant?: ButtonVariant | "outline" | "soft" | "dark";
  icon?: IconName;
  loading?: boolean;
  size?: "sm" | "md";
}) {
  const v: ButtonVariant = danger ? "danger" : variant === "outline" || variant === "soft" ? "secondary" : variant === "dark" ? "navy" : (variant ?? "primary");
  const cls = {
    primary: "bg-adm-primary text-white hover:bg-adm-primary-hover active:bg-[#1E40AF]",
    navy: "bg-adm-navy text-white hover:bg-adm-navy2",
    secondary: "border border-adm-border bg-white text-adm-text hover:bg-slate-50 active:bg-slate-100",
    ghost: "text-adm-sub hover:bg-slate-100 hover:text-adm-text",
    danger: "border border-red-200 bg-white text-adm-error hover:bg-red-50",
  }[v];
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adm-primary/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
        cls,
      )}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" aria-hidden /> : icon && <Icon name={icon} />}
      {children}
    </button>
  );
}
export function Field({
  label,
  children,
  required = false,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-adm-text">
        {label}
        {required && <span className="text-adm-error"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-adm-error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-xs text-adm-muted">{hint}</span>
      )}
    </label>
  );
}
/** Khung một khối công việc: tiêu đề, mô tả, thao tác bên phải; step = bước trong quy trình. */
export function Panel({
  title,
  children,
  description,
  actions,
  step,
  id,
  icon,
  tone = "blue",
}: {
  title: string;
  children: ReactNode;
  icon?: IconName;
  tone?: Tone;
  description?: ReactNode;
  actions?: ReactNode;
  step?: number;
  id?: string;
}) {
  return (
    <section id={id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {icon && step === undefined && <IconTile name={icon} tone={tone} size="sm" />}
          {step !== undefined && (
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-adm-navy text-xs font-semibold text-white">{step}</span>
          )}
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-adm-text">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] leading-relaxed text-adm-sub">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
export function Notice({
  message,
  error = false,
  onRetry,
}: {
  message: string;
  error?: boolean;
  onRetry?: () => void;
}) {
  return message ? (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50/70 text-[#991B1B]" : "border-emerald-200 bg-emerald-50/70 text-[#065F46]"}`}
    >
      <Icon name={error ? "alert" : "checkCircle"} className="mt-0.5" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-semibold underline-offset-2 hover:underline">
          Thử lại
        </button>
      )}
    </div>
  ) : null;
}
export function Table({
  headers,
  rows,
  empty,
  footer,
  numeric = [],
  loading = false,
  rowClass,
}: {
  headers: string[];
  rows: ReactNode[][];
  empty?: { icon?: IconName; title: string; description?: string; action?: ReactNode };
  footer?: ReactNode;
  /** Chỉ số cột số: căn phải, chữ số đều */
  numeric?: number[];
  loading?: boolean;
  rowClass?: (index: number) => string;
}) {
  const align = (j: number) => (numeric.includes(j) ? "text-right tabular-nums" : "");
  return (
    <div className="overflow-hidden rounded-lg border border-adm-border">
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-adm-bg text-xs font-semibold text-adm-sub">
            <tr className="border-b border-adm-border">
              {headers.map((h, j) => (
                <th key={h || j} scope="col" className={cn("whitespace-nowrap px-4 py-2.5", align(j))}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !rows.length
              ? Array.from({ length: 5 }, (_, i) => (
                  <tr key={i} className="border-t border-adm-border first:border-t-0">
                    {headers.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, i) => (
                  <tr key={i} className={cn("border-t border-adm-border transition-colors first:border-t-0 hover:bg-slate-50/80", rowClass?.(i))}>
                    {row.map((cell, j) => (
                      <td key={j} className={cn("px-4 py-2.5 align-middle text-adm-text", align(j))}>
                        {cell ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {!loading && !rows.length && <EmptyState icon={empty?.icon ?? "folder"} title={empty?.title ?? "Chưa có dữ liệu"} description={empty?.description} action={empty?.action} />}
      {footer}
    </div>
  );
}
export function useResource<T>(path: string, initial: T) {
  const [data, setData] = useState<T>(initial),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const serial = useRef(0);
  const reload = useCallback(async () => {
    const requestId = ++serial.current;
    setLoading(true);
    try {
      const result = await adminApi<T>(path);
      if (requestId === serial.current) {
        setData(result);
        setError("");
        setUpdatedAt(new Date());
      }
    } catch (e) {
      if (requestId === serial.current) setError((e as Error).message);
    } finally {
      if (requestId === serial.current) setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    void reload();
    return () => {
      serial.current++;
    };
  }, [reload]);
  return { data, error, loading, reload, updatedAt };
}
export const emptyConfig: Configuration = {
  competitions: [],
  pools: [],
  teams: [],
  policies: [],
};
export function useOperations() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const pending = useRef(false);
  async function run(
    task: () => Promise<void>,
    success = "Đã lưu thành công.",
  ) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await task();
      setMessage(success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { busy, error, message, run };
}
