import type { Metadata } from "next";
import CodeFlow from "@/components/exam/CodeFlow";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { pageMetadata } from "@/lib/meta";
import { asset } from "@/lib/paths";

export const metadata: Metadata = { ...pageMetadata("vi", "/thi/quen-mat-khau/", "Quên mật khẩu"), alternates: { canonical: asset("/thi/quen-mat-khau/") }, robots: { index: false, follow: false } };

export default function Page() {
  return (
    <SiteShell lang="vi" cta={false}>
      <PageHero lang="vi" eyebrow="Vòng 1 · Thi trực tuyến" title="Quên mật khẩu" />
      <div className="container-x py-16 lg:py-20">
        <CodeFlow mode="reset" />
      </div>
    </SiteShell>
  );
}
