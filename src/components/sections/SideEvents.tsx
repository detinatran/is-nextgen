import Photo from "@/components/Photo";
import { sideEvents } from "@/content/site";

export default function SideEvents() {
  return (
    <section className="bg-cream py-20 lg:py-28">
      <div className="container-x">
        <div className="reveal max-w-3xl">
          <p className="eyebrow text-rust">Ngoài phòng thi</p>
          <h2 className="mt-3 text-3xl leading-tight font-bold text-balance text-navy sm:text-4xl">
            Gặp doanh nghiệp trước khi bước vào nghề
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {sideEvents.map((e, i) => (
            <article
              key={e.tag}
              className="reveal group overflow-hidden bg-white"
              style={{ "--delay": `${i * 100}ms` } as React.CSSProperties}
            >
              <Photo src={e.image} alt={e.title} label={e.tag} className="aspect-[16/9] w-full" />
              <div className="p-6 sm:p-8">
                <p className="eyebrow text-orange">{e.tag}</p>
                <h3 className="mt-2 text-2xl font-bold text-navy">{e.title}</h3>
                <dl className="mt-4 grid gap-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-navy">Thời gian:</dt>
                    <dd className="text-muted">{e.when}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-navy">Thành phần:</dt>
                    <dd className="text-muted">{e.who}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm leading-relaxed text-muted">{e.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
