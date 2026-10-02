import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";
import { asset } from "@/lib/paths";

const tone = {
  orange: "from-[#ffc078] to-[#f08a2a] shadow-orange/40",
  blue: "from-[#6aa8ff] to-brand shadow-brand/40",
  red: "from-[#ff8a5c] to-[#e2452b] shadow-orange/40",
  gold: "from-[#ffd36b] to-[#e09b1a] shadow-gold/40",
};
const dot = { orange: "bg-[#f5a54a]", blue: "bg-sky", red: "bg-[#ff6b5a]", gold: "bg-gold" };

export default function Milestones({ lang }: { lang: Lang }) {
  const { milestones } = getContent(lang);
  const en = lang === "en";
  return (
    <section
      id="lo-trinh"
      className="band-fallback relative overflow-hidden bg-cover bg-center py-16 text-white lg:py-20"
      style={{
        backgroundImage: `linear-gradient(90deg, rgb(7 21 51 / 0.9), rgb(7 21 51 / 0.62) 55%, rgb(7 21 51 / 0.35)), url(${asset("/images/generated/timeline-bg.webp")})`,
      }}
    >
      <div className="container-x relative">
        <div className="reveal">
          <Eyebrow light>{en ? "Competition roadmap" : "Lộ trình cuộc thi"}</Eyebrow>
          <h2 className="text-on-photo mt-4 text-[1.9rem] leading-[1.18] font-bold sm:text-[2.5rem]">{en ? "Key dates" : "Các mốc thời gian quan trọng"}</h2>
        </div>

        <div className="relative mt-10">
          <ol className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
            {milestones.map((m, i) => (
              <li key={m.title} className="reveal w-60 shrink-0 snap-start lg:w-auto" style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}>
                <div className="mr-3 flex items-center gap-3 rounded-2xl bg-navy-deep/50 p-3 ring-1 ring-white/10 backdrop-blur-sm">
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${tone[m.tone]} shadow-lg ring-4 ring-white/10`}>
                    <Icon name={m.icon} className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-base font-bold whitespace-nowrap">{m.date}</p>
                    <p className="text-[15px] text-white/90">{m.title}</p>
                  </div>
                </div>
                {/* Đường nối các mốc */}
                <div className="relative mt-6 h-1">
                  <div className={`absolute inset-0 ${dot[m.tone]} opacity-80 ${i === 0 ? "rounded-l-full" : ""} ${i === milestones.length - 1 ? "rounded-r-full" : ""}`} />
                  <span className={`absolute top-1/2 left-9 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-white ${dot[m.tone]} shadow`} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
