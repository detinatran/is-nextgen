import Link from "next/link";
import Countdown from "@/components/Countdown";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { site } from "@/content/site";
import { asset } from "@/lib/paths";

// Ảnh nền: Vitaly Gariev trên Unsplash (unsplash.com/photos/kp7qkHTgSKc), giấy phép Unsplash
export default function Deadline() {
  return (
    <section id="dem-nguoc" className="bg-white pt-14 pb-2 lg:pt-16">
      <div className="container-x">
        <div className="reveal relative overflow-hidden rounded-3xl bg-navy-deep shadow-2xl shadow-navy/25">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/images/unsplash/countdown-students.webp")}
            alt=""
            loading="lazy"
            className="kenburns absolute inset-0 h-full w-full object-cover object-[50%_30%]"
          />
          <div aria-hidden className="absolute inset-0 bg-linear-to-r from-navy-deep via-navy-deep/85 to-navy/55" />
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_50%,rgb(242_107_29/0.22),transparent_60%)]" />

          <div className="relative grid items-center gap-y-6 p-6 text-white sm:p-8 lg:grid-cols-[1fr_1.15fr] lg:gap-x-12 lg:gap-y-5 lg:px-12 lg:py-10">
            {/* Di động: tiêu đề, đồng hồ, rồi nút. Máy tính: chữ và nút bên trái, đồng hồ bên phải */}
            <div className="lg:self-end">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[13px] font-semibold ring-1 ring-white/20 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-[#4ade80] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ade80]" />
                </span>
                Đang mở đăng ký
              </p>
              <Eyebrow light className="mt-5">
                Thời hạn đăng ký
              </Eyebrow>
              <h2 className="mt-3 text-[1.6rem] leading-tight font-bold sm:text-[2rem]">Cổng đăng ký sẽ đóng sau</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/80 sm:text-base">
                Hạn chót: <strong className="font-semibold text-gold">{site.registrationDeadlineLabel}</strong>. Đăng ký cá nhân, không
                thu lệ phí.
              </p>
            </div>
            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <Countdown deadline={site.registrationDeadline} large />
            </div>
            <div className="flex flex-wrap gap-3 lg:self-start">
              <Link href="/dang-ky/" className="btn-primary cta-pulse px-7 py-3">
                Đăng ký ngay <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link href="/the-le/" className="btn-glass px-6 py-3">
                Xem thể lệ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
