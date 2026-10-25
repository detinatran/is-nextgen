import Link from "next/link";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

// Đổi số phiên bản (và tên file ảnh) mỗi lần sửa banner: ảnh được trình duyệt giữ 30 ngày.
// Banner Ban Tổ chức gửi (16:9, 1920x1080, có dải logo đơn vị ở trên): hiện nguyên tỉ lệ, không cắt.
const BANNER_VERSION = "v5";

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
    <section id="top" className="relative bg-linear-to-b from-[#eef4fd] to-white pt-16 lg:bg-none lg:bg-white lg:pt-[5.5rem]">
      <h1 className="sr-only">
        {site.name} - {site.viName}
      </h1>

      {/* Banner chính: hiện nguyên khung 16:9 để không mất dải logo hai mép; dùng chung cho tiếng Việt và tiếng Anh */}
      <div data-tour="hero" className="relative aspect-[16/9] overflow-hidden bg-navy-deep">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(`/images/cover-${BANNER_VERSION}-1280.webp`)}
          srcSet={`${asset(`/images/cover-${BANNER_VERSION}-1280.webp`)} 1280w, ${asset(`/images/cover-${BANNER_VERSION}-1920.webp`)} 1920w`}
          sizes="100vw"
          alt={t.bannerAlt}
          width={1920}
          height={1080}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Mã QR trên banner bấm được, mở trang đăng ký (vùng QR: x 1198–1410, y 417–628 trên ảnh 1920x1080) */}
        <Link
          href={localePath(lang, "/dang-ky/")}
          aria-label={t.register}
          className="absolute rounded-md focus-visible:outline-2 focus-visible:outline-white"
          style={{ left: "62.4%", top: "38.6%", width: "11%", height: "19.6%" }}
        />
        {/* Nút đăng ký ở khoảng trống ngay dưới chữ "ĐĂNG KÝ NGAY!" của banner (tâm x = 1303/1920) */}
        <div className="absolute hidden -translate-x-1/2 lg:block" style={{ left: "67.9%", top: "67%" }}>
          <Link href={localePath(lang, "/dang-ky/")} className="btn-primary cta-pulse px-5 py-2.5 text-sm whitespace-nowrap shadow-lg shadow-navy-deep/30 xl:px-7 xl:py-3 xl:text-base">
            {t.register} <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
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
