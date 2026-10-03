// English version of all page copy, translated from site.ts (source: "IS NextGen Manager final" organizing plan).
// Edit text, figures and dates here; no need to touch the components.
import type { IconName } from "@/components/Icon";

export const site = {
  name: "IS-NextGen Manager Challenge 2026",
  viName: "Managers for a New Era",
  theme: "Portrait of a Manager in the AI Era",
  themeEn: "The Manager in the AI Era",
  heroTitle: "Managers in the AI Era",
  slogan: ["New Mindset", "New Skills", "Real Value"],
  tagline: "Shaping the next generation of managers",
  hashtag: "#ISNextGenManager",
  // TODO(BTC): replace with the official registration deadline. Round 1 takes place in week 2 of Nov 2026.
  registrationDeadline: "2026-11-01T23:59:00+07:00",
  registrationDeadlineLabel: "23:59 (GMT+7), Nov 1, 2026 (tentative)",
  // Each item is a phrase kept on one line
  address: {
    unit: ["Faculty of Economics and Management,", "VNU International School (VNU-IS)"],
    street: ["Building D2, VNU,", "144 Xuan Thuy,", "Cau Giay, Hanoi"],
  },
  // TODO(BTC): fill in real contact and social media details; leave empty to hide.
  contact: {
    email: "nextgen@vnuis.edu.vn",
    phone: "",
    fanpage: "",
    sponsorDeck: "",
  },
  socials: {
    facebook: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
  },
  // TODO(BTC): intro video link (YouTube); leave empty and the play button shows "coming soon".
  videoUrl: "",
};

export const nav = [
  { href: "/#top", label: "Home", id: "top" },
  { href: "/#gioi-thieu", label: "About", id: "gioi-thieu" },
  { href: "/#the-le", label: "Rules", id: "the-le" },
  { href: "/#lo-trinh", label: "Timeline", id: "lo-trinh" },
  { href: "/#giai-thuong", label: "Prizes", id: "giai-thuong" },
  { href: "/#hoi-dap", label: "FAQ", id: "hoi-dap" },
];

// Season 1 has no past numbers, so we highlight benefits instead
export const heroStats: { icon: IconName; value: string; label: string; tone?: "sky" | "gold" }[] = [
  { icon: "briefcase", value: "Internships", label: "With partner companies" },
  { icon: "handshake", value: "Network", label: "Meet and connect with employers", tone: "sky" },
  { icon: "landmark", value: "04 rounds", label: "Real-world, competency-based", tone: "gold" },
  { icon: "users", value: "Experts", label: "PhD & Master's faculty, industry leaders" },
];

export const about = {
  title: ["The first hands-on management competition", "built on ", "a Behavioral Competency Framework & AI"],
  body: "Organized by the Faculty of Economics and Management, VNU International School, IS-NextGen Manager 2026 is an annual academic competition for students nationwide. Across four rounds, from an aptitude test and hands-on group discussion to solving a real management problem set by a partner company, you will build systems thinking, the ability to decide with incomplete information, and the confidence to apply artificial intelligence (AI) in management. You will also receive a Personal Competency Report, join a field visit to a leading corporation and open doors to careers at top companies.",
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
      body: "Meet partner companies, win internships and a fast-track ticket to the final interview round.",
      tone: "bg-amber-50 text-amber-600",
    },
  ],
};

// Season 1 highlights: experiences unique to the competition, shown as feature cards
export const highlights = {
  eyebrow: "Season 1 highlights",
  title: "Experiences you only get at IS-NextGen Manager",
  lead: "More than an exam: you are assessed like a real management trainee candidate and step into the corporate world during the season.",
  framework: {
    tag: "Standardized",
    title: "Standardized behavioral competency framework",
    body: "Every round is scored on the same framework: judges record specific behaviours and convert them into scores, transparently and fairly.",
    stats: [
      { value: "06", label: "competency areas" },
      { value: "05", label: "observable behaviour levels" },
      { value: "02+", label: "independent judges per round" },
    ],
    // Short names of the 06 competency areas for the infographic
    areas: ["Analysis & decisions", "Systems thinking", "Leadership & influence", "Collaboration", "Ethics & responsibility", "Presentation"],
  },
  fastTrack: {
    tag: "For the Champion",
    title: "Fast track to the Management Trainee final interview",
    body: "Skip the screening rounds of a partner company's management trainee program.",
    extra: "Plus 01 internship for the Outstanding Individual award",
    image: "/images/generated/hl-mt.webp",
  },
  items: [
    {
      tag: "Qualifying Round",
      title: "Leaderless group discussion",
      body: "Groups of six get a case with conflicting interests and no appointed leader. Leadership shows up naturally.",
      facts: ["Groups of 06", "40 minutes", "No leader"],
      image: "/images/generated/hl-lgd.webp",
    },
    {
      tag: "IS-NextGen Business Trip",
      title: "Visit a leading company",
      body: "See a real workplace, hear how the company is organized and talk with managers about how they make decisions.",
      facts: ["16 contestants", "Week 1 · Dec 2026", "About 04 hours"],
      image: "/images/generated/hl-trip.webp",
    },
    {
      tag: "IS-NextGen Networking Dinner",
      title: "Networking dinner with employers",
      body: "Meet companies, judges and alumni. Each contestant gives a 01-minute introduction, then joins themed tables.",
      facts: ["After the Semi-final", "120 minutes", "05 themed tables"],
      image: "/images/generated/hl-dinner.webp",
    },
  ],
};

