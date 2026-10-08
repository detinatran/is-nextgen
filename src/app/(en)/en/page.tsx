import { pageMetadata } from "@/lib/meta";
import HomePage from "@/views/HomePage";

export const metadata = pageMetadata("en", "/");

export default function Page() {
  return <HomePage lang="en" />;
}
