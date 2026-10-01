import { site } from "@/content/site";
import { asset } from "@/lib/paths";

function ContactLine({ value, href, placeholder }: { value: string; href?: string; placeholder: string }) {
  if (!value) return <li className="text-white/40">{placeholder}</li>;
  return (
    <li>
      <a href={href ?? value} className="hover:text-gold" target={href ? undefined : "_blank"} rel="noopener noreferrer">
        {value}
      </a>
    </li>
  );
}

export default function Footer() {
  const { email, phone, fanpage, sponsorDeck } = site.contact;
  return (
    <footer className="bg-navy-deep py-14 text-sm text-white/75">
      <div className="container-x grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
        <div className="flex gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/images/crest.png")} alt="" className="h-14 w-auto shrink-0" />
          <div>
            <p className="font-extrabold tracking-wide text-white uppercase">{site.name}</p>
            <p className="mt-2 max-w-sm leading-relaxed">{site.address}</p>
          </div>
        </div>
        <div>
          <p className="font-semibold text-gold">Liên hệ</p>
          <ul className="mt-3 space-y-2">
            <ContactLine value={email} href={`mailto:${email}`} placeholder="Email Ban Tổ chức (sắp cập nhật)" />
            <ContactLine value={phone} href={`tel:${phone.replace(/\s/g, "")}`} placeholder="Số điện thoại (sắp cập nhật)" />
          </ul>
        </div>
        <div>
          <p className="font-semibold text-gold">Theo dõi</p>
          <ul className="mt-3 space-y-2">
            {fanpage ? <ContactLine value="Fanpage cuộc thi" href={fanpage} placeholder="" /> : <li className="text-white/40">Fanpage (sắp cập nhật)</li>}
            {sponsorDeck ? (
              <ContactLine value="Hồ sơ mời tài trợ" href={sponsorDeck} placeholder="" />
            ) : (
              <li className="text-white/40">Hồ sơ mời tài trợ (sắp cập nhật)</li>
            )}
            <li className="font-mono text-gold/80">{site.hashtag}</li>
          </ul>
        </div>
      </div>
      <div className="container-x mt-10 border-t border-white/10 pt-6 text-xs text-white/45">
        © 2026 Khoa Kinh tế và Quản lý, Trường Quốc tế - ĐHQGHN.
      </div>
    </footer>
  );
}
