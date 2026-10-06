"use client";

import React, { useRef, useEffect, useState, forwardRef } from "react";
import AdminButton from "./AdminButton";
import AdminBadge from "./AdminBadge";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  /** Enable staggered row entrance animation */
  animateRows?: boolean;
  className?: string;
}

const getAlignmentClass = (align?: "left" | "center" | "right") => {
  if (align === "center") return "text-center justify-center";
  if (align === "right") return "text-right justify-end";
  return "text-left justify-start";
};

export const AdminTable = forwardRef<HTMLDivElement, AdminTableProps<any>>(
  (
    {
      columns,
      data,
      keyExtractor,
      isLoading = false,
      emptyMessage = "Không tìm thấy dữ liệu nào",
      onRowClick,
      sortColumn,
      sortDirection = "asc",
      onSort,
      currentPage = 1,
      totalPages = 1,
      onPageChange,
      totalItems,
      pageSize = 10,
      animateRows = true,
      className = "",
      ...props
    },
    ref
  ) => {
    const tableRef = useRef<HTMLDivElement>(null);
    const rowsRef = useRef<HTMLTableRowElement[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    // Sort indicator SVG
    const SortIcon = ({ direction }: { direction: "asc" | "desc" }) => (
      <svg className="w-3.5 h-3.5 text-[#1F5BE0]" viewBox="0 0 20 20" fill="currentColor">
        {direction === "asc" ? (
          <path
            fillRule="evenodd"
            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        ) : (
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        )}
      </svg>
    );

    return (
      <div
        ref={ref}
        className={`w-full flex flex-col bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.06)] ${className}`}
        {...props}
      >
        <div className="overflow-x-auto" ref={tableRef}>
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={`px-4 py-3.5 ${
                      col.sortable ? "cursor-pointer hover:bg-slate-100/80 transition-colors" : ""
                    }`}
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                  >
                    <div className={`flex items-center gap-1.5 ${getAlignmentClass(col.align)}`}>
                      <span>{col.header}</span>
                      {col.sortable && sortColumn === col.key && (
                        <SortIcon direction={sortDirection} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={`skel-${rIdx}`} className="animate-pulse">
                    {columns.map((col, cIdx) => (
                      <td key={`skel-${rIdx}-${cIdx}`} className="px-4 py-3.5">
                        <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-slate-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-600 font-medium text-sm">{emptyMessage}</p>
                        <p className="text-slate-400 text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => {
                  const key = keyExtractor(row);

                  return (
                    <tr
                      key={key}
                      onClick={() => onRowClick && onRowClick(row)}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        onRowClick ? "cursor-pointer" : ""
                      }`}
                    >
                      {columns.map((col) => (
                        <td
                          key={`${key}-${col.key}`}
                          className={`px-4 py-3.5 text-xs sm:text-sm ${
                            col.align === "center"
                              ? "text-center"
                              : col.align === "right"
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {col.render
                            ? col.render(row, index)
                            : ((row as any)[col.key] as React.ReactNode)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && onPageChange && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-600">
            <div>
              {totalItems !== undefined && (
                <span>
                  Hiển thị{" "}
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {Math.min((currentPage - 1) * pageSize + 1, totalItems)}
                  </span>{" "}
                  -{" "}
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {Math.min(currentPage * pageSize, totalItems)}
                  </span>{" "}
                  trong tổng số{" "}
                  <span className="font-semibold text-slate-900 tabular-nums">{totalItems}</span> bản ghi
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <AdminButton
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                title="Trang trước"
                aria-label="Trang trước"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </AdminButton>
              <span className="px-2 font-medium">
                Trang {currentPage} / {totalPages}
              </span>
              <AdminButton
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                title="Trang sau"
                aria-label="Trang sau"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </AdminButton>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AdminTable.displayName = "AdminTable";

export default AdminTable;