import { pageMetadata } from "@/lib/meta";
import RulesPage, { rulesText } from "@/views/RulesPage";

export const metadata = pageMetadata("en", "/the-le/", rulesText.en.heroTitle);

export default function Page() {
  return <RulesPage lang="en" />;
}
