import SiteShell from "@/components/SiteShell";
import About from "@/components/sections/About";
import Deadline from "@/components/sections/Deadline";
import Faq from "@/components/sections/Faq";
import Hero from "@/components/sections/Hero";
import Highlights from "@/components/sections/Highlights";
import Milestones from "@/components/sections/Milestones";
import Partners from "@/components/sections/Partners";
import Personas from "@/components/sections/Personas";
import Prizes from "@/components/sections/Prizes";
import Rounds from "@/components/sections/Rounds";
import Theme from "@/components/sections/Theme";
import Values from "@/components/sections/Values";
import type { Lang } from "@/lib/i18n";

export default function HomePage({ lang }: { lang: Lang }) {
  return (
    <SiteShell lang={lang}>
      <Hero lang={lang} />
      <Deadline lang={lang} />
      <Highlights lang={lang} />
      <About lang={lang} />
      <Theme lang={lang} />
      <Rounds lang={lang} />
      <Values lang={lang} />
      <Personas lang={lang} />
      <Milestones lang={lang} />
      <Prizes lang={lang} />
      <Partners lang={lang} />
      <Faq lang={lang} />
    </SiteShell>
  );
}
