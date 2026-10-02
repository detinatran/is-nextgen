import Link from "next/link";
import { Fragment } from "react";
import Art from "@/components/Art";
import Icon, { type IconName } from "@/components/Icon";
import LangSwitch from "@/components/LangSwitch";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

const text = {
  vi: {
    ctaTitle: "Đã sẵn sàng bứt phá?",
    ctaBody: "Hãy trở thành một phần của IS-NextGen Manager 2026 và viết nên hành trình quản trị của riêng bạn!",
    register: "Đăng ký ngay",
    emailSoon: "Email Ban Tổ chức (sắp cập nhật)",
    soon: "Sắp cập nhật",
    links: "Liên kết",
    support: "Hỗ trợ",
    linkItems: [["/#top", "Trang chủ"], ["/#gioi-thieu", "Giới thiệu"], ["/the-le/", "Thể lệ"], ["/#giai-thuong", "Giải thưởng"]],
    contact: "Liên hệ",
    terms: "Điều khoản & thể lệ",
    results: "Kết quả",
    language: "Ngôn ngữ",
    qrTitle: "Quét mã để truy cập",
    qrAlt: "Mã QR dẫn tới nextgen.vnuis.edu.vn",
    qrDownload: "Tải mã QR",
  },
  en: {
    ctaTitle: "Ready to break through?",
    ctaBody: "Become part of IS-NextGen Manager 2026 and write your own management journey!",
    register: "Register now",
    emailSoon: "Organizing Committee email (coming soon)",
    soon: "Coming soon",
    links: "Links",
    support: "Support",
    linkItems: [["/#top", "Home"], ["/#gioi-thieu", "About"], ["/the-le/", "Rules"], ["/#giai-thuong", "Prizes"]],
    contact: "Contact",
    terms: "Terms & rules",
    results: "Results",
    language: "Language",
    qrTitle: "Scan to visit",
    qrAlt: "QR code linking to nextgen.vnuis.edu.vn",
    qrDownload: "Download QR code",
  },
};

