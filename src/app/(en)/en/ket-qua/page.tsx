import { pageMetadata } from "@/lib/meta";
import ResultsPage, { resultsText } from "@/views/ResultsPage";

export const metadata = pageMetadata("en", "/ket-qua/", resultsText.en.eyebrow);

export default function Page() {
  return <ResultsPage lang="en" />;
}
