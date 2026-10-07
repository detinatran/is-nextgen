"use client";

import { useEffect, useRef, useState } from "react";
import { AdminError, adminCall } from "@/lib/adminApi";

export const field =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

// Thông báo lỗi API (tiếng Anh) → tiếng Việt cho Ban Tổ chức
const translations: [RegExp, string][] = [
  [/^Pool (\S+) already exists$/, "Nhóm câu hỏi $1 đã tồn tại"],
  [/^Question text is required$/, "Chưa nhập nội dung câu hỏi"],
  [/^A question needs at least 2 options$/, "Câu hỏi cần ít nhất 2 đáp án"],
  [/^Exactly one option must be correct$/, "Cần chọn đúng 1 đáp án đúng"],
  [/^Question pool not found$/, "Không tìm thấy nhóm câu hỏi"],
  [/^Question not found$/, "Không tìm thấy câu hỏi"],
  [/^File is not a valid \.xlsx workbook$/, "File không phải Excel .xlsx hợp lệ"],
  [/^Workbook has no sheet$/, "File Excel không có trang tính nào"],
  [/^Attach an \.xlsx file.*$/, "Hãy chọn file Excel .xlsx"],
  [/^Pool (\S+) has only (\d+) questions, needs (\d+)$/, "Nhóm $1 chỉ có $2 câu, cần $3 câu"],
  [/^closesAt must be after opensAt$/, "Giờ đóng ca phải sau giờ mở ca"],
  [/^Schedule not found$/, "Không tìm thấy ca thi"],
  [/^Capacity cannot be below the (\d+) assigned candidates$/, "Sức chứa không được nhỏ hơn $1 thí sinh đã xếp vào ca"],
  [/^Schedule still has assigned candidates$/, "Ca thi vẫn còn thí sinh, hãy chuyển họ sang ca khác trước"],
  [/^Freeze the exam structure \(blueprint\) before assigning candidates$/, "Hãy lưu cấu trúc đề trước khi xếp ca"],
  [/^Assignment not found$/, "Không tìm thấy thí sinh trong danh sách phân ca"],
  [/^Candidate has already started this exam$/, "Thí sinh đã bắt đầu làm bài, không thể đổi ca"],
  [/^Schedule is full$/, "Ca thi đã đủ chỗ"],
  [/^Request validation failed$/, "Dữ liệu chưa hợp lệ"],
];

export function messageOf(err: unknown) {
  if (err instanceof AdminError) {
    if (err.status === 401) return "Sai email hoặc mật khẩu, hoặc mã OTP không đúng / đã hết hạn.";
    if (err.status === 403) return "Tài khoản này không có quyền quản trị.";
    if (err.status === 429) return "Thử quá nhiều lần, vui lòng đợi một phút.";
    for (const [re, vi] of translations) if (re.test(err.message)) return err.message.replace(re, vi);
    return err.message;
  }
  return "Không kết nối được máy chủ.";
}

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }) : "";
export const fmtDuration = (s: number | null) => (s === null ? "" : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`);

export function Modal({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-deep/50 px-4 py-10" role="dialog" aria-modal onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`w-full rounded-3xl bg-white p-6 shadow-2xl ${wide ? "max-w-2xl" : "max-w-md"}`}>{children}</div>
    </div>
  );
}

export type ImportError = { row: number; message: string };

/** Nút chọn file .xlsx và gửi lên API; lỗi theo dòng hiện trong hộp thoại, không dòng nào được ghi nếu có lỗi. */
export function ImportButton<T extends { errors?: ImportError[] }>({ path, label, onDone }: { path: string; label: string; onDone: (res: T) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<ImportError[] | null>(null);
  async function upload(file: File) {
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    try {
      const res = await adminCall<T>(path, { method: "POST", body });
      if (res.errors?.length) setErrors(res.errors);
      onDone(res);
    } catch (err) {
      setErrors([{ row: 0, message: messageOf(err) }]);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <>
      <input ref={input} type="file" accept=".xlsx" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-outline px-4 py-2.5 text-sm disabled:opacity-60">
        {busy ? "Đang nhập..." : label}
      </button>
      {errors && (
        <Modal onClose={() => setErrors(null)}>
          <h3 className="text-lg font-bold text-navy">Chưa nhập được file</h3>
          <p className="mt-1 text-[13px] text-muted">Không dòng nào được ghi. Sửa các lỗi sau rồi nhập lại:</p>
          <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto text-sm">
            {errors.map((e, i) => (
              <li key={i}>
                {e.row > 0 && <strong className="text-navy">Dòng {e.row}: </strong>}
                {e.message}
              </li>
            ))}
          </ul>
          <button onClick={() => setErrors(null)} className="btn-primary mt-5 w-full py-2.5 text-sm">
            Đóng
          </button>
        </Modal>
      )}
    </>
  );
}
