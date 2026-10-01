import Link from "next/link";
import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { about, site } from "@/content/site";

function VideoCard() {
  const inner = (
    <Photo
      src="/images/generated/about-city.webp"
      alt="Toà nhà văn phòng hiện đại"
      className="aspect-[1.9/1] w-full rounded-2xl shadow-card"
      imgClassName="transition duration-700 group-hover:scale-105"
    >
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-navy-deep/75 via-transparent to-transparent" />
      <span className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-orange ring-1 ring-white/60 backdrop-blur-md transition group-hover:scale-110 group-hover:bg-white">
        <Icon name="play" className="ml-0.5 h-5 w-5" />
      </span>
      <div className="absolute bottom-4 left-5">
        <p className="text-base font-bold text-white">IS-NextGen Manager 2026</p>
        <p className="text-[13px] text-white/85">{site.videoUrl ? "Xem video giới thiệu" : "Video giới thiệu · sắp ra mắt"}</p>
      </div>
    </Photo>
  );
  return site.videoUrl ? (
    <a href={site.videoUrl} target="_blank" rel="noopener noreferrer" className="group block" aria-label="Xem video giới thiệu">
      {inner}
    </a>
  ) : (
    <div className="group">{inner}</div>
  );
}

export default function About() {
  return (
    <section id="gioi-thieu" className="relative overflow-hidden bg-linear-to-b from-white to-mist pt-16 pb-16 lg:pt-20">
      <Art src="/images/generated/deco-blue-waves.webp" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60" />
      <Art src="/images/generated/deco-clouds.webp" className="pointer-events-none absolute inset-x-0 bottom-0 h-64 w-full object-cover object-bottom" />
      <div className="container-x relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div className="reveal">
            <Eyebrow>Về IS-NextGen Manager 2026</Eyebrow>
            <h2 className="h2-section mt-4">
              {about.title[0]} {about.title[1]}
              <span className="text-gradient-orange">{about.title[2]}</span>
            </h2>
            <p className="lead mt-4 max-w-xl">{about.body}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/dang-ky/" className="btn-primary">
                Đăng ký ngay <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link href="/the-le/" className="btn-outline">
                Tìm hiểu thêm
              </Link>
            </div>
          </div>
          <div className="reveal" style={{ "--delay": "120ms" } as React.CSSProperties}>
            <VideoCard />
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {about.features.map((f, i) => (
            <article
              key={f.title}
              className="card reveal bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl"
              style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}
            >
              <div>
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${f.tone}`}>
                  <Art src={`/images/generated/icon-light-${i + 1}.webp`} className="h-10 w-10 object-contain" fallback={<Icon name={f.icon} className="h-6 w-6" />} />
                </span>
                <h3 className="mt-4 text-lg leading-snug font-bold text-navy">{f.title}</h3>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
