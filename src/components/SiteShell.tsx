import type { Lang } from "@/lib/i18n";
import BackToTop from "./BackToTop";
import Header from "./Header";
import RevealObserver from "./RevealObserver";
import Footer from "./sections/Footer";

/** Khung chung cho mọi trang: header, nội dung, footer và các tiện ích cuộn. */
export default function SiteShell({ children, lang, cta = true }: { children: React.ReactNode; lang: Lang; cta?: boolean }) {
  return (
    <>
      <a
        href="#noi-dung"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-full focus:bg-orange focus:px-4 focus:py-2 focus:text-white"
      >
        {lang === "en" ? "Skip to content" : "Bỏ qua tới nội dung"}
      </a>
      <Header />
      <main id="noi-dung">{children}</main>
      <Footer lang={lang} cta={cta} />
      <BackToTop lang={lang} />
      <RevealObserver />
    </>
  );
}
