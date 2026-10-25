import Link from "next/link";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

// Đổi số phiên bản (và tên file ảnh) mỗi lần sửa banner: ảnh được trình duyệt giữ 30 ngày.
// Banner Ban Tổ chức gửi (1920x1080) được tách làm hai: phần ảnh (1920x917, bỏ dải logo phía trên)
// và dải logo đơn vị (partners-strip) hiển thị thành băng riêng dưới ảnh. Điện thoại dùng bản cắt
// tiêu đề + ba vòng thi (bỏ mã QR vì không quét được trên chính điện thoại).
const BANNER_VERSION = "v6";

const text = {
  vi: { register: "Đăng ký ngay", more: "Tìm hiểu thêm", audience: ["Cuộc thi", "dành cho sinh viên", "trên toàn quốc"], bannerAlt: "NextGen Manager 2026 – Discover 07/11, Decide 21/11, Deliver 05/12 – Shaping the AI-era Leader 2026. Đơn vị tổ chức: Trường Quốc tế – ĐHQGHN, Khoa Kinh tế và Quản lý" },
  en: { register: "Register now", more: "Learn more", audience: ["A competition", "for students", "nationwide"], bannerAlt: "NextGen Manager 2026 – Discover 07/11, Decide 21/11, Deliver 05/12 – Shaping the AI-era Leader 2026. Organized by VNU International School, Faculty of Economics and Management" },
};

function Ctas({ lang, className = "", compact }: { lang: Lang; className?: string; compact?: boolean }) {
  const t = text[lang];
  const size = compact ? "px-5 py-2.5 text-sm whitespace-nowrap shadow-lg shadow-navy-deep/30" : "";
  return (
    <div className={`flex gap-3 ${className}`}>
      <Link href={localePath(lang, "/dang-ky/")} className={`btn-primary ${size}`}>
        {t.register} <Icon name="arrowRight" className="h-4 w-4" />
      </Link>
      <Link href={localePath(lang, "/#gioi-thieu")} className={`${compact ? "btn-glass bg-navy-deep/40" : "btn-outline bg-white"} ${size}`}>
        {t.more} <Icon name="circleArrow" className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function Hero({ lang }: { lang: Lang }) {
  const { heroStats, site } = getContent(lang);
  const t = text[lang];
  return (
    <section id="top" className="relative bg-linear-to-b from-[#eef4fd] to-white pt-16 lg:bg-none lg:bg-white lg:pt-0">
      <h1 className="sr-only">
        {site.name} - {site.viName}
      </h1>

      {/* Banner chính. Máy tính: thanh menu nổi phía trên phần ảnh, khung không cao quá một màn hình. */}
      <div data-tour="hero" className="relative overflow-hidden bg-[#0d0f0c]">
        {/* Điện thoại: bản cắt tiêu đề + ba vòng thi để chữ đủ lớn */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(`/images/hero-${BANNER_VERSION}-m.webp`)}
          alt={t.bannerAlt}
          width={900}
          height={603}
          fetchPriority="high"
          className="block aspect-[900/603] w-full object-cover lg:hidden"
        />
        <div className="relative hidden lg:block lg:h-[min(calc(100vw*917/1920),100svh)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset(`/images/hero-${BANNER_VERSION}-1280.webp`)}
            srcSet={`${asset(`/images/hero-${BANNER_VERSION}-1280.webp`)} 1280w, ${asset(`/images/hero-${BANNER_VERSION}-1920.webp`)} 1920w`}
            sizes="100vw"
            alt={t.bannerAlt}
            width={1920}
            height={917}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Mã QR và chữ "ĐĂNG KÝ NGAY!" trên ảnh bấm được, mở trang đăng ký (x 1180–1430, y 250–530 trên ảnh 1920x917) */}
          <Link
            href={localePath(lang, "/dang-ky/")}
            aria-label={t.register}
            className="group absolute rounded-xl transition hover:bg-white/5 hover:ring-2 hover:ring-[#f5d27a]/70 focus-visible:outline-2 focus-visible:outline-white"
            style={{ left: "61.5%", top: "27.3%", width: "13%", height: "30.5%" }}
          />
        </div>
      </div>

      {/* Dải logo đơn vị (lấy từ banner): máy tính hiện cả dải; điện thoại chạy chậm thành băng chuyền để logo đủ lớn */}
      <div className="border-b border-line bg-white">
        <div className="container-x hidden py-3 lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(`/images/partners-strip-${BANNER_VERSION}.webp`)} alt={lang === "en" ? "Organizers, implementing units, media and professional sponsors, sponsors and partner companies" : "Đơn vị tổ chức, thực hiện, bảo trợ chuyên môn, bảo trợ truyền thông, nhà tài trợ và doanh nghiệp đồng hành"} width={1876} height={140} className="mx-auto block h-auto w-full max-w-[1400px]" />
        </div>
        <div className="marquee py-2 lg:hidden" aria-hidden>
          <div className="marquee-track" style={{ ["--marquee-duration" as string]: "40s" }}>
            {[0, 1].map((k) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={k} src={asset(`/images/partners-strip-${BANNER_VERSION}.webp`)} alt="" width={1876} height={140} className="block h-16 w-auto max-w-none pr-8" />
            ))}
          </div>
        </div>
      </div>

      {/* Bản di động: chữ đặt dưới ảnh */}
      <div className="container-x py-8 text-center lg:hidden">
        <p className="text-xl font-extrabold tracking-wide text-navy uppercase sm:text-2xl">{site.themeEn}</p>
        <p className="mt-1.5 text-xs font-semibold tracking-[0.08em] text-muted uppercase sm:text-sm">
          {lang === "en" ? site.slogan.join(" · ") : site.heroTitle}
        </p>
        <p className="mt-4 text-base text-muted">{t.audience.join(" ")}</p>
        <Ctas lang={lang} className="mt-6 flex-wrap justify-center" />
      </div>

      {/* Thẻ quyền lợi ngay dưới banner */}
      <div className="container-x relative z-10 pt-6 pb-4 lg:pt-8">
        <ul className="grid grid-cols-2 gap-y-2 rounded-3xl bg-white p-3 shadow-2xl shadow-navy/15 ring-1 ring-line sm:p-4 lg:grid-cols-4">
          {heroStats.map((s, i) => (
            <li key={s.value} className={`flex items-center gap-2 px-1.5 py-2 min-[360px]:gap-3 min-[360px]:px-2 sm:px-4 ${i > 0 ? "lg:border-l lg:border-line" : ""}`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1e6] text-orange min-[360px]:h-12 min-[360px]:w-12 sm:h-14 sm:w-14">
                <Icon name={s.icon} className="h-5 w-5 min-[360px]:h-6 min-[360px]:w-6" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="text-[0.95rem] leading-tight font-bold whitespace-nowrap text-navy sm:text-lg">{s.value}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted">{s.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
