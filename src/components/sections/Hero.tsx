import Link from "next/link";
import Art from "@/components/Art";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

const text = {
  vi: { register: "Đăng ký ngay", more: "Tìm hiểu thêm", audience: ["Cuộc thi", "dành cho sinh viên", "trên toàn quốc"], organizers: "Đơn vị tổ chức", season: "Chủ đề Mùa 1", organizersAlt: "Trường Quốc tế, Đoàn Thanh niên, Ban CLB Hội nhóm, CLB Marketing IMC", script: ["Kiến tạo", "thế hệ quản trị", "tiếp theo"] },
  en: { register: "Register now", more: "Learn more", audience: ["A competition", "for students", "nationwide"], organizers: "Organized by", season: "Season 1 theme", organizersAlt: "VNU International School, Youth Union, Clubs Board, IMC Marketing Club", script: ["Shaping", "the next generation", "of managers"] },
};

function Ctas({ lang, className = "", compact }: { lang: Lang; className?: string; compact?: boolean }) {
  const t = text[lang];
  const size = compact ? "px-4 py-2 text-sm" : "";
  return (
    <div className={`flex gap-3 ${className}`}>
      <Link href={localePath(lang, "/dang-ky/")} className={`btn-primary ${size} ${compact ? "w-full" : ""}`}>
        {t.register} <Icon name="arrowRight" className="h-4 w-4" />
      </Link>
      <Link href={localePath(lang, "/#gioi-thieu")} className={`${compact ? "btn-glass bg-navy-deep/30 w-full" : "btn-outline bg-white"} ${size}`}>
        {t.more} <Icon name="circleArrow" className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function Hero({ lang }: { lang: Lang }) {
  const { heroStats, site } = getContent(lang);
  const t = text[lang];
  return (
    <section id="top" className="relative bg-linear-to-b from-[#eef4fd] to-white pt-14 lg:bg-none lg:bg-white lg:pt-0">
      <h1 className="sr-only">
        {site.name} - {site.viName}
      </h1>

      <div className="relative aspect-video overflow-hidden lg:aspect-[1920/900]">
        {/* Di động: banner gốc đầy đủ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset("/images/banner.webp")}
          alt=""
          width={1920}
          height={1080}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover lg:hidden"
        />
        {/* Màn hình lớn: key visual góc rộng (sinh bằng Codex); dự phòng là banner gốc trên nền chính nó làm mờ */}
        <div className="absolute inset-0 hidden lg:block">
          <Art
            src="/images/generated/hero-wide.webp"
            className="absolute inset-0 h-full w-full object-cover object-[50%_42%]"
            fallback={
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset("/images/banner.webp")} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-90" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset("/images/banner.webp")}
                  alt=""
                  className="absolute top-[3%] left-[19%] w-[70%]"
                  style={{
                    maskImage:
                      "linear-gradient(180deg, transparent 0, transparent 13.5%, #000 21%, #000 80%, transparent 100%), linear-gradient(90deg, transparent 0, #000 16%, #000 86%, transparent 100%)",
                    maskComposite: "intersect",
                    WebkitMaskComposite: "source-in",
                  }}
                />
              </>
            }
          />
        </div>

        {/* Lớp phủ: tối dần về bên trái (chữ giới thiệu), phía trên (menu, logo) và góc phải (chữ viết tay) */}
        <div aria-hidden className="absolute inset-0 hidden bg-linear-to-r from-navy-deep/55 via-navy-deep/15 via-30% to-transparent to-50% lg:block" />
        <div aria-hidden className="absolute inset-x-0 top-0 hidden h-48 bg-linear-to-b from-navy-deep/60 to-transparent lg:block" />
        <div aria-hidden className="absolute top-0 right-0 hidden h-1/2 w-1/3 bg-[radial-gradient(ellipse_at_72%_50%,rgb(7_21_51/0.55),transparent_62%)] lg:block" />

        {/* Mép dưới cong như vành kính (asset sinh bằng Codex, dự phòng bằng SVG) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden lg:block">
          <Art
            src="/images/generated/wave-hero.webp"
            className="block h-auto w-full"
            fallback={
              <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="block h-[10vw] w-full" aria-hidden>
                <defs>
                  <linearGradient id="hero-rim" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#bfe0ff" stopOpacity="0" />
                    <stop offset="1" stopColor="#bfe0ff" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <path d="M0 40 C 380 150, 1060 150, 1440 40 V160 H0Z" fill="url(#hero-rim)" transform="translate(0 -14)" />
                <path d="M0 40 C 380 150, 1060 150, 1440 40 V160 H0Z" fill="#fff" />
              </svg>
            }
          />
        </div>

        {/* Khối giới thiệu bên trái: khung kính tối, đặt sát mép để không đè lên tiêu đề 3D */}
        <div className="absolute top-[30%] left-[3%] hidden w-[15.5rem] rounded-2xl bg-navy-deep/45 p-5 shadow-xl shadow-navy-deep/20 ring-1 ring-white/25 backdrop-blur-xl lg:block xl:left-[4%]">
          <p className="text-[1.25rem] leading-snug font-bold whitespace-nowrap text-white">
            {t.audience[0]}
            <br />
            {t.audience[1]}
            <br />
            {t.audience[2]}
          </p>
          <Ctas lang={lang} className="mt-4 flex-col gap-2" compact />
        </div>

        <div className="absolute inset-0 hidden lg:block">
          <div className="container-x relative h-full">
            {/* Đơn vị tổ chức */}
            <div className="absolute top-20 right-8 flex items-center gap-4 rounded-xl bg-navy-deep/55 px-4 py-1.5 shadow-lg shadow-navy-deep/20 ring-1 ring-white/25 backdrop-blur-xl">
              <span className="text-xs font-medium text-white/90">{t.organizers}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("/images/organizers.png")} alt={t.organizersAlt} className="h-8 w-auto" />
            </div>

            {/* Chữ viết tay bên phải */}
            <p
              aria-hidden
              className="absolute top-[25%] right-6 -rotate-[8deg] [text-shadow:0_2px_4px_rgb(7_21_51/0.6),0_4px_20px_rgb(7_21_51/0.5)] text-right font-script text-[clamp(2rem,2.4vw,2.7rem)] leading-[1.05] text-white xl:right-0"
            >
              {t.script[0]}
              <br />
              {t.script[1]}
              <br />
              {t.script[2]}
            </p>

            {/* Tiêu đề phụ đặt trong khung kính trên bục */}
            <div className="absolute top-[64%] left-1/2 w-max -translate-x-1/2 rounded-xl bg-navy-deep/45 px-7 py-2.5 text-center shadow-xl shadow-navy-deep/20 ring-1 ring-white/25 backdrop-blur-xl">
              <p className="text-[clamp(0.65rem,0.75vw,0.8rem)] font-semibold tracking-[0.22em] text-[#ffe2a3] uppercase">{t.season}</p>
              <p className="mt-0.5 text-[clamp(1.2rem,1.65vw,1.8rem)] leading-tight font-extrabold tracking-wide text-white uppercase">
                {site.themeEn}
              </p>
              <p className="mt-1 text-[clamp(0.75rem,0.9vw,0.95rem)] font-semibold tracking-[0.16em] text-white/85 uppercase">
                {lang === "en" ? site.slogan.join(" · ") : site.heroTitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bản di động: chữ đặt dưới ảnh */}
      <div className="container-x py-8 text-center lg:hidden">
        <p className="text-xs font-semibold tracking-[0.2em] text-orange-ink uppercase">{t.season}</p>
        <p className="mt-1 text-xl font-extrabold tracking-wide text-navy uppercase sm:text-2xl">{site.themeEn}</p>
        <p className="mt-1.5 text-xs font-semibold tracking-[0.08em] text-muted uppercase sm:text-sm">
          {lang === "en" ? site.slogan.join(" · ") : site.heroTitle}
        </p>
        <p className="mt-4 text-base text-muted">{t.audience.join(" ")}</p>
        <Ctas lang={lang} className="mt-6 flex-wrap justify-center" />
      </div>

      {/* Thẻ quyền lợi nổi lên khỏi mép banner */}
      <div className="container-x relative z-10 pb-4 lg:-mt-16">
        <ul className="grid grid-cols-2 gap-y-2 rounded-3xl bg-white p-3 shadow-2xl shadow-navy/15 ring-1 ring-line sm:p-4 lg:grid-cols-4">
          {heroStats.map((s, i) => (
            <li key={s.value} className={`flex items-center gap-3 px-2 py-2 sm:px-4 ${i > 0 ? "lg:border-l lg:border-line" : ""}`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff1e6] text-orange sm:h-14 sm:w-14">
                <Icon name={s.icon} className="h-6 w-6" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="text-[1.05rem] leading-tight font-bold text-navy sm:text-lg">{s.value}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted">{s.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
