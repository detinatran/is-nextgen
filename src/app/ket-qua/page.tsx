import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Results from "@/components/Results";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = { title: "Kết quả | IS-NextGen Manager Challenge 2026" };

export default function ResultsPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Kết quả"
        title="Công bố theo từng vòng"
        lead="Kết quả được cập nhật tại đây sau mỗi vòng thi và gửi qua email tới từng thí sinh."
      />
      <div className="container-x py-16 lg:py-20">
        <Results />
      </div>
    </SiteShell>
  );
}
