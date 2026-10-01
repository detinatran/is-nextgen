import type { Metadata } from "next";
import Countdown from "@/components/Countdown";
import Icon from "@/components/Icon";
import PageHero from "@/components/PageHero";
import RegisterForm from "@/components/RegisterForm";
import SiteShell from "@/components/SiteShell";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Đăng ký dự thi | IS-NextGen Manager Challenge 2026" };

const checklist = [
  "Thông tin cá nhân và mã số sinh viên",
  "Video tối đa 90 giây giới thiệu bản thân và trả lời câu hỏi tình huống do Ban Tổ chức công bố",
  "Link video để chế độ ai có link đều xem được (Google Drive hoặc YouTube không công khai)",
  "Thẻ sinh viên hoặc giấy xác nhận để xuất trình ở các vòng thi trực tiếp",
];

export default function RegisterPage() {
  return (
    <SiteShell cta={false}>
      <PageHero
        eyebrow="Mùa I · 2026"
        title="Đăng ký dự thi"
        lead="Đăng ký cá nhân, không thu lệ phí. Ban Tổ chức sẽ gửi email xác nhận và hướng dẫn làm bài Vòng Đơn."
      />
      <div className="container-x grid gap-8 py-16 lg:grid-cols-[1fr_1.4fr] lg:py-20">
        <div className="space-y-6">
          <div className="rounded-2xl bg-linear-to-br from-navy to-navy-soft p-6 text-white shadow-card">
            <p className="text-center text-[13px] font-semibold tracking-[0.15em] text-white uppercase">Thời hạn đăng ký</p>
            <div className="mt-4">
              <Countdown deadline={site.registrationDeadline} />
            </div>
            <p className="mt-3 text-center text-[13px] text-white/75">{site.registrationDeadlineLabel}</p>
          </div>
          <div className="card p-6">
            <h2 className="font-bold text-navy">Bạn cần chuẩn bị</h2>
            <ul className="mt-4 space-y-3">
              {checklist.map((c) => (
                <li key={c} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-orange" strokeWidth={2.2} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <RegisterForm deadline={site.registrationDeadline} />
      </div>
    </SiteShell>
  );
}
