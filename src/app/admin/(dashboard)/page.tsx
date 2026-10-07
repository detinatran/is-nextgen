"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminCard from "@/components/admin/ui/AdminCard";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

export default function AdminDashboardPage() {
  const { t } = useAdminI18n();
  const sectionRef = useRef<HTMLDivElement>(null);
  const kpiCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const leftSectionRef = useRef<HTMLDivElement>(null);
  const rightSectionRef = useRef<HTMLDivElement>(null);

  const kpiData = [
    {
      title: t("Tổng thí sinh đăng ký"),
      value: "318",
      subtext: t("Mục tiêu: 500 sinh viên"),
      change: t("+24 hôm nay"),
      variant: "success" as const,
      icon: (
        <svg className="w-5 h-5 text-[#1F5BE0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: t("Video giới thiệu đã nộp"),
      value: "286",
      subtext: t("Thời lượng ≤ 2 phút"),
      change: t("89.9% hoàn thành"),
      variant: "info" as const,
      icon: (
        <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: t("Ngân hàng câu hỏi"),
      value: "150",
      subtext: t("Đã Freeze: 120 câu"),
      change: t("Sẵn sàng Vòng 1"),
      variant: "gold" as const,
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: t("Hồ sơ cần rà soát"),
      value: "4",
      subtext: t("Nghi ngờ trùng thông tin"),
      change: t("Cần xử lý"),
      variant: "warning" as const,
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  const recentRegistrations = [
    {
      code: "CAND-00124",
      name: "Nguyễn Hoàng Nam",
      studentId: "22070145",
      school: "Trường Quốc tế - ĐHQGHN",
      major: "Quản trị Kinh doanh",
      videoStatus: "READY",
      createdAt: t("10 phút trước"),
    },
    {
      code: "CAND-00123",
      name: "Trần Thị Mai Anh",
      studentId: "23041088",
      school: "Đại học Ngoại Thương",
      major: "Kinh tế Đối ngoại",
      videoStatus: "READY",
      createdAt: t("35 phút trước"),
    },
    {
      code: "CAND-00122",
      name: "Lê Minh Tuấn",
      studentId: "22070982",
      school: "Trường Quốc tế - ĐHQGHN",
      major: "Công nghệ Tài chính",
      videoStatus: "VALIDATING",
      createdAt: t("1 giờ trước"),
    },
    {
      code: "CAND-00121",
      name: "Phạm Hải Đăng",
      studentId: "21050321",
      school: "Đại học Kinh tế Quốc dân",
      major: "Marketing",
      videoStatus: "READY",
      createdAt: t("2 giờ trước"),
    },
  ];

  const examSchedules = [
    {
      name: t("Ca 01 - Sáng Thứ Bảy (07/11)"),
      time: "08:30 - 09:30",
      assigned: "85 / 100",
      status: "SCHEDULED",
    },
    {
      name: t("Ca 02 - Chiều Thứ Bảy (07/11)"),
      time: "14:30 - 15:30",
      assigned: "92 / 100",
      status: "SCHEDULED",
    },
    {
      name: t("Ca 03 - Sáng Chủ Nhật (08/11)"),
      time: "09:00 - 10:00",
      assigned: "78 / 100",
      status: "SCHEDULED",
    },
  ];

  // Page entrance animation
  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const ctx = gsap.context(() => {
        // Animate KPI cards with stagger
        gsap.fromTo(
          kpiCardsRef.current.filter(Boolean),
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power3.out",
            stagger: 0.08,
          }
        );

        // Animate left and right sections
        gsap.fromTo(
          [leftSectionRef.current, rightSectionRef.current],
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.1,
            delay: 0.2,
          }
        );
      }, sectionRef);
      return () => ctx.revert();
    },
    { scope: sectionRef, dependencies: [] }
  );

  const kpiCardRef = (index: number) => (el: HTMLDivElement | null) => {
    if (el) (kpiCardsRef.current as any)[index] = el;
  };

  return (
    <div ref={sectionRef} className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <AdminCard variant="elevated" padding="lg" hoverLift>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0F1F3D] tracking-tight">
              {t("IS-NextGen Manager Challenge 2026")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t("Chủ đề:")} <span className="font-semibold text-[#0B1F4D]">The Manager in the AI Era</span>. {t("Đang mở cổng đăng ký trực tuyến Vòng 1.")}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/admin/candidates">
              <AdminButton variant="outline" size="sm">
                {t("Xem toàn bộ hồ sơ")}
              </AdminButton>
            </Link>
            <Link href="/admin/exams/monitor">
              <AdminButton
                variant="brand"
                size="sm"
                leftIcon={<span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              >
                {t("Vào phòng giám sát thi")}
              </AdminButton>
            </Link>
          </div>
        </div>
      </AdminCard>

      {/* KPI Metrics Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        role="list"
        aria-label={t("Chỉ số hiệu suất chính")}
      >
        {kpiData.map((item, idx) => (
          <AdminCard
            key={idx}
            ref={kpiCardRef(idx)}
            variant="metric"
            padding="lg"
            hoverLift
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{item.title}</span>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                {item.icon}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0F1F3D] tabular-nums leading-tight">
                {item.value}
              </div>
              <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400">{item.subtext}</span>
                <AdminBadge variant={item.variant} size="sm">
                  {item.change}
                </AdminBadge>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      {/* Two Column Section: Recent Candidates & Exam Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Left Column: Recent Registrations */}
        <AdminCard
          ref={leftSectionRef}
          variant="elevated"
          padding="lg"
          hoverLift
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t("Hồ sơ đăng ký mới nhất")}</h3>
              <p className="text-xs text-slate-400">{t("Danh sách thí sinh gửi hồ sơ trong ngày")}</p>
            </div>
            <Link
              href="/admin/candidates"
              className="text-xs font-semibold text-[#1F5BE0] hover:underline"
            >
              {t("Xem tất cả →")}
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentRegistrations.map((cand, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                    {cand.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{cand.name}</span>
                      <span className="text-[11px] font-sans tabular-nums tracking-tight text-slate-400 whitespace-nowrap">({cand.code})</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t("MSSV")}: {cand.studentId} • {cand.school} ({cand.major})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <AdminBadge
                    variant={cand.videoStatus === "READY" ? "success" : "warning"}
                    size="sm"
                  >
                    {cand.videoStatus === "READY" ? t("Video đã duyệt") : t("Đang kiểm tra")}
                  </AdminBadge>
                  <span className="text-[11px] text-slate-400 hidden sm:inline whitespace-nowrap">
                    {cand.createdAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Right Column: Exam Schedules Overview */}
        <AdminCard
          ref={rightSectionRef}
          variant="elevated"
          padding="lg"
          hoverLift
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{t("Ca thi Vòng 1")}</h3>
                <p className="text-xs text-slate-400">{t("Dự kiến 07 - 08/11/2026")}</p>
              </div>
              <Link
                href="/admin/exams/schedules"
                className="text-xs font-semibold text-[#1F5BE0] hover:underline"
              >
                {t("Quản lý →")}
              </Link>
            </div>

            <div className="space-y-3">
              {examSchedules.map((sch, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{sch.name}</span>
                    <AdminBadge variant="info" size="sm">
                      {sch.time}
                    </AdminBadge>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                    <span>{t("Đã phân bổ:")}</span>
                    <span className="font-semibold text-slate-900 font-sans tabular-nums tracking-tight">{sch.assigned}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-[#1F5BE0] h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${
                          (parseInt(sch.assigned.split("/")[0]) /
                            parseInt(sch.assigned.split("/")[1])) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/admin/exams/assignments" className="w-full block">
              <AdminButton variant="outline" size="sm" className="w-full">
                {t("Phân bổ ca thi cho thí sinh mới")}
              </AdminButton>
            </Link>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}