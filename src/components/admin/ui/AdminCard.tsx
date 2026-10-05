"use client";

import React, { forwardRef, useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant determines the visual emphasis */
  variant?: "default" | "elevated" | "outlined" | "metric" | "interactive";
  /** Optional hover lift effect for interactive cards */
  hoverLift?: boolean;
  /** Stagger index for entrance animation */
  staggerIndex?: number;
  /** Children content */
  children: React.ReactNode;
  /** Optional footer */
  footer?: React.ReactNode;
  /** Optional header */
  header?: React.ReactNode;
  /** Padding override */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

const variantStyles: Record<
  NonNullable<AdminCardProps["variant"]>,
  { base: string; hover: string }
> = {
  default: {
    base: "bg-white border border-slate-200/80",
    hover: "hover:border-slate-300 transition-colors duration-200",
  },
  elevated: {
    base: "bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.06)]",
    hover: "hover:shadow-[0_4px_12px_rgba(15,23,42,0.08),0_2px_4px_rgba(15,23,42,0.06)] transition-shadow duration-300",
  },
  outlined: {
    base: "bg-transparent border border-slate-200",
    hover: "hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-200",
  },
  metric: {
    base: "bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.06)]",
    hover: "hover:shadow-[0_4px_16px_rgba(11,31,77,0.08),0_2px_6px_rgba(11,31,77,0.06)] hover:border-[#1F5BE0]/30 transition-all duration-300",
  },
  interactive: {
    base: "bg-white border border-slate-200/80 cursor-pointer",
    hover: "hover:border-[#1F5BE0]/40 hover:shadow-[0_4px_16px_rgba(31,91,224,0.1)] transition-all duration-200",
  },
};

const paddingStyles: Record<NonNullable<AdminCardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
  xl: "p-8 sm:p-10",
};

export const AdminCard = forwardRef<HTMLDivElement, AdminCardProps>(
  (
    {
      variant = "default",
      hoverLift = false,
      staggerIndex = 0,
      children,
      footer,
      header,
      padding = "md",
      className = "",
      style,
      ...props
    },
    ref
  ) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const mergedRef = (el: HTMLDivElement | null) => {
      cardRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    };

    // Entrance animation using GSAP
    useGSAP(
      () => {
        if (!cardRef.current) return;
        const ctx = gsap.context(() => {
          gsap.fromTo(
            cardRef.current!,
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              delay: staggerIndex * 0.08,
            }
          );
        }, cardRef);
        return () => ctx.revert();
      },
      { scope: cardRef, dependencies: [staggerIndex] }
    );

    // Hover lift animation
    useGSAP(
      () => {
        if (!cardRef.current || !hoverLift) return;
        const el = cardRef.current;
        let hoverTween: gsap.core.Tween | null = null;

        const onEnter = () => {
          hoverTween?.kill();
          hoverTween = gsap.to(el, {
            y: -4,
            duration: 0.25,
            ease: "power2.out",
          });
        };
        const onLeave = () => {
          hoverTween?.kill();
          hoverTween = gsap.to(el, {
            y: 0,
            duration: 0.35,
            ease: "power2.out",
          });
        };

        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
        return () => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
          hoverTween?.kill();
        };
      },
      { scope: cardRef, dependencies: [hoverLift] }
    );

    const { base, hover } = variantStyles[variant];

    return (
      <div
        ref={mergedRef}
        className={`rounded-xl ${base} ${hover} ${paddingStyles[padding]} ${className}`}
        style={style}
        {...props}
      >
        {header && (
          <div className="mb-4 pb-4 border-b border-slate-100">
            {header}
          </div>
        )}
        <div className="text-slate-900">{children}</div>
        {footer && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

AdminCard.displayName = "AdminCard";

export default AdminCard;