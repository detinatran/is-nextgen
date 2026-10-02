import Link from "next/link";
import Art from "@/components/Art";
import Icon, { type IconName } from "@/components/Icon";
import { site } from "@/content/site";
import { asset } from "@/lib/paths";

function CtaBand() {
  return (
    <div className="relative z-10">
      <div className="relative overflow-visible bg-linear-to-r from-[#ff9a3c] via-[#f7812a] to-orange shadow-2xl shadow-orange/30">
        <div className="absolute inset-0 overflow-hidden">
          <Art src="/images/generated/cta-bg.webp" className="pointer-events-none h-full w-full object-cover" />
          {/* Lớp phủ giữ chữ trắng dễ đọc trên các vệt sáng của nền */}
          <div aria-hidden className="absolute inset-0 bg-linear-to-r from-[#f07a24]/70 via-[#f07a24]/35 to-transparent" />
        </div>
        <div className="container-x relative grid items-center gap-5 py-8 lg:grid-cols-[1fr_1.1fr_auto] lg:py-0">
          <div className="lg:py-10">
            <h2 className="text-[1.9rem] font-bold text-white [text-shadow:0_1px_3px_rgb(140_45_0/0.35)] sm:text-[2.4rem]">Đã sẵn sàng bứt phá?</h2>
            <p className="mt-3 max-w-md text-base leading-relaxed font-medium text-white [text-shadow:0_1px_2px_rgb(140_45_0/0.35)] sm:text-[17px]">
              Hãy trở thành một phần của IS-NextGen Manager 2026 và viết nên hành trình quản trị của riêng bạn!
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
          <Link href="/dang-ky/" className="btn-white w-max px-8 py-3.5 text-base">
            Đăng ký ngay <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

const linkCls = "text-[15px] text-white/85 transition hover:text-white";
const socialIcons: IconName[] = ["facebook", "linkedin", "youtube", "tiktok"];

export default function Footer({ cta = true }: { cta?: boolean }) {
  const { email, phone } = site.contact;
  const contactHref = email ? `mailto:${email}` : "/#hoi-dap";
  return (
    <>
      {cta && <CtaBand />}
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
                {site.address}
              </li>
              <li className="flex gap-2.5">
                <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                {email ? (
                  <a href={`mailto:${email}`} className="hover:text-white">
                    {email}
                  </a>
                ) : (
                  <span className="text-white/65">Email Ban Tổ chức (sắp cập nhật)</span>
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
                  <span key={name} className="text-white/50" title="Sắp cập nhật">
                    <Icon name={name} className="h-5 w-5" />
                  </span>
                );
              })}
            </div>
          </div>

          <nav aria-label="Liên kết">
            <p className="text-base font-semibold text-gold">Liên kết</p>
            <ul className="mt-4 space-y-2.5">
              {[
                ["/#top", "Trang chủ"],
                ["/#gioi-thieu", "Giới thiệu"],
                ["/the-le/", "Thể lệ"],
                ["/#giai-thuong", "Giải thưởng"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className={linkCls}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Hỗ trợ">
            <p className="text-base font-semibold text-gold">Hỗ trợ</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/#hoi-dap" className={linkCls}>
                  FAQ
                </Link>
              </li>
              <li>
                <a href={contactHref} className={linkCls}>
                  Liên hệ
                </a>
              </li>
              <li>
                <Link href="/the-le/" className={linkCls}>
                  Điều khoản & thể lệ
                </Link>
              </li>
              <li>
                <Link href="/ket-qua/" className={linkCls}>
                  Kết quả
                </Link>
              </li>
            </ul>
          </nav>

          <p
            aria-hidden
            className="hidden -rotate-[10deg] self-end pr-10 text-right font-script text-5xl leading-[0.95] text-white/90 drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] lg:block"
          >
            Be the
            <br />
            &nbsp;&nbsp;&nbsp;NextGen
          </p>
        </div>
        <div className="container-x relative">
          <div className="border-t border-white/15 py-5 text-center text-[13px] text-white/70">© 2026 IS-NextGen Manager. All rights reserved.</div>
        </div>
      </footer>
    </>
  );
}
