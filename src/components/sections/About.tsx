import Link from "next/link";
import Art from "@/components/Art";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";

const text = {
  vi: { eyebrow: "Điểm nhấn cuộc thi", rules: "Tìm hiểu thể lệ", register: "Đăng ký ngay", watch: "Xem video", alt: "Khu văn phòng hiện đại", round: "Vòng" },
  en: { eyebrow: "Competition highlights", rules: "Read the rules", register: "Register now", watch: "Watch video", alt: "Modern office district", round: "Round" },
};

export default function About({ lang }: { lang: Lang }) {
  const { about, rounds, site } = getContent(lang);
  const t = text[lang];
  return (
    <section id="gioi-thieu" className="relative overflow-hidden bg-white py-16 lg:py-20">
      <Art src="/images/generated/deco-blue-waves.webp" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="container-x relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div data-tour="about" className="reveal">
            <p className="text-[13px] font-bold tracking-[0.16em] text-orange uppercase">{t.eyebrow}</p>
            <h2 className="h2-section mt-3">
              {about.title[0]} {about.title[1]}
              <span className="text-orange">{about.title[2]}</span>
            </h2>
            <p className="lead mt-4">{about.body}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={localePath(lang, "/the-le/")} className="btn-primary">
                {t.rules} <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              {site.videoUrl ? (
                <a href={site.videoUrl} target="_blank" rel="noopener noreferrer" className="btn bg-white text-navy shadow-sm ring-1 ring-line hover:shadow-md">
                  <Icon name="play" className="h-4 w-4 text-brand" /> {t.watch}
                </a>
              ) : (
                <Link href={localePath(lang, "/dang-ky/")} className="btn bg-white text-navy shadow-sm ring-1 ring-line hover:shadow-md">
                  {t.register}
                </Link>
              )}
            </div>
          </div>
          <div className="reveal" style={{ "--delay": "120ms" } as React.CSSProperties}>
            <Photo src="/images/photos/about-city.webp" alt={t.alt} className="aspect-[16/10] rounded-3xl shadow-2xl shadow-navy/15" />
          </div>
        </div>

        {/* Tiến trình 04 vòng thi: số tròn cam nối bằng một đường */}
        <ol className="tl reveal mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {rounds.map((r, i) => (
            <li key={r.no} style={{ "--i": i } as React.CSSProperties}>
              <Link href={localePath(lang, `/the-le/#vong-${i + 1}`)} className="group block">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-orange bg-white text-sm font-bold text-orange transition group-hover:bg-orange group-hover:text-white">
                    {r.no}
                  </span>
                  <span className="tl-line h-0.5 flex-1 rounded-full bg-linear-to-r from-orange/70 to-line" />
                </div>
                <p className="mt-3 text-xs font-semibold tracking-wider text-orange uppercase">
                  {t.round} {r.no}
                </p>
                <h3 className="mt-0.5 text-[17px] font-bold text-navy transition group-hover:text-orange-ink">{r.step}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{r.short}</p>
                <p className="mt-1 text-[13px] font-medium text-navy/70">{r.funnel}</p>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
