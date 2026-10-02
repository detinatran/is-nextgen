import SiteShell from "@/components/SiteShell";
import About from "@/components/sections/About";
import Deadline from "@/components/sections/Deadline";
import Faq from "@/components/sections/Faq";
import Hero from "@/components/sections/Hero";
import Milestones from "@/components/sections/Milestones";
import Partners from "@/components/sections/Partners";
import Personas from "@/components/sections/Personas";
import Prizes from "@/components/sections/Prizes";
import Rounds from "@/components/sections/Rounds";
import Theme from "@/components/sections/Theme";
import Values from "@/components/sections/Values";

export default function Home() {
  return (
    <SiteShell>
      <Hero />
      <Deadline />
      <About />
      <Theme />
      <Rounds />
      <Values />
      <Personas />
      <Milestones />
      <Prizes />
      <Partners />
      <Faq />
    </SiteShell>
  );
}
