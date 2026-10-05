"use client";

import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { asset } from "@/lib/paths";
import { getContent } from "@/content";
import { uploadFile } from "@/lib/upload";
import PhotoUpload from "./PhotoUpload";
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
    uploadError: "Không tải được ảnh hoặc video lên. Kiểm tra kết nối mạng và thử lại.",
    consentTitle: "Đồng ý sử dụng hình ảnh *",
    consentBody:
      "Ban Tổ chức ghi hình, chụp ảnh tại các vòng thi và sự kiện của Cuộc thi, sử dụng cho mục đích truyền thông về Cuộc thi trên fanpage, website, ấn phẩm in và báo chí. Hình ảnh được lưu trong 01 năm kể từ ngày kết thúc Cuộc thi.",
    consentYes: "Tôi đồng ý cho Ban Tổ chức sử dụng hình ảnh, video của tôi cho mục đích truyền thông nêu trên.",
    consentNo: "Tôi không đồng ý.",
    consentWithdraw: "Bạn có thể rút lại sự đồng ý bất cứ lúc nào bằng cách gửi email tới",
    consentNote: "Đối với thí sinh tham gia xét giải Thí sinh được yêu thích nhất, thí sinh phải đồng ý sử dụng hình ảnh và video.",
    uploadingPhoto: "Đang tải ảnh...",
    steps: ["Thông tin", "Ảnh & video", "Cam kết"],
    next: "Tiếp tục",
    back: "Quay lại",
    stepOf: (n: number) => `Bước ${n}/3`,
    agreeIntro: "Vui lòng đọc kỹ và xác nhận các cam kết dưới đây trước khi nộp đăng ký.",
    agreeSubmit: "Đồng ý & nộp đăng ký",
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
    uploadError: "Could not upload your photo or video. Check your connection and try again.",
    consentTitle: "Consent to use of images *",
    consentBody:
      "The Organizing Committee will film and photograph the rounds and events of the Competition and use this material to promote the Competition on its fanpage, website, printed materials and in the press. Images are kept for 01 year after the Competition ends.",
    consentYes: "I agree that the Organizing Committee may use my photos and videos for the promotional purposes above.",
    consentNo: "I do not agree.",
    consentWithdraw: "You can withdraw your consent at any time by emailing",
    consentNote: "Contestants who wish to be considered for the Most Popular Contestant award must agree to the use of their photos and videos.",
    uploadingPhoto: "Uploading photo...",
    steps: ["Your details", "Photo & video", "Consent"],
    next: "Continue",
    back: "Back",
    stepOf: (n: number) => `Step ${n} of 3`,
    agreeIntro: "Please read and confirm the commitments below before submitting.",
    agreeSubmit: "Agree & submit",
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
  const email = getContent(lang).site.contact.email;
  const [state, setState] = useState<State>("idle");
  const [closed, setClosed] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [step, setStep] = useState<"photo" | "video">("video");
  // Trang hiện tại của form: 0 thông tin, 1 ảnh và video, 2 cam kết
  const [page, setPage] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const pages = useRef<(HTMLDivElement | null)[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    setClosed(Date.now() > new Date(deadline).getTime());
  }, [deadline]);

  function goTo(next: number) {
    setPage(next);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Chỉ sang bước sau khi mọi ô bắt buộc của bước hiện tại hợp lệ. */
  function nextPage() {
    const fields = pages.current[page]?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select") ?? [];
    for (const el of fields) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return;
      }
    }
    goTo(page + 1);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Bấm Enter ở các bước đầu thì chuyển bước, không gửi
    if (page < 2) return nextPage();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (data.get("website") || !video || !photo) return; // bẫy bot / chưa chọn ảnh, video
    data.delete("website");
    data.set("submittedAt", new Date().toISOString());
    data.set("shareProfile", data.get("shareProfile") ? "Có" : "Không");

    setErrorText("");
    try {
      setState("uploading");
      setProgress(0);
      const owner = `${data.get("fullName")} - ${data.get("studentId")}`;
      setStep("photo");
      data.set("photoUrl", await uploadFile(endpoint, photo, `${owner} - Ảnh - ${photo.name}`, setProgress));
      setStep("video");
      setProgress(0);
      data.set("videoUrl", await uploadFile(endpoint, video, `${owner} - Video - ${video.name}`, setProgress));
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
      setPhoto(null);
      setProgress(null);
      setPage(0);
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

  const busy = state === "uploading" || state === "sending";
  const pageCls = (i: number) => (page === i ? "grid gap-4 sm:grid-cols-2" : "hidden");

  return (
    <form ref={formRef} onSubmit={onSubmit} className="card scroll-mt-24 p-6 sm:p-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/images/logo.png")} alt="" className="mb-6 h-12 w-auto" />

      {/* Thanh bước */}
      <ol className="mb-7 grid grid-cols-3 gap-2" aria-label={t.stepOf(page + 1)}>
        {t.steps.map((label, i) => (
          <li key={label} aria-current={i === page ? "step" : undefined}>
            <div className={`h-1.5 rounded-full transition-colors duration-300 ${i <= page ? "bg-orange" : "bg-line"}`} />
            <p className={`mt-2 flex items-center gap-1.5 text-[13px] font-semibold ${i === page ? "text-navy" : i < page ? "text-orange-ink" : "text-muted"}`}>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${i < page ? "bg-orange text-white" : i === page ? "bg-navy text-white" : "bg-line text-muted"}`}
              >
                {i < page ? "✓" : i + 1}
              </span>
              <span className="hidden truncate sm:inline">{label}</span>
            </p>
          </li>
        ))}
      </ol>
      <p className="-mt-4 mb-6 text-[13px] font-semibold text-navy sm:hidden">
        {t.stepOf(page + 1)} · {t.steps[page]}
      </p>

      <fieldset disabled={unavailable || busy}>
        <legend className="sr-only">{t.legend}</legend>

        {/* Bước 1: thông tin cá nhân */}
        <div ref={(el) => { pages.current[0] = el; }} className={pageCls(0)}>
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
            <input name="phone" type="tel" required autoComplete="tel" pattern="[0-9+ ]{9,15}" title={t.phoneHint} className={field} />
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
        </div>

        {/* Bước 2: ảnh và video */}
        <div ref={(el) => { pages.current[1] = el; }} className={pageCls(1)}>
          <PhotoUpload lang={lang} file={photo} onChange={setPhoto} progress={state === "uploading" && step === "photo" ? progress : null} />
          <VideoUpload lang={lang} file={video} onChange={setVideo} progress={state === "uploading" && step === "video" ? progress : null} />
        </div>

        {/* Bước 3: cam kết, đồng ý rồi mới nộp */}
        <div ref={(el) => { pages.current[2] = el; }} className={pageCls(2)}>
          <p className="text-[15px] text-muted sm:col-span-2">{t.agreeIntro}</p>

          <fieldset className="rounded-xl border border-line bg-mist/40 p-4 sm:col-span-2">
            <legend className="px-1 text-[15px] font-semibold text-navy">{t.consentTitle}</legend>
            <p className="text-sm leading-relaxed text-muted">{t.consentBody}</p>
            <div className="mt-3 space-y-2">
              <label className="flex items-start gap-3 text-[15px] text-ink">
                <input type="radio" name="mediaConsent" value="Đồng ý" required className="mt-1 h-4 w-4 accent-orange" />
                <span>{t.consentYes}</span>
              </label>
              <label className="flex items-start gap-3 text-[15px] text-ink">
                <input type="radio" name="mediaConsent" value="Không đồng ý" className="mt-1 h-4 w-4 accent-orange" />
                <span>{t.consentNo}</span>
              </label>
            </div>
            <p className="mt-3 rounded-lg bg-[#fff1e6] px-3 py-2 text-sm font-medium text-orange-ink">{t.consentNote}</p>
            <p className="mt-2 text-[13px] text-muted">
              {t.consentWithdraw}{" "}
              <a href={`mailto:${email}`} className="font-semibold text-navy underline-offset-2 hover:underline">
                {email}
              </a>
              .
            </p>
          </fieldset>

          <label className="flex items-start gap-3 text-[15px] text-ink sm:col-span-2">
            <input name="confirm" type="checkbox" required className="mt-0.5 h-4 w-4 accent-orange" />
            <span>{t.confirm}</span>
          </label>
          <label className="flex items-start gap-3 text-[15px] text-ink sm:col-span-2">
            <input name="shareProfile" type="checkbox" className="mt-0.5 h-4 w-4 accent-orange" />
            <span>{t.share}</span>
          </label>
        </div>

        {/* Bẫy bot: người dùng không thấy ô này */}
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        <div className="mt-7 flex gap-3">
          {page > 0 && (
            <button type="button" onClick={() => goTo(page - 1)} className="btn-outline px-6 py-3.5">
              {t.back}
            </button>
          )}
          {page < 2 ? (
            <button key="next" type="button" onClick={nextPage} className="btn-primary flex-1 py-3.5 disabled:translate-y-0 disabled:opacity-60">
              {t.next}
            </button>
          ) : (
            <button key="submit" type="submit" className="btn-primary flex-1 py-3.5 disabled:translate-y-0 disabled:opacity-60">
              {state === "uploading"
                ? `${step === "photo" ? t.uploadingPhoto : t.uploading} ${Math.round((progress ?? 0) * 100)}%`
                : state === "sending"
                  ? t.sending
                  : t.agreeSubmit}
            </button>
          )}
        </div>
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
