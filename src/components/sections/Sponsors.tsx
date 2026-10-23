"use client";

import { useEffect, useRef, useState } from "react";
import Eyebrow from "@/components/Eyebrow";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";
import { asset } from "@/lib/paths";

const MARQUEE_SPEED_PX_PER_SEC = 18;
const DEFAULT_SLOT_WIDTH_PX = 272;

const text = {
  vi: {
    eyebrow: "Nhà tài trợ",
    title: "Doanh nghiệp đồng hành",
    altId: "doanh-nghiep-dong-hanh",
    ariaRegion: "Danh sách doanh nghiệp đồng hành cùng NextGen Manager 2026",
  },
  en: {
    eyebrow: "Sponsors",
    title: "Partner Companies",
    altId: "partner-companies",
    ariaRegion: "Partner companies supporting NextGen Manager 2026",
  },
};

function getLogoClass(logo: string) {
  if (logo.includes("talentnet")) {
    return "h-11 w-auto max-w-[175px] object-contain sm:h-12 sm:max-w-[195px]";
  }
  if (logo.includes("vinpearl")) {
    return "h-14 w-auto max-w-[135px] object-contain sm:h-16 sm:max-w-[155px]";
  }
  if (logo.includes("tpbank")) {
    return "h-11 w-auto max-w-[170px] object-contain sm:h-12 sm:max-w-[190px]";
  }
  if (logo.includes("the-mentor")) {
    return "h-16 w-auto max-w-[125px] object-contain sm:h-20 sm:max-w-[145px]";
  }
  if (logo.includes("customized-learning-culture")) {
    return "h-14 w-auto max-w-[155px] object-contain sm:h-[68px] sm:max-w-[175px]";
  }
  return "h-14 w-auto max-w-[165px] object-contain";
}

export default function Sponsors({ lang }: { lang: Lang }) {
  const { partnerCompanies } = getContent(lang);
  const t = text[lang];
  const primaryListRef = useRef<HTMLUListElement>(null);

  const fallbackDuration = Number(
    (
      ((partnerCompanies?.length || 5) * DEFAULT_SLOT_WIDTH_PX) /
      MARQUEE_SPEED_PX_PER_SEC
    ).toFixed(2),
  );
  const [durationSec, setDurationSec] = useState<number>(fallbackDuration);

  useEffect(() => {
    const el = primaryListRef.current;
    if (!el) return;

    const updateDuration = () => {
      const distancePx = el.getBoundingClientRect().width;
      if (distancePx > 0) {
        setDurationSec(Number((distancePx / MARQUEE_SPEED_PX_PER_SEC).toFixed(2)));
      }
    };

    updateDuration();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateDuration);
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateDuration);
    return () => window.removeEventListener("resize", updateDuration);
  }, [partnerCompanies?.length]);

  if (!partnerCompanies || partnerCompanies.length === 0) return null;

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

          <div
            className="marquee mt-6 -mx-4 py-2 sm:-mx-6 lg:-mx-8"
            style={{ "--marquee-duration": `${durationSec}s` } as React.CSSProperties}
            role="region"
            aria-label={t.ariaRegion}
          >
            <div className="marquee-track items-center">
              {[0, 1].map((copy) => (
                <ul
                  key={copy}
                  ref={copy === 0 ? primaryListRef : undefined}
                  className={`flex shrink-0 items-center gap-12 pr-12 sm:gap-16 sm:pr-16 ${
                    copy === 1 ? "motion-reduce:hidden" : "motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-8 motion-reduce:px-4"
                  }`}
                  aria-hidden={copy === 1 || undefined}
                  inert={copy === 1 || undefined}
                >
                  {partnerCompanies.map((item) => (
                    <li
                      key={item.name}
                      className="flex shrink-0 items-center justify-center"
                    >
                      <div className="flex h-20 w-44 shrink-0 items-center justify-center sm:h-24 sm:w-52">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset(item.logo)}
                          alt={copy === 0 ? item.name : ""}
                          loading="eager"
                          decoding="async"
                          className={getLogoClass(item.logo)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
