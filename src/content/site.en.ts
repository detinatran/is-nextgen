// English version of all page copy, translated from site.ts (source: "IS NextGen Manager final" organizing plan).
// Edit text, figures and dates here; no need to touch the components.
import type { IconName } from "@/components/Icon";

export const site = {
  name: "NextGen Manager Challenge 2026",
  viName: "Managers for a New Era",
  theme: "Portrait of a Manager in the AI Era",
  themeEn: "The Manager in the AI Era",
  heroTitle: "Managers in the AI Era",
  slogan: ["New Mindset", "New Skills", "Real Value"],
  tagline: "Shaping the next generation of managers",
  hashtag: "#NextGenManager",
  // Official registration deadline (set by the Organizing Committee: Oct 31, 2026). The live deadline comes from competitions.registration_closes_at.
  registrationDeadline: "2026-10-31T23:59:00+07:00",
  registrationDeadlineLabel: "23:59 (GMT+7), Oct 31, 2026",
  // Each item is a phrase kept on one line
  address: {
    unit: ["Faculty of Economics and Management,", "VNU International School (VNU-IS)"],
    street: ["Building D2, VNU,", "144 Xuan Thuy,", "Cau Giay, Hanoi"],
  },
  // Organizing Committee contacts (hotlines as announced by the committee)
  contact: {
    email: "nextgen@vnuis.edu.vn",
    hotlines: [
      { name: "Ms. Giang", phone: "0388 674 655" },
      { name: "Ms. Thu", phone: "0919 746 896" },
    ],
    fanpage: "https://www.facebook.com/profile.php?id=61595115537350",
    sponsorDeck: "",
  },
  socials: {
    facebook: "https://www.facebook.com/profile.php?id=61595115537350",
    linkedin: "",
    youtube: "",
    tiktok: "",
  },
  // TODO(BTC): intro video link (YouTube); leave empty and the play button shows "coming soon".
  videoUrl: "",
};

export const nav = [
  { href: "/#top", label: "Home", id: "top" },
  { href: "/#gioi-thieu", label: "Competition", id: "gioi-thieu" },
  { href: "/#trai-nghiem", label: "Experience", id: "trai-nghiem" },
  { href: "/#lo-trinh", label: "Timeline", id: "lo-trinh" },
  { href: "/#giai-thuong", label: "Prizes", id: "giai-thuong" },
  { href: "/the-le/", label: "Rules", id: "the-le" },
];

export const hero = {
  eyebrow: "Hands-on management competition · Season 1",
  title: ["NEXTGEN", "MANAGER 2026"],
  theme: "The Manager in the AI Era",
  tagline: "Shaping the next generation of managers",
};

// Season 1 has no past numbers, so we highlight benefits instead
export const heroStats: { icon: IconName; value: string; label: string; tone?: "sky" | "gold" }[] = [
  { icon: "briefcase", value: "Internships", label: "opportunities at partner companies" },
  { icon: "handshake", value: "Network", label: "with experts and business leaders" },
  { icon: "fileChart", value: "03 rounds", label: "Discover · Decide · Deliver, competency-based" },
  { icon: "users", value: "Experts", label: "Professors, PhDs and industry leaders" },
];

