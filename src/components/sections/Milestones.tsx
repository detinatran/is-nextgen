import Eyebrow from "@/components/Eyebrow";
import Link from "next/link";
import Icon from "@/components/Icon";
import { milestones } from "@/content/site";
import { asset } from "@/lib/paths";

export default function Milestones() {
  return (
    <section
      id="lo-trinh"
      className="band-fallback bg-cover bg-center py-20 text-white lg:py-24"
      style={{
        backgroundImage: `linear-gradient(90deg, rgb(7 21 51 / 0.92), rgb(7 21 51 / 0.72) 55%, rgb(7 21 51 / 0.5)), url(${asset("/images/generated/timeline-bg.webp")})`,
      }}
    >
      <div className="container-x">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow light>Lộ trình cuộc thi</Eyebrow>
            <h2 className="mt-4 text-[1.9rem] leading-[1.18] font-bold sm:text-[2.5rem]">Các mốc thời gian quan trọng</h2>
          </div>
          <Link href="/the-le/#lo-trinh" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-gold hover:gap-2.5">
            Lịch đầy đủ <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>

        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {milestones.map((m, i) => (
            <li key={m.title} className="reveal relative lg:pr-8" style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}>
              <div className="flex items-center">
                <span className={`h-3 w-3 shrink-0 rounded-full ${i === milestones.length - 1 ? "bg-orange" : "bg-gold"}`} />
                <span className="ml-3 h-px flex-1 bg-white/25" />
              </div>
              <p className="mt-5 text-sm font-semibold text-gold">{m.date}</p>
              <p className="mt-1 text-lg font-semibold">{m.title}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
