"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminModal from "@/components/admin/ui/AdminModal";
import AdminPopconfirm from "@/components/admin/ui/AdminPopconfirm";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";
import { useToastHelpers } from "@/components/admin/ui/Toast";
import { mockLiveAttempts, getLiveAttemptById } from "@/mocks/admin";
import type { LiveAttemptItem } from "@/mocks/admin/live-monitor";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

export default function LiveExamMonitorPage() {
  const { t, lang } = useAdminI18n();
  const [attempts, setAttempts] = useState<LiveAttemptItem[]>(mockLiveAttempts);
  const [filterViolation, setFilterViolation] = useState<"ALL" | "VIOLATION_ONLY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isWarnModalOpen, setIsWarnModalOpen] = useState(false);
  const [warnAttempt, setWarnAttempt] = useState<LiveAttemptItem | null>(null);
  const [warnReason, setWarnReason] = useState("");

  const { success, error, warning, info } = useToastHelpers();

  // Auto-refresh heartbeat simulation - realistic deterministic updates
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulateHeartbeat = useCallback(() => {
    setAttempts((prev) =>
      prev.map((attempt) => {
        if (attempt.status !== "ACTIVE") return attempt;

        // Deterministic progress based on time elapsed (not random)
        const timeElapsed = Date.now() - new Date(attempt.startedAt).getTime();
        const expectedAnswered = Math.min(
          Math.floor(timeElapsed / (60 * 1000)) * 2 + 1, // ~2 questions per minute
          attempt.totalQuestions
        );

        // Only update if progress would increase (prevents flicker)
        const newAnswered = Math.max(attempt.answeredCount, expectedAnswered);

        // Violations only increase, never decrease
        const newTabSwitch = Math.max(attempt.tabSwitchCount, Math.floor(timeElapsed / (5 * 60 * 1000)));
        const newCopyPaste = Math.max(attempt.copyPasteCount, Math.floor(timeElapsed / (10 * 60 * 1000)));

        // Auto-finalize if all questions answered
        const newStatus = newAnswered >= attempt.totalQuestions ? "FINALIZED" : "ACTIVE";
        const newHeartbeat = newStatus === "FINALIZED"
          ? `${t("Đã nộp bài")} (${new Date().toLocaleTimeString(lang === "vi" ? "vi-VN" : "en-US")})`
          : `${t("Vừa xong")} (${new Date().toLocaleTimeString(lang === "vi" ? "vi-VN" : "en-US")})`;

        return {
          ...attempt,
          answeredCount: newAnswered,
          tabSwitchCount: newTabSwitch,
          copyPasteCount: newCopyPaste,
          status: newStatus,
          lastHeartbeat: newHeartbeat,
        };
      })
    );
  }, [t, lang]);

  // Start/stop auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(simulateHeartbeat, 5000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, simulateHeartbeat]);

  const filtered = attempts.filter((item) => {
    const matchQuery =
      !searchQuery ||
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentId.includes(searchQuery);

    const matchViolation =
      filterViolation === "ALL" || item.tabSwitchCount >= 3 || item.copyPasteCount >= 2;

    return matchQuery && matchViolation;
  });

  const totalActive = attempts.filter((a) => a.status === "ACTIVE").length;
  const totalFinalized = attempts.filter((a) => a.status === "FINALIZED").length;
  const totalViolations = attempts.filter((a) => a.tabSwitchCount >= 3 || a.copyPasteCount >= 2).length;

  const columns: Column<LiveAttemptItem>[] = [
    {
      key: "candidate",
      header: t("Thí sinh & Ca thi"),
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-sans tabular-nums tracking-tight text-xs font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
              {row.candidateCode}
            </span>
            <span className="font-bold text-slate-900 text-xs sm:text-sm">
              {row.fullName}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 font-sans tabular-nums tracking-tight">
            {t("MSSV")}: {row.studentId} • {row.scheduleName}
          </span>
        </div>
      ),
    },
    {
      key: "progress",
      header: t("Tiến độ trả lời"),
      render: (row) => {
        const percent = Math.round((row.answeredCount / row.totalQuestions) * 100);
        return (
          <div className="w-40 space-y-1">
            <div className="flex items-center justify-between text-xs font-sans tabular-nums tracking-tight">
              <span className="text-slate-600 font-semibold">
                {row.answeredCount}/{row.totalQuestions}
              </span>
              <span className="text-slate-400 font-bold">{percent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all ${
                  percent === 100 ? "bg-emerald-500" : "bg-[#1F5BE0]"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "violations",
      header: t("Cảnh báo gian lận (Anti-Cheat)"),
      render: (row) => {
        const hasWarning = row.tabSwitchCount >= 3 || row.copyPasteCount >= 2;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`px-1.5 py-0.5 rounded font-sans tabular-nums tracking-tight text-[11px] ${
                  row.tabSwitchCount >= 3
                    ? "bg-rose-100 text-rose-800 font-bold"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {t("Rời tab:")} {row.tabSwitchCount}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded font-sans tabular-nums tracking-tight text-[11px] ${
                  row.copyPasteCount >= 2
                    ? "bg-rose-100 text-rose-800 font-bold"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Paste: {row.copyPasteCount}
              </span>
            </div>
            {hasWarning && (
              <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                ⚠️ {t("Bất thường cao")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: t("Trạng thái"),
      align: "center",
      render: (row) => {
        const variant =
          row.status === "ACTIVE"
            ? "info"
            : row.status === "FINALIZED"
            ? "success"
            : "danger";
        return (
          <div className="space-y-0.5">
            <AdminBadge variant={variant} size="sm" dot={row.status === "ACTIVE"}>
              {row.status}
            </AdminBadge>
            <span className="text-[10px] text-slate-400 block font-sans tabular-nums tracking-tight">
              {row.lastHeartbeat}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: t("Thao tác giám sát"),
      align: "right",
      render: (row) =>
        row.status === "ACTIVE" ? (
          <div className="flex items-center justify-end gap-1.5">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => {
                setWarnAttempt(row);
                setWarnReason(t("Cảnh cáo: Phát hiện nhiều lần rời màn hình thi!"));
                setIsWarnModalOpen(true);
              }}
            >
              {t("Cảnh cáo")}
            </AdminButton>
            <AdminPopconfirm
              title={t("Cưỡng chế nộp bài")}
              description={t("Buộc thí sinh") + ` ${row.fullName} ` + t("nộp bài ngay lập tức. Hành động này không thể hoàn tác.")}
              confirmVariant="danger"
              confirmText={t("Xác nhận cưỡng chế")}
              onConfirm={() => {
                setAttempts((prev) =>
                  prev.map((a) =>
                    a.id === row.id
                      ? { ...a, status: "FINALIZED", lastHeartbeat: t("Cưỡng chế nộp bài") }
                      : a
                  )
                );
                success(t("Đã cưỡng chế nộp bài"), `${t("Thí sinh")} ${row.fullName} ${t("đã được buộc nộp bài.")}`);
              }}
              triggerVariant="danger"
              triggerSize="sm"
            >
              {(open) => (
                <span
                  className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 cursor-pointer transition-colors ${open ? "bg-rose-600" : ""}`}
                >
                  {t("Thu bài")}
                </span>
              )}
            </AdminPopconfirm>
            <AdminPopconfirm
              title={t("Đình chỉ thi & Hủy tư cách")}
              description={t("Đình chỉ thi thí sinh") + ` ${row.fullName} ` + t("và hủy tư cách tham gia cuộc thi. Hành động này không thể hoàn tác.")}
              confirmVariant="danger"
              confirmText={t("Xác nhận đình chỉ")}
              onConfirm={() => {
                setAttempts((prev) =>
                  prev.map((a) =>
                    a.id === row.id
                      ? { ...a, status: "DISQUALIFIED", lastHeartbeat: t("Đình chỉ thi") }
                      : a
                  )
                );
                error(t("Đã đình chỉ thi"), `${t("Thí sinh")} ${row.fullName} ${t("đã bị hủy tư cách tham gia cuộc thi.")}`);
              }}
              triggerVariant="ghost"
              triggerSize="sm"
            >
              {(open) => (
                <span
                  className={`p-1.5 rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors text-xs cursor-pointer ${open ? "bg-rose-50" : ""}`}
                  title={t("Đình chỉ thi & Hủy tư cách")}
                  aria-label={t("Đình chỉ thi & Hủy tư cách")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              )}
            </AdminPopconfirm>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-sans tabular-nums tracking-tight italic">{t("Đã kết thúc")}</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {t("Giám sát ca thi trực tuyến")}
            </h2>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("Theo dõi tiến trình làm bài, phát hiện rời tab và ghi vết vào bảng")}{" "}
            <span className="font-sans tabular-nums tracking-tight font-semibold text-slate-700">exam_events</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-[#1F5BE0] focus:ring-[#1F5BE0]/20"
            />
            {t("Tự động cập nhật (Heartbeat 5s)")}
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">{t("Đang làm bài (ACTIVE)")}</p>
          <p className="text-2xl font-extrabold text-[#1F5BE0] mt-1 font-sans tabular-nums tracking-tight">{totalActive}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">{t("Đã nộp bài (FINALIZED)")}</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 font-sans tabular-nums tracking-tight">{totalFinalized}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">{t("Cảnh báo vi phạm rời tab/paste")}</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1 font-sans tabular-nums tracking-tight">{totalViolations}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AdminInput
          placeholder={t("Tìm theo Mã TS, Họ tên, MSSV...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <AdminSelect
          value={filterViolation}
          onChange={(e) => setFilterViolation(e.target.value as any)}
          options={[
            { label: t("Tất cả thí sinh trong ca"), value: "ALL" },
            { label: t("Chỉ hiển thị thí sinh có cảnh báo vi phạm"), value: "VIOLATION_ONLY" },
          ]}
        />
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
      />

      {/* Warning Modal */}
      <AdminModal
        isOpen={isWarnModalOpen}
        onClose={() => setIsWarnModalOpen(false)}
        title={t("Cảnh cáo thí sinh")}
        description={warnAttempt ? `${warnAttempt.fullName} (${warnAttempt.candidateCode})` : ""}
        maxWidth="md"
        footer={
          <div className="flex items-center gap-2">
            <AdminButton variant="outline" size="sm" onClick={() => setIsWarnModalOpen(false)}>
              {t("Hủy")}
            </AdminButton>
            <AdminButton
              variant="brand"
              size="sm"
              onClick={() => {
                if (warnAttempt) {
                  setAttempts((prev) =>
                    prev.map((a) =>
                      a.id === warnAttempt.id
                        ? { ...a, lastHeartbeat: t("Đã cảnh cáo") }
                        : a
                    )
                  );
                  success(t("Đã gửi cảnh cáo"), `${t("Thí sinh")} ${warnAttempt.fullName} ${t("đã nhận được cảnh cáo.")}`);
                }
                setIsWarnModalOpen(false);
              }}
            >
              {t("Gửi cảnh cáo")}
            </AdminButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {t("Nội dung cảnh cáo:")}
            </label>
            <textarea
              rows={4}
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-3 focus:outline-hidden focus:ring-2 focus:ring-[#1F5BE0]/20"
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
