"use client";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { RegistrationItem, viTime } from "@/lib/admin/api";
import { useResource, Notice, Button, inputClass } from "@/components/admin/operations/common";
import { Callout, EmptyState, Icon, IconTile, PageIntro, Pill, type IconName, type Tone } from "@/components/admin/ui/kit";
import { Suspense } from "react";

interface DuplicateGroup {
  field: string;
  value: string;
  candidates: RegistrationItem[];
  similarityScore: number;
}

function DuplicateReviewsPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const school = searchParams.get("school") ?? "";

  const registrations = useResource<RegistrationItem[]>(
    `admin/registrations?search=${encodeURIComponent(search)}&school=${encodeURIComponent(school)}`,
    [],
  );

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("");
  const [query, setQuery] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const duplicateGroups = useMemo(() => {
    if (!registrations.data.length) return [];

    const groups: DuplicateGroup[] = [];
    const byField = new Map<string, RegistrationItem[]>();

    // Group by exact matches on different fields
    const fieldsToCheck: { field: string; getter: (r: RegistrationItem) => string | null }[] = [
      { field: "studentId", getter: (r) => r.studentId ?? null },
      { field: "email", getter: (r) => r.email?.toLowerCase() ?? null },
      { field: "phone", getter: (r) => r.phone?.replace(/\D/g, "") ?? null },
      { field: "facebook", getter: (r) => r.facebook?.toLowerCase() ?? null },
    ];

    for (const { field, getter } of fieldsToCheck) {
      byField.clear();
      for (const r of registrations.data) {
        const val = getter(r);
        if (!val) continue;
        const existing = byField.get(val) || [];
        existing.push(r);
        byField.set(val, existing);
      }

      for (const [value, candidates] of byField.entries()) {
        if (candidates.length > 1) {
          groups.push({
            field,
            value,
            candidates,
            similarityScore: 1.0, // Exact match = 100%
          });
        }
      }
    }

    return groups;
  }, [registrations.data]);

  const handleResolve = (groupId: string, keepCandidateId: string) => {
    setResolution((prev) => ({
      ...prev,
      [groupId]: keepCandidateId,
    }));
    setResolvingId(null);
    setResolutionNote("");
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      studentId: "MSSV",
      email: "Email",
      phone: "Số điện thoại",
      facebook: "Facebook",
    };
    return labels[field] || field;
  };

  const fieldIcon: Record<string, { icon: IconName; tone: Tone }> = {
    studentId: { icon: "graduation", tone: "red" },
    email: { icon: "mail", tone: "violet" },
    phone: { icon: "phone", tone: "green" },
    facebook: { icon: "facebook", tone: "blue" },
  };
  const counts = duplicateGroups.reduce<Record<string, number>>((m, g) => ({ ...m, [g.field]: (m[g.field] ?? 0) + 1 }), {});
  const needle = query.trim().toLowerCase();
  const shown = duplicateGroups.filter(
    (g) =>
      (!tab || g.field === tab) &&
      (!needle || g.value.toLowerCase().includes(needle) || g.candidates.some((c) => [c.fullName, c.email, c.studentId, c.candidateCode].some((v) => v?.toLowerCase().includes(needle)))),
  );
  const chip = (on: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${on ? "bg-blue-50 text-[#1F5BE0] ring-[#1F5BE0]/40" : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"}`;

  return (
    <div className="space-y-6">
      <Notice message={registrations.error} error />

      <PageIntro
        icon="search"
        title={`Kiểm tra trùng lặp hồ sơ (${duplicateGroups.length} nhóm)`}
        description="Hệ thống phát hiện các hồ sơ có cùng MSSV, email, số điện thoại hoặc Facebook. Hãy xem xét và chọn hồ sơ chính thức để giữ lại."
        aside={
          <Button variant="soft" icon="file" onClick={() => setShowGuide((v) => !v)}>
            Hướng dẫn xử lý
          </Button>
        }
      />
      {showGuide && (
        <Callout title="Cách xử lý hồ sơ trùng">
          Mở từng nhóm, so sánh thông tin và thời điểm nộp, bấm <strong>Giữ bản này</strong> ở hồ sơ chính thức. Hồ sơ còn lại có thể khoá tài khoản ở
          trang Hồ sơ đăng ký. Lựa chọn ở đây chỉ để BTC ghi nhận khi rà soát, chưa thay đổi dữ liệu.
        </Callout>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={chip(!tab)} onClick={() => setTab("")}>
          Tất cả nhóm ({duplicateGroups.length})
        </button>
        {["studentId", "email", "phone", "facebook"].map((f) => (
          <button key={f} type="button" className={chip(tab === f)} onClick={() => setTab(f)}>
            {getFieldLabel(f)} ({counts[f] ?? 0})
          </button>
        ))}
        <span className="flex-1" />
        <label className="relative w-full sm:w-72">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={`${inputClass} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo MSSV, email, tên..." />
        </label>
      </div>

      {shown.map((group, idx) => {
        const groupId = `${group.field}-${group.value}`;
        const resolved = resolution[groupId];
        const open = openGroups[groupId] ?? idx === 0;
        const fi = fieldIcon[group.field] ?? { icon: "users" as IconName, tone: "slate" as Tone };
        return (
          <section key={groupId} className={`overflow-hidden rounded-2xl border bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${open ? "border-rose-200" : "border-slate-200/80"}`}>
            <button
              type="button"
              onClick={() => setOpenGroups((m) => ({ ...m, [groupId]: !open }))}
              className={`flex w-full items-center gap-4 px-5 py-4 text-left ${open ? "bg-rose-50/40" : ""}`}
              aria-expanded={open}
            >
              <IconTile name={fi.icon} tone={fi.tone} />
              <span className="font-bold text-[#0B1F4D]">
                Nhóm trùng lặp #{idx + 1}: {getFieldLabel(group.field)}
              </span>
              {resolved ? <Pill tone="green">Đã chọn hồ sơ giữ lại</Pill> : <Pill tone="red">{group.candidates.length} hồ sơ cần xử lý</Pill>}
              <Icon name="chevronDown" className={`ml-auto h-5 w-5 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <div className="space-y-3 px-5 pt-1 pb-5">
                <Callout tone="red" icon="alert" title={`${getFieldLabel(group.field)}: ${group.value}`}>
                  {group.candidates.length} hồ sơ có cùng giá trị — cần Ban Tổ chức xét duyệt
                </Callout>
                {group.candidates.map((candidate, cIdx) => {
                  const kept = resolved === candidate.id;
                  return (
                    <div key={candidate.id} className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 ${kept ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-white"}`}>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${kept ? "border-[#1F5BE0]" : "border-slate-300"}`}>
                        {kept && <span className="h-2.5 w-2.5 rounded-full bg-[#1F5BE0]" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500">Hồ sơ #{cIdx + 1}</span>
                          <span className="font-bold text-[#0B1F4D]">{candidate.fullName}</span>
                          {candidate.candidateCode && <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{candidate.candidateCode}</span>}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          MSSV: {candidate.studentId || "—"} • Email: {candidate.email}
                        </p>
                        <p className="text-sm text-slate-500">
                          Trường: {candidate.school || "—"} • Nộp: {candidate.submittedAt ? viTime(candidate.submittedAt) : "Chưa nộp"}
                        </p>
                      </div>
                      {kept ? (
                        <Pill tone="green">
                          <Icon name="check" className="h-3.5 w-3.5" /> Đã chọn
                        </Pill>
                      ) : (
                        <Button variant={resolved ? "outline" : "primary"} icon="check" disabled={!!resolved} onClick={() => handleResolve(groupId, candidate.id)}>
                          Giữ bản này
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {shown.length === 0 && !registrations.loading && (
        <section className="rounded-2xl border border-slate-200/80 bg-white">
          <EmptyState icon="checkCircle" title="Không tìm thấy trùng lặp" description="Không có hồ sơ nào trùng theo các tiêu chí hiện tại. Hãy kiểm tra lại sau khi có thêm dữ liệu." />
        </section>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Đang tải...</div>}>
      <DuplicateReviewsPage />
    </Suspense>
  );
}
