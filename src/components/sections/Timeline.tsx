import SectionHeading from "@/components/SectionHeading";
import { timeline } from "@/content/site";

const colors = ["bg-gold", "bg-gold", "bg-sky-400", "bg-sky-400", "bg-teal", "bg-sky-400", "bg-teal", "bg-orange", "bg-white/50"];

export default function Timeline() {
  return (
    <section id="lo-trinh" className="bg-navy py-20 text-white lg:py-28">
      <div className="container-x">
        <SectionHeading index="03" label="Lộ trình" title="Từ phát động đến trao giải" dark />
      </div>
      <div className="container-x mt-12">
        <ol className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-0 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-y-12 lg:overflow-visible lg:px-0">
          {timeline.map((t, i) => (
            <li
              key={t.title}
              className="reveal w-48 shrink-0 snap-start pr-5 lg:w-auto"
              style={{ "--delay": `${i * 60}ms` } as React.CSSProperties}
            >
              <div className={`h-1 ${colors[i]}`} aria-hidden />
              <p className="mt-4 font-mono text-xs text-gold">{t.date}</p>
              <h3 className="mt-1 font-bold">{t.title}</h3>
              <p className="mt-1 text-sm leading-snug text-white/65">{t.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
