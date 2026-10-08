import React from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gold"
  | "purple";

interface AdminBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export default function AdminBadge({
  children,
  variant = "default",
  size = "sm",
  dot = true,
  className = "",
}: AdminBadgeProps) {
  const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
    default: {
      badge: "bg-slate-100 text-slate-700 border border-slate-200/60",
      dot: "bg-slate-400",
    },
    success: {
      badge: "bg-emerald-50 text-emerald-800 border border-emerald-200/60",
      dot: "bg-emerald-500",
    },
    warning: {
      badge: "bg-amber-50 text-amber-800 border border-amber-200/60",
      dot: "bg-amber-500",
    },
    danger: {
      badge: "bg-rose-50 text-rose-800 border border-rose-200/60",
      dot: "bg-rose-500",
    },
    info: {
      badge: "bg-sky-50 text-sky-800 border border-sky-200/60",
      dot: "bg-sky-500",
    },
    gold: {
      badge: "bg-amber-50/80 text-amber-900 border border-amber-300 font-semibold shadow-[0_1px_2px_rgba(245,184,61,0.12)]",
      dot: "bg-amber-500 shadow-sm",
    },
    purple: {
      badge: "bg-indigo-50 text-indigo-800 border border-indigo-200/60",
      dot: "bg-indigo-500",
    },
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const currentVariant = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-md transition-colors ${currentVariant.badge} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentVariant.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}