import Eyebrow from "@/components/Eyebrow";
import { getContent } from "@/content";
import type { SponsorTier } from "@/content/site";
import type { Lang } from "@/lib/i18n";
import { asset } from "@/lib/paths";

const text = {
  vi: {
    eyebrow: "Nhà tài trợ",
    title: "Nhà tài trợ & doanh nghiệp đồng hành",
    altId: "doanh-nghiep-dong-hanh",
  },
  en: {
    eyebrow: "Sponsors",
    title: "Sponsors & partner companies",
    altId: "partner-companies",
  },
};

// Hạng cao hơn hiển thị logo lớn hơn; khung cố định để logo khác tỷ lệ vẫn thẳng hàng
const tierStyle: Record<SponsorTier, { box: string; label: string }> = {
  diamond: { box: "h-16 w-36 sm:h-20 sm:w-44", label: "text-navy" },
  gold: { box: "h-14 w-32 sm:h-16 sm:w-40", label: "text-amber-700" },
  silver: { box: "h-11 w-28 sm:h-12 sm:w-32", label: "text-slate-500" },
  companion: { box: "h-14 w-32 sm:h-16 sm:w-40", label: "text-orange-ink" },
};

export default function Sponsors({ lang }: { lang: Lang }) {
  const { sponsorTiers } = getContent(lang);
  const t = text[lang];
  const tiers = (sponsorTiers ?? []).filter((g) => g.items.length > 0);
  if (tiers.length === 0) return null;

  return (
    <section
      id="nha-tai-tro"
      aria-label={t.title}
      className="relative scroll-mt-24 bg-linear-to-b from-mist/70 to-white py-12 lg:py-16"
    >
      <div id={t.altId} className="container-x">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white px-4 py-8 shadow-card ring-1 ring-line sm:px-8 sm:py-10">
          <div>
            <Eyebrow>
              {t.eyebrow}
              <span aria-hidden className="h-px w-8 shrink-0 bg-current" />
            </Eyebrow>
            <h2 className="h2-section mt-2">{t.title}</h2>
          </div>

          <div className="mt-6 divide-y divide-line">
            {tiers.map((g) => {
              const s = tierStyle[g.tier];
              return (
                <div key={g.tier} className="py-6 first:pt-2 last:pb-0">
                  <h3 className={`text-center text-xs font-bold tracking-[0.18em] uppercase ${s.label}`}>{g.label}</h3>
                  <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-5 sm:gap-x-12">
                    {g.items.map((item) => (
                      <li key={item.name} className={`flex shrink-0 items-center justify-center ${s.box}`} title={item.name}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset(item.logo)}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="max-h-full max-w-full object-contain"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
