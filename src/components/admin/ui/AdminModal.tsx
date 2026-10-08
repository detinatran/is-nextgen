"use client";

import React, { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { createPortal } from "react-dom";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  /** Disable animation for instant open/close */
  disableAnimation?: boolean;
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "lg",
  disableAnimation = false,
}: AdminModalProps) {
  const { t } = useAdminI18n();
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // GSAP animations for open/close
  useGSAP(
    () => {
      if (disableAnimation || !modalRef.current || !backdropRef.current || !contentRef.current) return;

      const ctx = gsap.context(() => {
        if (isOpen) {
          // Enter animation
          gsap.set(backdropRef.current!, { opacity: 0 });
          gsap.set(contentRef.current!, { opacity: 0, scale: 0.95, y: 20 });

          gsap.to(backdropRef.current!, {
            opacity: 1,
            duration: 0.2,
            ease: "power2.out",
          });

          gsap.to(contentRef.current!, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "back.out(1.3)",
            delay: 0.05,
          });
        } else {
          // Exit animation
          gsap.to(backdropRef.current!, {
            opacity: 0,
            duration: 0.15,
            ease: "power2.in",
          });

          gsap.to(contentRef.current!, {
            opacity: 0,
            scale: 0.95,
            y: -10,
            duration: 0.2,
            ease: "power2.in",
          });
        }
      }, modalRef);

      return () => ctx.revert();
    },
    { scope: modalRef, dependencies: [isOpen, disableAnimation] }
  );

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  };

  const modalContent = (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Dialog Window */}
      <div
        ref={contentRef}
        className={`relative w-full ${maxWidthStyles[maxWidth]} bg-white rounded-xl shadow-[0_25px_50px_-12px_rgba(7,21,51,0.25),0_0_0_1px_rgba(11,31,77,0.08)] border border-slate-200/80 overflow-hidden`}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
            <div className="pr-4">
              {title && (
                <h3 className="text-base font-bold text-slate-900 leading-6">{title}</h3>
              )}
              {description && (
                <p className="mt-1 text-xs text-slate-500 leading-normal">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              title={t("Đóng (Esc)")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto text-sm text-slate-700">
          {children}
        </div>

        {/* Footer Actions */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50/80 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Portal to body for proper z-index handling
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
}