import { pageMetadata } from "@/lib/meta";
import RegisterPage, { registerText } from "@/views/RegisterPage";

export const metadata = pageMetadata("en", "/dang-ky/", registerText.en.title);

export default function Page() {
  return <RegisterPage lang="en" />;
}
