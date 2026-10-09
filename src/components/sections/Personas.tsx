import Link from "next/link";
import Art from "@/components/Art";
import Carousel from "@/components/Carousel";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

const text = {
  vi: {
    title: ["Bạn có phải nhà quản trị", "chúng tôi đang tìm?"],
    lead: "Sáu chân dung năng lực được chấm ở cả bốn vòng thi. Bạn thấy mình trong chân dung nào?",
    more: "Xem khung năng lực",
    partners: "Đơn vị tổ chức & đồng hành",
    sponsor: "Trở thành nhà tài trợ",
    group: "Nhóm năng lực",
    every: "chấm ở cả bốn vòng",
    label: "Sáu nhóm năng lực",
  },
  en: {
    title: ["Are you the manager", "we are looking for?"],
    lead: "Six competency profiles, assessed in all four rounds. Which one sounds like you?",
    more: "See the framework",
    partners: "Organizers & partners",
    sponsor: "Become a sponsor",
    group: "Competency",
    every: "assessed in all four rounds",
    label: "Six competency areas",
  },
};

export default function Personas({ lang }: { lang: Lang }) {
  const { personas, partners, site } = getContent(lang);
  const t = text[lang];
  const sponsorHref = site.contact.sponsorDeck || (site.contact.email ? `mailto:${site.contact.email}` : "");
  return (
    <section id="dong-hanh" className="relative overflow-hidden bg-linear-to-b from-white to-mist/70 py-16 lg:py-20">
      <Art src="/images/generated/deco-blue-waves.webp" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="container-x relative">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="h2-section">
              {t.title[0]} <br className="hidden sm:block" />
              {t.title[1]}
            </h2>
            <p className="lead mt-3 max-w-xl">{t.lead}</p>
          </div>
          <Link
            href={localePath(lang, "/the-le/")}
            className="inline-flex items-center gap-2 rounded-full bg-white py-2 pr-2 pl-4 text-sm font-semibold text-navy shadow-sm ring-1 ring-line transition hover:shadow-md"
          >
            {t.more}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mist">
              <Icon name="arrowRight" className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
          </Link>
        </div>

        {/* Dải logo đơn vị tổ chức thật */}
        <div className="reveal mt-8 rounded-3xl bg-white/90 px-5 py-5 shadow-card ring-1 ring-line backdrop-blur-sm sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold tracking-wider text-muted uppercase">{t.partners}</p>
            {sponsorHref && (
              <a href={sponsorHref} className="inline-flex items-center gap-1 text-[13px] font-semibold text-orange-ink hover:gap-2">
                {t.sponsor} <Icon name="arrowRight" className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <ul className="mt-4 flex flex-wrap items-start justify-center gap-x-8 gap-y-5 sm:gap-x-14">
            {partners.map((p) => (
              <li key={p.name} className="flex w-28 flex-col items-center gap-1.5 text-center sm:w-36" title={p.name}>
                {p.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset(p.logo)} alt={p.name} className={`h-10 w-auto max-w-full object-contain ${p.ink ? "logo-ink" : ""}`} />
                ) : (
                  <Icon name="landmark" className="h-8 w-8 text-navy-soft" strokeWidth={1.5} />
                )}
                <span className="text-[11px] leading-tight font-medium text-muted">{p.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal mt-6 -mx-2">
          <Carousel lang={lang} label={t.label} slideClassName="w-full px-2 py-2 md:w-1/2 lg:w-1/3" dots>
            {personas.map((p, i) => (
              <article key={p.title} className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-card ring-1 ring-line">
                <div className="flex gap-4">
                  <Photo src={p.image} alt="" className="aspect-square w-24 shrink-0 rounded-2xl" imgClassName="object-[50%_20%]" />
                  <div>
                    <span aria-hidden className="block font-serif text-3xl leading-none font-bold text-orange">
                      ❝
                    </span>
                    <p className="mt-1 text-[15px] leading-relaxed text-navy">{p.body}</p>
                  </div>
                </div>
                <h3 className="mt-4 text-base font-bold text-navy">{p.title}</h3>
                <p className="mt-0.5 text-[13px] text-muted">
                  {t.group} {String(i + 1).padStart(2, "0")} · {t.every}
                </p>
              </article>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
