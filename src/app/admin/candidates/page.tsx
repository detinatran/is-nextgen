"use client";

import React, { useState, useMemo } from "react";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";
import CandidateDetailDrawer from "@/components/admin/candidate/CandidateDetailDrawer";
import VideoReviewModal from "@/components/admin/candidate/VideoReviewModal";
import type { Candidate, CandidateProfile, Registration, MediaObject } from "@/types/admin";

interface CandidateRecord extends Candidate {
  profile: CandidateProfile;
  registration: Registration;
  mediaObject: MediaObject;
  accountStatus: "ACTIVE" | "PROVISIONED" | "DISABLED";
}

const mockCandidates: CandidateRecord[] = [
  {
    id: "c-001",
    user_id: "u-001",
    candidate_code: "CAND-00101",
    created_at: "2026-10-01T08:30:00Z",
    accountStatus: "ACTIVE",
    profile: {
      candidate_id: "c-001",
      full_name: "Nguyễn Hoàng Nam",
      date_of_birth: "2004-05-12",
      student_id: "22070145",
      school: "Trường Quốc tế - ĐHQGHN",
      department: "Kinh tế và Quản lý",
      major: "Quản trị Kinh doanh",
      email: "nam.nh22@isvnu.vn",
      email_normalized: "nam.nh22@isvnu.vn",
      phone: "0912345678",
      phone_normalized: "0912345678",
      facebook: "https://facebook.com/nam.nguyen",
      revision: 1,
      updated_at: "2026-10-01T08:30:00Z",
    },
    registration: {
      id: "reg-001",
      competition_id: "comp-2026",
      candidate_id: "c-001",
      state: "SUBMITTED",
      submitted_profile: {},
      submitted_at: "2026-10-01T09:15:00Z",
      revision: 1,
      created_at: "2026-10-01T08:30:00Z",
      updated_at: "2026-10-01T09:15:00Z",
    },
    mediaObject: {
      id: "media-001",
      upload_id: "upl-001",
      registration_id: "reg-001",
      object_key: "videos/comp-2026/c-001/intro.mp4",
      checksum_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      mime_type: "video/mp4",
      size_bytes: 45200000,
      duration_seconds: 114.5,
      is_private: true,
      validated_at: "2026-10-01T09:20:00Z",
      sealed_at: "2026-10-01T09:20:00Z",
    },
  },
  {
    id: "c-002",
    user_id: "u-002",
    candidate_code: "CAND-00102",
    created_at: "2026-10-01T10:15:00Z",
    accountStatus: "ACTIVE",
    profile: {
      candidate_id: "c-002",
      full_name: "Trần Thị Mai Anh",
      date_of_birth: "2005-02-18",
      student_id: "23041088",
      school: "Đại học Ngoại Thương",
      department: "Kinh tế đối ngoại",
      major: "Kinh tế quốc tế",
      email: "maianh.tran@ftu.edu.vn",
      email_normalized: "maianh.tran@ftu.edu.vn",
      phone: "0988776655",
      phone_normalized: "0988776655",
      facebook: "https://facebook.com/maianh.ftu",
      revision: 1,
      updated_at: "2026-10-01T10:15:00Z",
    },
    registration: {
      id: "reg-002",
      competition_id: "comp-2026",
      candidate_id: "c-002",
      state: "SUBMITTED",
      submitted_profile: {},
      submitted_at: "2026-10-01T10:45:00Z",
      revision: 1,
      created_at: "2026-10-01T10:15:00Z",
      updated_at: "2026-10-01T10:45:00Z",
    },
    mediaObject: {
      id: "media-002",
      upload_id: "upl-002",
      registration_id: "reg-002",
      object_key: "videos/comp-2026/c-002/intro.mp4",
      checksum_sha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
      mime_type: "video/mp4",
      size_bytes: 88400000,
      duration_seconds: 119.0,
      is_private: true,
      validated_at: "2026-10-01T10:50:00Z",
      sealed_at: "2026-10-01T10:50:00Z",
    },
  },
  {
    id: "c-003",
    user_id: "u-003",
    candidate_code: "CAND-00103",
    created_at: "2026-10-02T14:20:00Z",
    accountStatus: "ACTIVE",
    profile: {
      candidate_id: "c-003",
      full_name: "Lê Minh Tuấn",
      date_of_birth: "2004-11-30",
      student_id: "22070982",
      school: "Trường Quốc tế - ĐHQGHN",
      department: "Công nghệ Thông tin",
      major: "Tin học và Kỹ thuật máy tính",
      email: "tuan.lm22@isvnu.vn",
      email_normalized: "tuan.lm22@isvnu.vn",
      phone: "0901234567",
      phone_normalized: "0901234567",
      facebook: "https://facebook.com/tuan.le",
      revision: 1,
      updated_at: "2026-10-02T14:20:00Z",
    },
    registration: {
      id: "reg-003",
      competition_id: "comp-2026",
      candidate_id: "c-003",
      state: "SUBMITTED",
      submitted_profile: {},
      submitted_at: "2026-10-02T15:00:00Z",
      revision: 1,
      created_at: "2026-10-02T14:20:00Z",
      updated_at: "2026-10-02T15:00:00Z",
    },
    mediaObject: {
      id: "media-003",
      upload_id: "upl-003",
      registration_id: "reg-003",
      object_key: "videos/comp-2026/c-003/intro.mp4",
      checksum_sha256: "8743b52063cd84097a65d1633f5c74f5",
      mime_type: "video/mp4",
      size_bytes: 62100000,
      duration_seconds: 128.5, // > 120s!
      is_private: true,
      validated_at: "2026-10-02T15:05:00Z",
      sealed_at: "2026-10-02T15:05:00Z",
    },
  },
  {
    id: "c-004",
    user_id: "u-004",
    candidate_code: "CAND-00104",
    created_at: "2026-10-03T09:00:00Z",
    accountStatus: "PROVISIONED",
    profile: {
      candidate_id: "c-004",
      full_name: "Phạm Hải Đăng",
      date_of_birth: "2003-08-25",
      student_id: "21050321",
      school: "Đại học Kinh tế Quốc dân",
      department: "Quản trị kinh doanh",
      major: "Quản trị tổng hợp",
      email: "dang.ph21@neu.edu.vn",
      email_normalized: "dang.ph21@neu.edu.vn",
      phone: "0934567890",
      phone_normalized: "0934567890",
      facebook: "https://facebook.com/haidang.neu",
      revision: 1,
      updated_at: "2026-10-03T09:00:00Z",
    },
    registration: {
      id: "reg-004",
      competition_id: "comp-2026",
      candidate_id: "c-004",
      state: "DRAFT",
      submitted_profile: null,
      submitted_at: null,
      revision: 1,
      created_at: "2026-10-03T09:00:00Z",
      updated_at: "2026-10-03T09:00:00Z",
    },
    mediaObject: {
      id: "media-004",
      upload_id: "upl-004",
      registration_id: "reg-004",
      object_key: "videos/comp-2026/c-004/intro.mp4",
      checksum_sha256: "fb8e20fc2e4c3f248c60c39bd652f3c1347298ab9f5045b13c19d22d3a777be3",
      mime_type: "video/mp4",
      size_bytes: 35000000,
      duration_seconds: 90.0,
      is_private: true,
      validated_at: "2026-10-03T09:10:00Z",
      sealed_at: "2026-10-03T09:10:00Z",
    },
  },
];

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateRecord[]>(mockCandidates);
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selected Candidate for Drawer & Video Modal
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

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

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Mã thí sinh",
      "Họ và tên",
      "MSSV",
      "Trường",
      "Ngành",
      "Email",
      "Số điện thoại",
      "Trạng thái hồ sơ",
      "Link đối tượng Video S3",
      "Thời lượng video (giây)",
      "Ngày đăng ký",
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

  const handleToggleAccount = (cand: CandidateRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = cand.accountStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    if (
      confirm(
        `Bạn có chắc chắn muốn chuyển trạng thái tài khoản của ${cand.profile.full_name} sang ${nextStatus}?`
      )
    ) {
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === cand.id ? { ...c, accountStatus: nextStatus } : c
        )
      );
    }
  };

  const columns: Column<CandidateRecord>[] = [
    {
      key: "candidate_code",
      header: "Mã TS",
      width: "120px",
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.candidate_code || "CHƯA CẤP"}
        </span>
      ),
    },
    {
      key: "full_name",
      header: "Họ và tên",
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.profile.full_name}</div>
          <div className="text-[11px] text-slate-400 font-mono">
            MSSV: {row.profile.student_id} • {row.profile.email}
          </div>
        </div>
      ),
    },
    {
      key: "school",
      header: "Trường / Ngành học",
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800 text-xs">{row.profile.school}</div>
          <div className="text-[11px] text-slate-500">{row.profile.major}</div>
        </div>
      ),
    },
    {
      key: "video",
      header: "Video dự thi",
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
              {isDurationValid ? "Hợp lệ" : "> 2 phút"}
            </AdminBadge>
          </div>
        );
      },
    },
    {
      key: "state",
      header: "Hồ sơ",
      align: "center",
      render: (row) => (
        <AdminBadge
          variant={row.registration.state === "SUBMITTED" ? "success" : "default"}
          size="sm"
        >
          {row.registration.state === "SUBMITTED" ? "Đã nộp" : "Dự thảo"}
        </AdminBadge>
      ),
    },
    {
      key: "account",
      header: "Tài khoản",
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
      header: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => handleToggleAccount(row, e)}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors text-xs cursor-pointer ${
              row.accountStatus === "ACTIVE" ? "text-slate-500 hover:text-rose-600" : "text-emerald-600"
            }`}
            title={row.accountStatus === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
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
          </button>
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => handleOpenDetail(row)}
          >
            Chi tiết
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
            Quản lý hồ sơ & Dữ liệu đăng ký
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <span className="font-bold text-[#0B1F4D]">{candidates.length}</span> hồ sơ • Đã nộp video:{" "}
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
            Xuất Excel / CSV
          </AdminButton>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminInput
          placeholder="Tìm theo MSSV, Họ tên, Email, Mã thí sinh..."
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
            { label: "Tất cả các Trường / Viện", value: "ALL" },
            { label: "Trường Quốc tế - ĐHQGHN", value: "Trường Quốc tế" },
            { label: "Đại học Ngoại Thương", value: "Ngoại Thương" },
            { label: "Đại học Kinh tế Quốc dân", value: "Kinh tế Quốc dân" },
          ]}
        />
        <AdminSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: "Tất cả trạng thái hồ sơ", value: "ALL" },
            { label: "Đã nộp chính thức (SUBMITTED)", value: "SUBMITTED" },
            { label: "Dự thảo (DRAFT)", value: "DRAFT" },
          ]}
        />
      </div>

      {/* Candidates Data Table */}
      <AdminTable
        columns={columns}
        data={filteredCandidates}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => handleOpenDetail(item)}
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
          alert("Đã duyệt video đạt tiêu chuẩn!");
        }}
        onReject={(reason) => {
          alert(`Đã từ chối video với lý do: ${reason}`);
        }}
      />
    </div>
  );
}
