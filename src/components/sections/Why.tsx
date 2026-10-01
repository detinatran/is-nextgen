import Photo from "@/components/Photo";
import SectionHeading from "@/components/SectionHeading";
import { eligibility, eligibilityNote, highlights, site } from "@/content/site";

const accents = ["border-navy", "border-gold", "border-orange", "border-teal"];

export default function Why() {
  return (
    <>
      <section id="gioi-thieu" className="bg-cream py-20 lg:py-28">
        <div className="container-x">
          <SectionHeading
            index="01"
            label="Vì sao khác biệt"
            title={
              <>
                Cuộc thi đo năng lực điều hành,
                <br className="hidden sm:block" /> không đo ý tưởng
              </>
            }
            lead="Trường Quốc tế đã có sân chơi cho nghiên cứu, khởi nghiệp và công nghệ tài chính. IS-NextGen Manager là cuộc thi đầu tiên tập trung vào năng lực quản lý và điều hành tổ chức, nhóm năng lực mà doanh nghiệp cần nhất."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((h, i) => (
              <article
                key={h.title}
                className={`reveal border-t-4 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg ${accents[i % 4]}`}
                style={{ "--delay": `${(i % 4) * 80}ms` } as React.CSSProperties}
              >
                <p className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-lg leading-snug font-bold text-navy">{h.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{h.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:items-center">
          <Photo
            src="/images/generated/about.webp"
            alt="Giảng viên hướng dẫn nhóm sinh viên phân tích tình huống quản trị"
            label={site.themeEn}
            className="reveal aspect-[4/3] w-full"
          />
          <div className="reveal" style={{ "--delay": "120ms" } as React.CSSProperties}>
            <p className="eyebrow text-rust">Chủ đề mùa I</p>
            <h2 className="mt-3 text-3xl leading-tight font-bold text-navy sm:text-4xl">{site.theme}</h2>
            <p className="mt-2 font-mono text-sm text-muted">“{site.themeEn}”</p>
            <p className="mt-6 leading-relaxed text-muted">
              Năng lực quản trị hình thành qua những lần ra quyết định khi thông tin không đầy đủ và nguồn lực hạn chế.
              Cuộc thi đặt bạn vào đúng những tình huống đó, rồi trả lại cho bạn một bản đánh giá năng lực cụ thể.
            </p>

            <h3 className="mt-8 text-lg font-bold text-navy">Ai được tham gia?</h3>
            <ul className="mt-3 space-y-2">
              {eligibility.map((e) => (
                <li key={e} className="flex gap-3 text-sm leading-relaxed text-ink">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 bg-orange" />
                  {e}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-l-4 border-gold bg-cream px-4 py-3 text-sm leading-relaxed text-muted">
              {eligibilityNote}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
