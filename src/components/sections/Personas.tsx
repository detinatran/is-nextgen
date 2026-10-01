import Carousel from "@/components/Carousel";
import Eyebrow from "@/components/Eyebrow";
import Photo from "@/components/Photo";
import { personas } from "@/content/site";
import { asset } from "@/lib/paths";

export default function Personas() {
  return (
    <section
      className="relative overflow-hidden bg-mist bg-cover bg-center py-16 lg:py-20"
      style={{ backgroundImage: `linear-gradient(180deg, rgb(255 255 255 / 0.85), rgb(255 255 255 / 0.3) 35%, rgb(243 247 253 / 0.85)), url(${asset("/images/generated/soft-bg.webp")})` }}
    >
      <div className="container-x">
        <div className="reveal">
          <Eyebrow>Chân dung nhà quản trị</Eyebrow>
          <h2 className="h2-section mt-4">
            Bạn có phải nhà quản trị <br className="hidden sm:block" />
            chúng tôi đang tìm?
          </h2>
        </div>

        <div className="reveal mt-8 -mx-2">
          <Carousel label="Sáu nhóm năng lực" slideClassName="w-full px-2 md:w-1/2" dots>
            {personas.map((p, i) => (
              <article key={p.title} className="card flex h-full flex-col overflow-hidden sm:flex-row">
                <Photo src={p.image} alt="" className="aspect-[4/3] w-full shrink-0 sm:aspect-auto sm:w-[38%]" imgClassName="object-[50%_25%]" />
                <div className="flex flex-col px-6 py-5">
                  <span aria-hidden className="font-serif text-4xl leading-none text-orange">
                    “
                  </span>
                  <p className="mt-1 flex-1 text-base leading-relaxed text-ink">{p.body}</p>
                  <h3 className="mt-4 text-[17px] font-bold text-navy">{p.title}</h3>
                  <p className="mt-0.5 text-sm text-muted">Nhóm năng lực {String(i + 1).padStart(2, "0")} · chấm ở cả bốn vòng</p>
                </div>
              </article>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
