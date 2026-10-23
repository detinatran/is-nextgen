"use client";

import { useState } from "react";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";
import { asset } from "@/lib/paths";

const text = {
  vi: {
    eyebrow: "Nhà tài trợ",
    title: "Doanh nghiệp đồng hành",
    altId: "doanh-nghiep-dong-hanh",
    pause: "Tạm dừng chạy logo",
    resume: "Tiếp tục chạy logo",
    pauseLabel: "Tạm dừng",
    resumeLabel: "Tiếp tục",
    ariaRegion: "Danh sách doanh nghiệp đồng hành cùng NextGen Manager 2026",
  },
  en: {
    eyebrow: "Sponsors",
    title: "Partner Companies",
    altId: "partner-companies",
    pause: "Pause logo carousel",
    resume: "Resume logo carousel",
    pauseLabel: "Pause",
    resumeLabel: "Play",
    ariaRegion: "Partner companies supporting NextGen Manager 2026",
  },
};

function getLogoClass(logo: string) {
  if (logo.includes("talentnet")) {
    return "max-h-12 w-auto max-w-[170px] object-contain sm:max-h-14 sm:max-w-[190px]";
  }
  if (logo.includes("vinpearl")) {
    return "max-h-12 w-auto max-w-[130px] object-contain sm:max-h-14 sm:max-w-[150px]";
  }
  if (logo.includes("tpbank")) {
    return "max-h-12 w-auto max-w-[170px] object-contain sm:max-h-14 sm:max-w-[190px]";
  }
  if (logo.includes("the-mentor")) {
    return "max-h-14 w-auto max-w-[110px] object-contain sm:max-h-16 sm:max-w-[125px]";
  }
  if (logo.includes("customized-learning-culture")) {
    return "max-h-11 w-auto max-w-[145px] object-contain sm:max-h-13 sm:max-w-[160px]";
  }
  return "max-h-14 w-auto max-w-[160px] object-contain";
}

export default function Sponsors({ lang }: { lang: Lang }) {
  const { partnerCompanies } = getContent(lang);
  const t = text[lang];
  const [isPaused, setIsPaused] = useState(false);

  if (!partnerCompanies || partnerCompanies.length === 0) return null;

  // Duplicate the list so each set covers wide viewports (up to 2560px) without gaps
  const baseItems = partnerCompanies;
  const loopSet = [...baseItems, ...baseItems];

  return (
    <section
      id="nha-tai-tro"
      aria-label={t.title}
      className="relative scroll-mt-24 bg-linear-to-b from-mist/70 to-white py-12 lg:py-16"
    >
      <div id={t.altId} className="container-x">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white px-4 py-8 shadow-card ring-1 ring-line sm:px-8 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>
                {t.eyebrow}
                <span aria-hidden className="h-px w-8 shrink-0 bg-current" />
              </Eyebrow>
              <h2 className="h2-section mt-2">{t.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={isPaused ? t.resume : t.pause}
                aria-pressed={isPaused}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-navy/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy shadow-xs transition hover:border-navy/30 hover:bg-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Icon
                  name={isPaused ? "play" : "pause"}
                  className="h-3.5 w-3.5 text-orange-ink"
                />
                <span>{isPaused ? t.resumeLabel : t.pauseLabel}</span>
              </button>
            </div>
          </div>

          <div
            className="marquee mt-8 -mx-4 py-2 sm:-mx-6 sm:px-2 lg:-mx-8"
            style={{ "--marquee-duration": "36s" } as React.CSSProperties}
            role="region"
            aria-label={t.ariaRegion}
          >
            <div
              className="marquee-track flex items-center gap-6"
              style={{ animationPlayState: isPaused ? "paused" : undefined }}
            >
              {/* Primary list: accessible to screen readers and keyboard navigation */}
              <ul className="flex shrink-0 items-center gap-6">
                {loopSet.map((item, idx) => (
                  <li key={`${item.name}-${idx}`} className="shrink-0">
                    <div className="flex h-24 w-52 shrink-0 items-center justify-center rounded-2xl bg-mist/35 px-5 py-3 shadow-xs ring-1 ring-line/80 transition hover:shadow-md hover:ring-brand/30 sm:h-28 sm:w-60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset(item.logo)}
                        alt={`Logo ${item.name}`}
                        loading="lazy"
                        className={getLogoClass(item.logo)}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              {/* Duplicate list: hidden from assistive technology for a smooth seamless loop */}
              <ul
                className="flex shrink-0 items-center gap-6"
                aria-hidden="true"
                inert
              >
                {loopSet.map((item, idx) => (
                  <li key={`clone-${item.name}-${idx}`} className="shrink-0">
                    <div className="flex h-24 w-52 shrink-0 items-center justify-center rounded-2xl bg-mist/35 px-5 py-3 shadow-xs ring-1 ring-line/80 transition sm:h-28 sm:w-60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset(item.logo)}
                        alt=""
                        loading="lazy"
                        className={getLogoClass(item.logo)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
