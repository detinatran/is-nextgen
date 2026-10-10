import Link from "next/link";
import Art from "@/components/Art";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";

export default function Faq({ lang }: { lang: Lang }) {
  const { faqs, site } = getContent(lang);
  const c = site.contact;
  const en = lang === "en";
  return (
    <section id="hoi-dap" className="relative overflow-hidden bg-white py-16 pb-24 lg:py-20 lg:pb-28">
      <Art src="/images/generated/deco-clouds.webp" className="pointer-events-none absolute inset-x-0 bottom-0 h-64 w-full object-cover object-bottom opacity-70 blur-[2px] [mask-image:linear-gradient(to_bottom,transparent,black_55%)]" />
      <div className="container-x relative grid items-start gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div className="reveal">
          <span aria-hidden className="block h-1.5 w-14 rounded-full bg-linear-to-r from-orange to-[#ffb057]" />
          <h2 className="h2-section mt-4">{en ? "Answers to your questions" : "Giải đáp những thắc mắc của bạn"}</h2>
          <p className="lead mt-4">
            {en ? "Common questions about NextGen Manager 2026. Need more? See the" : "Những câu hỏi thường gặp về cuộc thi NextGen Manager 2026. Cần thêm? Xem"}{" "}
            <Link href={localePath(lang, "/the-le/")} className="font-semibold text-orange-ink underline-offset-4 hover:underline">
              {en ? "full rules" : "thể lệ chi tiết"}
            </Link>{" "}
            {en ? "or contact the Organizing Committee." : "hoặc liên hệ Ban Tổ chức."}
          </p>
          {/* FR-1.4: liên hệ Ban Tổ chức */}
          <div data-tour="contact" className="mt-6 space-y-3 rounded-2xl bg-white/90 p-5 shadow-sm ring-1 ring-line backdrop-blur-sm">
            <p className="text-sm font-bold text-navy">{en ? "Contact the Organizing Committee" : "Liên hệ Ban Tổ chức"}</p>
            {c.hotlines.map((h) => (
              <a key={h.phone} href={`tel:${h.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-[15px] text-ink hover:text-orange-ink">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff1e6] text-orange">
                  <Icon name="phone" className="h-4 w-4" />
                </span>
                <span>
                  <span className="font-semibold">Hotline {h.phone}</span>
                  <span className="block text-[13px] text-muted">{h.name}</span>
                </span>
              </a>
            ))}
            {c.email && (
              <a href={`mailto:${c.email}`} className="flex items-center gap-3 text-[15px] text-ink hover:text-orange-ink">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff1e6] text-orange">
                  <Icon name="mail" className="h-4 w-4" />
                </span>
                {c.email}
              </a>
            )}
            {c.fanpage && (
              <a href={c.fanpage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[15px] text-ink hover:text-orange-ink">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff1e6] text-orange">
                  <Icon name="facebook" className="h-4 w-4" />
                </span>
                {en ? "Fanpage NextGen Manager" : "Fanpage NextGen Manager"}
              </a>
            )}
          </div>
        </div>
        <div className="reveal space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-white/95 shadow-sm ring-1 ring-line backdrop-blur-sm transition duration-300 hover:ring-orange/30 open:shadow-card">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-base font-semibold text-navy [&::-webkit-details-marker]:hidden">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-brand">
                  <Icon name={f.icon} className="h-4 w-4" />
                </span>
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
