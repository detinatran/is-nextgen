import SectionHeading from "@/components/SectionHeading";
import { organizers, site, sponsorTiers } from "@/content/site";

export default function Partners() {
  const sponsorHref = site.contact.sponsorDeck || (site.contact.email ? `mailto:${site.contact.email}` : "#dang-ky");
  return (
    <section id="dong-hanh" className="py-20 lg:py-28">
      <div className="container-x">
        <SectionHeading index="06" label="Đồng hành" title="Đơn vị tổ chức và đồng hành" />

        <ul className="reveal mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {organizers.map((o) => (
            <li key={o} className="border-l-4 border-navy bg-cream px-4 py-3 text-sm font-semibold text-navy">
              {o}
            </li>
          ))}
        </ul>

        <div className="mt-12 space-y-6">
          {sponsorTiers.map((t) => (
            <div key={t.tier} className="reveal">
              <p className="eyebrow text-muted">{t.tier}</p>
              <div
                className={`mt-2 grid gap-3 ${
                  t.slots === 1 ? "grid-cols-1" : t.slots === 2 ? "sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-4"
                }`}
              >
                {Array.from({ length: t.slots }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-center border border-dashed border-line bg-cream/60 text-xs text-muted ${
                      t.slots === 1 ? "h-28" : t.slots === 2 ? "h-24" : "h-20"
                    }`}
                  >
                    Vị trí logo nhà tài trợ
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <a
          href={sponsorHref}
          className="reveal mt-8 inline-flex items-center gap-2 text-sm font-bold text-navy underline underline-offset-4 hover:text-orange"
        >
          Trở thành đơn vị đồng hành
          <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}
