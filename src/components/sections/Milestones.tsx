import Link from "next/link";
import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import Timeline from "@/components/Timeline";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";

export default function Milestones({ lang }: { lang: Lang }) {
  const { timeline } = getContent(lang);
  const en = lang === "en";
  return (
    <section id="lo-trinh" className="relative overflow-hidden bg-linear-to-b from-white via-[#eef4fd] to-white py-16 lg:py-24">
      <Art src="/images/generated/deco-blue-waves.webp" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40" />
      <div data-tour="milestones" className="container-x relative">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>{en ? "Competition roadmap" : "Lộ trình cuộc thi"}</Eyebrow>
            <h2 className="h2-section mt-4">{en ? "Season I schedule" : "Lịch trình mùa I · 2026"}</h2>
            <p className="lead mt-3 max-w-2xl">
              {en
                ? "Every key date, from registration to the Final: rounds, workshop, field trip, Gala and results."
                : "Toàn bộ các mốc từ mở đơn đến Chung kết: vòng thi, workshop, field trip, Gala và ngày công bố kết quả."}
            </p>
          </div>
          <Link
            href={localePath(lang, "/the-le/#lo-trinh")}
            className="inline-flex items-center gap-2 rounded-full bg-white py-2 pr-2 pl-4 text-sm font-semibold text-navy shadow-sm ring-1 ring-line transition hover:shadow-md"
          >
            {en ? "Full rules" : "Xem thể lệ"}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mist">
              <Icon name="arrowRight" className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
          </Link>
        </div>

        <div className="reveal mt-10">
          <Timeline items={timeline} lang={lang} />
        </div>
      </div>
    </section>
  );
}
