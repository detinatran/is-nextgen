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

export default function LiveExamMonitorPage() {
  const [attempts, setAttempts] = useState<LiveAttemptItem[]>(mockLiveAttempts);
  const [filterViolation, setFilterViolation] = useState<"ALL" | "VIOLATION_ONLY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [targetAttempt, setTargetAttempt] = useState<LiveAttemptItem | null>(null);
  const [actionType, setActionType] = useState<"WARN" | "FORCE_SUBMIT" | "DISQUALIFY">("WARN");
  const [reason, setReason] = useState("");

  const { success, error, warning, info } = useToastHelpers();

  // Auto-refresh heartbeat simulation
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulateHeartbeat = useCallback(() => {
    setAttempts((prev) =>
      prev.map((attempt) => {
        if (attempt.status !== "ACTIVE") return attempt;

        // Simulate progress - increase answered count randomly
        const progressIncrement = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;
        const newAnswered = Math.min(attempt.answeredCount + progressIncrement, attempt.totalQuestions);

        // Simulate occasional violations
        const newTabSwitch = attempt.tabSwitchCount + (Math.random() > 0.95 ? 1 : 0);
        const newCopyPaste = attempt.copyPasteCount + (Math.random() > 0.98 ? 1 : 0);

        // Auto-finalize if all questions answered
        const newStatus = newAnswered >= attempt.totalQuestions ? "FINALIZED" : "ACTIVE";
        const newHeartbeat = newStatus === "FINALIZED"
          ? `Đã nộp bài (${new Date().toLocaleTimeString("vi-VN")})`
          : "Vừa xong";

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
  }, []);

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
      header: "Thí sinh & Ca thi",
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
            MSSV: {row.studentId} • {row.scheduleName}
          </span>
        </div>
      ),
    },
    {
      key: "progress",
      header: "Tiến độ trả lời",
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
      header: "Cảnh báo gian lận (Anti-Cheat)",
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
                Rời tab: {row.tabSwitchCount}
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
                ⚠️ Bất thường cao
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Trạng thái",
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
      header: "Thao tác giám sát",
      align: "right",
      render: (row) =>
        row.status === "ACTIVE" ? (
          <div className="flex items-center justify-end gap-1.5">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => {
                setTargetAttempt(row);
                setActionType("WARN");
                setReason("Cảnh cáo: Phát hiện nhiều lần rời màn hình thi!");
              }}
            >
              Cảnh cáo
            </AdminButton>
            <AdminPopconfirm
              title="Cưỡng chế nộp bài"
              description={`Buộc thí sinh ${row.fullName} nộp bài ngay lập tức. Hành động này không thể hoàn tác.`}
              confirmVariant="danger"
              confirmText="Xác nhận cưỡng chế"
              onConfirm={() => {
                setAttempts((prev) =>
                  prev.map((a) =>
                    a.id === row.id
                      ? { ...a, status: "FINALIZED", lastHeartbeat: "Cưỡng chế nộp bài" }
                      : a
                  )
                );
                success("Đã cưỡng chế nộp bài", `Thí sinh ${row.fullName} đã được buộc nộp bài.`);
              }}
              triggerVariant="danger"
              triggerSize="sm"
            >
              {(open) => (
                <span
                  className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 cursor-pointer transition-colors ${open ? "bg-rose-600" : ""}`}
                >
                  Thu bài
                </span>
              )}
            </AdminPopconfirm>
            <AdminPopconfirm
              title="Đình chỉ thi & Hủy tư cách"
              description={`Đình chỉ thi thí sinh ${row.fullName} và hủy tư cách tham gia cuộc thi. Hành động này không thể hoàn tác.`}
              confirmVariant="danger"
              confirmText="Xác nhận đình chỉ"
              onConfirm={() => {
                setAttempts((prev) =>
                  prev.map((a) =>
                    a.id === row.id
                      ? { ...a, status: "DISQUALIFIED", lastHeartbeat: "Đình chỉ thi" }
                      : a
                  )
                );
                error("Đã đình chỉ thi", `Thí sinh ${row.fullName} đã bị hủy tư cách tham gia cuộc thi.`);
              }}
              triggerVariant="ghost"
              triggerSize="sm"
            >
              {(open) => (
                <span
                  className={`p-1.5 rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors text-xs cursor-pointer ${open ? "bg-rose-50" : ""}`}
                  title="Đình chỉ thi & Hủy tư cách"
                  aria-label="Đình chỉ thi & Hủy tư cách"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              )}
            </AdminPopconfirm>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-sans tabular-nums tracking-tight italic">Đã kết thúc</span>
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
              Giám sát ca thi trực tuyến
            </h2>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến trình làm bài, phát hiện rời tab (focus_lost), copy/paste và ghi vết vào bảng{" "}
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
            Tự động cập nhật (Heartbeat 5s)
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Đang làm bài (ACTIVE)</p>
          <p className="text-2xl font-extrabold text-[#1F5BE0] mt-1 font-sans tabular-nums tracking-tight">{totalActive}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Đã nộp bài (FINALIZED)</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 font-sans tabular-nums tracking-tight">{totalFinalized}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Cảnh báo vi phạm rời tab/paste</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1 font-sans tabular-nums tracking-tight">{totalViolations}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AdminInput
          placeholder="Tìm theo Mã TS, Họ tên, MSSV..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <AdminSelect
          value={filterViolation}
          onChange={(e) => setFilterViolation(e.target.value as any)}
          options={[
            { label: "Tất cả thí sinh trong ca", value: "ALL" },
            { label: "Chỉ hiển thị thí sinh có cảnh báo vi phạm", value: "VIOLATION_ONLY" },
          ]}
        />
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
      />
    </div>
  );
}
