import Countdown from "@/components/Countdown";
import { site, stats } from "@/content/site";
import { asset } from "@/lib/paths";

export default function Hero() {
  return (
    <>
      <section id="top" className="bg-navy-deep pt-16">
        <h1 className="sr-only">
          {site.name} - {site.viName}
        </h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset("/images/banner.webp")}
          alt="Key visual IS-NextGen Manager 2026"
          width={1920}
          height={1080}
          fetchPriority="high"
          className="mx-auto block aspect-video max-h-[calc(100svh-4rem)] w-full object-cover"
        />
      </section>

      <section className="relative overflow-hidden bg-navy text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-navy-soft/60 blur-3xl"
        />
        <div className="container-x relative grid gap-12 py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-24">
          <div className="reveal">
            <p className="eyebrow text-gold">{site.season}</p>
            <p className="mt-5 text-4xl leading-[1.1] font-extrabold sm:text-5xl lg:text-[3.4rem]">
              Nhà Quản trị
              <br />
              trong Kỷ nguyên AI
            </p>
            <p className="mt-6 flex items-center gap-4 text-base font-semibold text-gold sm:text-lg">
              <span aria-hidden className="h-1 w-10 shrink-0 bg-orange" />
              Mùa I của Cuộc thi {site.viName}
            </p>
            <p className="mt-5 max-w-xl leading-relaxed text-white/80">
              Cuộc thi đo năng lực ra quyết định và điều hành tổ chức, mô phỏng quy trình tuyển chọn quản trị viên tập
              sự của doanh nghiệp. Dành cho sinh viên các trường đại học, học viện trong và ngoài Hà Nội.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#dang-ky" className="btn-gold">
                Đăng ký dự thi
              </a>
              <a href="#the-le" className="btn-ghost">
                Xem thể lệ
              </a>
            </div>
          </div>

          <div className="reveal space-y-6" style={{ "--delay": "120ms" } as React.CSSProperties}>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div key={s.label} className={`p-5 sm:p-6 ${s.highlight ? "bg-orange text-navy-deep" : "bg-navy-soft"}`}>
                  <div className={`text-3xl font-extrabold sm:text-4xl ${s.highlight ? "" : "text-gold"}`}>{s.value}</div>
                  <div className={`mt-1 text-xs sm:text-sm ${s.highlight ? "text-navy-deep/80" : "text-white/70"}`}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="font-mono text-xs text-white/60">Hạn đăng ký: {site.registrationDeadlineLabel}</p>
              <div className="mt-3">
                <Countdown deadline={site.registrationDeadline} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
