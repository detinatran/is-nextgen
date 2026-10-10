import Link from "next/link";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import Slideshow from "@/components/Slideshow";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";

export default function Journey({ lang }: { lang: Lang }) {
  const { journey } = getContent(lang);
  return (
    <section id="trai-nghiem" className="relative bg-linear-to-b from-white to-mist/60 py-12 lg:py-16">
      <div className="container-x">
        <div className="reveal flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-3 text-[1.6rem] font-bold text-navy sm:text-[2rem]">
            {journey.title}
            <svg viewBox="0 0 40 12" className="h-3 w-10 text-orange" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M1 6h36M32 1l5 5-5 5" />
            </svg>
          </h2>
          <Link
            href={localePath(lang, "/the-le/")}
            className="inline-flex items-center gap-2 rounded-full bg-white py-2 pr-2 pl-4 text-sm font-semibold text-navy shadow-sm ring-1 ring-line transition hover:shadow-md"
          >
            {journey.more}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mist text-navy">
              <Icon name="arrowRight" className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
          </Link>
        </div>

        <div className="mt-8 flex gap-4 lg:gap-6">
          {/* Mốc năm dọc bên trái như thiết kế */}
          <div aria-hidden className="hidden w-8 shrink-0 flex-col items-center xl:flex">
            <span className="h-2 w-2 rounded-full bg-navy/40" />
            <span className="mt-2 h-10 w-px bg-navy/15" />
            <span className="my-3 [writing-mode:vertical-rl] rotate-180 text-4xl font-extrabold tracking-wider text-navy/15">2026</span>
            <span className="w-px flex-1 bg-navy/15" />
          </div>
          <ul className="grid flex-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {journey.items.map((item, i) => (
              <li key={item.title} className="reveal" style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}>
                <Link
                  href={localePath(lang, item.href)}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line transition duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                >
                  {"images" in item && item.images ? (
                    <Slideshow images={item.images} className="aspect-[16/10]" imgClassName="group-hover:scale-105 [transition:opacity_1s,transform_.7s]" />
                  ) : (
                    <Photo src={item.image} alt="" className="aspect-[16/10]" imgClassName="transition duration-700 group-hover:scale-105" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-[17px] leading-snug font-bold text-navy">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{item.body}</p>
                    <span className="mt-4 ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-mist text-brand transition group-hover:bg-brand group-hover:text-white">
                      <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
