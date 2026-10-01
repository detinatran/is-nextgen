import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { experiences, rounds, roundsIntro } from "@/content/site";

export default function Rounds() {
  return (
    <section id="the-le" className="bg-white py-16 lg:py-24">
      <div className="container-x">
        <div className="reveal max-w-3xl">
          <Eyebrow>Bốn vòng thi · Một hành trình năng lực</Eyebrow>
          <h2 className="h2-section mt-4">Từ hồ sơ cá nhân đến hội đồng doanh nghiệp</h2>
          <p className="lead mt-4">{roundsIntro}</p>
        </div>

        {/* Các bước: số thứ tự, tên vòng, hình thức; vạch trên cùng thể hiện tiến trình */}
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {rounds.map((r, i) => (
            <li key={r.no} className="reveal relative lg:pr-6" style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}>
              <div className={`h-1 rounded-full ${i === rounds.length - 1 ? "bg-orange" : "bg-navy"}`} />
              <Link href={`/the-le/#vong-${i + 1}`} className="group mt-5 block">
                <p className="text-sm font-semibold text-orange-ink tabular-nums">Vòng {r.no}</p>
                <h3 className="mt-1 text-xl font-bold text-navy group-hover:text-orange-ink">{r.step}</h3>
                <p className="mt-1 text-[15px] text-muted">{r.short}</p>
                <p className="mt-3 text-sm font-medium text-navy">{r.funnel}</p>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {experiences.map((e, i) => (
            <article key={e.title} className="reveal group" style={{ "--delay": `${i * 100}ms` } as React.CSSProperties}>
              <Photo src={e.image} alt={e.title} className="aspect-[3/2] rounded-xl" imgClassName="transition duration-700 group-hover:scale-[1.03]" />
              <h3 className="mt-5 text-lg leading-snug font-bold text-navy">{e.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{e.body}</p>
              <Link href={e.href} className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-orange-ink hover:gap-2.5">
                Xem chi tiết <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
