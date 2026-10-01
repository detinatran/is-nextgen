import Link from "next/link";
import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { about, site } from "@/content/site";

function VideoCard() {
  const photo = (
    <Photo
      src="/images/generated/about-city.webp"
      alt="Khu văn phòng hiện đại"
      className="aspect-[4/3] w-full rounded-xl"
      imgClassName="transition duration-700 group-hover:scale-[1.03]"
    >
      {site.videoUrl && (
        <>
          <div aria-hidden className="absolute inset-0 bg-navy-deep/25" />
          <span className="absolute bottom-5 left-5 flex items-center gap-3 rounded-full bg-white py-2 pr-5 pl-2 text-sm font-semibold text-navy">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange text-white">
              <Icon name="play" className="ml-0.5 h-3.5 w-3.5" />
            </span>
            Xem video giới thiệu
          </span>
        </>
      )}
    </Photo>
  );
  return site.videoUrl ? (
    <a href={site.videoUrl} target="_blank" rel="noopener noreferrer" className="group block">
      {photo}
    </a>
  ) : (
    photo
  );
}

export default function About() {
  return (
    <section id="gioi-thieu" className="relative overflow-hidden bg-white pt-16 pb-20 lg:pt-20">
      <Art src="/images/generated/deco-blue-waves.webp" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45" />
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

        <ol className="mt-16 grid gap-x-8 gap-y-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {about.features.map((f, i) => (
            <li key={f.title} className="reveal" style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}>
              <div className="flex items-end justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-orange/25 bg-cream text-orange-ink">
                  <Icon name={f.icon} className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <span className="text-sm font-semibold text-orange-ink tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-3 text-lg leading-snug font-bold text-navy">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
