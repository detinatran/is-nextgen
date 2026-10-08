import Icon from "@/components/Icon";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";
import { asset } from "@/lib/paths";

export default function Values({ lang }: { lang: Lang }) {
  const { values } = getContent(lang);
  return (
    <section
      className="relative bg-[#eef3f9] bg-cover bg-center py-14 lg:py-16"
      style={{
        // Phủ trắng nhẹ ở giữa để chữ tối luôn dễ đọc trên nền núi
        backgroundImage: `linear-gradient(90deg, rgb(255 255 255 / 0.55), rgb(255 255 255 / 0.25) 50%, rgb(255 255 255 / 0.1)), url(${asset("/images/generated/band-mountains.webp")})`,
      }}
    >
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div className="reveal">
          <p className="text-[13px] font-bold tracking-[0.16em] text-orange uppercase">{values.eyebrow}</p>
          <h2 className="h2-section mt-3">
            {values.title[0]} {values.title[1]}
          </h2>
          <p className="lead mt-4 max-w-lg">{values.body}</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {values.items.map((v, i) => (
            <li
              key={v.title}
              className="reveal flex items-center gap-4 rounded-2xl bg-white/95 p-4 shadow-card ring-1 ring-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff1e6] text-orange">
                <Icon name={v.icon} className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-[15px] font-bold text-navy">{v.title}</h3>
                <p className="mt-0.5 text-[13px] leading-snug text-muted">{v.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
