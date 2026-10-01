import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { minorPrizes, prizeTotal, prizes } from "@/content/site";

function TrophyFallback() {
  return (
    <div className="relative mx-auto flex aspect-square w-56 items-center justify-center" aria-hidden>
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(245_184_61/0.45),transparent_65%)]" />
      <Icon name="trophy" className="relative h-28 w-28 text-gold" strokeWidth={1.2} />
    </div>
  );
}

export default function Prizes() {
  return (
    <section
      id="giai-thuong"
      className="relative overflow-hidden py-16 lg:py-20"
      style={{
        background:
          "radial-gradient(ellipse 60% 70% at 85% 50%, rgb(255 214 170 / 0.55), transparent 70%), radial-gradient(ellipse 50% 60% at 0% 100%, rgb(255 190 140 / 0.35), transparent 70%), linear-gradient(180deg, #fff9f3, #fff3e6)",
      }}
    >
      <Art src="/images/generated/deco-peach-waves.webp" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className="container-x relative grid items-center gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="reveal">
            <Eyebrow>Giải thưởng</Eyebrow>
            <h2 className="h2-section mt-4">
              Tổng giá trị <span className="text-gradient-orange">{prizeTotal}</span>
            </h2>
            <p className="lead mt-4 max-w-2xl">
              Giá trị nghề nghiệp là chính: suất thực tập, vé vào thẳng vòng phỏng vấn cuối và giấy chứng nhận được doanh nghiệp đồng hành công nhận.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {prizes.map((p, i) => (
              <article
                key={p.rank}
                className={`card reveal px-5 py-5 ${p.featured ? "border-l-4 border-l-orange" : ""}`}
                style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}
              >
                <p className="flex items-center gap-2 text-[15px] font-semibold text-navy">
                  <Art
                    src={`/images/generated/icon-light-${i + 5}.webp`}
                    className="h-7 w-7 object-contain"
                    fallback={<Icon name={p.icon} className="h-4 w-4 text-orange" strokeWidth={2} />}
                  />
                  {p.rank}
                </p>
                <p className="mt-2 text-[1.6rem] leading-tight font-extrabold text-navy">{p.amount}</p>
                <ul className="mt-3 space-y-1">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex gap-1.5 text-sm leading-snug text-muted">
                      <span aria-hidden>•</span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="reveal mt-5 text-[15px] text-muted">{minorPrizes}</p>
        </div>

        <div className="reveal" style={{ "--delay": "150ms" } as React.CSSProperties}>
          <Art src="/images/generated/trophy.webp" className="w-full object-contain lg:scale-125" fallback={<TrophyFallback />} />
        </div>
      </div>
    </section>
  );
}
