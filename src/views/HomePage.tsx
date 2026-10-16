import SiteShell from "@/components/SiteShell";
import About from "@/components/sections/About";
import Deadline from "@/components/sections/Deadline";
import Faq from "@/components/sections/Faq";
import Hero from "@/components/sections/Hero";
import Journey from "@/components/sections/Journey";
import Milestones from "@/components/sections/Milestones";
import Perks from "@/components/sections/Perks";
import Personas from "@/components/sections/Personas";
import Prizes from "@/components/sections/Prizes";
import Theme from "@/components/sections/Theme";
import Values from "@/components/sections/Values";
import type { Lang } from "@/lib/i18n";

export default function HomePage({ lang }: { lang: Lang }) {
  return (
    <SiteShell lang={lang}>
      <Hero lang={lang} />
      <Deadline lang={lang} />
      <Perks lang={lang} />
      <Journey lang={lang} />
      <About lang={lang} />
      <Theme lang={lang} />
      <Milestones lang={lang} />
      <Personas lang={lang} />
      <Values lang={lang} />
      <Prizes lang={lang} />
      <Faq lang={lang} />
    </SiteShell>
  );
}
