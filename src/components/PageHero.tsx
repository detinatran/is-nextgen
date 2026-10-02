import Link from "next/link";
import { type Lang, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";
import Eyebrow from "./Eyebrow";

type Props = { lang: Lang; eyebrow: string; title: string; lead?: string };

/** Phần đầu cho các trang con (Thể lệ, Kết quả, Đăng ký). */
export default function PageHero({ lang, eyebrow, title, lead }: Props) {
  return (
    <section
      className="band-fallback relative overflow-hidden bg-cover bg-center pt-36 pb-20 text-white"
      style={{
        backgroundImage: `linear-gradient(90deg, rgb(7 21 51 / 0.92), rgb(7 21 51 / 0.6)), url(${asset("/images/generated/timeline-bg.webp")})`,
      }}
    >
      <div className="container-x relative">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/75">
          <Link href={localePath(lang, "/")} className="hover:text-white">
            {lang === "en" ? "Home" : "Trang chủ"}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/90">{title}</span>
        </nav>
        <Eyebrow light>{eyebrow}</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold sm:text-5xl">{title}</h1>
        {lead && <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-white/85">{lead}</p>}
      </div>
    </section>
  );
}
