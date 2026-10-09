"use client";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { adminApi, Configuration } from "@/lib/admin/api";

import { Icon, IconTile, EmptyState, type IconName, type Tone } from "@/components/admin/ui/kit";

export const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] placeholder:text-slate-400 transition focus:border-[#1F5BE0] focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50";
export function Button({
  children,
  onClick,
  disabled,
  type = "button",
  danger = false,
  variant,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  danger?: boolean;
  variant?: "primary" | "outline" | "soft" | "dark";
  icon?: IconName;
}) {
  const v = danger ? "danger" : (variant ?? "primary");
  const cls = {
    primary: "bg-[#1F5BE0] text-white shadow-sm shadow-blue-600/20 hover:bg-[#184bc0]",
    dark: "bg-[#0B1F4D] text-white shadow-sm hover:bg-[#13306f]",
    outline: "border border-slate-200 bg-white text-slate-700 hover:border-[#1F5BE0]/40 hover:text-[#1F5BE0]",
    soft: "bg-blue-50 text-[#1F5BE0] hover:bg-blue-100",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  }[v];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {icon && <Icon name={icon} className="h-4 w-4" />}
      {children}
    </button>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
export function Panel({
  title,
  children,
  icon,
  tone = "blue",
  description,
  actions,
  step,
}: {
  title: string;
  children: ReactNode;
  icon?: IconName;
  tone?: Tone;
  description?: ReactNode;
  actions?: ReactNode;
  step?: number;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {step !== undefined ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1F5BE0] text-sm font-bold text-white shadow-sm shadow-blue-600/30">
              {String(step).padStart(2, "0")}
            </span>
          ) : (
            icon && <IconTile name={icon} tone={tone} size="sm" />
          )}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#0B1F4D] sm:text-lg">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
export function Notice({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return message ? (
    <p
      role={error ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
    >
      <Icon name={error ? "alert" : "checkCircle"} className="mt-0.5 h-4 w-4" />
      <span>{message}</span>
    </p>
  ) : null;
}
export function Table({
  headers,
  rows,
  empty,
  footer,
}: {
  headers: string[];
  rows: ReactNode[][];
  empty?: { icon?: IconName; title: string; description?: string };
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500">
            <tr>
              {headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-100 transition hover:bg-blue-50/30">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 align-middle text-slate-700">
                    {cell ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <EmptyState icon={empty?.icon ?? "folder"} title={empty?.title ?? "Chưa có dữ liệu"} description={empty?.description} />}
      {footer}
    </div>
  );
}
export function useResource<T>(path: string, initial: T) {
  const [data, setData] = useState<T>(initial),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const serial = useRef(0);
  const reload = useCallback(async () => {
    const requestId = ++serial.current;
    setLoading(true);
    try {
      const result = await adminApi<T>(path);
      if (requestId === serial.current) {
        setData(result);
        setError("");
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
  return { data, error, loading, reload };
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
