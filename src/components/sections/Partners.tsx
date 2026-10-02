import Carousel from "@/components/Carousel";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";
import { asset } from "@/lib/paths";

export default function Partners({ lang }: { lang: Lang }) {
  const { partners, site, sponsors } = getContent(lang);
  const t =
    lang === "en"
      ? { slot: "Sponsor", eyebrow: "Organizers and partners", sub: "Shaping the next generation of managers together", become: "Become a sponsor", updating: "Coming soon" }
      : { slot: "Nhà tài trợ", eyebrow: "Đơn vị tổ chức và đồng hành", sub: "Cùng nhau kiến tạo thế hệ quản trị tương lai", become: "Trở thành nhà tài trợ", updating: "Đang cập nhật" };
  const sponsorHref = site.contact.sponsorDeck || (site.contact.email ? `mailto:${site.contact.email}` : "");
  const items = [
    ...partners.map((p) => ({ ...p, kind: "partner" as const })),
    ...sponsors.map((s) => ({ ...s, ink: false, kind: "sponsor" as const })),
    ...(sponsors.length ? [] : [{ name: t.slot, kind: "slot" as const }, { name: t.slot, kind: "slot" as const }]),
  ];

  return (
    <section id="dong-hanh" className="bg-white pt-16 pb-8">
      <div className="container-x">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <p className="mt-2 text-base text-muted">{t.sub}</p>
          </div>
          {sponsorHref && (
            <a href={sponsorHref} className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-orange-ink hover:gap-2.5">
              {t.become} <Icon name="arrowRight" className="h-4 w-4" />
            </a>
          )}
        </div>

        <div className="reveal mt-6 -mx-2 sm:mx-0 lg:-mx-2">
          <Carousel lang={lang} label={t.eyebrow} slideClassName="w-1/2 px-2 sm:w-1/3 lg:w-1/6">
            {items.map((p, i) =>
              p.kind === "slot" ? (
                <div
                  key={`slot-${i}`}
                  className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-orange/30 bg-cream/60 px-3 text-center"
                >
                  <Icon name="handshake" className="h-6 w-6 text-orange/70" />
                  <span className="mt-2 text-[13px] font-semibold text-muted">{p.name}</span>
                  <span className="text-xs text-muted">{t.updating}</span>
                </div>
              ) : (
                <div key={p.name} className="card flex h-28 flex-col items-center justify-center gap-2 rounded-xl px-3 text-center shadow-none">
                  {p.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset(p.logo)} alt="" className={`h-11 w-auto max-w-full object-contain ${p.ink ? "logo-ink" : ""}`} />
                  ) : (
                    <Icon name="landmark" className="h-7 w-7 text-navy-soft" strokeWidth={1.5} />
                  )}
                  <span className="text-[13px] leading-tight font-semibold text-navy">{p.name}</span>
                </div>
              ),
            )}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