export const about = {
  title: ["The first hands-on management competition", "built on ", "a Behavioral Competency Framework & AI"],
  body: "Organized by the Faculty of Economics and Management, VNU International School, NextGen Manager 2026 is an academic competition for students nationwide. Across three rounds, Discover – Decide – Deliver, from your profile, video and aptitude test, through a group business case, to an executive case in the Final, you will build systems thinking, the ability to decide with incomplete information, and the confidence to apply artificial intelligence (AI) in management. You will also visit a company, meet managers at the Gala networking dinner and gain internship opportunities with partner companies.",
  features: [
    {
      icon: "brain" as IconName,
      title: "Strategic thinking in the AI era",
      body: "Adopt a modern management mindset: use AI as a tool while keeping your own judgment.",
      tone: "bg-blue-50 text-brand",
    },
    {
      icon: "lightbulb" as IconName,
      title: "Hands-on experience, real assessment",
      body: "Tackle simulated cases and real business problems, scored against a behavioral competency framework.",
      tone: "bg-orange-50 text-orange",
    },
    {
      icon: "usersGroup" as IconName,
      title: "Connect with students nationwide",
      body: "Team up with students from different universities and majors, as well as international students.",
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: "trophy" as IconName,
      title: "Open doors to your career",
      body: "Meet partner companies, gain internship opportunities and a fast-track ticket to the final interview round.",
      tone: "bg-amber-50 text-amber-600",
    },
  ],
};

// "Only at NextGen" cards: alternating peach/blue, 3D icons exp-icon-1..3, exp-icon-4-globe
export const perks = {
  eyebrow: "About the competition",
  title: "Experiences you only get at NextGen Manager",
  lead: "A hands-on management competition that builds well-rounded skills, deep connections and real value for your future career.",
  items: [
    { title: "Real-world challenges", body: "Solve real company cases, scored on a standardized behavioral framework: 06 competency areas, 05 behaviour levels.", href: "/the-le/" },
    { title: "Internships & careers", body: "Internship opportunities and a fast track to the Management Trainee final interview.", href: "/#giai-thuong" },
    { title: "A strong network", body: "Meet companies, judges and students from across the country.", href: "/#trai-nghiem" },
    { title: "Well-rounded growth", body: "Build systems thinking, decision-making and confidence with AI in every round.", href: "/the-le/" },
  ],
};

// "Your journey": the key activities of the season
export const journey = {
  title: "Your journey",
  more: "See the full rules",
  items: [
    { title: "Leaderless group discussion", body: "Round 2 – Decide: randomly formed teams solve a real company case with no facilitator.", image: "/images/is/sv-thao-luan.webp", href: "/the-le/#vong-2" },
    { title: "Executive case", body: "Final – Deliver: a team part and an individual part solving a real problem set by a company.", image: "/images/is/sv-man-hinh.webp", href: "/the-le/#vong-3" },
    { title: "Company visit & talks", body: "Field trip on Nov 14: Round 2 contestants visit a company and talk with its managers.", image: "/images/is/sv-giang-duong.webp", href: "/the-le/#ben-le" },
    { title: "Gala networking dinner", body: "Evening of Nov 28: meet experts and partner companies.", image: "/images/is/sv-ban-tron.webp", href: "/the-le/#ben-le" },
  ],
};

export const themeSection = {
  body: "Artificial intelligence (AI) is reshaping how every business operates. NextGen Manager 2026 sets out to find and develop a new generation of young managers with systems thinking, the ability to make sound decisions with incomplete information, and the confidence to use AI as a powerful aid while keeping their own independent judgement.",
  points: ["Applying AI in management", "Solving real-world business problems", "Proposing creative, sustainable and feasible solutions", "Ready to lead in a global environment"],
  quote: "More than a competition, it is a journey of self-discovery and self-affirmation.",
};

