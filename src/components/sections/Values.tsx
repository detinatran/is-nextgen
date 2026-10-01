import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { values } from "@/content/site";
import { asset } from "@/lib/paths";

export default function Values() {
  return (
    <section
      className="bg-mist bg-cover py-20 lg:py-28"
      style={{
        // Mờ dần về trắng ở trên và dưới để nối liền với các section kề bên
        backgroundImage: `linear-gradient(180deg, #fff, rgb(255 255 255 / 0.2) 22%, rgb(255 255 255 / 0.2) 78%, #fff), linear-gradient(90deg, rgb(255 255 255 / 0.55), rgb(255 255 255 / 0) 55%), url(${asset("/images/generated/soft-bg.webp")})`,
        backgroundPosition: "center 60%",
      }}
    >
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
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
              className="reveal bg-white/85 p-6 backdrop-blur-sm"
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
    </section>
  );
}