export const themeSection = {
  body: "Artificial intelligence (AI) is reshaping how every business operates. IS-NextGen Manager 2026 sets out to find and develop a new generation of young managers with systems thinking, the ability to make sound decisions with incomplete information, and the confidence to use AI as a powerful aid while keeping their own independent judgement.",
  points: ["Applying AI in management", "Solving real-world business problems", "Proposing creative, sustainable and feasible solutions"],
  quote: "More than a competition, it is a journey of self-discovery and self-affirmation.",
};

export const rounds = [
  {
    no: "01",
    step: "Application Round",
    short: "Application, video & test",
    name: "Application and aptitude test",
    format: "Individual · Online",
    duration: "60 minutes",
    body: "Submit an online application with a video of up to 90 seconds answering a management case question announced by the Organizing Committee. Then take an online test covering numerical reasoning, logical reasoning and core management knowledge; candidates from outside VNU-IS take it remotely under proctoring.",
    funnel: "250-300 → 40 candidates",
    gradient: "from-[#2f6bf0] to-[#1d47c8]",
  },
  {
    no: "02",
    step: "Qualifying Round",
    short: "Group discussion",
    name: "Leaderless group discussion",
    format: "Groups of 06",
    duration: "40 minutes/group",
    body: "Groups of six candidates receive a case involving conflicting interests. No one is appointed as leader, and the group must reach a joint decision. Judges observe and score against a behavioral framework.",
    funnel: "40 → 16 candidates",
    gradient: "from-[#1d3f9a] to-[#2a5bd6]",
  },
  {
    no: "03",
    step: "Semi-final",
    short: "Executive in-tray case",
    name: "Executive in-tray case",
    format: "Individual · AI allowed",
    duration: "90 min work + 15 min defense",
    body: "A simulation of a manager's inbox: many issues arrive at once and resources are limited. Candidates set priorities, make decisions and justify them in writing, then defend their choices before the judges.",
    funnel: "16 → 12 candidates",
    gradient: "from-[#0e7c8c] to-[#1f63ae]",
  },
  {
    no: "04",
    step: "Grand Final",
    short: "Presentation & Debate",
    name: "Grand Final",
    format: "03 teams × 04 · AI allowed",
    duration: "20 minutes/team",
    body: "The 12 finalists are grouped into 03 teams to solve a real management challenge from a partner company within 05 days, then present and defend their solution before the panel, including a segment in English.",
    funnel: "12 candidates · 03 teams",
    gradient: "from-[#f2711c] to-[#e0313e]",
  },
];

export const roundIcons: IconName[] = ["fileText", "messages", "inbox", "presentation"];

export const roundsIntro =
  "Each round is a different challenge, helping you grow from sharp thinking to real-world skills, assessed by faculty and industry experts.";

export const experiences = [
  {
    image: "/images/generated/round-case.webp",
    title: "Analyze management cases",
    body: "Numerical and logical reasoning tests plus an executive in-tray case: set priorities, make decisions, justify them.",
    href: "/the-le/#vong-1",
  },
  {
    image: "/images/generated/round-2.webp",
    title: "Work in teams like a real company",
    body: "Groups of six, a case with conflicting interests, and no one appointed as team leader.",
    href: "/the-le/#vong-2",
  },
  {
    image: "/images/generated/round-pitch.webp",
    title: "Pitch to a panel of experts",
    body: "Three finalist teams present and defend their solutions before a panel including business leaders, partly in English.",
    href: "/the-le/#vong-4",
  },
];

