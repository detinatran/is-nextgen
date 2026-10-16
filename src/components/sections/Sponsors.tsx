import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";
import { asset } from "@/lib/paths";

const text = {
  vi: {
    id: "doanh-nghiep-dong-hanh",
    title: "Doanh nghiệp đồng hành",
  },
  en: {
    id: "partner-companies",
    title: "Partner Companies",
  },
};

export default function Sponsors({ lang }: { lang: Lang }) {
  const { partnerCompanies } = getContent(lang);
  const t = text[lang];

  if (!partnerCompanies || partnerCompanies.length === 0) return null;

  return (
    <section
      id={t.id}
      aria-label={t.title}
      className="reveal mt-4 rounded-3xl bg-white/90 px-5 py-5 shadow-card ring-1 ring-line backdrop-blur-sm sm:px-8 sm:py-6"
    >
      <h3 className="text-center text-xs font-semibold tracking-wider text-muted uppercase">
        {t.title}
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {partnerCompanies.map((item) => {
          const isHorizontal = item.logo.includes("talentnet");
          return (
            <div
              key={item.name}
              className="flex flex-col items-center justify-between rounded-2xl bg-white px-5 py-4 text-center ring-1 ring-line/80 sm:px-6 sm:py-5"
            >
              <div className="flex h-22 w-full items-center justify-center sm:h-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset(item.logo)}
                  alt={`Logo ${item.name}`}
                  width={isHorizontal ? 220 : 168}
                  height={96}
                  className={
                    isHorizontal
                      ? "max-h-12 w-auto max-w-[200px] object-contain sm:max-h-14 sm:max-w-[220px]"
                      : "max-h-20 w-auto max-w-[160px] object-contain sm:max-h-24 sm:max-w-[180px]"
                  }
                />
              </div>
              <p className="mt-3 text-sm leading-snug font-medium text-navy sm:text-[15px]">
                {item.name}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
