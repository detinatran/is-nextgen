"use client";

import React from "react";
import AdminBadge from "../ui/AdminBadge";
import AdminButton from "../ui/AdminButton";
import type { Candidate, CandidateProfile, Registration, MediaObject } from "@/types/admin";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

interface CandidateDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: (Candidate & {
    profile?: CandidateProfile;
    registration?: Registration;
    mediaObject?: MediaObject;
  }) | null;
  onOpenVideoReview?: () => void;
  onToggleStatus?: () => void;
}

export default function CandidateDetailDrawer({
  isOpen,
  onClose,
  candidate,
  onOpenVideoReview,
  onToggleStatus,
}: CandidateDetailDrawerProps) {
  const { t } = useAdminI18n();
  if (!isOpen || !candidate) return null;

  const profile = candidate.profile;
  const registration = candidate.registration;
  const media = candidate.mediaObject;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {profile?.full_name || t("Chi tiết thí sinh")}
                </h3>
                {candidate.candidate_code && (
                  <span className="text-xs font-sans tabular-nums tracking-tight font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {candidate.candidate_code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("Đăng ký ngày")}: {new Date(candidate.created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
            {/* Trạng thái hồ sơ */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t("Trạng thái đăng ký")}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">{t("Hồ sơ Vòng Đơn:")}</span>
                <AdminBadge
                  variant={registration?.state === "SUBMITTED" ? "success" : "default"}
                  size="sm"
                >
                  {registration?.state === "SUBMITTED" ? t("ĐÃ NỘP HỒ SƠ") : t("DỰ THẢO (DRAFT)")}
                </AdminBadge>
              </div>
              {registration?.submitted_at && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{t("Thời điểm nộp:")}</span>
                  <span className="font-sans tabular-nums tracking-tight text-slate-800">
                    {new Date(registration.submitted_at).toLocaleString("vi-VN")}
                  </span>
                </div>
              )}
            </div>

            {/* Thông tin học vấn & cá nhân */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#0B1F4D] uppercase tracking-wider border-b border-slate-100 pb-1">
                {t("Thông tin học vấn & cá nhân")}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">{t("Mã số sinh viên (MSSV)")}</span>
                  <span className="font-semibold text-slate-900 font-sans tabular-nums tracking-tight">
                    {profile?.student_id || t("Chưa cập nhật")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t("Ngày sinh")}</span>
                  <span className="font-semibold text-slate-900">
                    {profile?.date_of_birth
                      ? new Date(profile.date_of_birth).toLocaleDateString("vi-VN")
                      : t("Chưa cập nhật")}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">{t("Trường / Viện đào tạo")}</span>
                  <span className="font-semibold text-slate-900">
                    {profile?.school || t("Chưa cập nhật")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t("Khoa / Bộ môn")}</span>
                  <span className="font-semibold text-slate-900">
                    {profile?.department || t("Chưa cập nhật")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t("Chuyên ngành")}</span>
                  <span className="font-semibold text-slate-900">
                    {profile?.major || t("Chưa cập nhật")}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin liên hệ */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#0B1F4D] uppercase tracking-wider border-b border-slate-100 pb-1">
                {t("Thông tin liên hệ")}
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">{t("Email chính thức")}</span>
                  <span className="font-medium text-[#1F5BE0] font-sans tabular-nums tracking-tight">
                    {profile?.email || t("Chưa cập nhật")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t("Số điện thoại")}</span>
                  <span className="font-semibold text-slate-900 font-sans tabular-nums tracking-tight">
                    {profile?.phone || t("Chưa cập nhật")}
                  </span>
                </div>
                {profile?.facebook && (
                  <div>
                    <span className="text-slate-400 block">{t("Link Facebook")}</span>
                    <a
                      href={profile.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1F5BE0] hover:underline truncate block"
                    >
                      {profile.facebook}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Video dự thi */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#0B1F4D] uppercase tracking-wider border-b border-slate-100 pb-1">
                {t("Video giới thiệu bản thân (&le; 2 phút)")}
              </h4>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {media ? t("Video MP4 tải lên trực tiếp") : t("Chưa có video hoặc đang xác thực")}
                  </p>
                  {media && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t("Thời lượng")}: {media.duration_seconds}s • {t("Dung lượng")}:{" "}
                      {(media.size_bytes / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  )}
                </div>
                {media && onOpenVideoReview && (
                  <AdminButton variant="outline" size="sm" onClick={onOpenVideoReview}>
                    {t("Xem Video")}
                  </AdminButton>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <AdminButton variant="outline" size="sm" onClick={onClose}>
              {t("Đóng")}
            </AdminButton>
            {onToggleStatus && (
              <AdminButton variant="secondary" size="sm" onClick={onToggleStatus}>
                {t("Khóa / Đổi trạng thái")}
              </AdminButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
