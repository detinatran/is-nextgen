import Photo from "@/components/Photo";
import SectionHeading from "@/components/SectionHeading";
import { competencies, judgingRules, rounds } from "@/content/site";

const funnel = [
  { n: "250+", label: "Đăng ký" },
  { n: "40", label: "Vòng 2" },
  { n: "16", label: "Vòng 3" },
  { n: "12", label: "Chung kết" },
];

export default function Rules() {
  return (
    <section id="the-le" className="py-20 lg:py-28">
      <div className="container-x">
        <SectionHeading
          index="02"
          label="Thể lệ"
          title="Bốn vòng, một khung năng lực"
          lead="Đăng ký cá nhân. Ban Tổ chức ghép nhóm và đội hỗn hợp giữa sinh viên trong và ngoài Trường, giữa các ngành học, để mỗi vòng giống một môi trường làm việc thật."
        />

        <ol className="reveal mt-10 grid grid-cols-4 items-end gap-1.5 sm:gap-3" aria-label="Số thí sinh qua từng vòng">
          {funnel.map((f, i) => (
            <li key={f.label} className="flex flex-col">
              <div
                className={`flex items-end px-3 pb-2 font-extrabold text-white ${i === 3 ? "bg-orange" : "bg-navy"}`}
                style={{ height: `${[7, 5.25, 4, 3.25][i]}rem`, opacity: i === 3 ? 1 : 1 - i * 0.18 }}
              >
                <span className="text-2xl sm:text-3xl">{f.n}</span>
              </div>
              <span className="mt-2 font-mono text-[11px] tracking-wider text-muted uppercase sm:text-xs">{f.label}</span>
            </li>
          ))}
        </ol>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {rounds.map((r, i) => (
            <article
              key={r.no}
              className={`reveal flex flex-col overflow-hidden ${r.featured ? "bg-navy text-white" : "bg-cream"}`}
              style={{ "--delay": `${(i % 2) * 100}ms` } as React.CSSProperties}
            >
              <Photo src={r.image} alt={`Minh hoạ ${r.name}`} label={`Vòng ${r.no}`} className="aspect-[16/7] w-full" />
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <p className={`eyebrow ${r.featured ? "text-gold" : "text-rust"}`}>
                  {r.featured ? "Vòng 04 · Chung kết" : `Vòng ${r.no}`}
                </p>
                <h3 className={`mt-2 text-xl font-bold ${r.featured ? "text-white" : "text-navy"}`}>{r.name}</h3>
                <p className={`mt-1 text-xs font-medium ${r.featured ? "text-white/60" : "text-muted"}`}>
                  {r.format} · {r.duration}
                </p>
                <p className={`mt-4 flex-1 text-sm leading-relaxed ${r.featured ? "text-white/80" : "text-muted"}`}>
                  {r.body}
                </p>
                <p
                  className={`mt-5 border-t pt-4 text-sm font-bold ${
                    r.featured ? "border-white/15 text-gold" : "border-line text-navy"
                  }`}
                >
                  {r.funnel}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div className="reveal">
            <p className="eyebrow text-rust">Khung năng lực</p>
            <h3 className="mt-3 text-2xl font-bold text-navy sm:text-3xl">Sáu nhóm năng lực, chấm xuyên suốt</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Mỗi nhóm được mô tả bằng 05 mức hành vi quan sát được. Giám khảo ghi nhận hành vi cụ thể, sau đó quy đổi ra
              điểm theo bảng quy đổi thống nhất do giảng viên Khoa Kinh tế và Quản lý thiết kế.
            </p>
          </div>
          <ol className="grid gap-px bg-line sm:grid-cols-2">
            {competencies.map((c, i) => (
              <li key={c.name} className="reveal bg-white p-5" style={{ "--delay": `${(i % 2) * 80}ms` } as React.CSSProperties}>
                <span className="font-mono text-xs text-orange">{String(i + 1).padStart(2, "0")}</span>
                <h4 className="mt-1 font-bold text-navy">{c.name}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          <aside className="reveal relative overflow-hidden bg-navy-deep p-7 text-white sm:p-9">
            <span aria-hidden className="absolute -right-6 -bottom-10 font-mono text-[9rem] leading-none font-medium text-white/5">
              AI
            </span>
            <p className="eyebrow text-gold">Vòng 3 và Chung kết</p>
            <h3 className="mt-3 text-2xl font-bold">Được dùng AI, nhưng phải giải trình</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Khai báo bạn đã dùng công cụ như thế nào, phần nào là kết quả của công cụ, phần nào là phán đoán của bạn, và
              vì sao giữ hay bác bỏ từng gợi ý. Điểm số tập trung vào phần giải trình.
            </p>
          </aside>
          <aside className="reveal bg-cream p-7 sm:p-9" style={{ "--delay": "100ms" } as React.CSSProperties}>
            <p className="eyebrow text-rust">Nguyên tắc chấm thi</p>
            <ul className="mt-4 space-y-3">
              {judgingRules.map((rule) => (
                <li key={rule} className="flex gap-3 text-sm leading-relaxed text-ink">
                  <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-teal" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M3 8.5l3 3 7-7" />
                  </svg>
                  {rule}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
