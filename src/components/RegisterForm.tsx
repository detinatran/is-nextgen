"use client";

import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { asset } from "@/lib/paths";
import { getContent } from "@/content";
import { ApiError, apiBase, submitRegistration, type SubmitStep } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { type FieldErrorCode, normalizeFacebook, validateProfile } from "@/lib/validate";
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
    fieldErrors: {
      required: "Vui lòng điền ô này.",
      name: "Họ tên chỉ gồm chữ cái và khoảng trắng.",
      email: "Email chưa đúng, ví dụ: ten@gmail.com.",
      phone: "Số điện thoại gồm 9-15 chữ số.",
      studentId: "Mã số sinh viên chỉ gồm chữ và số (4-20 ký tự).",
      facebook: "Nhập link trang Facebook cá nhân, ví dụ: facebook.com/ten-cua-ban.",
      dob: "Ngày sinh chưa hợp lệ.",
      text: "Nội dung chưa hợp lệ.",
    } as Record<FieldErrorCode, string>,
    needPhoto: "Vui lòng tải lên ảnh cá nhân.",
    needVideo: "Vui lòng tải lên video giới thiệu.",
    waitVideo: "Đang kiểm tra video, vui lòng đợi trong giây lát.",
    needConsent: "Vui lòng chọn Đồng ý hoặc Không đồng ý.",
    needConfirm: "Vui lòng xác nhận để nộp đăng ký.",
    duplicateNote: "Mỗi thí sinh chỉ đăng ký một lần. Hồ sơ trùng email hoặc mã số sinh viên sẽ được Ban Tổ chức rà soát; nếu cần sửa thông tin, hãy liên hệ",
    steps: ["Thông tin", "Ảnh & video", "Cam kết"],
    next: "Tiếp tục",
    back: "Quay lại",
    stepOf: (n: number) => `Bước ${n}/3`,
    agreeIntro: "Vui lòng đọc kỹ và xác nhận các cam kết dưới đây trước khi nộp đăng ký.",
    agreeSubmit: "Đồng ý & nộp đăng ký",
    sendError: "Video đã tải lên nhưng chưa gửi được thông tin. Kiểm tra kết nối mạng và bấm gửi lại.",
    received: "Đã nhận đăng ký",
    thanks: "Cảm ơn bạn!",
    doneBody: "Ban Tổ chức sẽ gửi email xác nhận tới địa chỉ bạn đã đăng ký. Trước ngày thi Vòng Đơn, bạn sẽ nhận email mời thi gồm mã thí sinh, ca thi và đường link kích hoạt tài khoản để vào thi.",
    another: "Đăng ký cho người khác",
    legend: "Thông tin đăng ký",
    fullName: "Họ và tên *",
    phone: "Số điện thoại *",
    phoneHint: "9-15 chữ số",
    school: "Trường đang theo học *",
    schoolPh: "Chọn hoặc gõ tên trường",
    major: "Ngành học *",
    dob: "Ngày sinh *",
    department: "Khoa/Viện *",
    facebook: "Link Facebook cá nhân *",
    facebookPh: "https://facebook.com/ten-cua-ban",
    creating: "Đang tạo hồ sơ...",
    checking: "Đang kiểm tra video...",
    codeLabel: "Mã thí sinh của bạn",
    errors: {
      VIDEO_TOO_LONG: "Video dài quá 2 phút. Hãy cắt ngắn rồi gửi lại.",
      VIDEO_TOO_LARGE: "Video vượt dung lượng cho phép.",
      VIDEO_INVALID_FORMAT: "Video phải là file MP4.",
      VIDEO_VALIDATION_FAILED: "Không đọc được video. Hãy xuất lại file MP4 rồi thử lại.",
      PHOTO_INVALID_FORMAT: "Ảnh phải là JPG hoặc PNG.",
      PHOTO_TOO_LARGE: "Ảnh lớn hơn 10 MB.",
      VALIDATION_FAILED: "Thông tin chưa hợp lệ, vui lòng kiểm tra lại các ô đã nhập.",
      STATE_CONFLICT: "Cổng đăng ký hiện không mở.",
      RATE_LIMITED: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.",
      DEADLINE_PASSED: "Đã hết hạn đăng ký.",
      NOT_FOUND: "Cuộc thi chưa mở đăng ký trên hệ thống.",
      IDEMPOTENCY_CONFLICT: "Hồ sơ đang được xử lý, vui lòng không bấm nộp nhiều lần.",
      UPLOAD_INCOMPLETE: "Video chưa tải lên xong. Vui lòng thử lại.",
      AUTH_REQUIRED: "Phiên đăng ký đã hết hạn. Vui lòng tải lại trang và đăng ký lại.",
      FORBIDDEN: "Phiên đăng ký đã hết hạn. Vui lòng tải lại trang và đăng ký lại.",
      DEPENDENCY_UNAVAILABLE: "Hệ thống đang bận, vui lòng thử lại sau ít phút.",
      INTERNAL: "Hệ thống gặp lỗi, vui lòng thử lại sau ít phút.",
    } as Record<string, string>,
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
    notOpen: "Cổng đăng ký hiện chưa mở. Vui lòng quay lại sau.",
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
    fieldErrors: {
      required: "Please fill in this field.",
      name: "Your name may only contain letters and spaces.",
      email: "Please enter a valid email, e.g. name@gmail.com.",
      phone: "Phone number must have 9-15 digits.",
      studentId: "Student ID may only contain letters and digits (4-20 characters).",
      facebook: "Enter your Facebook profile link, e.g. facebook.com/your-name.",
      dob: "Please enter a valid date of birth.",
      text: "This value is not valid.",
    } as Record<FieldErrorCode, string>,
    needPhoto: "Please upload your personal photo.",
    needVideo: "Please upload your intro video.",
    waitVideo: "Checking your video, please wait a moment.",
    needConsent: "Please choose Agree or Do not agree.",
    needConfirm: "Please confirm to submit your registration.",
    duplicateNote: "Each contestant may register only once. Registrations with a duplicate email or student ID are reviewed by the Organizing Committee; to change your details, contact",
    steps: ["Your details", "Photo & video", "Consent"],
    next: "Continue",
    back: "Back",
    stepOf: (n: number) => `Step ${n} of 3`,
    agreeIntro: "Please read and confirm the commitments below before submitting.",
    agreeSubmit: "Agree & submit",
    sendError: "Your video was uploaded but the form was not sent. Check your connection and submit again.",
    received: "Registration received",
    thanks: "Thank you!",
    doneBody: "The Organizing Committee will email you a confirmation. Before the Application Round, you will receive an exam invitation with your candidate code, exam slot and a link to activate your exam account.",
    another: "Register someone else",
    legend: "Registration details",
    fullName: "Full name *",
    phone: "Phone number *",
    phoneHint: "9-15 digits",
    school: "University *",
    schoolPh: "Choose or type your university",
    major: "Major *",
    dob: "Date of birth *",
    department: "Faculty / School *",
    facebook: "Facebook profile link *",
    facebookPh: "https://facebook.com/your-name",
    creating: "Creating your application...",
    checking: "Checking your video...",
    codeLabel: "Your candidate code",
    errors: {
      VIDEO_TOO_LONG: "The video is longer than 2 minutes. Please trim it and try again.",
      VIDEO_TOO_LARGE: "The video is larger than allowed.",
      VIDEO_INVALID_FORMAT: "The video must be an MP4 file.",
      VIDEO_VALIDATION_FAILED: "We could not read the video. Please export it again as MP4.",
      PHOTO_INVALID_FORMAT: "The photo must be JPG or PNG.",
      PHOTO_TOO_LARGE: "The photo is larger than 10 MB.",
      VALIDATION_FAILED: "Some details are not valid. Please check your entries.",
      STATE_CONFLICT: "Registration is not open right now.",
      RATE_LIMITED: "Too many attempts. Please try again in a few minutes.",
      DEADLINE_PASSED: "Registration has closed.",
      NOT_FOUND: "Registration for this competition is not open in the system.",
      IDEMPOTENCY_CONFLICT: "Your application is being processed; please don't submit twice.",
      UPLOAD_INCOMPLETE: "The video did not finish uploading. Please try again.",
      AUTH_REQUIRED: "Your registration session expired. Please reload the page and try again.",
      FORBIDDEN: "Your registration session expired. Please reload the page and try again.",
      DEPENDENCY_UNAVAILABLE: "The system is busy. Please try again in a few minutes.",
      INTERNAL: "Something went wrong. Please try again in a few minutes.",
    } as Record<string, string>,
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
    notOpen: "Registration is not open yet. Please check back later.",
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
  const [step, setStep] = useState<SubmitStep>("video");
  const [candidateCode, setCandidateCode] = useState("");
  // Trang hiện tại của form: 0 thông tin, 1 ảnh và video, 2 cam kết
  const [page, setPage] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const pages = useRef<(HTMLDivElement | null)[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [errorText, setErrorText] = useState("");
  // Lỗi hiển thị ngay dưới từng ô (theo tên ô) và trạng thái đang kiểm tra video
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [videoChecking, setVideoChecking] = useState(false);

  useEffect(() => {
    setClosed(Date.now() > new Date(deadline).getTime());
  }, [deadline]);

  function goTo(next: number) {
    setPage(next);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Kiểm tra một bước; lỗi hiện dưới từng ô và đưa con trỏ tới ô lỗi đầu tiên. */
  function validatePage(p: number): boolean {
    const form = formRef.current;
    if (!form) return false;
    const data = new FormData(form);
    const get = (n: string) => String(data.get(n) ?? "");
    let found: Record<string, string> = {};
    if (p === 0) {
      const codes = validateProfile(get);
      found = Object.fromEntries(Object.entries(codes).map(([k, c]) => [k, t.fieldErrors[c]]));
    } else if (p === 1) {
      if (!photo) found.photo = t.needPhoto;
      if (videoChecking) found.video = t.waitVideo;
      else if (!video) found.video = t.needVideo;
    } else {
      if (!get("mediaConsent")) found.mediaConsent = t.needConsent;
      if (!get("confirm")) found.confirm = t.needConfirm;
    }
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      const el = form.querySelector<HTMLElement>(`[name="${first}"]`);
      el?.focus({ preventScroll: true });
      (el?.closest("label, fieldset, .sm\\:col-span-2") ?? el)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  function nextPage() {
    if (validatePage(page)) goTo(page + 1);
  }

  /** Gõ lại vào ô nào thì xoá lỗi của ô đó. */
  function clearError(e: React.FormEvent<HTMLFormElement>) {
    const name = (e.target as HTMLInputElement).name;
    if (name && errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Bấm Enter ở các bước đầu thì chuyển bước, không gửi
    if (page < 2) return nextPage();
    const form = e.currentTarget;
    if (!photo || !video) {
      goTo(1);
      validatePage(1);
      return;
    }
    if (!validatePage(2)) return;
    const data = new FormData(form);
    if (data.get("website")) return; // bẫy bot
    data.delete("website");
    // Cắt khoảng trắng thừa ở mọi ô chữ, chuẩn hoá link Facebook
    for (const [k, v] of [...data.entries()]) if (typeof v === "string") data.set(k, v.trim());
    if (data.get("facebook")) data.set("facebook", normalizeFacebook(String(data.get("facebook"))));
    data.set("submittedAt", new Date().toISOString());
    data.set("shareProfile", data.get("shareProfile") ? "Có" : "Không");

    setErrorText("");
    if (apiBase) return submitToBackend(form, data);
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

  // Gửi tới backend NestJS khi có NEXT_PUBLIC_API_URL
  async function submitToBackend(form: HTMLFormElement, data: FormData) {
    const get = (k: string) => String(data.get(k) ?? "").trim();
    setState("uploading");
    try {
      const result = await submitRegistration({
        profile: {
          fullName: get("fullName"),
          dateOfBirth: get("dateOfBirth"),
          studentId: get("studentId"),
          school: get("school"),
          department: get("department"),
          major: get("major"),
          email: get("email"),
          phone: get("phone"),
          facebook: get("facebook"),
        },
        dataProcessing: !!data.get("confirm"),
        mediaUsage: data.get("mediaConsent") === "Đồng ý",
        photo: photo!,
        video: video!,
        onStep: setStep,
        onProgress: setProgress,
      });
      setCandidateCode(result.candidateCode);
      setState("done");
      setVideo(null);
      setPhoto(null);
      setProgress(null);
      setPage(0);
      form.reset();
    } catch (err) {
      setState("error");
      setProgress(null);
      const code = err instanceof ApiError ? err.code : "";
      // Mã lỗi chưa có trong danh sách: hiện nguyên lời backend để thí sinh biết vì sao
      setErrorText(code === "NETWORK" ? t.uploadError : (t.errors[code] ?? `${t.sendError}${err instanceof Error && err.message ? ` (${err.message})` : ""}`));
    }
  }

  if (state === "done") {
    return (
      <div className="card p-8 text-center" role="status">
        <p className="eyebrow justify-center">{t.received}</p>
        <h3 className="mt-3 text-2xl font-bold text-navy">{t.thanks}</h3>
        {candidateCode && (
          <p className="mx-auto mt-4 w-max rounded-xl bg-cream px-5 py-3">
            <span className="block text-xs font-semibold tracking-wider text-muted uppercase">{t.codeLabel}</span>
            <span className="text-2xl font-bold tracking-wider text-orange-ink">{candidateCode}</span>
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t.doneBody}
        </p>
        <button type="button" className="btn-outline mt-6" onClick={() => setState("idle")}>
          {t.another}
        </button>
      </div>
    );
  }

  const unavailable = closed || (!endpoint && !apiBase);

  const busy = state === "uploading" || state === "sending";
  const inputProps = (name: string) => ({
    "aria-invalid": errors[name] ? true : undefined,
    className: `${field} ${errors[name] ? "border-orange-ink bg-white ring-2 ring-orange/15" : ""}`,
  });
  const pageCls = (i: number) => (page === i ? "grid gap-4 sm:grid-cols-2" : "hidden");

  return (
    <form ref={formRef} onSubmit={onSubmit} onInput={clearError} onChange={clearError} noValidate className="card scroll-mt-24 p-6 sm:p-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/images/logo-2026.png")} alt="" className="mb-6 h-16 w-auto" />

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
            <input name="fullName" required autoComplete="name" {...inputProps("fullName")} />
            <FieldError msg={errors.fullName} />
          </label>

          <label>
            <span className={labelCls}>Email *</span>
            <input name="email" type="email" required autoComplete="email" {...inputProps("email")} />
            <FieldError msg={errors.email} />
          </label>
          <label>
            <span className={labelCls}>{t.phone}</span>
            <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" {...inputProps("phone")} />
            <FieldError msg={errors.phone} />
          </label>

          <label className="sm:col-span-2">
            <span className={labelCls}>{t.school}</span>
            <input name="school" required list="school-list" placeholder={t.schoolPh} {...inputProps("school")} />
            <datalist id="school-list">
              {schools.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <FieldError msg={errors.school} />
          </label>

          <label>
            <span className={labelCls}>{t.dob}</span>
            <input name="dateOfBirth" type="date" required min="1970-01-01" max="2012-12-31" {...inputProps("dateOfBirth")} />
            <FieldError msg={errors.dateOfBirth} />
          </label>
          <label>
            <span className={labelCls}>{t.department}</span>
            <input name="department" required {...inputProps("department")} />
            <FieldError msg={errors.department} />
          </label>

          <label>
            <span className={labelCls}>{t.major}</span>
            <input name="major" required {...inputProps("major")} />
            <FieldError msg={errors.major} />
          </label>
          <label>
            <span className={labelCls}>{t.studentId}</span>
            <input name="studentId" required autoCapitalize="characters" {...inputProps("studentId")} />
            <FieldError msg={errors.studentId} />
          </label>

          <label className="sm:col-span-2">
            <span className={labelCls}>{t.facebook}</span>
            <input name="facebook" type="url" inputMode="url" required placeholder={t.facebookPh} {...inputProps("facebook")} />
            <FieldError msg={errors.facebook} />
          </label>

          <label>
            <span className={labelCls}>{t.year}</span>
            <select name="year" required defaultValue="" {...inputProps("year")}>
              <option value="" disabled>
                {t.choose}
              </option>
              {yearValues.map((y, i) => (
                <option key={y} value={y}>
                  {t.years[i]}
                </option>
              ))}
            </select>
            <FieldError msg={errors.year} />
          </label>
          <label>
            <span className={labelCls}>{t.nationality}</span>
            <input name="nationality" defaultValue={t.nationalityDefault} {...inputProps("nationality")} />
            <FieldError msg={errors.nationality} />
          </label>
        </div>

        {/* Bước 2: ảnh và video */}
        <div ref={(el) => { pages.current[1] = el; }} className={pageCls(1)}>
          <PhotoUpload lang={lang} formError={errors.photo} file={photo} onChange={(f) => { setPhoto(f); if (f) setErrors(({ photo: _p, ...rest }) => rest); }} progress={state === "uploading" && step === "photo" ? progress : null} />
          <VideoUpload lang={lang} mp4Only={!!apiBase} formError={errors.video} onCheckingChange={setVideoChecking} file={video} onChange={(f) => { setVideo(f); if (f) setErrors(({ video: _v, ...rest }) => rest); }} progress={state === "uploading" && step === "video" ? progress : null} />
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
            <FieldError msg={errors.mediaConsent} />
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
            <span>
              {t.confirm}
              <FieldError msg={errors.confirm} />
            </span>
          </label>
          <label className="flex items-start gap-3 text-[15px] text-ink sm:col-span-2">
            <input name="shareProfile" type="checkbox" className="mt-0.5 h-4 w-4 accent-orange" />
            <span>{t.share}</span>
          </label>
          <p className="rounded-lg bg-mist px-3 py-2 text-[13px] leading-relaxed text-muted sm:col-span-2">
            {t.duplicateNote}{" "}
            <a href={`mailto:${email}`} className="font-semibold text-navy underline-offset-2 hover:underline">
              {email}
            </a>
            .
          </p>
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
                ? step === "draft"
                  ? t.creating
                  : step === "checking"
                    ? t.checking
                    : step === "submit"
                      ? t.sending
                      : `${step === "photo" ? t.uploadingPhoto : t.uploading} ${Math.round((progress ?? 0) * 100)}%`
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

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <span className="mt-1.5 block text-[13px] font-medium text-orange-ink" role="alert">
      {msg}
    </span>
  );
}
