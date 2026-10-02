import Link from "next/link";
import Countdown from "@/components/Countdown";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import { type Lang, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

// Ảnh nền: Vitaly Gariev trên Unsplash (unsplash.com/photos/kp7qkHTgSKc), giấy phép Unsplash
const text = {
  vi: { open: "Đang mở đăng ký", eyebrow: "Thời hạn đăng ký", title: "Cổng đăng ký sẽ đóng sau", deadline: "Hạn chót", note: "Đăng ký cá nhân, không thu lệ phí.", register: "Đăng ký ngay", rules: "Xem thể lệ" },
  en: { open: "Registration open", eyebrow: "Registration deadline", title: "Registration closes in", deadline: "Deadline", note: "Individual entry, free of charge.", register: "Register now", rules: "View rules" },
};

export default function Deadline({ lang }: { lang: Lang }) {
  const { site } = getContent(lang);
  const t = text[lang];
  return (
    <section id="dem-nguoc" className="bg-white pt-14 pb-2 lg:pt-16">
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
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-[#15803d] shadow-sm ring-1 ring-[#4ade80]/40">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-[#4ade80] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ade80]" />
                </span>
                {t.open}
              </p>
              <Eyebrow className="mt-5">
                {t.eyebrow}
              </Eyebrow>
              <h2 className="mt-3 text-[1.6rem] leading-tight font-bold text-navy sm:text-[2rem]">{t.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted sm:text-base">
                {t.deadline}: <strong className="font-semibold text-orange-ink">{site.registrationDeadlineLabel}</strong>. {t.note}
              </p>
            </div>
            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <Countdown lang={lang} deadline={site.registrationDeadline} large />
            </div>
            <div className="flex flex-wrap gap-3 lg:self-start">
              <Link href={localePath(lang, "/dang-ky/")} className="btn-primary cta-pulse px-7 py-3">
                {t.register} <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link href={localePath(lang, "/the-le/")} className="btn-outline bg-white/70 px-6 py-3">
                {t.rules}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
