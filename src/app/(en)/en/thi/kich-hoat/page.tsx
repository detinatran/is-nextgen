import type { Metadata } from "next";
import CodeFlow from "@/components/exam/CodeFlow";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { pageMetadata } from "@/lib/meta";
import { asset } from "@/lib/paths";

export const metadata: Metadata = { ...pageMetadata("en", "/thi/kich-hoat/", "Activate your exam account"), alternates: { canonical: asset("/en/thi/kich-hoat/") }, robots: { index: false, follow: false } };

export default function Page() {
  return (
    <SiteShell lang="en" cta={false}>
      <PageHero lang="en" eyebrow="Round 1 · Online exam" title="Activate your exam account" />
      <div className="container-x py-16 lg:py-20">
        <CodeFlow mode="activate" />
      </div>
    </SiteShell>
  );
}
