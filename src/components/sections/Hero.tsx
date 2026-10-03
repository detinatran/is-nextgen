import Link from "next/link";
import Art from "@/components/Art";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

const text = {
  vi: { register: "Đăng ký ngay", more: "Tìm hiểu thêm", heroAlt: "Bốn nhà quản trị trẻ nhìn về phía trước bên bờ sông thành phố" },
  en: { register: "Register now", more: "Learn more", heroAlt: "Four young managers looking ahead by a city riverfront" },
};

export default function Hero({ lang }: { lang: Lang }) {
  const { hero, heroStats, site } = getContent(lang);
  const t = text[lang];
  return (
    <section id="top" className="relative bg-white">
      <h1 className="sr-only">
        {site.name} - {hero.theme}
      </h1>

      <div className="relative min-h-[34rem] overflow-hidden sm:min-h-[36rem] lg:min-h-[40rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset("/images/generated/hero-team.webp")}
          alt={t.heroAlt}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[72%_center] lg:object-[60%_center]"
        />
        {/* Phủ xanh đậm phía trái để chữ trắng nổi; di động phủ toàn khung */}
        <div aria-hidden className="absolute inset-0 bg-linear-to-r from-[#0b2a6b]/90 via-[#1a4fb8]/55 to-transparent lg:via-[#1a4fb8]/35 lg:to-55%" />
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-[#0b2a6b]/70 via-transparent to-[#0b2a6b]/40 lg:from-transparent" />

        {/* Chữ viết tay bên phải */}
        <div aria-hidden className="absolute top-[4.5rem] right-[2.5%] hidden -rotate-6 xl:block">
          <p className="text-right font-script text-[2.1rem] leading-[1.05] text-white [text-shadow:0_2px_12px_rgb(7_21_51/0.45)]">
            Young Talent
            <br />
            &nbsp;&nbsp;Real Impact
          </p>
          <svg viewBox="0 0 220 40" className="mt-1 ml-auto h-8 w-52 text-orange" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M6 30c50-14 110-20 196-12" />
            <path d="M190 9l14 9-15 8" />
          </svg>
        </div>

        <div className="container-x relative flex min-h-[inherit] flex-col justify-center pt-24 pb-28 lg:pb-36">
          <div className="max-w-xl text-white">
            <p className="text-[13px] font-bold tracking-[0.18em] text-[#ffb074] uppercase">{hero.eyebrow}</p>
            <p className="mt-3 text-[2.6rem] leading-[1.02] font-extrabold tracking-tight sm:text-[3.4rem] lg:text-[3.9rem]">
              <span className="block text-white [text-shadow:0_4px_24px_rgb(7_21_51/0.35)]">{hero.title[0]}</span>
              <span className="block bg-linear-to-r from-[#ffb057] to-orange bg-clip-text text-transparent">{hero.title[1]}</span>
            </p>
            <p className="mt-4 text-lg font-bold tracking-wide uppercase sm:text-xl">{hero.theme}</p>
            <p className="mt-1.5 text-[15px] text-white/85 sm:text-base">{hero.tagline}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={localePath(lang, "/dang-ky/")} className="btn-primary px-7 py-3.5 text-base">
                {t.register} <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link href={localePath(lang, "/#gioi-thieu")} className="btn-glass px-7 py-3.5 text-base">
                {t.more}
              </Link>
            </div>
          </div>
        </div>

        {/* Mép dưới cong như vành kính */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <Art src="/images/generated/wave-hero.webp" className="block h-auto w-full" />
        </div>
      </div>

      {/* Thẻ quyền lợi nổi lên khỏi mép ảnh */}
      <div className="container-x relative z-10 -mt-16 sm:-mt-20">
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
