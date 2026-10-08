import { pageMetadata } from "@/lib/meta";
import HomePage from "@/views/HomePage";

export const metadata = pageMetadata("vi", "/");

export default function Page() {
  return <HomePage lang="vi" />;
}
