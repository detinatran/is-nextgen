import Link from "next/link";
import { Fragment } from "react";
import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { experiences, roundIcons, rounds, roundsIntro } from "@/content/site";

export default function Rounds() {
  return (
    <section id="the-le" className="relative bg-white pt-16 pb-28 lg:pt-20 lg:pb-32">
      <Art src="/images/generated/rounds-bg.webp" className="pointer-events-none absolute inset-x-0 bottom-12 h-72 w-full object-cover object-bottom opacity-80" />
      <div className="container-x relative">
        <div className="reveal max-w-3xl">
          <Eyebrow>Bốn vòng thi · Một hành trình năng lực</Eyebrow>
          <h2 className="h2-section mt-4">Từ hồ sơ cá nhân đến hội đồng doanh nghiệp</h2>
          <p className="lead mt-4">{roundsIntro}</p>
        </div>

        <ol className="mt-10 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
          {rounds.map((r, i) => (
            <Fragment key={r.no}>
              <li className="reveal" style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}>
                <Link
                  href={`/the-le/#vong-${i + 1}`}
                  className={`flex items-center gap-3 rounded-xl bg-linear-to-br ${r.gradient} px-4 py-4 text-white shadow-lg shadow-navy/15 transition hover:-translate-y-1 hover:shadow-xl`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-white/10">
                    {i < 2 ? <span className="text-lg font-bold">{r.no}</span> : <Icon name={roundIcons[i]} className="h-6 w-6" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-bold">{r.step}</span>
                    <span className="block text-[13px] text-white/90">{r.short}</span>
                  </span>
                </Link>
              </li>
              {i < rounds.length - 1 && (
                <li aria-hidden className="hidden text-navy-soft lg:block">
                  <Icon name="chevronRight" className="h-5 w-5" strokeWidth={2.5} />
                </li>
              )}
            </Fragment>
          ))}
        </ol>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {experiences.map((e, i) => (
            <article
              key={e.title}
              className="card reveal group flex flex-col overflow-hidden"
              style={{ "--delay": `${i * 100}ms` } as React.CSSProperties}
            >
              <Photo src={e.image} alt={e.title} className="aspect-[2/1]" imgClassName="transition duration-700 group-hover:scale-105" />
              <div className="flex flex-1 flex-col px-6 pt-5 pb-6">
                <h3 className="text-lg leading-snug font-bold text-navy">{e.title}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">{e.body}</p>
                <Link href={e.href} className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-orange-ink hover:gap-2.5">
                  Xem chi tiết <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
