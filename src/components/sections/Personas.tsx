import Eyebrow from "@/components/Eyebrow";
import { personas } from "@/content/site";

export default function Personas() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_2fr]">
        <div className="reveal lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>Chân dung nhà quản trị</Eyebrow>
          <h2 className="h2-section mt-4">Bạn có phải nhà quản trị chúng tôi đang tìm?</h2>
          <p className="lead mt-4">
            Sáu nhóm năng lực được chấm xuyên suốt bốn vòng thi. Mỗi nhóm có năm mức hành vi quan sát được.
          </p>
        </div>
        <ol className="grid gap-x-10 sm:grid-cols-2">
          {personas.map((p, i) => (
            <li key={p.title} className="reveal border-t border-line py-6" style={{ "--delay": `${(i % 2) * 80}ms` } as React.CSSProperties}>
              <span className="text-sm font-semibold text-orange-ink tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 text-lg font-bold text-navy">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
