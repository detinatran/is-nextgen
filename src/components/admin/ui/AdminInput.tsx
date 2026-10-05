import React from "react";

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function AdminInput({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = "",
  id,
  ...props
}: AdminInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 select-none flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-rose-500 font-bold ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm rounded-lg border transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#1F5BE0]/20 focus:border-[#1F5BE0] disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 ${
            leftIcon ? "pl-10" : "pl-4"
          } ${rightIcon ? "pr-10" : "pr-4"} py-2.5 ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-slate-300 hover:border-slate-400"
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-slate-400 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export function AdminSelect({
  label,
  error,
  options,
  className = "",
  id,
  ...props
}: AdminSelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 select-none flex items-center justify-between"
        >
          <span>{label}</span>
          {props.required && <span className="text-rose-500 font-bold ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full bg-white text-slate-900 text-sm rounded-lg border border-slate-300 hover:border-slate-400 px-4 py-2.5 pr-10 appearance-none transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#1F5BE0]/20 focus:border-[#1F5BE0] cursor-pointer disabled:bg-slate-50 disabled:text-slate-500 ${
            error ? "border-rose-400 focus:border-rose-500" : ""
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

export default AdminInput;