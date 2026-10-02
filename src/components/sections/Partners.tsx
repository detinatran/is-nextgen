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
  // Mỗi bản lặp phải rộng hơn màn hình để băng chuyền không hở khoảng trống
  const row = items.length < 10 ? [...items, ...items] : items;

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
      </div>

      {/* Băng chuyền: danh sách lặp 2 lần, chạy sang trái liên tục, dừng khi rê chuột */}
      <div className="marquee reveal mt-8" aria-label={t.eyebrow}>
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 gap-4 pr-4" aria-hidden={copy === 1 || undefined}>
              {row.map((p, i) =>
                p.kind === "slot" ? (
                  <li
                    key={i}
                    className="flex h-28 w-48 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-orange/30 bg-cream/60 px-3 text-center"
                  >
                    <Icon name="handshake" className="h-6 w-6 text-orange/70" />
                    <span className="mt-2 text-[13px] font-semibold text-muted">{p.name}</span>
                    <span className="text-xs text-muted">{t.updating}</span>
                  </li>
                ) : (
                  <li key={i} className="card flex h-28 w-48 shrink-0 flex-col items-center justify-center gap-2 rounded-xl px-3 text-center transition hover:border-orange/40">
                    {p.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset(p.logo)} alt="" className={`h-11 w-auto max-w-full object-contain ${p.ink ? "logo-ink" : ""}`} />
                    ) : (
                      <Icon name="landmark" className="h-7 w-7 text-navy-soft" strokeWidth={1.5} />
              )}
                    <span className="text-[13px] leading-tight font-semibold text-navy">{p.name}</span>
                  </li>
                ),
              )}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
