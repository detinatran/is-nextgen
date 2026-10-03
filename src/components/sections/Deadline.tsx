import Link from "next/link";
import Countdown from "@/components/Countdown";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

// Ảnh nền: Vitaly Gariev trên Unsplash (unsplash.com/photos/kp7qkHTgSKc), giấy phép Unsplash
const text = {
  vi: { title: "Cổng đăng ký sẽ đóng sau", lead: "Đừng bỏ lỡ cơ hội trở thành một phần của IS-NextGen Manager 2026!", deadline: "Hạn chót", register: "Đăng ký ngay", rules: "Xem chi tiết" },
  en: { title: "Registration closes in", lead: "Don't miss your chance to be part of IS-NextGen Manager 2026!", deadline: "Deadline", register: "Register now", rules: "View details" },
};

export default function Deadline({ lang }: { lang: Lang }) {
  const { site } = getContent(lang);
  const t = text[lang];
  return (
    <section id="dem-nguoc" className="relative bg-white pt-8 pb-2 lg:pt-10">
      <div className="container-x">
        <div className="reveal relative overflow-hidden rounded-3xl border border-line bg-cream shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/images/unsplash/countdown-students.webp")}
            alt=""
            loading="lazy"
            className="kenburns absolute inset-0 h-full w-full object-cover object-[50%_30%] opacity-60"
          />
          {/* Phủ sáng: chữ bên trái nằm trên nền kem, ảnh lộ dần sang phải */}
          <div aria-hidden className="absolute inset-0 bg-linear-to-r from-[#fff8ef] via-[#fff8ef]/92 to-white/45" />
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_50%,rgb(242_107_29/0.12),transparent_60%)]" />

          <div className="relative grid items-center gap-y-6 p-6 text-navy sm:p-8 lg:grid-cols-[1fr_1.15fr] lg:gap-x-12 lg:gap-y-5 lg:px-12 lg:py-10">
            {/* Di động: tiêu đề, đồng hồ, rồi nút. Máy tính: chữ và nút bên trái, đồng hồ bên phải */}
            <div className="lg:self-end">
              <h2 className="text-[1.6rem] leading-tight font-bold text-navy sm:text-[2rem]">{t.title}</h2>
              <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted sm:text-base">{t.lead}</p>
              <p className="mt-1 text-sm text-muted">
                {t.deadline}: <strong className="font-semibold text-orange-ink">{site.registrationDeadlineLabel}</strong>
              </p>
            </div>
            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <Countdown lang={lang} deadline={site.registrationDeadline} large />
            </div>
            <div className="flex flex-wrap gap-3 lg:self-start">
              <Link href={localePath(lang, "/dang-ky/")} className="btn-primary cta-pulse px-7 py-3">
                {t.register} <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link href={localePath(lang, "/the-le/")} className="btn bg-white px-6 py-3 text-navy shadow-sm hover:shadow-md">
                {t.rules}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
