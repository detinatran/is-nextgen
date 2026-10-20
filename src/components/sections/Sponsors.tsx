import Eyebrow from "@/components/Eyebrow";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";
import { asset } from "@/lib/paths";

const text = {
  vi: {
    eyebrow: "Nhà tài trợ",
    title: "Doanh nghiệp đồng hành",
    altId: "doanh-nghiep-dong-hanh",
  },
  en: {
    eyebrow: "Sponsors",
    title: "Partner Companies",
    altId: "partner-companies",
  },
};

export default function Sponsors({ lang }: { lang: Lang }) {
  const { partnerCompanies } = getContent(lang);
  const t = text[lang];

  if (!partnerCompanies || partnerCompanies.length === 0) return null;

  return (
    <section
      id="nha-tai-tro"
      aria-label={t.title}
      className="relative bg-linear-to-b from-mist/70 to-white py-12 lg:py-16"
    >
      <div id={t.altId} className="container-x">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white px-5 py-8 shadow-card ring-1 ring-line sm:px-10 sm:py-10">
          <div className="text-center">
            <Eyebrow className="justify-center">
              {t.eyebrow}
              <span aria-hidden className="h-px w-8 shrink-0 bg-current" />
            </Eyebrow>
            <h2 className="h2-section mt-3">{t.title}</h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            {partnerCompanies.map((item) => {
              const isTalentnet = item.logo.includes("talentnet");
              const isTpbank = item.logo.includes("tpbank");
              return (
                <div
                  key={item.name}
                  className="flex flex-col items-center justify-between rounded-2xl bg-mist/35 px-6 py-6 text-center ring-1 ring-line/80 sm:last:col-span-2 sm:last:mx-auto sm:last:w-full sm:last:max-w-[calc(50%-0.75rem)] lg:last:col-span-1 lg:last:max-w-none"
                >
                  <div className="flex h-28 w-full items-center justify-center sm:h-32">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset(item.logo)}
                      alt={`Logo ${item.name}`}
                      width={isTalentnet ? 230 : isTpbank ? 240 : 190}
                      height={112}
                      className={
                        isTalentnet
                          ? "max-h-14 w-auto max-w-[220px] object-contain sm:max-h-16 sm:max-w-[230px]"
                          : isTpbank
                            ? "max-h-16 w-auto max-w-[230px] object-contain sm:max-h-20 sm:max-w-[240px]"
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
