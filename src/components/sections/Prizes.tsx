import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { minorPrizes, prizeTotal, prizes } from "@/content/site";

const forEveryone = [
  "Giấy chứng nhận tham dự vòng trong, được doanh nghiệp đồng hành công nhận khi xét hồ sơ thực tập và tuyển dụng",
  "Báo cáo năng lực cá nhân bản điện tử: điểm mạnh, điểm cần cải thiện và gợi ý phát triển",
];

export default function Prizes() {
  return (
    <section id="giai-thuong" className="relative overflow-hidden bg-cream py-16 lg:py-24">
      <Art src="/images/generated/deco-peach-waves.webp" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50" />
      <div className="container-x relative">
        <div className="reveal max-w-3xl">
          <Eyebrow>Giải thưởng</Eyebrow>
          <h2 className="h2-section mt-4">
            Tổng giá trị <span className="text-orange-ink">{prizeTotal}</span>
          </h2>
          <p className="lead mt-4">
            Giá trị nghề nghiệp là chính: suất thực tập, vé vào thẳng vòng phỏng vấn cuối và giấy chứng nhận được doanh nghiệp
            đồng hành công nhận.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
            {prizes.map((p, i) => (
              <li
                key={p.rank}
                className="reveal group relative bg-white p-6 transition-colors duration-300 hover:bg-cream"
                style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}
              >
                {/* Vạch cam chạy ra khi rê chuột */}
                <span aria-hidden className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-orange transition-transform duration-300 group-hover:scale-x-100" />
                <p className="flex items-center gap-2 text-[15px] font-semibold text-navy">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cream text-orange-ink transition duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-orange group-hover:text-white">
                    <Icon name={p.icon} className="h-4 w-4" strokeWidth={2} />
                  </span>
                  {p.rank}
                  <span className="font-normal text-muted">· {p.qty}</span>
                </p>
                <p className="mt-3 text-[1.75rem] leading-none font-bold text-navy transition-all duration-300 group-hover:translate-x-1 group-hover:text-orange-ink">{p.amount}</p>
                <ul className="mt-4 space-y-1">
                  {p.perks.map((perk) => (
                    <li key={perk} className="text-[15px] leading-snug text-muted">
                      {perk}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <aside className="reveal group flex flex-col rounded-xl bg-navy p-7 text-white transition-shadow duration-300 hover:shadow-2xl hover:shadow-navy/30" style={{ "--delay": "150ms" } as React.CSSProperties}>
            <Art src="/images/generated/trophy.webp" className="mx-auto -mt-2 mb-4 w-56 object-contain transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105" />
            <p className="text-sm font-semibold tracking-[0.14em] text-gold uppercase">Cho mọi thí sinh vòng trong</p>
            <ul className="mt-5 space-y-4">
              {forEveryone.map((t) => (
                <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-white/90">
                  <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-gold" strokeWidth={2.4} />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-auto border-t border-white/15 pt-5 text-[15px] leading-relaxed text-white/75">{minorPrizes}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
