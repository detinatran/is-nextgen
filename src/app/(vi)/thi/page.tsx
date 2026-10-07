import type { Metadata } from "next";
import ExamPortal from "@/components/exam/ExamPortal";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { pageMetadata } from "@/lib/meta";
import { asset } from "@/lib/paths";

export const metadata: Metadata = { ...pageMetadata("vi", "/thi/", "Vòng 1 thi trực tuyến"), alternates: { canonical: asset("/thi/") } };

export default function Page() {
  return (
    <SiteShell lang="vi" cta={false}>
      <PageHero lang="vi" eyebrow="Vòng 1 · Thi trực tuyến" title="Vòng 1 thi trực tuyến" lead="Đăng nhập bằng tài khoản Ban Tổ chức gửi qua email, kiểm tra ca thi và vào làm bài trắc nghiệm 60 phút." />
      <div className="container-x py-16 lg:py-20">
        <ExamPortal />
      </div>
    </SiteShell>
  );
}
