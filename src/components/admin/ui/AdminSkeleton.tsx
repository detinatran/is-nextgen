"use client";

import React from "react";

/**
 * Skeleton loading components for admin dashboard
 * Following minimalist-ui design with slate-100/slate-200 colors
 */

export function AdminSkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)] animate-pulse ${className}`}>
      <div className="h-16 bg-slate-100 border-b border-slate-200/80" />
      <div className="p-5 space-y-4">
        <div className="h-4 bg-slate-100 rounded-md w-1/4" />
        <div className="h-8 bg-slate-100 rounded-md w-3/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-1/3" />
            <div className="h-6 bg-slate-100 rounded w-full" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-1/3" />
            <div className="h-6 bg-slate-100 rounded w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSkeletonTable({
  rows = 5,
  columns = 6,
  className = "",
}: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={`w-full flex flex-col bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              {Array.from({ length: columns }).map((_, idx) => (
                <th key={idx} className="px-4 py-3.5">
                  <div className="h-3 bg-slate-100 rounded w-3/4 animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={`skel-${rIdx}`} className="animate-pulse">
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <td key={`skel-${rIdx}-${cIdx}`} className="px-4 py-3.5">
                    <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-600 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-48" />
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="h-8 w-20 bg-slate-100 rounded" />
          <div className="h-8 w-20 bg-slate-100 rounded" />
          <div className="h-8 w-20 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export function AdminSkeletonKPI({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs animate-pulse">
          <div className="h-3 bg-slate-100 rounded w-2/3" />
          <div className="h-8 bg-slate-100 rounded w-1/2 mt-2" />
        </div>
      ))}
    </div>
  );
}

export function AdminSkeletonForm({ fields = 5, className = "" }: { fields?: number; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, idx) => (
        <div key={idx} className="animate-pulse space-y-1">
          <div className="h-3 bg-slate-100 rounded w-1/4" />
          <div className="h-10 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}

export function AdminSkeletonDrawer({ className = "" }: { className?: string }) {
  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-xl animate-pulse ${className}`}>
      <div className="h-16 bg-slate-100 border-b border-slate-200/80" />
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-8 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="space-y-4 pt-4 border-t border-slate-200/80">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="space-y-1">
              <div className="h-3 bg-slate-100 rounded w-1/4" />
              <div className="h-10 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/80">
          <div className="h-10 w-24 bg-slate-100 rounded" />
          <div className="h-10 w-32 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export function AdminSkeletonModal({ className = "" }: { className?: string }) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs animate-pulse ${className}`}>
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl m-4">
        <div className="h-16 bg-slate-100 border-b border-slate-200/80" />
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-6 bg-slate-100 rounded w-full" />
          </div>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="space-y-1">
              <div className="h-3 bg-slate-100 rounded w-1/4" />
              <div className="h-10 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-200/80">
          <div className="h-10 w-20 bg-slate-100 rounded" />
          <div className="h-10 w-28 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export function AdminSkeletonPageHeader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs animate-pulse ${className}`}>
      <div className="space-y-2 w-full">
        <div className="h-5 bg-slate-100 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
      </div>
      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        <div className="h-10 w-32 bg-slate-100 rounded" />
        <div className="h-10 w-32 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

export function AdminSkeletonFilterBar({ inputs = 2, className = "" }: { inputs?: number; className?: string }) {
  return (
    <div className={`bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse ${className}`}>
      {Array.from({ length: inputs }).map((_, idx) => (
        <div key={idx} className="space-y-1">
          <div className="h-3 bg-slate-100 rounded w-1/3" />
          <div className="h-10 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}