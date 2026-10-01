import Art from "@/components/Art";
import Icon from "@/components/Icon";
import { values } from "@/content/site";
import { asset } from "@/lib/paths";
import Wave from "./Wave";

export default function Values() {
  return (
    <section
      className="band-fallback relative -mt-16 overflow-hidden bg-cover bg-center pt-28 pb-32 text-white lg:pt-32 lg:pb-36"
      style={{
        backgroundImage: `linear-gradient(90deg, rgb(7 21 51 / 0.88), rgb(7 21 51 / 0.62) 50%, rgb(7 21 51 / 0.55)), url(${asset("/images/generated/values-bg.webp")})`,
        backgroundPosition: "center 30%",
      }}
    >
      <Art
        src="/images/generated/wave-mist-top.webp"
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-16 w-full object-fill lg:h-24"
        fallback={<Wave position="top" />}
      />
      <Art
        src="/images/generated/wave-mist-bottom.webp"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-20 w-full object-fill lg:h-28"
        fallback={<Wave position="bottom" />}
      />
      <div className="container-x relative z-[2] grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="reveal">
          <p className="flex items-center gap-2 text-[13px] font-bold tracking-[0.12em] text-gold uppercase">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-[#ffe08a] to-[#d98b16] text-[10px] text-navy-deep">
              <Icon name="star" className="h-3 w-3" strokeWidth={2.5} />
            </span>
            Giá trị mang lại
          </p>
          <h2 className="text-on-photo mt-4 text-[1.9rem] leading-[1.18] font-bold sm:text-[2.5rem]">
            {values.title[0]}
            <br />
            {values.title[1]}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/90 sm:text-[17px]">{values.body}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {values.items.map((v, i) => (
            <div key={v.title} className="reveal flex items-center gap-4 rounded-2xl bg-navy-deep/45 p-4 ring-1 ring-white/10 backdrop-blur-sm" style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}>
              <Art
                src={`/images/generated/icon-value-${i + 1}.webp`}
                className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_0_18px_rgba(245,184,61,0.45)]"
                fallback={
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_28%,#fff2c6,#f5b83d_45%,#a8650f)] text-navy-deep shadow-[0_0_28px_rgba(245,184,61,0.45)] ring-2 ring-white/25">
                    <Icon name={v.icon} className="h-5 w-5" strokeWidth={2} />
                  </span>
                }
              />
              <div>
                <h3 className="text-[17px] font-semibold">{v.title}</h3>
                <p className="mt-1 text-sm text-white/85">{v.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
