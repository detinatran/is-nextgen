import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";

// Mức minh hoạ cho từng nhóm năng lực trong infographic (1-5), chỉ để thể hiện thang 05 mức
const sampleLevels = [4, 3, 5, 4, 3, 4];

function FrameworkMatrix({ names }: { names: string[] }) {
  return (
    <ul className="space-y-2.5" aria-hidden>
      {names.map((name, row) => (
        <li key={name} className="grid grid-cols-[1fr_auto] items-center gap-3">
          <span className="text-[13px] leading-tight font-medium text-navy">{name}</span>
          <span className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <span
                key={lvl}
                className={`hl-dot h-3 w-4 rounded-full ${lvl <= sampleLevels[row] ? "on bg-linear-to-r from-[#f5b83d] to-orange" : "bg-navy/10"}`}
                style={{ "--d": row * 5 + lvl } as React.CSSProperties}
              />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Highlights({ lang }: { lang: Lang }) {
  const { highlights: h } = getContent(lang);
  return (
    <section id="diem-nhan" className="relative overflow-hidden bg-linear-to-b from-white via-[#fbf5ea] to-white py-16 lg:py-24">
      <Art src="/images/generated/deco-peach-waves.webp" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="container-x relative">
        <div className="reveal mx-auto max-w-3xl text-center">
          <Eyebrow className="justify-center">{h.eyebrow}</Eyebrow>
          <h2 className="h2-section mt-4">{h.title}</h2>
          <span aria-hidden className="mx-auto mt-5 block h-1 w-16 rounded-full bg-linear-to-r from-[#f5b83d] to-orange" />
          <p className="lead mt-5">{h.lead}</p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {/* Khung năng lực: infographic số liệu + ma trận mức hành vi */}
          <article className="reveal flex flex-col justify-center rounded-3xl border border-[#f1dfbd] bg-white/90 p-6 shadow-card backdrop-blur-sm sm:p-8 lg:col-span-2">
            <div className="grid gap-8 md:grid-cols-[1fr_1.05fr] md:items-center">
              <div>
                <span className="inline-flex rounded-full bg-[#fdf1db] px-3 py-1 text-xs font-semibold tracking-wide text-[#a8721c] uppercase">{h.framework.tag}</span>
                <h3 className="mt-3 text-[1.4rem] leading-snug font-bold text-navy">{h.framework.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{h.framework.body}</p>
                <dl className="mt-6 grid grid-cols-3 gap-3">
                  {h.framework.stats.map((s) => (
                    <div key={s.label} className="rounded-2xl bg-[#fbf5ea] px-3 py-3 text-center">
                      <dt className="sr-only">{s.label}</dt>
                      <dd className="text-[2rem] leading-none font-extrabold text-[#b8862f] tabular-nums">{s.value}</dd>
                      <dd className="mt-1.5 text-xs leading-snug text-muted">{s.label}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-2xl border border-line bg-mist/60 p-5">
                <FrameworkMatrix names={h.framework.areas} />
                <div className="mt-4 flex justify-end gap-1.5 text-[11px] text-muted tabular-nums">
                  {["01", "02", "03", "04", "05"].map((n) => (
                    <span key={n} className="w-4 text-center">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* Vé vào thẳng phỏng vấn cuối: thẻ nổi bật nhất */}
          <article
            className="reveal group flex flex-col overflow-hidden rounded-3xl border border-orange/25 bg-linear-to-b from-[#fff0e2] to-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange/15"
            style={{ "--delay": "100ms" } as React.CSSProperties}
          >
            <Photo src={h.fastTrack.image} alt="" className="aspect-[16/10]" imgClassName="transition duration-700 group-hover:scale-[1.04]">
              <span className="absolute top-4 left-4 rounded-full bg-orange px-3 py-1 text-xs font-semibold text-white shadow-md shadow-orange/30">{h.fastTrack.tag}</span>
            </Photo>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-[1.25rem] leading-snug font-bold text-navy">{h.fastTrack.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{h.fastTrack.body}</p>
              <p className="mt-auto flex items-start gap-2 pt-4 text-[15px] font-semibold text-orange-ink">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
                {h.fastTrack.extra}
              </p>
            </div>
          </article>

          {h.items.map((item, i) => (
            <article
              key={item.title}
              className="reveal group flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ "--delay": `${i * 90}ms` } as React.CSSProperties}
            >
              <Photo src={item.image} alt="" className="aspect-[16/10]" imgClassName="transition duration-700 group-hover:scale-[1.04]">
                <span className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-navy shadow-sm backdrop-blur">{item.tag}</span>
              </Photo>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg leading-snug font-bold text-navy">{item.title}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">{item.body}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {item.facts.map((f) => (
                    <li key={f} className="rounded-full bg-cream px-3 py-1 text-[13px] font-medium text-navy">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