// Three rounds, per the Organizing Committee's sponsorship deck (Discover – Decide – Deliver)
export const rounds = [
  {
    no: "01",
    step: "Round 1 · Discover",
    short: "Profile, video & test",
    name: "Profile and aptitude test",
    format: "Individual · Online",
    duration: "Nov 7, 2026 · 8:00 – 23:59",
    body: "Submit your profile online with 01 personal video of up to 02 minutes (topic of your choice) and 01 photo. Take an objective multiple-choice test on the profile of a manager in the AI era, online on the competition website, scored automatically.",
    funnel: "Profiles → 40 contestants",
    gradient: "from-[#2f6bf0] to-[#1d47c8]",
  },
  {
    no: "02",
    step: "Round 2 · Decide",
    short: "Group discussion",
    name: "Group discussion on a company case",
    format: "Teams · In person",
    duration: "Nov 21, 2026 · 9:00 – 16:30",
    body: "Contestants who pass Round 1 are randomly grouped into teams, solve a real case set by a company with no facilitator, present and answer the judges' questions. Judges assess against the behavioral competency framework.",
    funnel: "40 → 16 contestants",
    gradient: "from-[#1d3f9a] to-[#2a5bd6]",
  },
  {
    no: "03",
    step: "Final · Deliver",
    short: "Executive case",
    name: "Executive case",
    format: "Team part & individual part",
    duration: "Dec 5, 2026",
    body: "The Final has two parts: a team part (scored individually) and an individual part, solving a real business problem proposed by a company.",
    funnel: "16 contestants",
    gradient: "from-[#f2711c] to-[#e0313e]",
  },
];

export const roundIcons: IconName[] = ["fileText", "messages", "presentation"];

export const roundsIntro =
  "Each round is a different challenge, helping you grow from sharp thinking to real-world skills, assessed by faculty and industry experts.";

export const values = {
  eyebrow: "Investing in your future",
  title: ["Build your capabilities –", "lead your career"],
  body: "Internship opportunities, a fast track to the final interview of a management trainee program, plus a company visit and a Gala networking dinner for advanced-round contestants.",
  items: [
    { icon: "fileChart" as IconName, title: "Practical knowledge", body: "From experts and businesses" },
    { icon: "briefcase" as IconName, title: "Internships & real projects", body: "Experience a real workplace" },
    { icon: "handshake" as IconName, title: "A strong network", body: "With talented peers and companies" },
    { icon: "rocket" as IconName, title: "Career opportunities", body: "Open doors to your future career" },
  ],
};

export const personas = [
  {
    image: "/images/is/gv-dao-cong-tuan.webp",
    title: "Analytical thinking and decision-making",
    body: "Pinpoint the core problem, use data, reason with evidence and dare to decide when information is incomplete.",
  },
  {
    image: "/images/is/gv-ta-huy-hung.webp",
    title: "Systems thinking and prioritization",
    body: "See cause and effect, allocate limited resources, know what comes first and be able to explain why.",
  },
  {
    image: "/images/is/gv-luu-thi-minh-ngoc.webp",
    title: "Leadership and influence",
    body: "Propose a direction, persuade others, handle disagreement and take responsibility for your decisions.",
  },
  {
    image: "/images/is/gv-nguyen-phuong-mai.webp",
    title: "Collaboration and communication",
    body: "Listen, build on others' ideas and contribute to the shared outcome instead of competing for airtime.",
  },
  {
    image: "/images/is/gv-tran-cong-thanh.webp",
    title: "Ethics and responsibility",
    body: "Weigh the interests of all stakeholders, act with integrity in your proposals and recognize ethical risks.",
  },
  {
    image: "/images/is/gv-le-thi-mai.webp",
    title: "Presentation and language",
    body: "Structure messages clearly, persuade with words and visuals, and present confidently in English.",
  },
];

// until: hết ngày của mốc, dùng để đánh dấu giai đoạn đang diễn ra
export const milestones: { date: string; title: string; icon: IconName; tone: "orange" | "blue" | "red" | "gold"; until: string }[] = [
  { date: "Oct 11 – Oct 31, 2026", title: "Registration opens", icon: "fileText", tone: "orange", until: "2026-10-31T23:59:00+07:00" },
  { date: "Nov 7, 2026", title: "Round 1 · Discover", icon: "fileChart", tone: "blue", until: "2026-11-11T23:59:00+07:00" },
  { date: "Nov 21, 2026", title: "Round 2 · Decide", icon: "messages", tone: "red", until: "2026-11-25T23:59:00+07:00" },
  { date: "Dec 5, 2026", title: "Final · Deliver", icon: "trophy", tone: "gold", until: "2026-12-05T23:59:00+07:00" },
];