export const values = {
  title: ["Build your capabilities,", "lead your future career"],
  body: "Gain knowledge, grow your network and seize career opportunities with our partner companies, plus a personal competency report for every candidate.",
  items: [
    { icon: "fileChart" as IconName, title: "Practical knowledge", body: "From experts and businesses" },
    { icon: "target" as IconName, title: "Well-rounded skills", body: "Analysis · Creativity · Leadership" },
    { icon: "handshake" as IconName, title: "A quality network", body: "Connect with peers, mentors, recruiters" },
    { icon: "rocket" as IconName, title: "Growth opportunities", body: "Internships, jobs and valuable prizes" },
  ],
};

export const personas = [
  {
    image: "/images/generated/persona-1.webp",
    title: "Analytical thinking and decision-making",
    body: "Pinpoint the core problem, use data, reason with evidence and dare to decide when information is incomplete.",
  },
  {
    image: "/images/generated/persona-2.webp",
    title: "Systems thinking and prioritization",
    body: "See cause and effect, allocate limited resources, know what comes first and be able to explain why.",
  },
  {
    image: "/images/generated/persona-3.webp",
    title: "Leadership and influence",
    body: "Propose a direction, persuade others, handle disagreement and take responsibility for your decisions.",
  },
  {
    image: "/images/generated/persona-4.webp",
    title: "Collaboration and communication",
    body: "Listen, build on others' ideas and contribute to the shared outcome instead of competing for airtime.",
  },
  {
    image: "/images/generated/persona-5.webp",
    title: "Ethics and responsibility",
    body: "Weigh the interests of all stakeholders, act with integrity in your proposals and recognize ethical risks.",
  },
  {
    image: "/images/generated/persona-6.webp",
    title: "Presentation and language",
    body: "Structure messages clearly, persuade with words and visuals, and present confidently in English.",
  },
];

// until: hết ngày của mốc, dùng để đánh dấu giai đoạn đang diễn ra
export const milestones: { date: string; title: string; icon: IconName; tone: "orange" | "blue" | "red" | "gold"; until: string }[] = [
  { date: "Oct 10 – Nov 1, 2026", title: "Registration opens", icon: "fileText", tone: "orange", until: "2026-11-01T23:59:00+07:00" },
  { date: "Week 4 · Nov 2026", title: "Qualifying Round", icon: "messages", tone: "blue", until: "2026-11-29T23:59:00+07:00" },
  { date: "Week 2 · Dec 2026", title: "Semi-final", icon: "inbox", tone: "red", until: "2026-12-13T23:59:00+07:00" },
  { date: "Week 4 · Dec 2026", title: "Grand Final", icon: "trophy", tone: "gold", until: "2026-12-27T23:59:00+07:00" },
];

// Full timeline, shown on the Rules page
export const timeline = [
  { date: "Week 2 · Oct 2026", title: "Launch Ceremony", body: "Online registration opens" },
  { date: "Week 4 · Oct 2026", title: "Info Day", body: "Format overview, Q&A and insights from partner companies" },
  { date: "Week 2 · Nov 2026", title: "Application Round", body: "Online test, results announced within 05 days" },
  { date: "Week 4 · Nov 2026", title: "Qualifying Round", body: "Group discussions in sessions of 06 candidates each" },
  { date: "Week 1 · Dec 2026", title: "Business Trip", body: "16 candidates visit a leading corporation" },
  { date: "Week 2 · Dec 2026", title: "Semi-final", body: "Case work and defense; 12 finalists announced and teams formed" },
  { date: "Week 3 · Dec 2026", title: "Networking & Voting", body: "Networking dinner, final case released, Fan Favorite voting" },
  { date: "Week 4 · Dec 2026", title: "Grand Final", body: "Presentations, Q&A, results and award ceremony" },
  { date: "Jan 2027", title: "Competency Reports", body: "Personal reports sent to candidates from the Qualifying Round on" },
];

export const prizeTotal = "14,500,000 VND";

