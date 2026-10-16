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
    <section id={t.id} className="relative bg-linear-to-b from-mist/70 to-white py-12 lg:py-16">
      <div className="container-x">
        <div className="reveal mx-auto max-w-4xl rounded-3xl bg-white px-6 py-8 shadow-card ring-1 ring-line sm:px-10 sm:py-10">
          <h2 className="text-center text-xl font-bold text-navy sm:text-2xl">{t.title}</h2>
          <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            {partnerCompanies.map((item) => {
              const isHorizontal = item.logo.includes("talentnet");
              return (
                <div
                  key={item.name}
                  className="flex flex-col items-center justify-between rounded-2xl bg-mist/40 px-6 py-6 text-center ring-1 ring-line/80"
                >
                  <div className="flex h-24 w-full items-center justify-center sm:h-28">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset(item.logo)}
                      alt={`Logo ${item.name}`}
                      width={isHorizontal ? 240 : 180}
                      height={112}
                      className={
                        isHorizontal
                          ? "max-h-14 w-auto max-w-[220px] object-contain sm:max-h-16 sm:max-w-[240px]"
                          : "max-h-24 w-auto max-w-[180px] object-contain sm:max-h-28 sm:max-w-[200px]"
                      }
                    />
                  </div>
                  <p className="mt-4 text-[15px] leading-snug font-semibold text-navy sm:text-base">
                    {item.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