// Full schedule (per the Organizing Committee's sponsorship deck), shown on the Rules page
export const timeline = [
  { date: "Oct 11, 2026", title: "Registration opens", body: "Online portal opens for profiles and videos" },
  { date: "Oct 22, 2026", title: "Opening & Workshop", body: "18:30, competition launch, skills and knowledge workshop" },
  { date: "Oct 31, 2026", title: "Registration closes", body: "Last day to submit profiles and videos (23:59)" },
  { date: "Nov 7, 2026", title: "Round 1 · Discover", body: "8:00 – 23:59, online test, auto-scored" },
  { date: "Nov 11, 2026", title: "Round 1 results", body: "Contestants advancing to Round 2 announced" },
  { date: "Nov 14, 2026", title: "Field trip", body: "Company visit and talks with managers" },
  { date: "Nov 21, 2026", title: "Round 2 · Decide", body: "9:00 – 16:30, team business case" },
  { date: "Nov 25, 2026", title: "Round 2 results", body: "Finalists announced" },
  { date: "Nov 28, 2026", title: "Gala networking dinner", body: "18:30 – 22:00, meet experts and companies" },
  { date: "Dec 5, 2026", title: "Final · Deliver", body: "Team part and individual part" },
];

// Prize structure set by the Organizing Committee; cash amounts are not published on the website
export const prizes: { rank: string; qty: string; perks: string[]; icon: IconName; featured?: boolean }[] = [
  {
    rank: "First Prize",
    qty: "01 contestant",
    perks: ["Best contestant of the Final pitching round", "Fast track to the final interview of a management trainee program", "Internship opportunity with a sponsor", "Certificate and commemorative medal"],
    icon: "crown",
    featured: true,
  },
  { rank: "Second Prize", qty: "01 contestant", perks: ["Second-best contestant of the Final pitching round", "Certificate and commemorative medal"], icon: "medal" },
  { rank: "Third Prize", qty: "01 contestant", perks: ["Third-best contestant of the Final pitching round", "Certificate and commemorative medal"], icon: "award" },
  { rank: "Honorable Mention", qty: "03 contestants", perks: ["The remaining contestants of the Final pitching round", "Certificate and commemorative medal"], icon: "star" },
  { rank: "Best Team", qty: "01 team", perks: ["The most outstanding team", "Certificate"], icon: "usersGroup" },
  { rank: "Fan Favorite", qty: "01 contestant", perks: ["Voted from the videos of the 40 Round 2 contestants on the fanpage", "Certificate"], icon: "sparkles" },
];

export const minorPrizes =
  "Full prize details follow the official rules of the Organizing Committee.";

export const partners: { name: string; logo?: string; ink?: boolean }[] = [
  { name: "VNU International School (VNU-IS)", logo: "/images/org/truong-crest.png" },
  { name: "Ho Chi Minh Communist Youth Union", logo: "/images/org/doan.png" },
  { name: "Youth Union Branch – Economics & Management", logo: "/images/org/lcd-ktql-navy.png" },
  { name: "iSupport Club", logo: "/images/org/isupport.png" },
  { name: "Marketing Club (IMC)", logo: "/images/org/imc.png" },
];

// TODO(BTC): add sponsors once agreements are signed, e.g. { name: "Company name", logo: "/images/sponsors/company-name.png" }
export const sponsors: { name: string; logo?: string }[] = [];

export const eligibility = [
  "Students currently enrolled at VNU International School (VNU-IS).",
  "Students of other member schools and units of Vietnam National University, Hanoi (VNU).",
  "Students of other universities and academies in and outside Hanoi.",
  "International students studying in Vietnam are encouraged to apply.",
];

export const eligibilityNote =
  "Applicants must be full-time undergraduate students still enrolled at the time of registration, and must present a student ID card or a certificate of enrollment from their university at all in-person rounds.";

