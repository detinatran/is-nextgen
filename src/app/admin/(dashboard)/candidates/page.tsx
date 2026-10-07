"use client";

import React, { useState, useMemo, useCallback } from "react";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminPopconfirm from "@/components/admin/ui/AdminPopconfirm";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";
import { useToastHelpers } from "@/components/admin/ui/Toast";
import CandidateDetailDrawer from "@/components/admin/candidate/CandidateDetailDrawer";
import VideoReviewModal from "@/components/admin/candidate/VideoReviewModal";
import BulkActionBar from "@/components/admin/ui/BulkActionBar";
import { mockCandidates, getSchools } from "@/mocks/admin";
import type { CandidateRecord } from "@/mocks/admin/candidates";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

export default function CandidatesPage() {
  const { t } = useAdminI18n();
  const [candidates, setCandidates] = useState<CandidateRecord[]>(mockCandidates);
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Bulk Selection
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Selected Candidate for Drawer & Video Modal
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const { success, error, warning, info } = useToastHelpers();

  // Filtered List
  const filteredCandidates = useMemo(() => {
    return candidates.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.profile.full_name.toLowerCase().includes(q) ||
        (item.profile.student_id && item.profile.student_id.toLowerCase().includes(q)) ||
        item.profile.email.toLowerCase().includes(q) ||
        (item.candidate_code && item.candidate_code.toLowerCase().includes(q));

      const matchSchool =
        schoolFilter === "ALL" || item.profile.school?.includes(schoolFilter);

      const matchStatus =
        statusFilter === "ALL" || item.registration.state === statusFilter;

      return matchQuery && matchSchool && matchStatus;
    });
  }, [candidates, searchQuery, schoolFilter, statusFilter]);

  // Bulk Actions
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allKeys = new Set(filteredCandidates.map((c) => c.id));
      setSelectedRows(allKeys);
    } else {
      setSelectedRows(new Set());
    }
  }, [filteredCandidates]);

  const handleSelectionChange = useCallback((newSelection: Set<string | number>) => {
    setSelectedRows(newSelection as Set<string>);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const handleBulkExportCSV = useCallback(() => {
    const selectedCandidates = filteredCandidates.filter((c) => selectedRows.has(c.id));
    if (selectedCandidates.length === 0) return;

    const headers = [
      t("Mã TS"), t("Họ và tên"), t("MSSV"), t("Trường / Ngành học"), t("Ngành"), t("Email"),
      t("Số điện thoại"), t("Hồ sơ"), t("Link Video S3"), t("Thời lượng (giây)"), t("Ngày đăng ký")
    ];
    const rows = selectedCandidates.map((c) => [
      c.candidate_code || "", `"${c.profile.full_name}"`, c.profile.student_id || "",
      `"${c.profile.school || ""}"`, `"${c.profile.major || ""}"`, c.profile.email,
      c.profile.phone || "", c.registration.state, c.mediaObject?.object_key || "",
      c.mediaObject?.duration_seconds || 0, new Date(c.created_at).toLocaleDateString("vi-VN")
    ]);
    const csvContent = "data:text/csv;charset=utf-8,﻿" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `IS-NextGen_DS_Chon_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    success(t("Đã xuất CSV"), t("Đã xuất") + ` ${selectedCandidates.length} ` + t("hồ sơ đã chọn ra file CSV."));
    clearSelection();
  }, [filteredCandidates, selectedRows, success, clearSelection]);

  const handleBulkToggleAccount = useCallback((disable: boolean) => {
    const selectedCandidates = filteredCandidates.filter((c) => selectedRows.has(c.id));
    if (selectedCandidates.length === 0) return;

    setCandidates((prev) =>
      prev.map((c) =>
        selectedRows.has(c.id) ? { ...c, accountStatus: disable ? "DISABLED" : "ACTIVE" } : c
      )
    );
    success(
      disable ? t("Đã khóa hàng loạt") : t("Đã mở khóa hàng loạt"),
      t("Đã") + ` ${disable ? t("khóa") : t("mở khóa")} ${selectedCandidates.length} ` + t("tài khoản.")
    );
    clearSelection();
  }, [filteredCandidates, selectedRows, success, clearSelection]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      t("Mã TS"), t("Họ và tên"), t("MSSV"), t("Trường / Ngành học"), t("Ngành"), t("Email"),
      t("Số điện thoại"), t("Hồ sơ"), t("Link Video S3"), t("Thời lượng (giây)"), t("Ngày đăng ký")
    ];

    const rows = filteredCandidates.map((c) => [
      c.candidate_code || "",
      `"${c.profile.full_name}"`,
      c.profile.student_id || "",
      `"${c.profile.school || ""}"`,
      `"${c.profile.major || ""}"`,
      c.profile.email,
      c.profile.phone || "",
      c.registration.state,
      c.mediaObject?.object_key || "",
      c.mediaObject?.duration_seconds || 0,
      new Date(c.created_at).toLocaleDateString("vi-VN"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,﻿" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `IS-NextGen_Danh_Sach_Thi_Sinh_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(t("Đã xuất CSV"), t("Đã xuất") + ` ${filteredCandidates.length} ` + t("hồ sơ thí sinh ra file CSV."));
  };

  const handleOpenDetail = (cand: CandidateRecord) => {
    setSelectedCandidate(cand);
    setIsDrawerOpen(true);
  };

  const handleOpenVideo = (cand: CandidateRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCandidate(cand);
    setIsVideoModalOpen(true);
  };

  const handleToggleAccount = (cand: CandidateRecord) => {
    const nextStatus = cand.accountStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    warning(
      nextStatus === "DISABLED" ? t("Khóa tài khoản") : t("Mở khóa tài khoản"),
      nextStatus === "DISABLED"
        ? t("Tài khoản của") + ` ${cand.profile.full_name} ` + t("sẽ bị khóa và không thể đăng nhập.")
        : t("Tài khoản của") + ` ${cand.profile.full_name} ` + t("sẽ được kích hoạt lại."),
      {
        action: {
          label: t("Xác nhận"),
          onClick: () => {
            setCandidates((prev) =>
              prev.map((c) =>
                c.id === cand.id ? { ...c, accountStatus: nextStatus } : c
              )
            );
            success(
              nextStatus === "DISABLED" ? t("Đã khóa tài khoản") : t("Đã mở khóa tài khoản"),
              t("Tài khoản của") + ` ${cand.profile.full_name} ` + t("đã được chuyển sang") + ` ${nextStatus}.`
            );
          },
        },
      }
    );
  };

  const columns: Column<CandidateRecord>[] = [
    {
      key: "candidate_code",
      header: t("Mã TS"),
      width: "120px",
      render: (row) => (
        <span className="font-sans tabular-nums tracking-tight font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.candidate_code || t("CHƯA CẤP")}
        </span>
      ),
    },
    {
      key: "full_name",
      header: t("Họ và tên"),
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.profile.full_name}</div>
          <div className="text-[11px] text-slate-400 font-sans tabular-nums tracking-tight">
            MSSV: {row.profile.student_id} • {row.profile.email}
          </div>
        </div>
      ),
    },
    {
      key: "school",
      header: t("Trường / Ngành học"),
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800 text-xs">{row.profile.school}</div>
          <div className="text-[11px] text-slate-500">{row.profile.major}</div>
        </div>
      ),
    },
    {
      key: "video",
      header: t("Video dự thi"),
      align: "center",
      render: (row) => {
        const isDurationValid = row.mediaObject && row.mediaObject.duration_seconds <= 120;
        return (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={(e) => handleOpenVideo(row, e)}
              className="text-xs font-semibold text-[#1F5BE0] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              <span>{row.mediaObject.duration_seconds}s</span>
            </button>
            <AdminBadge variant={isDurationValid ? "success" : "danger"} size="sm">
              {isDurationValid ? t("Hợp lệ") : "> 2 phút"}
            </AdminBadge>
          </div>
        );
      },
    },
    {
      key: "state",
      header: t("Hồ sơ"),
      align: "center",
      render: (row) => (
        <AdminBadge
          variant={row.registration.state === "SUBMITTED" ? "success" : "default"}
          size="sm"
        >
          {row.registration.state === "SUBMITTED" ? t("Đã nộp") : t("Dự thảo")}
        </AdminBadge>
      ),
    },
    {
      key: "account",
      header: t("Tài khoản"),
      align: "center",
      render: (row) => (
        <AdminBadge
          variant={
            row.accountStatus === "ACTIVE"
              ? "success"
              : row.accountStatus === "DISABLED"
              ? "danger"
              : "warning"
          }
          size="sm"
        >
          {row.accountStatus}
        </AdminBadge>
      ),
    },
    {
      key: "actions",
      header: t("Thao tác"),
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <AdminPopconfirm
            title={row.accountStatus === "ACTIVE" ? t("Khóa tài khoản") : t("Mở khóa tài khoản")}
            description={
              row.accountStatus === "ACTIVE"
                ? t("Tài khoản của") + ` ${row.profile.full_name} ` + t("sẽ bị khóa và không thể đăng nhập.")
                : t("Tài khoản của") + ` ${row.profile.full_name} ` + t("sẽ được kích hoạt lại.")
            }
            confirmVariant="danger"
            confirmText={t("Xác nhận")}
            onConfirm={() => handleToggleAccount(row)}
            triggerVariant="ghost"
            triggerSize="sm"
          >
            {(open) => (
              <span
                className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors text-xs cursor-pointer ${
                  row.accountStatus === "ACTIVE"
                    ? "text-slate-500 hover:text-rose-600"
                    : "text-emerald-600"
                  } ${open ? "bg-slate-100" : ""}`}
                title={
                  row.accountStatus === "ACTIVE"
                    ? t("Khóa tài khoản")
                    : t("Mở khóa tài khoản")
                }
                aria-label={
                  row.accountStatus === "ACTIVE"
                    ? t("Khóa tài khoản")
                    : t("Mở khóa tài khoản")
                }
              >
                {row.accountStatus === "ACTIVE" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
              </span>
            )}
          </AdminPopconfirm>
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => handleOpenDetail(row)}
          >
            {t("Chi tiết")}
          </AdminButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {t("Quản lý hồ sơ & Dữ liệu đăng ký")}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("Tổng cộng")}: <span className="font-bold text-[#0B1F4D]">{candidates.length}</span> {t("hồ sơ")} • {t("Đã nộp video")}:{" "}
            <span className="font-bold text-emerald-600">
              {candidates.filter((c) => c.registration.state === "SUBMITTED").length}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <AdminButton
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            {t("Xuất Excel / CSV")}
          </AdminButton>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminInput
          placeholder={t("Tìm theo MSSV, Họ tên, Email, Mã thí sinh...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <AdminSelect
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          options={[
            { label: t("Tất cả các Trường / Viện"), value: "ALL" },
            { label: t("Trường Quốc tế"), value: "Trường Quốc tế" },
            { label: t("Ngoại Thương"), value: "Ngoại Thương" },
            { label: t("Kinh tế Quốc dân"), value: "Kinh tế Quốc dân" },
          ]}
        />
        <AdminSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: t("Tất cả trạng thái hồ sơ"), value: "ALL" },
            { label: t("Đã nộp chính thức (SUBMITTED)"), value: "SUBMITTED" },
            { label: t("Dự thảo (DRAFT)"), value: "DRAFT" },
          ]}
        />
      </div>

      {/* Candidates Data Table */}
      <AdminTable
        columns={columns}
        data={filteredCandidates}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => handleOpenDetail(item)}
        emptyMessage={t("Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại")}
        enableSelection={true}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedRows.size}
        onClearSelection={clearSelection}
        actions={[
          {
            label: t("Xuất CSV"),
            onClick: handleBulkExportCSV,
            variant: "outline",
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
          },
          {
            label: t("Khóa tài khoản"),
            onClick: () => handleBulkToggleAccount(true),
            variant: "danger",
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ),
          },
          {
            label: t("Mở khóa tài khoản"),
            onClick: () => handleBulkToggleAccount(false),
            variant: "primary",
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            ),
          },
        ]}
      />

      {/* Modals & Drawers */}
      <CandidateDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        candidate={selectedCandidate}
        onOpenVideoReview={() => {
          setIsDrawerOpen(false);
          setIsVideoModalOpen(true);
        }}
      />

      <VideoReviewModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        candidateName={selectedCandidate?.profile.full_name || ""}
        candidateCode={selectedCandidate?.candidate_code || ""}
        media={selectedCandidate?.mediaObject || null}
        onApprove={() => {
          success(t("Đã duyệt video"), t("Video dự thi đạt tiêu chuẩn quy định."));
        }}
        onReject={(reason) => {
          error(t("Đã từ chối video"), t("Lý do:") + ` ${reason}`);
        }}
      />
    </div>
  );
}