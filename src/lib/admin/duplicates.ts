import type { RegistrationItem } from "./api";

export type DuplicateField = "studentId" | "email" | "phone" | "facebook";
export type DuplicateGroup = { id: string; field: DuplicateField; value: string; candidates: RegistrationItem[] };

export const duplicateFieldLabel: Record<DuplicateField, string> = {
  studentId: "MSSV",
  email: "Email",
  phone: "Số điện thoại",
  facebook: "Facebook",
};

const getters: [DuplicateField, (r: RegistrationItem) => string | null][] = [
  ["studentId", (r) => r.studentId?.trim() || null],
  ["email", (r) => r.email?.trim().toLowerCase() || null],
  ["phone", (r) => r.phone?.replace(/\D/g, "") || null],
  ["facebook", (r) => r.facebook?.trim().toLowerCase() || null],
];

/** Nhóm hồ sơ trùng chính xác theo MSSV, email, số điện thoại hoặc Facebook (bỏ qua tài khoản đã xoá). */
export function findDuplicates(rows: RegistrationItem[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  for (const [field, get] of getters) {
    const by = new Map<string, RegistrationItem[]>();
    for (const r of rows) {
      if (r.deleted) continue;
      const v = get(r);
      if (v) by.set(v, [...(by.get(v) ?? []), r]);
    }
    for (const [value, candidates] of by) if (candidates.length > 1) groups.push({ id: `${field}:${value}`, field, value, candidates });
  }
  return groups;
}
