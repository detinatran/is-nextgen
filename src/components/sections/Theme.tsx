import Art from "@/components/Art";
import Icon from "@/components/Icon";
import Photo from "@/components/Photo";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";

// Ảnh: Vitaly Gariev trên Unsplash (unsplash.com/photos/YyJNda7nsPo), giấy phép Unsplash
export default function Theme({ lang }: { lang: Lang }) {
  const { themeSection } = getContent(lang);
  const en = lang === "en";
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-white via-mist/70 to-white py-14 lg:py-20">
      <Art
        src="/images/generated/deco-blue-waves.webp"
        className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover object-right opacity-60 lg:block"
      />
      <div className="container-x relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Photo
          src="/images/is/sv-man-hinh.webp"
          alt={en ? "A young team discussing a business plan in a modern office" : "Nhóm nhân sự trẻ thảo luận phương án kinh doanh trong văn phòng"}
          className="reveal aspect-[16/10] rounded-3xl shadow-2xl ring-8 shadow-navy/15 ring-white"
        />

        <div className="reveal relative" style={{ "--delay": "100ms" } as React.CSSProperties}>
          {/* Máy bay giấy với đường bay nét đứt */}
          <svg
            aria-hidden
            viewBox="0 0 120 60"
            className="absolute -top-6 right-0 hidden h-12 w-24 text-orange/70 lg:block"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          >
            <path d="M2 50c20-2 30-18 52-14 14 3 10 16 0 14s-6-18 18-24" strokeDasharray="3 4" />
            <path d="M84 22l30-14-10 30-8-10z" />
            <path d="M96 28l18-20" />
          </svg>
          <p className="text-[13px] font-bold tracking-[0.16em] text-orange uppercase">{en ? "AI in management" : "AI trong quản trị"}</p>
          <h2 className="h2-section mt-3">
            {en ? (
              <>
                Managers
                <br />
                in the <span className="text-orange">AI era</span>
              </>
            ) : (
              <>
                Nhà quản trị
                <br />
                trong kỷ <span className="text-orange">nguyên AI</span>
              </>
            )}
          </h2>
          <p className="lead mt-4">{themeSection.body}</p>
          <ul className="mt-6 space-y-3">
            {themeSection.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-base font-medium text-navy">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange text-white">
                  <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
