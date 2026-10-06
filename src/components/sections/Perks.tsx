import Link from "next/link";
import Art from "@/components/Art";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";

// Xen kẽ tông cam nhạt và xanh nhạt như thiết kế
const tones = [
  { card: "from-[#fff1e4] to-[#fffaf5] ring-[#fde3cc]", arrow: "text-orange" },
  { card: "from-[#eaf2ff] to-[#f7faff] ring-[#d9e6fb]", arrow: "text-brand" },
];

export default function Perks({ lang }: { lang: Lang }) {
  const { perks } = getContent(lang);
  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-10 lg:pt-20">
      <Art src="/images/generated/deco-peach-waves.webp" className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/2 object-cover object-right opacity-40" />
      <Art src="/images/generated/deco-blue-waves.webp" className="pointer-events-none absolute inset-y-0 left-0 h-full w-1/2 object-cover object-left opacity-40" />
      <div className="container-x relative">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-bold tracking-[0.16em] text-orange uppercase">{perks.eyebrow}</p>
          <h2 className="h2-section mt-3">{perks.title}</h2>
          <p className="lead mt-4">{perks.lead}</p>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {perks.items.map((p, i) => {
            const tone = tones[i % 2];
            return (
              <li key={p.title} className="reveal" style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}>
                <Link
                  href={localePath(lang, p.href)}
                  className={`group flex h-full flex-col rounded-3xl bg-linear-to-b ${tone.card} p-6 ring-1 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-navy/10`}
                >
                  <Art
                    src={`/images/generated/exp-icon-${i + 1}.webp`}
                    className="h-16 w-16 object-contain transition duration-300 group-hover:-translate-y-1 group-hover:scale-105"
                  />
                  <h3 className="mt-4 text-lg leading-snug font-bold text-navy">{p.title}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">{p.body}</p>
                  <span className={`mt-5 ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition group-hover:translate-x-1 ${tone.arrow}`}>
                    <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
