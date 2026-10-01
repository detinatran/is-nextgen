import RegisterForm from "@/components/RegisterForm";
import { site } from "@/content/site";

export default function Register() {
  return (
    <section id="dang-ky" className="relative overflow-hidden bg-orange py-20 lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20 [background:repeating-linear-gradient(135deg,#fff_0_1px,transparent_1px_22px)]"
      />
      <div className="container-x relative grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div className="reveal text-navy-deep">
          <p className="eyebrow text-navy-deep/70">Mùa I · 2026</p>
          <h2 className="mt-3 text-4xl font-extrabold sm:text-5xl">Đăng ký dự thi</h2>
          <p className="mt-5 max-w-md leading-relaxed text-navy-deep/85">
            Điền thông tin và nộp video giới thiệu dài tối đa 90 giây trả lời câu hỏi tình huống do Ban Tổ chức công bố.
            Không thu lệ phí dự thi.
          </p>
          <p className="mt-5 font-mono text-sm text-navy-deep">Hạn nộp: {site.registrationDeadlineLabel}</p>
        </div>
        <div className="reveal" style={{ "--delay": "120ms" } as React.CSSProperties}>
          <RegisterForm deadline={site.registrationDeadline} />
        </div>
      </div>
    </section>
  );
}
