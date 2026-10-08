import { pageMetadata } from "@/lib/meta";
import RegisterPage, { registerText } from "@/views/RegisterPage";

export const metadata = pageMetadata("vi", "/dang-ky/", registerText.vi.title);

export default function Page() {
  return <RegisterPage lang="vi" />;
}
