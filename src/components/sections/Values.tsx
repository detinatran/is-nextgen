import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { values } from "@/content/site";
import { asset } from "@/lib/paths";

export default function Values() {
  return (
    <section
      className="band-fallback relative overflow-hidden bg-cover bg-center py-28 text-white lg:py-32"
      style={{
        backgroundImage: `linear-gradient(90deg, rgb(7 21 51 / 0.92), rgb(7 21 51 / 0.75) 55%, rgb(7 21 51 / 0.55)), url(${asset("/images/generated/values-bg.webp")})`,
        backgroundPosition: "center 30%",
      }}
    >
      <Art src="/images/generated/wave-mist-top.webp" className="pointer-events-none absolute inset-x-0 top-0 h-14 w-full object-fill lg:h-20" />
      <Art src="/images/generated/wave-mist-bottom.webp" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full object-fill lg:h-24" />
      <div className="container-x relative grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div className="reveal">
          <Eyebrow light>Giá trị mang lại</Eyebrow>
          <h2 className="mt-4 text-[1.9rem] leading-[1.18] font-bold text-balance sm:text-[2.5rem]">
            {values.title[0]} {values.title[1]}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/85 sm:text-[17px]">{values.body}</p>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-xl bg-white/15 sm:grid-cols-2">
          {values.items.map((v, i) => (
            <li
              key={v.title}
              className="reveal bg-navy-deep/80 p-6"
              style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold/40 text-gold">
                <Icon name={v.icon} className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <h3 className="mt-4 text-[17px] font-semibold">{v.title}</h3>
              <p className="mt-1 text-[15px] text-white/75">{v.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
