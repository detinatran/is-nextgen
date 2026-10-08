"use client";

import React, { useState, useRef, useEffect } from "react";
import AdminButton from "./AdminButton";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

interface AdminPopconfirmProps {
  /** Trigger content - render prop function that receives open state */
  children: (open: boolean) => React.ReactNode;
  /** Confirmation title */
  title: string;
  /** Confirmation description */
  description?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button variant */
  confirmVariant?: "danger" | "brand" | "primary";
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Trigger variant - used for default wrapper styling if needed */
  triggerVariant?: "ghost" | "outline" | "danger" | "brand";
  /** Trigger size */
  triggerSize?: "sm" | "md";
  /** Placement of popover */
  placement?: "top" | "bottom" | "left" | "right";
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

export default function AdminPopconfirm({
  children,
  title,
  description,
  confirmText,
  cancelText,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
  triggerVariant = "ghost",
  triggerSize = "sm",
  placement = "bottom",
  open: controlledOpen,
  onOpenChange,
}: AdminPopconfirmProps) {
  const { t } = useAdminI18n();
  const defaultConfirmText = confirmText || t("Xác nhận");
  const defaultCancelText = cancelText || t("Hủy");
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled
    ? (val: boolean) => onOpenChange?.(val)
    : setUncontrolledOpen;
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        if (onCancel) onCancel();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onCancel, setOpen, isControlled]);

  const placementStyles: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowStyles: Record<string, string> = {
    top: "bottom-[-6px] left-1/2 -translate-x-1/2 border-t-white",
    bottom: "top-[-6px] left-1/2 -translate-x-1/2 border-b-white",
    left: "right-[-6px] top-1/2 -translate-y-1/2 border-l-white",
    right: "left-[-6px] top-1/2 -translate-y-1/2 border-r-white",
  };

  return (
    <div className="relative inline-block">
      <span
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center cursor-pointer"
        data-trigger-variant={triggerVariant}
        data-trigger-size={triggerSize}
      >
        {children(open)}
      </span>

      {open && (
        <div
          ref={popoverRef}
          className={`fixed z-50 ${placementStyles[placement]} animate-in zoom-in-95 fade-in duration-150`}
          style={{
            top: triggerRef.current?.getBoundingClientRect().bottom,
            left: triggerRef.current?.getBoundingClientRect().left,
          }}
        >
          <div className="relative w-72 bg-white rounded-xl border border-slate-200 shadow-lg p-4">
            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 border-3 border-transparent ${arrowStyles[placement]}`}
            />

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">{title}</h4>
              {description && (
                <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    onCancel?.();
                  }}
                >
                  {defaultCancelText}
                </AdminButton>
                <AdminButton
                  variant={confirmVariant}
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    onConfirm();
                  }}
                >
                  {defaultConfirmText}
                </AdminButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
