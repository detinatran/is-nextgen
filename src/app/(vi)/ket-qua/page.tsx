import { pageMetadata } from "@/lib/meta";
import ResultsPage, { resultsText } from "@/views/ResultsPage";

export const metadata = pageMetadata("vi", "/ket-qua/", resultsText.vi.eyebrow);

export default function Page() {
  return <ResultsPage lang="vi" />;
}
