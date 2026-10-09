"use client";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi, RegistrationItem } from "@/lib/admin/api";
import { useResource, Panel, Notice } from "@/components/admin/operations/common";
import AdminButton from "@/components/admin/ui/AdminButton";
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

  return (
    <div className="space-y-6">
      <Notice message={registrations.error} error />

      <Panel title={`Kiểm tra trùng lặp hồ sơ (${duplicateGroups.length} nhóm)`}>
        <p className="text-sm text-slate-500">
          Hệ thống phát hiện các hồ sơ có cùng MSSV, email, số điện thoại hoặc Facebook.
          Hãy xem xét và chọn hồ sơ chính thức để giữ lại.
        </p>
      </Panel>

      {duplicateGroups.map((group, idx) => {
        const groupId = `${group.field}-${group.value}`;
        const resolved = resolution[groupId];

        return (
          <Panel key={groupId} title={`Nhóm trùng lặp #${idx + 1}: ${getFieldLabel(group.field)}`}>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-rose-800">
                {getFieldLabel(group.field)}: <span className="font-mono">{group.value}</span>
              </p>
              <p className="text-xs text-rose-600 mt-1">
                {group.candidates.length} hồ sơ cùng giá trị — cần Ban Tổ Chức xét duyệt
              </p>
            </div>

            <div className="space-y-3">
              {group.candidates.map((candidate, cIdx) => (
                <div
                  key={candidate.id}
                  className={`p-4 rounded-lg border ${resolved === candidate.id ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Hồ sơ #{cIdx + 1}</span>
                        <span className="font-bold text-slate-900">{candidate.fullName}</span>
                        {candidate.candidateCode && (
                          <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded">
                            {candidate.candidateCode}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        MSSV: {candidate.studentId} • Email: {candidate.email}
                      </div>
                      <div className="text-xs text-slate-500">
                        Trường: {candidate.school} • Nộp: {candidate.submittedAt || "Chưa nộp"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {resolved === candidate.id ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                          Đã chọn
                        </span>
                      ) : (
                        <AdminButton
                          size="sm"
                          variant="brand"
                          disabled={!!resolved}
                          onClick={() => handleResolve(groupId, candidate.id)}
                        >
                          Giữ bản này
                        </AdminButton>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {resolved && (
              <div className="mt-3 p-2 bg-emerald-50 rounded text-xs text-emerald-700">
                Đã chọn giữ lại hồ sơ: {group.candidates.find((c) => c.id === resolved)?.fullName}
              </div>
            )}
          </Panel>
        );
      })}

      {duplicateGroups.length === 0 && !registrations.loading && (
        <Panel title="Không tìm thấy trùng lặp">
          <p className="text-sm text-slate-500">
            Không có hồ sơ nào trùng lặp theo các tiêu chí hiện tại. Hãy kiểm tra lại sau khi có thêm dữ liệu.
          </p>
        </Panel>
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
