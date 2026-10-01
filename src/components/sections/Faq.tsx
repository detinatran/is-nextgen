import SectionHeading from "@/components/SectionHeading";
import { faqs } from "@/content/site";

export default function Faq() {
  return (
    <section id="hoi-dap" className="bg-cream py-20 lg:py-28">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_2fr]">
        <SectionHeading index="07" label="Hỏi đáp" title="Câu hỏi thường gặp" />
        <div className="reveal divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold text-navy [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center border border-navy/20 text-lg transition group-open:rotate-45 group-open:bg-navy group-open:text-white"
                >
                  +
                </span>
              </summary>
              <p className="pb-5 pr-10 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
