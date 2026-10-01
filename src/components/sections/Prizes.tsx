import SectionHeading from "@/components/SectionHeading";
import { minorPrizes, prizeTotal, prizes } from "@/content/site";

export default function Prizes() {
  return (
    <section id="giai-thuong" className="bg-cream py-20 lg:py-28">
      <div className="container-x">
        <SectionHeading
          index="05"
          label="Giải thưởng"
          title={`Tổng giá trị ${prizeTotal}`}
          lead="Giá trị nghề nghiệp là chính, tiền thưởng để khích lệ: suất thực tập, vé vào thẳng vòng phỏng vấn cuối và giấy chứng nhận được doanh nghiệp đồng hành công nhận."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {prizes.map((p, i) => (
            <article
              key={p.rank}
              className={`reveal flex flex-col p-6 ${p.featured ? "bg-navy text-white" : "bg-white"}`}
              style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}
            >
              <p className={`eyebrow ${p.featured ? "text-gold" : "text-rust"}`}>{p.rank}</p>
              <p className={`mt-3 text-3xl font-extrabold ${p.featured ? "text-white" : "text-navy"}`}>{p.amount}</p>
              <p className={`mt-1 text-xs ${p.featured ? "text-white/60" : "text-muted"}`}>{p.qty}</p>
              <p className={`mt-4 text-sm leading-relaxed ${p.featured ? "text-white/80" : "text-muted"}`}>{p.perks}</p>
            </article>
          ))}
        </div>

        <div className="reveal mt-4 grid gap-4 sm:grid-cols-3">
          {minorPrizes.map((m) => (
            <div key={m.name} className="flex items-center justify-between gap-4 border border-line bg-white/60 px-5 py-4">
              <span className="text-sm font-semibold text-navy">{m.name}</span>
              <span className="font-mono text-sm text-rust">{m.amount}</span>
            </div>
          ))}
        </div>

        <p className="reveal mt-8 max-w-3xl text-sm leading-relaxed text-muted">
          Toàn bộ thí sinh từ Vòng 2 trở lên nhận <strong className="text-navy">Giấy chứng nhận tham dự vòng trong</strong>{" "}
          (được doanh nghiệp đồng hành công nhận khi xét hồ sơ thực tập, tuyển dụng) và{" "}
          <strong className="text-navy">Báo cáo năng lực cá nhân</strong> bản điện tử.
        </p>
      </div>
    </section>
  );
}
