import Header from "@/components/Header";
import RevealObserver from "@/components/RevealObserver";
import Faq from "@/components/sections/Faq";
import Footer from "@/components/sections/Footer";
import Hero from "@/components/sections/Hero";
import Partners from "@/components/sections/Partners";
import Prizes from "@/components/sections/Prizes";
import Register from "@/components/sections/Register";
import ResultsSection from "@/components/sections/ResultsSection";
import Rules from "@/components/sections/Rules";
import SideEvents from "@/components/sections/SideEvents";
import Timeline from "@/components/sections/Timeline";
import Why from "@/components/sections/Why";

export default function Home() {
  return (
    <>
      <a href="#gioi-thieu" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-gold focus:px-4 focus:py-2">
        Bỏ qua tới nội dung
      </a>
      <Header />
      <main>
        <Hero />
        <Why />
        <Rules />
        <SideEvents />
        <Timeline />
        <ResultsSection />
        <Prizes />
        <Partners />
        <Faq />
        <Register />
      </main>
      <Footer />
      <RevealObserver />
    </>
  );
}
