import { pageMetadata } from "@/lib/meta";
import RulesPage, { rulesText } from "@/views/RulesPage";

export const metadata = pageMetadata("vi", "/the-le/", rulesText.vi.heroTitle);

export default function Page() {
  return <RulesPage lang="vi" />;
}
