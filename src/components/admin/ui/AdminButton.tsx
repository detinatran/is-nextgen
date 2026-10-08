"use client";

import React, { forwardRef } from "react";

export type ButtonVariant =
  | "primary"      // #0B1F4D - Main actions
  | "brand"        // #1F5BE0 - Brand accent
  | "secondary"    // Slate - Secondary actions
  | "outline"      // White with border - Subtle actions
  | "ghost"        // Transparent - Tertiary
  | "danger"       // Rose - Destructive
  | "gold";        // #F5B83D - Highlight/Top ranking

export type ButtonSize = "sm" | "md" | "lg";

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-[#0B1F4D] text-white hover:bg-[#071533] active:bg-[#050F26] border border-transparent shadow-[0_1px_2px_rgba(11,31,77,0.08),0_1px_3px_rgba(11,31,77,0.12)] focus-visible:ring-[rgba(11,31,77,0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      brand:
        "bg-[#1F5BE0] text-white hover:bg-[#1649B8] active:bg-[#103A96] border border-transparent shadow-[0_1px_2px_rgba(31,91,224,0.12),0_1px_3px_rgba(31,91,224,0.18)] focus-visible:ring-[rgba(31,91,224,0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/80 focus-visible:ring-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
      outline:
        "bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-300 focus-visible:ring-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_3px_rgba(15,23,42,0.08)]",
      ghost:
        "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 border border-transparent focus-visible:ring-slate-400",
      danger:
        "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-transparent shadow-[0_1px_2px_rgba(225,29,72,0.12),0_1px_3px_rgba(225,29,72,0.18)] focus-visible:ring-rose-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      gold:
        "bg-[#F5B83D] text-[#071533] font-semibold hover:bg-[#E5A82D] active:bg-[#D5981D] border border-amber-300 shadow-[0_1px_2px_rgba(245,184,61,0.12),0_1px_3px_rgba(245,184,61,0.18)] focus-visible:ring-[rgba(245,184,61,0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "text-xs px-3 py-1.5 gap-1.5 rounded-md min-h-[36px]",
      md: "text-sm px-4 py-2 gap-2 rounded-lg min-h-[40px]",
      lg: "text-base px-5 py-2.5 gap-2.5 rounded-lg min-h-[44px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 ease-out select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-hidden focus-visible:ring-2 active:scale-[0.98] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

AdminButton.displayName = "AdminButton";

export default AdminButton;