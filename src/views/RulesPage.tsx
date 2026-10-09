import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { getContent } from "@/content";
import { type IconName } from "@/components/Icon";
import { type Lang, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

export const rulesText = {
  vi: {
    heroEyebrow: "Thể lệ cuộc thi",
    heroTitle: "Thể lệ",
    heroLead: "Bốn vòng thi, một khung sáu năng lực. Mọi vòng đều có tiêu chí và thang điểm công bố trước.",
    whoEyebrow: "Đối tượng",
    whoTitle: "Ai được tham gia?",
    formatEyebrow: "Thể thức",
    formatTitle: "Bốn vòng thi",
    compEyebrow: "Khung năng lực",
    compTitle: "Sáu nhóm năng lực được chấm",
    compLead:
      "Mỗi nhóm được mô tả bằng 05 mức hành vi quan sát được. Giám khảo ghi nhận hành vi cụ thể, sau đó quy đổi ra điểm theo bảng quy đổi thống nhất.",
    aiEyebrow: "Vòng Bán kết và Chung kết",
    aiTitle: "Được dùng AI, nhưng phải giải trình",
    aiBody:
      "Khai báo bạn đã dùng công cụ như thế nào, phần nào là kết quả của công cụ, phần nào là phán đoán của bạn, và vì sao giữ hay bác bỏ từng gợi ý. Điểm số tập trung vào phần giải trình.",
    judgingEyebrow: "Nguyên tắc chấm thi",
    sideEyebrow: "Hoạt động bên lề",
    sideTitle: "Gặp doanh nghiệp trước khi bước vào nghề",
    when: "Thời gian:",
    who: "Thành phần:",
    timelineEyebrow: "Lộ trình",
    timelineTitle: "Lịch đầy đủ mùa I",
    voteEyebrow: "Giải phụ",
    voteTitle: "Thể lệ bình chọn Đội thi được yêu thích nhất",
    faqEyebrow: "Hỏi đáp",
    faqTitle: "Câu hỏi khác",
    register: "Đăng ký dự thi",
  },
  en: {
    heroEyebrow: "Competition rules",
    heroTitle: "Rules",
    heroLead: "Four rounds, one six-competency framework. Every round has criteria and scoring published in advance.",
    whoEyebrow: "Eligibility",
    whoTitle: "Who can take part?",
    formatEyebrow: "Format",
    formatTitle: "Four rounds",
    compEyebrow: "Competency framework",
    compTitle: "Six competency areas assessed",
    compLead:
      "Each area is described by 05 levels of observable behaviour. Judges record specific behaviours, then convert them into scores using a shared conversion table.",
    aiEyebrow: "Semi-final and Grand Final",
    aiTitle: "AI is allowed, but you must explain it",
    aiBody:
      "State how you used each tool, which parts came from the tool and which from your own judgement, and why you kept or rejected each suggestion. Scoring focuses on that explanation.",
    judgingEyebrow: "Judging principles",
    sideEyebrow: "Side events",
    sideTitle: "Meet employers before you start your career",
    when: "When:",
    who: "Who:",
    timelineEyebrow: "Roadmap",
    timelineTitle: "Full Season I schedule",
    voteEyebrow: "Special award",
    voteTitle: "Fan Favorite Team voting rules",
    faqEyebrow: "Q&A",
    faqTitle: "More questions",
    register: "Register to compete",
  },
};

// Tông màu 4 vòng (xanh lá, xanh dương, cam, đỏ gạch) và 6 nhóm năng lực, theo ảnh tham chiếu
const roundTones = [
  { card: "border-[#cfe3c0] bg-[#f4f9ef]", badge: "bg-[#5b8a3a]", ink: "text-[#4a7a2c]" },
  { card: "border-[#c9dbf6] bg-[#eff5fe]", badge: "bg-[#2f6bf0]", ink: "text-[#2557c9]" },
  { card: "border-[#f5d7b4] bg-[#fdf5ea]", badge: "bg-[#ef8a1f]", ink: "text-[#c2620f]" },
  { card: "border-[#f1cdc4] bg-[#fdf1ee]", badge: "bg-[#b8432f]", ink: "text-[#a63a28]" },
];
const compTones = ["#f26b1d", "#5b8a3a", "#2f6bf0", "#7c4ddb", "#e0513e", "#1f9aa8"];
const compIcons: IconName[] = ["fileChart", "target", "usersGroup", "handshake", "landmark", "presentation"];

const img = (name: string) => asset(`/images/rules/${name}.webp`);

function Block({ id, eyebrow, title, aside, children }: { id?: string; eyebrow: string; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="reveal relative scroll-mt-28">
      <div className="flex items-end justify-between gap-6">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="h2-section mt-4">{title}</h2>
        </div>
        {aside}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function RulesPage({ lang }: { lang: Lang }) {
  const { competencies, eligibility, eligibilityNote, judgingRules, moreFaqs, roundIcons, rounds, sideEvents, timeline, votingRules } =
    getContent(lang);
  const t = rulesText[lang];
  return (
    <SiteShell lang={lang}>
      <PageHero
        lang={lang}
        eyebrow={t.heroEyebrow}
        title={t.heroTitle}
        lead={t.heroLead}
      />

      <div className="relative overflow-hidden bg-[#fbf8f2]">
        <div className="container-x space-y-24 py-16 lg:py-24">
          <Block eyebrow={t.whoEyebrow} title={t.whoTitle}>
            <div className="grid items-center gap-8 lg:grid-cols-[1.25fr_1fr_0.9fr]">
              <ul className="space-y-4">
                {eligibility.map((e) => (
                  <li key={e} className="flex gap-3 text-base text-ink">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5b8a3a] text-white">
                      <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    {e}
                  </li>
                ))}
              </ul>
              <figure className="relative -rotate-2 rounded-sm bg-[#fffdf7] p-7 pt-9 shadow-[0_10px_30px_-12px_rgb(11_31_77/0.35)] ring-1 ring-[#eadfca]">
                <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2 bg-[#e9dcc0]/80" />
                <Icon name="messages" className="h-6 w-6 text-orange" />
                <p className="mt-3 text-[15px] leading-relaxed text-navy italic">{eligibilityNote}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img("leaves")} alt="" aria-hidden className="absolute -right-6 -bottom-8 w-24 rotate-12" />
              </figure>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img("campus")} alt="" aria-hidden className="mx-auto w-full max-w-xs" />
              </div>
            </div>
          </Block>

          <Block eyebrow={t.formatEyebrow} title={t.formatTitle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img("mountains")} alt="" aria-hidden className="pointer-events-none absolute inset-x-0 top-24 -z-0 w-full opacity-40" />
            <div className="relative grid gap-5 pt-4 md:grid-cols-2 xl:grid-cols-4">
              {rounds.map((r, i) => {
                const tone = roundTones[i % roundTones.length];
                return (
                  <article id={`vong-${i + 1}`} key={r.no} className={`relative scroll-mt-28 rounded-2xl border-2 p-6 pt-9 shadow-[0_12px_30px_-18px_rgb(11_31_77/0.4)] ${tone.card}`}>
                    <span className={`absolute -top-5 left-6 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ring-4 ring-[#fbf8f2] ${tone.badge}`}>{r.no}</span>
                    <div className="text-center">
                      <Icon name={roundIcons[i]} className={`mx-auto h-9 w-9 ${tone.ink}`} strokeWidth={1.6} />
                      <p className={`mt-3 text-sm font-bold tracking-wider uppercase ${tone.ink}`}>{r.step}</p>
                      <h3 className="mt-1 text-lg leading-snug font-bold text-navy">{r.name}</h3>
                      <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[12px] font-semibold">
                        <span className="rounded-full border border-current/30 bg-white/70 px-2.5 py-0.5 text-navy">{r.format}</span>
                        <span className="rounded-full border border-current/30 bg-white/70 px-2.5 py-0.5 text-navy">{r.duration}</span>
                        <span className={`rounded-full bg-white/70 px-2.5 py-0.5 ${tone.ink}`}>{r.funnel}</span>
                      </div>
                    </div>
                    <p className="mt-4 text-[14px] leading-relaxed text-muted">{r.body}</p>
                  </article>
                );
              })}
            </div>
          </Block>

          <Block eyebrow={t.compEyebrow} title={t.compTitle}>
            <p className="-mt-2 mb-10 max-w-3xl text-muted">{t.compLead}</p>
            <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {competencies.map((c, i) => (
                <li key={c.name} className="text-center xl:border-r xl:border-dashed xl:border-line xl:pr-6 xl:last:border-r-0 xl:last:pr-0">
                  <span
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full ring-4 ring-offset-4 ring-offset-[#fbf8f2]"
                    style={{ background: compTones[i], ["--tw-ring-color" as string]: `${compTones[i]}33` }}
                  >
                    <Icon name={compIcons[i]} className="h-9 w-9 text-white" strokeWidth={1.7} />
                  </span>
                  <p className="mt-4 text-lg font-extrabold" style={{ color: compTones[i] }}>
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 font-bold text-navy">{c.name}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{c.body}</p>
                </li>
              ))}
            </ol>
          </Block>

          <section className="reveal relative grid overflow-hidden rounded-3xl bg-navy text-white shadow-[0_30px_60px_-30px_rgb(11_31_77/0.6)] lg:grid-cols-[1.1fr_1fr]">
            <div className="relative z-10 p-8 sm:p-12">
              <Eyebrow light>{t.aiEyebrow}</Eyebrow>
              <h2 className="mt-3 text-3xl leading-tight font-bold sm:text-4xl">{t.aiTitle}</h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90">{t.aiBody}</p>
              <p className="mt-8 text-sm font-bold tracking-wider text-gold uppercase">{t.judgingEyebrow}</p>
              <ul className="mt-3 space-y-2.5">
                {judgingRules.map((rule) => (
                  <li key={rule} className="flex gap-3 text-[15px] leading-relaxed text-white/90">
                    <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-orange" strokeWidth={2.4} />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative min-h-72 lg:min-h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("/images/photos/hero-team.webp")} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[60%_center] lg:[clip-path:polygon(8%_0,100%_0,100%_100%,0_100%)]" />
            </div>
          </section>

          <Block id="ben-le" eyebrow={t.sideEyebrow} title={t.sideTitle}>
            <div className="grid gap-6 lg:grid-cols-2">
              {sideEvents.map((e, i) => (
                <article key={e.tag} className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_30px_-18px_rgb(11_31_77/0.4)] ring-1 ring-[#eadfca]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(`/images/generated/${i === 0 ? "hl-trip" : "hl-dinner"}.webp`)} alt="" aria-hidden className="h-48 w-full object-cover" />
                  <div className="p-6 sm:p-7">
                    <p className="text-sm font-bold tracking-wider text-orange-ink uppercase">{e.tag}</p>
                    <h3 className="mt-2 text-xl font-bold text-navy">{e.title}</h3>
                    <dl className="mt-4 space-y-1 text-[15px]">
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-semibold text-navy">{t.when}</dt>
                        <dd className="text-muted">{e.when}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-semibold text-navy">{t.who}</dt>
                        <dd className="text-muted">{e.who}</dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-[15px] leading-relaxed text-muted">{e.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </Block>

          <Block
            id="lo-trinh"
            eyebrow={t.timelineEyebrow}
            title={t.timelineTitle}
            aside={
              <div aria-hidden className="relative -mb-4 hidden w-[24rem] lg:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img("skyline")} alt="" className="w-full" />
              </div>
            }
          >
            {/* Dòng thời gian ngang: đủ 9 mốc trên một hàng từ 1280px, nhỏ hơn thì vuốt ngang */}
            <ol className="-mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-3 [scrollbar-width:thin] xl:mx-0 xl:grid xl:grid-cols-9 xl:overflow-visible xl:px-0">
              {timeline.map((item, i) => (
                <li key={item.title} className="relative w-44 shrink-0 snap-start pr-5 xl:w-auto xl:pr-3">
                  {i < timeline.length - 1 && <span aria-hidden className="absolute top-[7px] right-0 left-4 h-0.5 bg-orange/30" />}
                  <span aria-hidden className="relative block h-4 w-4 rounded-full bg-orange ring-4 ring-[#fbf8f2]" />
                  <p className="mt-4 text-[14px] font-bold tracking-tight whitespace-nowrap text-orange-ink xl:text-[13px]">{item.date}</p>
                  <p className="mt-1 text-[15px] leading-snug font-semibold text-navy">{item.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{item.body}</p>
                </li>
              ))}
            </ol>
          </Block>

          <Block eyebrow={t.voteEyebrow} title={t.voteTitle}>
            <ul className="relative space-y-3 rounded-2xl bg-white p-7 shadow-[0_12px_30px_-18px_rgb(11_31_77/0.4)] ring-1 ring-[#eadfca]">
              {votingRules.map((v) => (
                <li key={v} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-orange" strokeWidth={2.2} />
                  {v}
                </li>
              ))}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img("leaves")} alt="" aria-hidden className="pointer-events-none absolute -top-10 -right-4 hidden w-28 -rotate-12 sm:block" />
            </ul>
          </Block>

          <Block eyebrow={t.faqEyebrow} title={t.faqTitle}>
            <div className="grid items-start gap-10 lg:grid-cols-[1fr_20rem]">
              <div className="space-y-3">
                {moreFaqs.map((f) => (
                  <details key={f.q} className="group rounded-xl bg-white shadow-sm ring-1 ring-[#eadfca]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-medium text-navy [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <Icon name="plus" className="h-4 w-4 shrink-0 transition group-open:rotate-45 group-open:text-orange" strokeWidth={2} />
                    </summary>
                    <p className="px-5 pb-4 text-[15px] leading-relaxed text-muted">{f.a}</p>
                  </details>
                ))}
              </div>
              <div className="relative mx-auto hidden w-72 lg:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img("notebook")} alt="" aria-hidden className="w-full" />
              </div>
            </div>
          </Block>

          <div className="reveal text-center">
            <Link href={localePath(lang, "/dang-ky/")} className="btn-primary px-8 py-3.5 text-base">
              {t.register} <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
