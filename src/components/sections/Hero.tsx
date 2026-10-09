import Link from "next/link";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

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
    <section id="top" className="relative bg-linear-to-b from-[#eef4fd] to-white pt-16 lg:bg-none lg:bg-white">
      <h1 className="sr-only">
        {site.name} - {site.viName}
      </h1>

      {/* Dải nền sau thanh menu (menu không rộng hết màn hình lớn) */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-16 bg-navy-deep" />

      {/* Banner chính (ghép từ nền sinh bằng Codex + logo + chữ thật, xem .cache/cover/compose.py); bản tiếng Anh riêng */}
      <div data-tour="hero" className="relative aspect-[820/360] overflow-hidden bg-navy-deep">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(lang === "en" ? "/images/cover-en-1640.webp" : "/images/cover-1640.webp")}
          srcSet={`${asset(lang === "en" ? "/images/cover-en-1640.webp" : "/images/cover-1640.webp")} 1640w, ${asset(lang === "en" ? "/images/cover-en-2460.webp" : "/images/cover-2460.webp")} 2460w`}
          sizes="100vw"
          alt={t.bannerAlt}
          width={1640}
          height={720}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Nút đăng ký đặt ở khoảng trống dưới các mốc thời gian của banner */}
        <div className="absolute top-[71%] left-[27.2%] hidden -translate-x-1/2 lg:block">
          <Ctas lang={lang} className="gap-2.5" compact />
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
            <li key={s.value} className={`flex items-center gap-3 px-2 py-2 sm:px-4 ${i > 0 ? "lg:border-l lg:border-line" : ""}`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff1e6] text-orange sm:h-14 sm:w-14">
                <Icon name={s.icon} className="h-6 w-6" strokeWidth={1.9} />
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
