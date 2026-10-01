"use client";

import { useEffect, useState } from "react";

const endpoint = process.env.NEXT_PUBLIC_REGISTER_ENDPOINT || "";

type State = "idle" | "sending" | "done" | "error";

const schools = [
  "Trường Quốc tế - ĐHQGHN",
  "Trường Đại học Kinh tế - ĐHQGHN",
  "Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQGHN",
  "Trường Đại học Ngoại ngữ - ĐHQGHN",
  "Trường Quản trị và Kinh doanh - ĐHQGHN",
  "Trường Đại học Kinh tế Quốc dân",
  "Trường Đại học Ngoại thương",
  "Học viện Tài chính",
  "Học viện Ngân hàng",
  "Trường Đại học Thương mại",
];

const field =
  "mt-1.5 w-full border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-navy focus:ring-2 focus:ring-navy/15";
const labelCls = "block text-sm font-semibold text-navy";

export default function RegisterForm({ deadline }: { deadline: string }) {
  const [state, setState] = useState<State>("idle");
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    setClosed(Date.now() > new Date(deadline).getTime());
  }, [deadline]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (data.get("website")) return; // bẫy bot
    data.delete("website");
    data.set("submittedAt", new Date().toISOString());
    data.set("shareProfile", data.get("shareProfile") ? "Có" : "Không");

    setState("sending");
    try {
      // Google Apps Script không trả header CORS, nên gửi no-cors và coi như thành công nếu không lỗi mạng.
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams(data as unknown as Record<string, string>),
      });
      setState("done");
      form.reset();
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="bg-white p-8 text-center shadow-xl shadow-black/10" role="status">
        <p className="eyebrow text-rust">Đã nhận đăng ký</p>
        <h3 className="mt-3 text-2xl font-bold text-navy">Cảm ơn bạn!</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Ban Tổ chức sẽ gửi email xác nhận và hướng dẫn làm bài Vòng 1 tới địa chỉ bạn đã đăng ký.
        </p>
        <button type="button" className="btn-navy mt-6" onClick={() => setState("idle")}>
          Đăng ký cho người khác
        </button>
      </div>
    );
  }

  const unavailable = closed || !endpoint;

  return (
    <form onSubmit={onSubmit} className="bg-white p-6 shadow-xl shadow-black/10 sm:p-8">
      <fieldset disabled={unavailable || state === "sending"} className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Thông tin đăng ký</legend>

        <label className="sm:col-span-2">
          <span className={labelCls}>Họ và tên *</span>
          <input name="fullName" required autoComplete="name" className={field} />
        </label>

        <label>
          <span className={labelCls}>Email *</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label>
          <span className={labelCls}>Số điện thoại *</span>
          <input
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            pattern="[0-9+ ]{9,15}"
            title="9-15 chữ số"
            className={field}
          />
        </label>

        <label className="sm:col-span-2">
          <span className={labelCls}>Trường đang theo học *</span>
          <input name="school" required list="school-list" placeholder="Chọn hoặc gõ tên trường" className={field} />
          <datalist id="school-list">
            {schools.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>

        <label>
          <span className={labelCls}>Ngành học *</span>
          <input name="major" required className={field} />
        </label>
        <label>
          <span className={labelCls}>Mã số sinh viên *</span>
          <input name="studentId" required className={field} />
        </label>

        <label>
          <span className={labelCls}>Năm học *</span>
          <select name="year" required defaultValue="" className={field}>
            <option value="" disabled>
              Chọn
            </option>
            {["Năm 1", "Năm 2", "Năm 3", "Năm 4", "Năm 5"].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>Quốc tịch</span>
          <input name="nationality" defaultValue="Việt Nam" className={field} />
        </label>

        <label className="sm:col-span-2">
          <span className={labelCls}>Link video giới thiệu (tối đa 90 giây) *</span>
          <input
            name="videoUrl"
            type="url"
            required
            placeholder="https://drive.google.com/... hoặc YouTube (chế độ không công khai)"
            className={field}
          />
        </label>

        {/* Bẫy bot: người dùng không thấy ô này */}
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        <label className="flex items-start gap-3 text-sm text-muted sm:col-span-2">
          <input name="confirm" type="checkbox" required className="mt-0.5 h-4 w-4 accent-navy" />
          <span>Tôi là sinh viên đại học chính quy còn trong thời gian đào tạo và cam kết thông tin trên là chính xác. *</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-muted sm:col-span-2">
          <input name="shareProfile" type="checkbox" className="mt-0.5 h-4 w-4 accent-navy" />
          <span>Tôi đồng ý cho Ban Tổ chức chia sẻ hồ sơ năng lực của tôi với doanh nghiệp đồng hành.</span>
        </label>

        <button type="submit" className="btn-navy w-full py-3.5 disabled:opacity-60 sm:col-span-2">
          {state === "sending" ? "Đang gửi..." : "Gửi đăng ký"}
        </button>
      </fieldset>

      {unavailable && (
        <p className="mt-4 text-center text-sm text-rust" role="note">
          {closed ? "Đã hết hạn đăng ký mùa I." : "Cổng đăng ký sẽ mở trong Lễ phát động (tuần 2 tháng 10/2026)."}
        </p>
      )}
      {state === "error" && (
        <p className="mt-4 text-center text-sm text-rust" role="alert">
          Không gửi được đăng ký. Kiểm tra kết nối mạng và thử lại.
        </p>
      )}
    </form>
  );
}