function CtaBand({ lang }: { lang: Lang }) {
  const t = text[lang];
  return (
    <div className="relative z-10">
      <div className="relative overflow-visible bg-orange">
        <div className="container-x relative grid items-center gap-5 py-8 lg:grid-cols-[1fr_1.1fr_auto] lg:py-0">
          <div className="lg:py-10">
            <h2 className="text-[1.9rem] font-bold text-white sm:text-[2.4rem]">{t.ctaTitle}</h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-white/95 sm:text-[17px]">
              {t.ctaBody}
            </p>
          </div>
          <div className="relative hidden self-stretch lg:block">
            <svg aria-hidden viewBox="0 0 160 60" className="absolute top-6 -left-16 h-12 w-32 text-white/85" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M2 44c30-2 52-10 74-22 18-10 34 2 22 14s-30-2-12-14c14-9 36-12 58-6" />
              <path d="M140 12l6 4-7 3" />
            </svg>
            {/* Ảnh sinh viên nhô lên khỏi mép trên của dải */}
            <Art
              src="/images/generated/cta-students.webp"
              className="pointer-events-none absolute inset-x-0 -top-14 bottom-0 h-[calc(100%+3.5rem)] w-full object-cover object-[50%_18%] [mask-image:linear-gradient(90deg,transparent,black_7%,black_93%,transparent)]"
            />
          </div>
          <Link href={localePath(lang, "/dang-ky/")} className="btn-white w-max px-8 py-3.5 text-base">
            {t.register} <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

const linkCls = "text-[15px] text-white/85 transition hover:text-white";
const socialIcons: IconName[] = ["facebook", "linkedin", "youtube", "tiktok"];

export default function Footer({ lang, cta = true }: { lang: Lang; cta?: boolean }) {
  const { site } = getContent(lang);
  const t = text[lang];
  const href = (path: string) => localePath(lang, path);
  const { email, phone } = site.contact;
  const contactHref = email ? `mailto:${email}` : href("/#hoi-dap");
  return (
    <>
      {cta && <CtaBand lang={lang} />}
      <footer
        className={`band-fallback relative overflow-hidden bg-cover bg-right text-white pt-14`}
        style={{
          backgroundImage: `linear-gradient(90deg, rgb(7 21 51) 35%, rgb(7 21 51 / 0.85) 55%, rgb(7 21 51 / 0.35)), url(${asset("/images/generated/footer-bg.webp")})`,
        }}
      >
        <div className="container-x relative grid gap-10 pb-8 md:grid-cols-[1.4fr_0.6fr_0.8fr] lg:grid-cols-[1.3fr_0.5fr_0.7fr_1.2fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/images/logo-white.png")} alt={site.name} className="h-11 w-auto" />
            <p className="mt-3 text-base text-white/90">{site.tagline}</p>
            <ul className="mt-5 space-y-3 text-[15px] text-white/85">
              <li className="flex gap-2.5">
                <Icon name="mapPin" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span className="space-y-1">
                  <span className="block">
                    {site.address.unit.map((part) => (
                      <Fragment key={part}>
                        <span className="whitespace-nowrap">{part}</span>{" "}
                      </Fragment>
                    ))}
                  </span>
                  <span className="block text-white/70">
                    {site.address.street.map((part) => (
                      <Fragment key={part}>
                        <span className="whitespace-nowrap">{part}</span>{" "}
                      </Fragment>
                    ))}
                  </span>
                </span>
              </li>
              <li className="flex gap-2.5">
                <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {email ? (
                  <a href={`mailto:${email}`} className="hover:text-white">
                    {email}
                  </a>
                ) : (
                  <span className="text-white/65">{t.emailSoon}</span>
                )}
              </li>
              {phone && (
                <li className="flex gap-2.5">
                  <Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white">
                    {phone}
                  </a>
                </li>
              )}
            </ul>
            <div className="mt-5 flex gap-5">
              {socialIcons.map((name) => {
                const url = site.socials[name as keyof typeof site.socials];
                return url ? (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name} className="text-white/80 transition hover:text-orange">
                    <Icon name={name} className="h-5 w-5" />
                  </a>
                ) : (
                  <span key={name} className="text-white/50" title={t.soon}>
                    <Icon name={name} className="h-5 w-5" />
                  </span>
                );
              })}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <span className="text-[13px] text-white/70">{t.language}</span>
              <LangSwitch />
            </div>
          </div>

          <nav aria-label={t.links}>
            <p className="text-base font-semibold text-gold">{t.links}</p>
            <ul className="mt-4 space-y-2.5">
              {t.linkItems.map(([path, label]) => (
                <li key={path}>
                  <Link href={href(path)} className={linkCls}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t.support}>
            <p className="text-base font-semibold text-gold">{t.support}</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href={href("/#hoi-dap")} className={linkCls}>
                  FAQ
                </Link>
              </li>
              <li>
                <a href={contactHref} className={linkCls}>
                  {t.contact}
                </a>
              </li>
              <li>
                <Link href={href("/the-le/")} className={linkCls}>
                  {t.terms}
                </Link>
              </li>
              <li>
                <Link href={href("/ket-qua/")} className={linkCls}>
                  {t.results}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex flex-col gap-8 md:col-span-3 lg:col-span-1 lg:items-end">
            <div className="flex w-max items-center gap-4 rounded-2xl bg-white/10 p-3 pr-5 ring-1 ring-white/15 backdrop-blur-sm">
              {/* Nền trắng và lề quanh mã để máy ảnh điện thoại quét được */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("/images/qr-nextgen.png")} alt={t.qrAlt} width={112} height={112} className="h-28 w-28 rounded-lg bg-white p-1.5" />
              <div>
                <p className="text-[15px] font-semibold text-white">{t.qrTitle}</p>
                <p className="mt-0.5 text-[13px] text-white/70">nextgen.vnuis.edu.vn</p>
                <a
                  href={asset("/images/qr-nextgen.png")}
                  download="IS-NextGen-Manager-QR.png"
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-gold hover:text-white"
                >
                  <Icon name="arrowUp" className="h-3.5 w-3.5 rotate-180" strokeWidth={2.2} />
                  {t.qrDownload}
                </a>
              </div>
            </div>
            <p
              aria-hidden
              className="hidden -rotate-[10deg] pr-10 text-right font-script text-5xl leading-[0.95] text-white/90 drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] lg:block"
            >
              Be the
              <br />
              &nbsp;&nbsp;&nbsp;NextGen
            </p>
          </div>
        </div>
        <div className="container-x relative">
          <div className="border-t border-white/15 py-5 text-center text-[13px] text-white/70">© 2026 IS-NextGen Manager. All rights reserved.</div>
        </div>
      </footer>
    </>
  );
}
