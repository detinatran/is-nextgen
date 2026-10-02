import Link from "next/link";
import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { faqs } from "@/content/site";

export default function Faq() {
  return (
    <section id="hoi-dap" className="relative overflow-hidden bg-white pt-12 pb-24">
      <Art src="/images/generated/deco-clouds.webp" className="pointer-events-none absolute inset-x-0 bottom-0 h-72 w-full object-cover object-bottom opacity-80 blur-[2px] [mask-image:linear-gradient(to_bottom,transparent,black_60%)]" />
      <div className="container-x relative grid items-start gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div className="reveal">
          <Eyebrow>Câu hỏi thường gặp</Eyebrow>
          <h2 className="h2-section mt-4">Giải đáp những thắc mắc của bạn</h2>
          <p className="lead mt-4">
            Chưa thấy câu trả lời? Xem{" "}
            <Link href="/the-le/" className="font-semibold text-orange-ink underline-offset-4 hover:underline">
              thể lệ chi tiết
            </Link>{" "}
            hoặc liên hệ Ban Tổ chức.
          </p>
        </div>
        <div className="reveal space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-xl border border-[#eadfce] bg-[#fbf6ef] transition open:bg-white open:shadow-card">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-base font-semibold text-navy [&::-webkit-details-marker]:hidden">
                <Icon name={f.icon} className="h-5 w-5 shrink-0 text-orange-ink" />
                <span className="flex-1">{f.q}</span>
                <Icon name="plus" className="h-5 w-5 shrink-0 text-navy-soft transition group-open:rotate-45 group-open:text-orange" strokeWidth={2} />
              </summary>
              <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted sm:pl-13">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
