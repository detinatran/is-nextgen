import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import WaveLine from "@/components/WaveLine";
import { values } from "@/content/site";
import { asset } from "@/lib/paths";

export default function Values() {
  return (
    <section
      className="relative bg-mist bg-cover"
      style={{
        // Mờ dần về trắng ở trên và dưới để nối liền với các section kề bên
        backgroundImage: `linear-gradient(90deg, rgb(255 255 255 / 0.5), rgb(255 255 255 / 0) 50%), linear-gradient(180deg, rgb(214 228 246 / 0.35), rgb(255 237 214 / 0.25)), url(${asset("/images/generated/soft-bg.webp")})`,
        backgroundPosition: "center 60%",
      }}
    >
      <WaveLine className="absolute inset-x-0 top-0" />
      <div className="container-x grid gap-12 py-24 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:py-32">
        <div className="reveal">
          <Eyebrow>Giá trị mang lại</Eyebrow>
          <h2 className="h2-section mt-4">
            {values.title[0]} {values.title[1]}
          </h2>
          <p className="lead mt-4 max-w-md">{values.body}</p>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {values.items.map((v, i) => (
            <li
              key={v.title}
              className="reveal bg-white/90 p-6"
              style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-orange/25 bg-cream text-orange-ink">
                <Icon name={v.icon} className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <h3 className="mt-4 text-[17px] font-semibold text-navy">{v.title}</h3>
              <p className="mt-1 text-[15px] text-muted">{v.body}</p>
            </li>
          ))}
        </ul>
      </div>
      <WaveLine flip className="absolute inset-x-0 bottom-0" />
    </section>
  );
}