export const competencies = personas.map((p) => ({ name: p.title, body: p.body }));

export const judgingRules = [
  "Each round has at least 02 judges scoring independently; any gap over 20% of the total score must be discussed and recorded in the minutes.",
  "Judges receive at least 90 minutes of training on the competency framework before each round.",
  "Judges who supervise, directly teach or are related to a candidate must recuse themselves from the relevant scoring session.",
  "Case materials remain sealed until the start of each round; case authors do not coach candidates.",
];

export const sideEvents = [
  {
    tag: "NextGen Business Trip",
    title: "Company visit and experience",
    when: "Nov 14, 2026",
    who: "Contestants who pass Round 1 (about 40), faculty advisors and the Organizing Committee",
    body: "Tour the workplace and learn about the company's structure, strategy, culture and operations; talk with managers about decision-making, prioritization, leading teams, internships and management trainee programs. Afterwards, each contestant writes a short note on one management decision they observed (not scored), used as reference for the individual part of the Final.",
  },
  {
    tag: "NextGen Networking Dinner",
    title: "Gala networking dinner",
    when: "18:30 – 22:00, Nov 28, 2026",
    who: "Finalists, partner companies, judges, advisors and university representatives (about 40 guests)",
    body: "Speeches from the university and companies, short self-introductions by contestants and networking by field: HR, marketing, finance, operations and technology.",
  },
];

export const votingRules = [
  "The personal videos of the 40 Round 2 contestants are posted on the official fanpage.",
  "01 reaction = 01 point; 01 public share with the hashtag #NextGenManager = 02 points. Only accounts following the fanpage count, and each account can share each video once.",
  "The contestant with the highest total wins the Fan Favorite award.",
  "Fake accounts, engagement tools and buying or selling interactions are prohibited. This award is separate and does not count toward the competition score.",
];

export const faqs: { q: string; a: string; icon: IconName }[] = [
  {
    icon: "users",
    q: "Who can take part in the competition?",
    a: "Full-time undergraduate students of VNU International School, other VNU member units, and other universities and academies in and outside Hanoi. International students studying in Vietnam are encouraged to join.",
  },
  {
    icon: "fileText",
    q: "How do I register?",
    a: "Fill in the online registration form and submit 01 personal video of up to 02 minutes (topic of your choice) and 01 photo. Participation is free of charge, and each email can register only once.",
  },
  {
    icon: "usersGroup",
    q: "Can I register as a team?",
    a: "No, registration is individual. In Round 2 the Organizing Committee randomly groups contestants into teams; the Final has a team part and an individual part.",
  },
  {
    icon: "calendar",
    q: "What is the detailed schedule?",
    a: "Registration opens on Oct 11, 2026 (deadline 23:59, Oct 31), the opening ceremony is at 18:30 on Oct 22, Round 1 is online on Nov 7, the field trip on Nov 14, Round 2 on Nov 21, the Gala networking dinner on Nov 28 and the Final on Dec 5, 2026. The full schedule is on the Rules page.",
  },
  {
    icon: "briefcase",
    q: "Do the prizes include internship opportunities?",
    a: "Yes. The First Prize winner gets a fast track to the final interview of a management trainee program and an internship opportunity with a sponsor. Advanced-round contestants also visit a company and meet managers at the field trip and the Gala networking dinner.",
  },
];

// Additional questions, shown on the Rules page
export const moreFaqs: { q: string; a: string }[] = [
  {
    q: "I live outside Hanoi. Can I still compete?",
    a: "Round 1 is held online on the competition website. Round 2 and the Final are held in person at VNU International School (No. 1 Phan Tay Nhac, Xuan Phuong, Nam Tu Liem, Hanoi).",
  },
  {
    q: "Can I use ChatGPT or other AI tools?",
    a: "Yes. Contestants may use smart tools to look things up, while the judges assess your own reasoning and creativity, especially in the leaderless group discussion.",
  },
];
