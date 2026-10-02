"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { asset } from "@/lib/paths";
import { uploadVideo } from "@/lib/upload";
import VideoUpload from "./VideoUpload";

const endpoint = process.env.NEXT_PUBLIC_REGISTER_ENDPOINT || "";

type State = "idle" | "uploading" | "sending" | "done" | "error";

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

// Giá trị gửi lên Google Sheet giữ tiếng Việt ở cả hai bản để dữ liệu thống nhất; chỉ nhãn hiển thị được dịch.
const text = {
  vi: {
    uploadError: "Không tải được video lên. Kiểm tra kết nối mạng và thử lại.",
    sendError: "Video đã tải lên nhưng chưa gửi được thông tin. Kiểm tra kết nối mạng và bấm gửi lại.",
    received: "Đã nhận đăng ký",
    thanks: "Cảm ơn bạn!",
    doneBody: "Ban Tổ chức sẽ gửi email xác nhận và hướng dẫn làm bài Vòng Đơn tới địa chỉ bạn đã đăng ký.",
    another: "Đăng ký cho người khác",
    legend: "Thông tin đăng ký",
    fullName: "Họ và tên *",
    phone: "Số điện thoại *",
    phoneHint: "9-15 chữ số",
    school: "Trường đang theo học *",
    schoolPh: "Chọn hoặc gõ tên trường",
    major: "Ngành học *",
    studentId: "Mã số sinh viên *",
    year: "Năm học *",
    choose: "Chọn",
    years: ["Năm 1", "Năm 2", "Năm 3", "Năm 4", "Năm 5"],
    nationality: "Quốc tịch",
    nationalityDefault: "Việt Nam",
    confirm: "Tôi là sinh viên đại học chính quy còn trong thời gian đào tạo và cam kết thông tin trên là chính xác. *",
    share: "Tôi đồng ý cho Ban Tổ chức chia sẻ hồ sơ năng lực của tôi với doanh nghiệp đồng hành.",
    uploading: "Đang tải video...",
    sending: "Đang gửi...",
    submit: "Gửi đăng ký",
    closed: "Đã hết hạn đăng ký mùa I.",
    notOpen: "Cổng đăng ký sẽ mở trong Lễ phát động (tuần 2 tháng 10/2026).",
  },
  en: {
    uploadError: "Could not upload your video. Check your connection and try again.",
    sendError: "Your video was uploaded but the form was not sent. Check your connection and submit again.",
    received: "Registration received",
    thanks: "Thank you!",
    doneBody: "The Organizing Committee will email you a confirmation and instructions for the Application Round.",
    another: "Register someone else",
    legend: "Registration details",
    fullName: "Full name *",
    phone: "Phone number *",
    phoneHint: "9-15 digits",
    school: "University *",
    schoolPh: "Choose or type your university",
    major: "Major *",
    studentId: "Student ID *",
    year: "Year of study *",
    choose: "Select",
    years: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
    nationality: "Nationality",
    nationalityDefault: "",
    confirm: "I am a full-time undergraduate student currently enrolled, and I confirm the information above is accurate. *",
    share: "I agree that the Organizing Committee may share my competency profile with partner companies.",
    uploading: "Uploading video...",
    sending: "Sending...",
    submit: "Submit registration",
    closed: "Registration for Season I has closed.",
    notOpen: "Registration opens at the Launch Event (week 2 of October 2026).",
  },
};
const yearValues = text.vi.years;

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-mist/50 px-4 py-3 text-base text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";
const labelCls = "block text-[15px] font-semibold text-navy";

