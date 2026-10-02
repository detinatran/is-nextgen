import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { themeSection } from "@/content/site";

const pointIcons = ["sparkles", "briefcase", "lightbulb"] as const;

export default function Theme() {
  return (
    <section className="relative overflow-hidden bg-white py-12 lg:py-0">
      <Art
        src="/images/generated/deco-blue-waves.webp"
        className="pointer-events-none absolute top-0 right-0 hidden h-full w-1/2 -scale-x-100 object-cover object-left opacity-50 lg:block"
      />
      {/* Ảnh tràn sát mép trái trên màn hình lớn */}
      <div className="reveal lg:absolute lg:inset-y-0 lg:left-0 lg:w-[49%]">
        <Photo
          src="/images/generated/theme-ai.webp"
          alt="Nhà quản trị trẻ nhìn về thành phố với các bảng thông tin AI"
          className="mx-4 aspect-[3/2] rounded-2xl shadow-card sm:mx-6 lg:mx-0 lg:aspect-auto lg:h-full lg:rounded-l-none lg:rounded-r-[1.75rem]"
        />
        <Art
          src="/images/generated/deco-blue-waves.webp"
          className="pointer-events-none absolute -top-10 left-0 hidden h-[70%] w-[85%] object-cover object-left-top opacity-80 lg:block"
        />
      </div>

      <div className="container-x relative">
        {/* Máy bay giấy trang trí */}
        <svg
          aria-hidden
          viewBox="0 0 120 60"
          className="absolute top-8 right-24 hidden h-10 w-20 text-orange/70 lg:block"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        >
          <path d="M2 50c20-2 30-18 52-14 14 3 10 16 0 14s-6-18 18-24" strokeDasharray="3 4" />
          <path d="M84 22l30-14-10 30-8-10z" />
          <path d="M96 28l18-20" />
        </svg>

        <div className="reveal mt-8 lg:mt-0 lg:ml-[53%] lg:py-20" style={{ "--delay": "100ms" } as React.CSSProperties}>
          <Eyebrow>Chủ đề cuộc thi</Eyebrow>
          <h2 className="h2-section mt-4">
            Nhà quản trị
            <br />
            trong <span className="text-gradient-orange">kỷ nguyên</span> AI
          </h2>
          <p className="lead mt-4">{themeSection.body}</p>
          <ul className="mt-6 space-y-3.5">
            {themeSection.points.map((p, i) => (
              <li key={p} className="flex items-center gap-3 text-base font-semibold text-navy">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#ffb057] to-orange text-white shadow-md shadow-orange/30">
                  <Icon name={pointIcons[i]} className="h-4 w-4" strokeWidth={2.2} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <blockquote className="mt-8 flex gap-3 rounded-2xl border border-orange/15 bg-cream px-6 py-5">
            <span aria-hidden className="font-serif text-4xl leading-none text-orange">
              “
            </span>
            <p className="pt-1 text-base leading-relaxed font-semibold text-navy">{themeSection.quote}</p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
