"use client";

import React, { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { createPortal } from "react-dom";

interface AdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Drawer position */
  side?: "left" | "right";
  /** Drawer width */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Disable animation for instant open/close */
  disableAnimation?: boolean;
  /** Show backdrop */
  showBackdrop?: boolean;
}

export default function AdminDrawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  size = "lg",
  disableAnimation = false,
  showBackdrop = true,
}: AdminDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
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

  // GSAP animations for slide in/out
  useGSAP(
    () => {
      if (disableAnimation || !drawerRef.current || !backdropRef.current || !contentRef.current) return;

      const ctx = gsap.context(() => {
        const isRight = side === "right";
        const xStart = isRight ? "100%" : "-100%";

        if (isOpen) {
          // Enter animation
          gsap.set(backdropRef.current!, { opacity: 0 });
          gsap.set(contentRef.current!, { x: xStart });

          gsap.to(backdropRef.current!, {
            opacity: 1,
            duration: 0.2,
            ease: "power2.out",
          });

          gsap.to(contentRef.current!, {
            x: "0%",
            duration: 0.4,
            ease: "power3.out",
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
            x: xStart,
            duration: 0.3,
            ease: "power3.in",
          });
        }
      }, drawerRef);

      return () => ctx.revert();
    },
    { scope: drawerRef, dependencies: [isOpen, side, disableAnimation] }
  );

  if (!isOpen) return null;

  const sizeStyles = {
    sm: "w-72 max-w-[18rem]",
    md: "w-96 max-w-[24rem]",
    lg: "max-w-lg w-[32rem]",
    xl: "max-w-xl w-[40rem]",
    full: "max-w-4xl w-[56rem]",
  };

  const sideStyles = side === "right" ? "right-0" : "left-0";

  const drawerContent = (
    <div
      ref={drawerRef}
      className={`fixed inset-y-0 z-50 flex ${side === "right" ? "justify-end" : "justify-start"} p-0 overflow-y-auto`}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      {showBackdrop && (
        <div
          ref={backdropRef}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Drawer Content */}
      <div
        ref={contentRef}
        className={`relative flex flex-col h-full ${sizeStyles[size]} ${sideStyles} bg-white rounded-xl shadow-[0_25px_50px_-12px_rgba(7,21,51,0.25),0_0_0_1px_rgba(11,31,77,0.08)] border border-slate-200/80 overflow-hidden ${side === "right" ? "rounded-l-xl" : "rounded-r-xl"}`}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
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
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
              title="Đóng (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="px-6 py-5 flex-1 overflow-y-auto text-sm text-slate-700">
          {children}
        </div>

        {/* Footer Actions */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Portal to body for proper z-index handling
  if (typeof window !== "undefined") {
    return createPortal(drawerContent, document.body);
  }

  return null;
}