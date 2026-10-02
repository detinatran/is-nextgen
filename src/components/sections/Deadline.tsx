import Link from "next/link";
import Countdown from "@/components/Countdown";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { site } from "@/content/site";

export default function Deadline() {
  return (
    <section id="dem-nguoc" className="bg-white pt-16 pb-4 lg:pt-20">
      <div className="container-x">
        <div className="reveal grid items-center gap-y-8 rounded-3xl border border-line bg-cream p-6 sm:p-10 lg:grid-cols-[1fr_1.5fr] lg:gap-x-14 lg:gap-y-7 lg:p-12">
          {/* Di động: tiêu đề, đồng hồ, rồi nút. Máy tính: chữ và nút bên trái, đồng hồ bên phải */}
          <div className="lg:self-end">
            <Eyebrow>Thời hạn đăng ký</Eyebrow>
            <h2 className="h2-section mt-4">Cổng đăng ký sẽ đóng sau</h2>
            <p className="lead mt-4">
              Hạn chót:{" "}
              <strong className="font-semibold text-navy">
                {site.registrationDeadlineLabel}
              </strong>
              . Đăng ký cá nhân, không thu lệ phí.
            </p>
          </div>
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <Countdown deadline={site.registrationDeadline} large />
          </div>
          <div className="flex flex-wrap gap-3 lg:self-start">
            <Link
              href="/dang-ky/"
              className="btn-primary px-8 py-3.5 text-base"
            >
              Đăng ký ngay <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link href="/the-le/" className="btn-outline px-7 py-3.5 text-base">
              Xem thể lệ
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