export const prizes: { rank: string; qty: string; amount: string; perks: string[]; icon: IconName; featured?: boolean }[] = [
  {
    rank: "Champion",
    qty: "First Prize · 01 team",
    amount: "5,000,000 VND",
    perks: ["Fast track to the final interview round", "Certificate", "Partner company endorsement"],
    icon: "crown",
    featured: true,
  },
  { rank: "Runner-up", qty: "Second Prize · 01 team", amount: "3,000,000 VND", perks: ["Certificate", "Partner company endorsement"], icon: "medal" },
  { rank: "Top 3", qty: "Third Prize · 01 team", amount: "2,000,000 VND", perks: ["Certificate", "Partner company endorsement"], icon: "award" },
  { rank: "Outstanding Individual", qty: "01 candidate", amount: "1,500,000 VND", perks: ["01 internship offer", "Commemorative medal"], icon: "star" },
];

export const minorPrizes =
  "There are also two special awards (Best Teamwork, Best English Presentation) and a Fan Favorite Team award, each worth 1,000,000 VND.";

export const partners: { name: string; logo?: string; ink?: boolean }[] = [
  { name: "VNU International School (VNU-IS)", logo: "/images/crest.png" },
  { name: "Faculty of Economics and Management" },
  { name: "VNU-IS Youth Union", logo: "/images/org-doan.png" },
  { name: "Clubs Board", logo: "/images/org-clb.png", ink: true },
  { name: "Marketing Club (IMC)", logo: "/images/org-imc.png", ink: true },
  { name: "iSupport Club" },
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
    tag: "IS-NextGen Business Trip",
    title: "Visit a leading company",
    when: "Week 1 of Dec 2026 · about 04 hours",
    who: "The 16 candidates who pass the Qualifying Round",
    body: "Tour the workplace, learn about the company's organizational model and culture, and join a talk with middle managers on how they make decisions. Afterwards, each candidate writes a short reflection (max. 300 words) to use as material for their Semi-final defense.",
  },
  {
    tag: "IS-NextGen Networking Dinner",
    title: "Business networking dinner",
    when: "After the Semi-final, before the Grand Final · about 120 minutes",
    who: "Finalists, partner companies, judges and alumni",
    body: "Each candidate gives a 01-minute self-introduction, followed by open networking at themed tables: HR, marketing, finance, operations and technology.",
  },
];

export const votingRules = [
  "Each of the 03 finalist teams submits 01 introduction video of up to 90 seconds after the final case is released.",
  "All 03 videos are posted at the same time on the official fanpage; voting runs for 03 days.",
  "01 reaction = 01 point; 01 public share with the hashtag #ISNextGenManager = 02 points. Only accounts following the fanpage count, and each account may share each video once.",
  "Fake accounts, engagement-boosting tools and buying or selling interactions are strictly prohibited. This award is separate and does not count toward competition scores.",
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
    a: "Fill in the online registration form and submit a video of up to 90 seconds answering a case question announced by the Organizing Committee. Participation is free of charge.",
  },
  {
    icon: "usersGroup",
    q: "Can I register as a team?",
    a: "No, registration is individual. The Qualifying Round is held in groups of 06 and the Grand Final in teams of 04, formed by the Organizing Committee to mix students across universities and majors.",
  },
  {
    icon: "calendar",
    q: "What is the detailed schedule?",
    a: "Launch and registration open in week 2 of Oct 2026, the Application Round in week 2 of Nov, the Qualifying Round in week 4 of Nov, the Business Trip and Semi-final in early Dec, and the Grand Final in week 4 of Dec 2026. The full schedule is on the Rules page.",
  },
  {
    icon: "briefcase",
    q: "Do the prizes include internship opportunities?",
    a: "Yes. The Champion team gets a fast track to the final interview round of a management trainee program; the Outstanding Individual receives 01 internship offer. Candidates from the Qualifying Round on receive a certificate recognized by our partner companies in their hiring review.",
  },
];

// Additional questions, shown on the Rules page
export const moreFaqs: { q: string; a: string }[] = [
  {
    q: "I live outside Hanoi. Can I still compete?",
    a: "The Application Round is held online, and candidates from outside VNU-IS take it remotely under proctoring. From the Qualifying Round onward, all rounds are held in person on the VNU International School campus.",
  },
  {
    q: "Can I use ChatGPT or other AI tools?",
    a: "Yes, in the Semi-final and Grand Final. You must declare how you used them, which parts came from the tool and which from your own judgment, and explain why you kept or rejected each suggestion. Scoring focuses on your justification.",
  },
  {
    q: "What is the personal competency report?",
    a: "A digital feedback report on your strengths, areas for improvement and development suggestions, based on actual scoring data. It is sent to every candidate who reached the Qualifying Round or beyond in Jan 2027.",
  },
];
