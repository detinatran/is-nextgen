import Link from "next/link";
import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";

const text = {
  vi: { eyebrow: "Về IS-NextGen Manager 2026", register: "Đăng ký ngay", more: "Tìm hiểu thêm", watch: "Xem video giới thiệu", alt: "Khu văn phòng hiện đại" },
  en: { eyebrow: "About IS-NextGen Manager 2026", register: "Register now", more: "Learn more", watch: "Watch the intro video", alt: "Modern office district" },
};

function VideoCard({ lang }: { lang: Lang }) {
  const { site } = getContent(lang);
  const t = text[lang];
  const photo = (
    <Photo
      src="/images/generated/about-city.webp"
      alt={t.alt}
      className="aspect-[4/3] w-full rounded-2xl shadow-card"
      imgClassName="transition duration-700 group-hover:scale-[1.03]"
    >
      {site.videoUrl && (
        <>
          <div aria-hidden className="absolute inset-0 bg-navy-deep/25" />
          <span className="absolute bottom-5 left-5 flex items-center gap-3 rounded-full bg-white py-2 pr-5 pl-2 text-sm font-semibold text-navy">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange text-white">
              <Icon name="play" className="ml-0.5 h-3.5 w-3.5" />
            </span>
            {t.watch}
          </span>
        </>
      )}
    </Photo>
  );
  return site.videoUrl ? (
    <a href={site.videoUrl} target="_blank" rel="noopener noreferrer" className="group block">
      {photo}
    </a>
  ) : (
    photo
  );
}

export default function About({ lang }: { lang: Lang }) {
  const { about } = getContent(lang);
  const t = text[lang];
  return (
    <section id="gioi-thieu" className="relative overflow-hidden bg-white pt-16 pb-20 lg:pt-20">
      <Art src="/images/generated/deco-blue-waves.webp" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45" />
      <div className="container-x relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div className="reveal">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h2 className="h2-section mt-4">
              {about.title[0]} {about.title[1]}
              <span className="text-gradient-orange">{about.title[2]}</span>
            </h2>
            <p className="lead mt-4 max-w-xl">{about.body}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={localePath(lang, "/dang-ky/")} className="btn-primary">
                {t.register} <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link href={localePath(lang, "/the-le/")} className="btn-outline">
                {t.more}
              </Link>
            </div>
          </div>
          <div className="reveal" style={{ "--delay": "120ms" } as React.CSSProperties}>
            <VideoCard lang={lang} />
          </div>
        </div>

        <ol className="mt-16 grid gap-x-8 gap-y-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {about.features.map((f, i) => (
            <li key={f.title} className="reveal" style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}>
              <span className="text-[1.75rem] leading-none font-bold text-orange tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 text-lg leading-snug font-bold text-navy">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
