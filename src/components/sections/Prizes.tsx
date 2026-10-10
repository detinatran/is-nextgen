import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";

const text = {
  vi: {
    eyebrow: "Giải thưởng",
    total: "Cơ cấu giải thưởng",
    lead: "Giá trị nghề nghiệp là chính: cơ hội thực tập, vé vào thẳng vòng phỏng vấn cuối chương trình quản trị viên tập sự, cùng giấy chứng nhận và kỷ niệm chương.",
    everyone: "Cho mọi thí sinh vòng trong",
    forEveryone: [
      "Giấy chứng nhận tham dự vòng trong",
      "Báo cáo năng lực cá nhân bản điện tử: điểm mạnh, điểm cần cải thiện và gợi ý phát triển",
    ],
  },
  en: {
    eyebrow: "Prizes",
    total: "Prize structure",
    lead: "The real value is your career: internship opportunities, a fast track to the final interview of a management trainee program, plus certificates and commemorative medals.",
    everyone: "For every contestant past round 1",
    forEveryone: [
      "A certificate of participation in the advanced rounds",
      "A personal digital competency report: strengths, areas to improve and development suggestions",
    ],
  },
};

export default function Prizes({ lang }: { lang: Lang }) {
  const { minorPrizes, prizes } = getContent(lang);
  const t = text[lang];
  return (
    <section id="giai-thuong" className="bg-linear-to-b from-white via-cream to-white py-16 lg:py-24">
      <div className="container-x">
        <div className="reveal max-w-3xl">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 className="h2-section mt-4">
            {t.total}
          </h2>
          <p className="lead mt-4">
            {t.lead}
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-card sm:grid-cols-2">
            {prizes.map((p, i) => (
              <li
                key={p.rank}
                className="reveal group relative bg-white p-6 transition-colors duration-300 hover:bg-cream"
                style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}
              >
                {/* Vạch cam chạy ra khi rê chuột */}
                <span aria-hidden className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-orange transition-transform duration-300 group-hover:scale-x-100" />
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-semibold text-navy">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cream text-orange-ink transition duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-orange group-hover:text-white">
                    <Icon name={p.icon} className="h-4 w-4" strokeWidth={2} />
                  </span>
                  {p.rank}
                  <span className="font-normal text-muted">· {p.qty}</span>
                </p>
                <ul className="mt-3 space-y-1">
                  {p.perks.map((perk) => (
                    <li key={perk} className="text-[15px] leading-snug text-muted">
                      {perk}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <aside className="reveal group flex flex-col rounded-2xl border border-gold/30 bg-linear-to-b from-[#fff4dc] via-white to-white p-7 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gold/20" style={{ "--delay": "150ms" } as React.CSSProperties}>
            <Art src="/images/generated/trophy.webp" className="mx-auto -mt-2 mb-4 w-56 object-contain transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105" />
            <p className="text-sm font-semibold tracking-[0.14em] text-orange-ink uppercase">{t.everyone}</p>
            <ul className="mt-5 space-y-4">
              {t.forEveryone.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                  <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-orange" strokeWidth={2.4} />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-auto border-t border-line pt-5 text-[15px] leading-relaxed text-muted">{minorPrizes}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
