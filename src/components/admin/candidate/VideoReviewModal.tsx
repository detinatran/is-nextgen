"use client";

import React, { useState } from "react";
import AdminModal from "../ui/AdminModal";
import AdminButton from "../ui/AdminButton";
import AdminBadge from "../ui/AdminBadge";
import type { MediaObject } from "@/types/admin";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

interface VideoReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidateCode: string;
  media?: MediaObject | null;
  videoUrl?: string;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
}

export default function VideoReviewModal({
  isOpen,
  onClose,
  candidateName,
  candidateCode,
  media,
  videoUrl,
  onApprove,
  onReject,
}: VideoReviewModalProps) {
  const { t, lang } = useAdminI18n();
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      alert(t("Vui lòng nhập lý do từ chối video!"));
      return;
    }
    if (onReject) {
      onReject(rejectionReason);
      setRejecting(false);
      setRejectionReason("");
      onClose();
    }
  };

  const isDurationValid = media?.duration_seconds ? media.duration_seconds <= 120 : true;
  const isSizeValid = media?.size_bytes ? media.size_bytes <= 500000000 : true;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t("Thẩm định Video dự thi:")} ${candidateName}`}
      description={`${t("Mã TS")}: ${candidateCode} • ${t("Yêu cầu: Video giới thiệu bản thân <= 2 phút")}`}
      maxWidth="2xl"
      footer={
        rejecting ? (
          <div className="w-full flex items-center justify-between gap-3">
            <input
              type="text"
              placeholder={t("Nhập lý do không đạt (quá giờ, mờ, sai chủ đề...)")}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="flex-1 text-xs border border-rose-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
            />
            <AdminButton variant="danger" size="sm" onClick={handleRejectConfirm}>
              {t("Xác nhận từ chối")}
            </AdminButton>
            <AdminButton variant="ghost" size="sm" onClick={() => setRejecting(false)}>
              {t("Hủy")}
            </AdminButton>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <AdminButton variant="outline" size="sm" onClick={onClose}>
              {t("Đóng")}
            </AdminButton>
            <AdminButton
              variant="danger"
              size="sm"
              onClick={() => setRejecting(true)}
            >
              {t("Từ chối video")}
            </AdminButton>
            <AdminButton
              variant="brand"
              size="sm"
              onClick={() => {
                if (onApprove) onApprove();
                onClose();
              }}
            >
              {t("Duyệt video")}
            </AdminButton>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {/* Video Player */}
        <div className="w-full aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
            >
              {t("Trình duyệt của bạn không hỗ trợ thẻ video HTML5.")}
            </video>
          ) : (
            <div className="text-center p-6 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs">{t("Trình phát video xem trước (Private S3 Secure Storage)")}</p>
              <p className="text-[11px] text-slate-500 font-sans tabular-nums tracking-tight mt-1">{media?.object_key || "—"}</p>
            </div>
          )}
        </div>

        {/* Technical Validation Checks - Only show when media metadata is available */}
        {media && (
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block">{t("Thời lượng (Quy định &le; 120s):")}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-slate-900 font-sans tabular-nums tracking-tight">
                  {media.duration_seconds} {t("giây")}
                </span>
                <AdminBadge variant={isDurationValid ? "success" : "danger"} size="sm">
                  {isDurationValid ? t("Hợp lệ") : t("Quá thời lượng")}
                </AdminBadge>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block">{t("Dung lượng file:")}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-slate-900 font-sans tabular-nums tracking-tight">
                  {(media.size_bytes / (1024 * 1024)).toFixed(2)} MB
                </span>
                <AdminBadge variant={isSizeValid ? "success" : "danger"} size="sm">
                  {isSizeValid ? t("Dưới 500MB") : t("Vượt mức")}
                </AdminBadge>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block">{t("Định dạng MIME Type:")}</span>
              <span className="font-semibold text-slate-800 font-sans tabular-nums tracking-tight">
                {media.mime_type}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">{t("Trạng thái bảo mật:")}</span>
              <span className="font-semibold text-emerald-700">
                {media.is_private ? t("Private Encrypted S3") : t("Public")}
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-200">
              <span className="text-slate-400 block">{t("SHA-256 Checksum:")}</span>
              <span className="font-sans tabular-nums tracking-tight text-[11px] text-slate-600 break-all select-all">
                {media.checksum_sha256}
              </span>
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
}
