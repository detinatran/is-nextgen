"use client";

import React from "react";
import AdminButton from "./AdminButton";
import AdminBadge from "./AdminBadge";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "danger" | "outline" | "ghost";
    icon?: React.ReactNode;
  }[];
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  actions,
  className = "",
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 left-4 lg:left-auto lg:right-4 lg:w-auto z-50 animate-slide-up ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-2xl">
        <div className="flex items-center gap-4">
          <AdminBadge variant="info" size="md" className="font-bold">
            Đã chọn: {selectedCount} bản ghi
          </AdminBadge>
          <AdminButton variant="ghost" size="sm" onClick={onClearSelection}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Bỏ chọn
          </AdminButton>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {actions.map((action, index) => (
            <AdminButton
              key={index}
              variant={action.variant || "primary"}
              size="sm"
              onClick={action.onClick}
              leftIcon={action.icon}
            >
              {action.label}
            </AdminButton>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BulkActionBar;