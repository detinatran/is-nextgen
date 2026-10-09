import type { Metadata } from "next";
import ExamPortal from "@/components/exam/ExamPortal";
import PageHero from "@/components/PageHero";
import SiteShell from "@/components/SiteShell";
import { pageMetadata } from "@/lib/meta";
import { asset } from "@/lib/paths";

export const metadata: Metadata = { ...pageMetadata("en", "/thi/", "Round 1 online exam"), alternates: { canonical: asset("/en/thi/") }, robots: { index: false, follow: false } };

export default function Page() {
  return (
    <SiteShell lang="en" cta={false}>
      <PageHero lang="en" eyebrow="Round 1 · Online exam" title="Round 1 online exam" lead="Sign in with the account the Organizing Committee sent you by email, check your session and take the 60-minute multiple-choice test." />
      <div className="container-x py-16 lg:py-20">
        <ExamPortal />
      </div>
    </SiteShell>
  );
}
