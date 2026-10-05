"use client";

import React, { useState } from "react";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminModal from "@/components/admin/ui/AdminModal";
import type { DuplicateReview } from "@/types/admin";

interface DuplicateReviewItem extends DuplicateReview {
  conflictDetails: {
    field: string;
    value: string;
    candidates: {
      id: string;
      code: string;
      name: string;
      school: string;
      submittedAt: string;
    }[];
  };
}

const mockDuplicates: DuplicateReviewItem[] = [
  {
    id: "dup-001",
    state: "OPEN",
    disposition: null,
    reviewed_by_user_id: null,
    reviewed_at: null,
    revision: 1,
    signals: {
      similarity_score: 0.95,
    },
    conflictDetails: {
      field: "Mã số sinh viên (MSSV) & Số điện thoại",
      value: "MSSV: 22070145 • SĐT: 0912345678",
      candidates: [
        {
          id: "c-001",
          code: "CAND-00101",
          name: "Nguyễn Hoàng Nam",
          school: "Trường Quốc tế - ĐHQGHN",
          submittedAt: "01/10/2026 09:15",
        },
        {
          id: "c-099",
          code: "CAND-00199",
          name: "Nguyễn Hoàng Nam (Bản nộp lại)",
          school: "Trường Quốc tế - ĐHQGHN",
          submittedAt: "02/10/2026 14:20",
        },
      ],
    },
  },
  {
    id: "dup-002",
    state: "OPEN",
    disposition: null,
    reviewed_by_user_id: null,
    reviewed_at: null,
    revision: 1,
    signals: {
      similarity_score: 0.88,
    },
    conflictDetails: {
      field: "Link Facebook cá nhân & Email",
      value: "fb.com/maianh.ftu",
      candidates: [
        {
          id: "c-002",
          code: "CAND-00102",
          name: "Trần Thị Mai Anh",
          school: "Đại học Ngoại Thương",
          submittedAt: "01/10/2026 10:45",
        },
        {
          id: "c-088",
          code: "CAND-00188",
          name: "Mai Anh Trần",
          school: "Đại học Ngoại Thương",
          submittedAt: "03/10/2026 11:30",
        },
      ],
    },
  },
];

export default function DuplicateReviewsPage() {
  const [reviews, setReviews] = useState<DuplicateReviewItem[]>(mockDuplicates);
  const [selectedReview, setSelectedReview] = useState<DuplicateReviewItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const handleResolve = (keepCandidateId: string) => {
    if (!selectedReview) return;
    setReviews((prev) =>
      prev.map((r) =>
        r.id === selectedReview.id
          ? {
              ...r,
              state: "RESOLVED",
              disposition: `Giữ lại bản ghi [${keepCandidateId}] - Ghi chú: ${resolutionNote || "Hợp lệ"}`,
              reviewed_at: new Date().toISOString(),
            }
          : r
      )
    );
    setSelectedReview(null);
    setResolutionNote("");
    alert("Đã giải quyết cảnh báo trùng lặp hồ sơ!");
  };

  const columns: Column<DuplicateReviewItem>[] = [
    {
      key: "id",
      header: "Mã Review",
      width: "120px",
      render: (row) => <span className="font-mono text-xs font-bold">{row.id}</span>,
    },
    {
      key: "conflict",
      header: "Trường dữ liệu nghi ngờ",
      render: (row) => (
        <div>
          <span className="font-bold text-rose-700 text-xs block">
            {row.conflictDetails.field}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Giá trị trùng: {row.conflictDetails.value}
          </span>
        </div>
      ),
    },
    {
      key: "candidates",
      header: "Các hồ sơ liên quan",
      render: (row) => (
        <div className="space-y-1">
          {row.conflictDetails.candidates.map((c, i) => (
            <div key={i} className="text-xs flex items-center gap-2">
              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                {c.code}
              </span>
              <span className="font-medium text-slate-900">{c.name}</span>
              <span className="text-slate-400">({c.submittedAt})</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "state",
      header: "Trạng thái",
      align: "center",
      render: (row) => (
        <AdminBadge
          variant={row.state === "OPEN" ? "warning" : "success"}
          size="sm"
        >
          {row.state === "OPEN" ? "Cần xử lý" : "Đã giải quyết"}
        </AdminBadge>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) =>
        row.state === "OPEN" ? (
          <AdminButton
            variant="primary"
            size="sm"
            onClick={() => setSelectedReview(row)}
          >
            Xử lý trùng lặp
          </AdminButton>
        ) : (
          <span className="text-xs text-slate-400 font-mono">
            {row.disposition?.slice(0, 30)}...
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900">
          Rà soát hồ sơ trùng lặp (Duplicate Reviews - FR-04)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Hệ thống phát hiện hồ sơ có dấu hiệu nộp trùng lặp (chung MSSV, Số điện thoại, Email hoặc Link Facebook) để Ban Chuyên môn đối chiếu và hợp nhất.
        </p>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={reviews}
        keyExtractor={(item) => item.id}
      />

      {/* Resolution Modal */}
      {selectedReview && (
        <AdminModal
          isOpen={true}
          onClose={() => setSelectedReview(null)}
          title="Xử lý hồ sơ trùng lặp"
          description={`Mã đối chiếu: ${selectedReview.id} • Dữ liệu trùng: ${selectedReview.conflictDetails.field}`}
          maxWidth="xl"
          footer={
            <AdminButton variant="outline" size="sm" onClick={() => setSelectedReview(null)}>
              Đóng
            </AdminButton>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Chọn hồ sơ chính thức bạn muốn giữ lại cho kỳ thi. Hồ sơ còn lại sẽ được lưu vào lịch sử nhưng không được phân ca thi:
            </p>

            <div className="space-y-3">
              {selectedReview.conflictDetails.candidates.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-300">
                        {c.code}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {c.school} • Nộp lúc: <span className="font-mono text-slate-700">{c.submittedAt}</span>
                    </p>
                  </div>
                  <AdminButton
                    variant="brand"
                    size="sm"
                    onClick={() => handleResolve(c.code)}
                  >
                    Giữ bản này
                  </AdminButton>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Ghi chú quyết định xử lý:
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Thí sinh nộp nhầm video ở lượt đầu, giữ bản nộp lại..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#1F5BE0]/20"
              />
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