export default function RegisterForm({ lang, deadline }: { lang: Lang; deadline: string }) {
  const t = text[lang];
  const [state, setState] = useState<State>("idle");
  const [closed, setClosed] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    setClosed(Date.now() > new Date(deadline).getTime());
  }, [deadline]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (data.get("website") || !video) return; // bẫy bot / chưa chọn video
    data.delete("website");
    data.set("submittedAt", new Date().toISOString());
    data.set("shareProfile", data.get("shareProfile") ? "Có" : "Không");

    setErrorText("");
    try {
      setState("uploading");
      setProgress(0);
      const owner = `${data.get("fullName")} - ${data.get("studentId")}`;
      data.set("videoUrl", await uploadVideo(endpoint, video, owner, setProgress));
    } catch {
      setState("error");
      setProgress(null);
      setErrorText(t.uploadError);
      return;
    }

    setState("sending");
    try {
      // Google Apps Script không trả header CORS, nên gửi no-cors và coi như thành công nếu không lỗi mạng.
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams(data as unknown as Record<string, string>),
      });
      setState("done");
      setVideo(null);
      setProgress(null);
      form.reset();
    } catch {
      setState("error");
      setErrorText(t.sendError);
    }
  }

  if (state === "done") {
    return (
      <div className="card p-8 text-center" role="status">
        <p className="eyebrow justify-center">{t.received}</p>
        <h3 className="mt-3 text-2xl font-bold text-navy">{t.thanks}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t.doneBody}
        </p>
        <button type="button" className="btn-outline mt-6" onClick={() => setState("idle")}>
          {t.another}
        </button>
      </div>
    );
  }

  const unavailable = closed || !endpoint;

  return (
    <form onSubmit={onSubmit} className="card p-6 sm:p-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/images/logo.png")} alt="" className="mb-6 h-12 w-auto" />
      <fieldset disabled={unavailable || state === "uploading" || state === "sending"} className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">{t.legend}</legend>

        <label className="sm:col-span-2">
          <span className={labelCls}>{t.fullName}</span>
          <input name="fullName" required autoComplete="name" className={field} />
        </label>

        <label>
          <span className={labelCls}>Email *</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label>
          <span className={labelCls}>{t.phone}</span>
          <input
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            pattern="[0-9+ ]{9,15}"
            title={t.phoneHint}
            className={field}
          />
        </label>

        <label className="sm:col-span-2">
          <span className={labelCls}>{t.school}</span>
          <input name="school" required list="school-list" placeholder={t.schoolPh} className={field} />
          <datalist id="school-list">
            {schools.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>

        <label>
          <span className={labelCls}>{t.major}</span>
          <input name="major" required className={field} />
        </label>
        <label>
          <span className={labelCls}>{t.studentId}</span>
          <input name="studentId" required className={field} />
        </label>

        <label>
          <span className={labelCls}>{t.year}</span>
          <select name="year" required defaultValue="" className={field}>
            <option value="" disabled>
              {t.choose}
            </option>
            {yearValues.map((y, i) => (
              <option key={y} value={y}>
                {t.years[i]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelCls}>{t.nationality}</span>
          <input name="nationality" defaultValue={t.nationalityDefault} className={field} />
        </label>

        <VideoUpload lang={lang} file={video} onChange={setVideo} progress={state === "uploading" ? progress : null} />

        {/* Bẫy bot: người dùng không thấy ô này */}
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        <label className="flex items-start gap-3 text-[15px] text-muted sm:col-span-2">
          <input name="confirm" type="checkbox" required className="mt-0.5 h-4 w-4 accent-orange" />
          <span>{t.confirm}</span>
        </label>
        <label className="flex items-start gap-3 text-[15px] text-muted sm:col-span-2">
          <input name="shareProfile" type="checkbox" className="mt-0.5 h-4 w-4 accent-orange" />
          <span>{t.share}</span>
        </label>

        <button type="submit" className="btn-primary w-full py-3.5 disabled:translate-y-0 disabled:opacity-60 sm:col-span-2">
          {state === "uploading"
            ? `${t.uploading} ${Math.round((progress ?? 0) * 100)}%`
            : state === "sending"
              ? t.sending
              : t.submit}
        </button>
      </fieldset>

      {unavailable && (
        <p className="mt-4 text-center text-[15px] font-medium text-orange-ink" role="note">
          {closed ? t.closed : t.notOpen}
        </p>
      )}
      {state === "error" && (
        <p className="mt-4 text-center text-[15px] font-medium text-orange-ink" role="alert">
          {errorText}
        </p>
      )}
    </form>
  );
}
