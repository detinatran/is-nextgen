import Link from "next/link";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import { buildSrcSet, HERO_BANNER } from "@/content/heroBanner";
import { type Lang, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";
import HeroSlider, { type NewsSlide } from "./HeroSlider";

const text = {
  vi: {
    register: "Vào thi",
    more: "Tìm hiểu thêm",
    audience: ["Cuộc thi", "dành cho sinh viên", "trên toàn quốc"],
  },
  en: {
    register: "Take the exam",
    more: "Learn more",
    audience: ["A competition", "for students", "nationwide"],
  },
};

function Ctas({
  lang,
  className = "",
  compact,
}: {
  lang: Lang;
  className?: string;
  compact?: boolean;
}) {
  const t = text[lang];
  const size = compact
    ? "px-5 py-2.5 text-sm whitespace-nowrap shadow-lg shadow-navy-deep/30"
    : "";
  return (
    <div className={`flex gap-3 ${className}`}>
      <Link href={localePath(lang, "/thi/")} className={`btn-primary ${size}`}>
        {t.register} <Icon name="arrowRight" className="h-4 w-4" />
      </Link>
      <Link
        href={localePath(lang, "/#gioi-thieu")}
        className={`${compact ? "btn-glass bg-navy-deep/40" : "btn-outline bg-white"} ${size}`}
      >
        {t.more} <Icon name="circleArrow" className="h-4 w-4" />
      </Link>
    </div>
  );
}

// Ảnh lớn hơn ảnh đại diện cho slide trang bìa (ảnh đại diện vài bài nhỏ hoặc quá dẹt)
const SLIDE_IMAGE: Record<string, string> = {
  giaoduc: "/images/news/giaoduc-1.webp",
  ttxvn: "/images/news/ttxvn-1.jpg",
  phunuvn: "/images/news/phunuvn.jpg",
  vtcnewsInterview: "/images/news/vtc-interview-1.webp",
  tcdn: "/images/news/tcdn.jpg",
  gtvhKt: "/images/news/gtvh-kt-1.jpg",
  gtvhCst: "/images/news/gtvh-cst.png",
};
const MAX_NEWS_SLIDES = 5;

export default function Hero({ lang }: { lang: Lang }) {
  const { heroStats, site, newsArticles } = getContent(lang);
  // Bài mới nhất trước; bài có toàn văn mở trong site, bài chỉ có tóm tắt mở bản gốc
  const news: NewsSlide[] = [...(newsArticles ?? [])]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, MAX_NEWS_SLIDES)
    .map((a) => ({
      id: a.id,
      href: a.hasFullText ? localePath(lang, `/tin-tuc/${a.slug}/`) : a.originalUrl,
      external: !a.hasFullText,
      image: SLIDE_IMAGE[a.id] ?? a.thumbnail,
      imageAlt: a.thumbnailAlt,
      source: a.source,
      sourceRole: a.sourceRole,
      date: a.publishedDateLabel,
      title: a.title,
      summary: a.summary,
    }));
  const t = text[lang];
  const { desktop, mobile, alt, bgColor } = HERO_BANNER;
  return (
    <section
      id="top"
      className="relative bg-linear-to-b from-[#eef4fd] to-white pt-16 lg:bg-none lg:bg-white lg:pt-[5.5rem]"
    >
      <h1 className="sr-only">
        {site.name} - {site.viName}
      </h1>

      {/* Trang bìa dạng slideshow: banner cuộc thi + các bài báo truyền thông */}
      <HeroSlider
        lang={lang}
        news={news}
        banner={
          <div className="relative w-full" style={{ backgroundColor: bgColor }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <picture className="block w-full">
              {mobile?.webp?.length ? (
                <source
                  media="(max-width: 639px)"
                  type="image/webp"
                  srcSet={buildSrcSet(mobile.webp, asset)}
                  sizes="100vw"
                  width={mobile.width}
                  height={mobile.height}
                />
              ) : null}
              {mobile ? (
                <source
                  media="(max-width: 639px)"
                  type="image/jpeg"
                  srcSet={
                    mobile.jpeg?.length
                      ? buildSrcSet(mobile.jpeg, asset)
                      : asset(mobile.fallbackSrc)
                  }
                  sizes="100vw"
                  width={mobile.width}
                  height={mobile.height}
                />
              ) : null}
              {desktop.webp?.length ? (
                <source
                  type="image/webp"
                  srcSet={buildSrcSet(desktop.webp, asset)}
                  sizes="100vw"
                  width={desktop.width}
                  height={desktop.height}
                />
              ) : null}
              {desktop.jpeg?.length ? (
                <source
                  type="image/jpeg"
                  srcSet={buildSrcSet(desktop.jpeg, asset)}
                  sizes="100vw"
                  width={desktop.width}
                  height={desktop.height}
                />
              ) : null}
              <img
                src={asset(desktop.fallbackSrc)}
                alt={alt[lang]}
                width={desktop.width}
                height={desktop.height}
                fetchPriority="high"
                decoding="async"
                style={
                  !mobile
                    ? { aspectRatio: `${desktop.width} / ${desktop.height}` }
                    : undefined
                }
                className="block h-auto w-full"
              />
            </picture>

            {/* Bấm vào banner để mở trang vào thi (đã qua giai đoạn đăng ký) */}
            <Link
              href={localePath(lang, "/thi/")}
              aria-label={t.register}
              className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-white"
            />
          </div>
        }
      />

      {/* Bản di động: chữ đặt dưới ảnh */}
      <div className="container-x py-8 text-center lg:hidden">
        <p className="text-xl font-extrabold tracking-wide text-navy uppercase sm:text-2xl">
          {site.themeEn}
        </p>
        <p className="mt-1.5 text-xs font-semibold tracking-[0.08em] text-muted uppercase sm:text-sm">
          {lang === "en" ? site.slogan.join(" · ") : site.heroTitle}
        </p>
        <p className="mt-4 text-base text-muted">{t.audience.join(" ")}</p>
        <Ctas lang={lang} className="mt-6 flex-wrap justify-center" />
      </div>

      {/* Thẻ quyền lợi ngay dưới banner */}
      <div className="container-x relative z-10 pt-6 pb-4 lg:pt-8">
        <ul className="grid grid-cols-2 auto-rows-fr gap-1.5 rounded-3xl bg-white p-2 shadow-2xl shadow-navy/15 ring-1 ring-line sm:gap-3 sm:p-4 lg:grid-cols-4 lg:gap-0">
          {heroStats.map((s, i) => (
            <li
              key={s.value}
              className={`flex h-full min-w-0 items-start gap-1.5 rounded-2xl px-1 py-2 min-[360px]:gap-2.5 min-[360px]:px-2 sm:gap-3 sm:px-3.5 sm:py-2.5 lg:rounded-none lg:px-4 ${i > 0 ? "lg:border-l lg:border-line" : ""}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff1e6] text-orange min-[360px]:h-9 min-[360px]:w-9 sm:h-12 sm:w-12">
                <Icon
                  name={s.icon}
                  className="h-4 w-4 min-[360px]:h-[18px] min-[360px]:w-[18px] sm:h-6 sm:w-6"
                  strokeWidth={1.9}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] leading-snug font-bold text-navy min-[360px]:text-sm sm:text-base xl:text-lg">
                  {s.value}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-muted sm:text-[13px]">
                  {s.label}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
