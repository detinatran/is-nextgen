import PageHero from "@/components/PageHero";
import Results from "@/components/Results";
import SiteShell from "@/components/SiteShell";
import type { Lang } from "@/lib/i18n";

export const resultsText = {
  vi: { eyebrow: "Kết quả", title: "Công bố theo từng vòng", lead: "Kết quả được cập nhật tại đây sau mỗi vòng thi và gửi qua email tới từng thí sinh." },
  en: { eyebrow: "Results", title: "Announced round by round", lead: "Results are posted here after each round and emailed to every contestant." },
};

export default function ResultsPage({ lang }: { lang: Lang }) {
  const t = resultsText[lang];
  return (
    <SiteShell lang={lang}>
      <PageHero lang={lang} eyebrow={t.eyebrow} title={t.title} lead={t.lead} />
      <div className="container-x py-16 lg:py-20">
        <Results lang={lang} />
      </div>
    </SiteShell>
  );
}
