import type { Student } from "./profile";

export interface Career {
  title: string;
  description: string;
  skills: string[];
  interests: string[];
  goalWords: string[]; // phrases in a career goal that point to this role
  branches: string[]; // onboarding branches that commonly lead here
  outlook: string;
}

export interface Recommendation extends Career {
  score: number;
  reason: string;
  missing_skills: string[];
}

const CS = ["Computer Science", "Information Technology"];

// Demo catalog. Replace with a careers table / ML model later.
export const careers: Career[] = [
  { title: "Data Analyst", description: "Turn raw data into insights that drive business decisions.", skills: ["python", "sql", "excel", "statistics", "tableau"], interests: ["data", "analytics", "math"], goalWords: ["data analyst", "analyst", "analytics"], branches: [...CS, "Business / Commerce"], outlook: "High demand" },
  { title: "Data Scientist", description: "Use statistics and machine learning to answer complex questions with data.", skills: ["python", "statistics", "machine learning", "sql", "data visualization"], interests: ["data", "ai", "research"], goalWords: ["data scientist", "data science"], branches: CS, outlook: "Competitive" },
  { title: "Machine Learning Engineer", description: "Build and deploy models that learn from data.", skills: ["python", "machine learning", "statistics", "tensorflow", "math"], interests: ["ai", "machine learning", "research"], goalWords: ["machine learning", "ml engineer", "ai engineer", "artificial intelligence"], branches: CS, outlook: "Fast growing" },
  { title: "Full-Stack Developer", description: "Design and build complete web applications.", skills: ["javascript", "react", "node", "sql", "git"], interests: ["web", "software", "building"], goalWords: ["developer", "software engineer", "web", "full stack", "full-stack"], branches: CS, outlook: "High demand" },
  { title: "Mobile App Developer", description: "Create apps for Android and iOS.", skills: ["kotlin", "swift", "flutter", "git", "ui design"], interests: ["mobile", "apps", "software"], goalWords: ["mobile", "app developer", "android", "ios"], branches: CS, outlook: "Steady growth" },
  { title: "Cybersecurity Analyst", description: "Protect systems and data from threats.", skills: ["networking", "linux", "security", "python", "problem solving"], interests: ["security", "hacking", "networks"], goalWords: ["security", "cyber", "ethical hacker"], branches: [...CS, "Electronics"], outlook: "Very high demand" },
  { title: "Cloud / DevOps Engineer", description: "Automate and run reliable cloud infrastructure.", skills: ["linux", "aws", "docker", "git", "networking"], interests: ["cloud", "automation", "infrastructure"], goalWords: ["devops", "cloud", "sre"], branches: CS, outlook: "High demand" },
  { title: "Product Manager", description: "Lead product vision and work across design and engineering.", skills: ["communication", "analytics", "strategy", "leadership", "user research"], interests: ["product", "strategy", "business"], goalWords: ["product manager", "product management", "product"], branches: [...CS, "Business / Commerce"], outlook: "Competitive" },
  { title: "UX Designer", description: "Create intuitive, user-centred digital experiences.", skills: ["figma", "user research", "prototyping", "design", "creativity"], interests: ["design", "creativity", "users"], goalWords: ["designer", "ux", "ui"], branches: [...CS, "Other"], outlook: "Steady growth" },
  { title: "Business Analyst", description: "Bridge business needs and technical solutions.", skills: ["excel", "sql", "communication", "analytics", "documentation"], interests: ["business", "analytics", "problem solving"], goalWords: ["business analyst", "consulting", "consultant"], branches: ["Business / Commerce", ...CS], outlook: "Steady growth" },
  { title: "Financial Analyst", description: "Evaluate investments and financial performance to guide decisions.", skills: ["excel", "financial modelling", "accounting", "analytics", "communication"], interests: ["finance", "markets", "business"], goalWords: ["finance", "financial", "investment", "banking"], branches: ["Business / Commerce"], outlook: "Steady growth" },
  { title: "Embedded Systems Engineer", description: "Program the hardware inside devices, from wearables to vehicles.", skills: ["c", "microcontrollers", "electronics", "rtos", "debugging"], interests: ["hardware", "electronics", "iot"], goalWords: ["embedded", "iot", "firmware", "hardware"], branches: ["Electronics", "Electrical"], outlook: "Steady growth" },
  { title: "Power & Electrical Engineer", description: "Design and maintain electrical and power systems.", skills: ["circuit design", "matlab", "power systems", "plc", "autocad"], interests: ["energy", "electrical", "automation"], goalWords: ["power", "electrical", "energy", "grid"], branches: ["Electrical", "Electronics"], outlook: "Growing (renewables)" },
  { title: "Mechanical Design Engineer", description: "Design and test mechanical components and products.", skills: ["cad", "solidworks", "thermodynamics", "materials", "problem solving"], interests: ["design", "manufacturing", "robotics"], goalWords: ["mechanical", "design engineer", "manufacturing", "robotics"], branches: ["Mechanical"], outlook: "Steady growth" },
  { title: "Civil / Structural Engineer", description: "Plan and analyse buildings, bridges and infrastructure.", skills: ["autocad", "staad pro", "structural analysis", "surveying", "project management"], interests: ["construction", "infrastructure", "design"], goalWords: ["civil", "structural", "construction", "infrastructure"], branches: ["Civil"], outlook: "Steady growth" },
];

const aliases: Record<string, string> = {
  js: "javascript", "node.js": "node", nodejs: "node", "react.js": "react", reactjs: "react",
  ml: "machine learning", "ms excel": "excel", "power bi": "tableau", "c++": "c",
};
const norm = (s: string) => {
  const t = s.toLowerCase().trim();
  return aliases[t] ?? t;
};

// Exact, token or (length >= 3) substring match, so a skill like "C" can't match everything.
function matches(have: string[], term: string) {
  return have.some(
    (x) =>
      x === term ||
      x.split(/[^a-z0-9+#]+/).includes(term) ||
      (x.length >= 3 && term.includes(x)) ||
      (term.length >= 3 && x.includes(term))
  );
}

const joinList = (a: string[]) =>
  a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;

export function recommend(s: Student): Recommendation[] {
  const skills = s.skills.map(norm);
  const interests = s.interests.map(norm);
  const goal = s.career_goal.toLowerCase();
  const branch = s.branch.toLowerCase();

  return careers
    .map((c) => {
      const skillHits = c.skills.filter((x) => matches(skills, x));
      const interestHits = c.interests.filter((x) => matches(interests, x));
      const goalHit = [c.title.toLowerCase(), ...c.goalWords].some((w) => goal.includes(w));
      const branchHit = c.branches.some((b) => b.toLowerCase() === branch);

      const score = Math.min(
        98,
        Math.round(
          40 +
            (skillHits.length / c.skills.length) * 32 +
            (interestHits.length / c.interests.length) * 14 +
            (goalHit ? 10 : 0) +
            (branchHit ? 5 : 0)
        )
      );

      const because: string[] = [];
      if (skillHits.length) because.push(`you already have ${joinList(skillHits.slice(0, 3))}, which this role relies on`);
      if (interestHits.length) because.push(`your interest in ${joinList(interestHits.slice(0, 2))} lines up with the work`);
      if (goalHit) because.push("it matches the career goal you described");
      if (branchHit) because.push(`${s.branch} is a common route into it`);
      const reason = because.length
        ? `This fits because ${joinList(because)}.`
        : "A broader option worth exploring given your background, though it needs the most new skills.";

      return {
        ...c,
        score,
        reason,
        missing_skills: c.skills.filter((x) => !matches(skills, x)).slice(0, 4),
        _hits: skillHits.length,
      };
    })
    .sort((a, b) => b.score - a.score || b._hits - a._hits)
    .slice(0, 3)
    .map(({ _hits, ...r }) => r);
}

export const getCareer = (title: string) => careers.find((c) => c.title === title);

/** Finds a catalog career mentioned in free text, e.g. "tell me about UX designer". */
export const findCareerInText = (text: string) => {
  const t = text.toLowerCase();
  return careers.find((c) => t.includes(c.title.toLowerCase()));
};

const resources: Record<string, string> = {
  sql: "Practice on Mode SQL tutorials or LeetCode database problems",
  python: "Complete a free Python for Data course and build 2 mini projects",
  statistics: "Khan Academy statistics + apply it on a Kaggle dataset",
  tableau: "Build a public dashboard with Tableau Public",
  excel: "Learn pivot tables, lookups and charts with a real dataset",
  "machine learning": "Andrew Ng's ML Specialization on Coursera",
  tensorflow: "Follow the official TensorFlow beginner tutorials",
  "data visualization": "Recreate 3 charts from a news article using a real dataset",
  math: "Revise linear algebra and probability basics",
  javascript: "Build 3 small projects with modern JavaScript",
  react: "Build a portfolio app with React",
  node: "Create a REST API with Node and Express",
  git: "Contribute to a small open-source repo on GitHub",
  kotlin: "Build a simple Android app with the official Kotlin tutorials",
  swift: "Follow Apple's free SwiftUI tutorials",
  flutter: "Build a small cross-platform app with Flutter",
  "ui design": "Redesign one screen of an app you use",
  communication: "Present a project in a campus club or hackathon",
  analytics: "Analyse a public dataset and write up findings",
  strategy: "Write a product teardown of an app you use",
  leadership: "Lead a student project or club initiative",
  "user research": "Run 5 user interviews for a class project",
  figma: "Redesign an app screen in Figma",
  prototyping: "Create a clickable prototype in Figma",
  design: "Study design fundamentals and build a case study",
  creativity: "Join a design challenge or hackathon",
  networking: "Study CCNA basics and use Packet Tracer",
  linux: "Set up a Linux VM and practise the command line",
  security: "Try beginner labs on TryHackMe",
  "problem solving": "Solve 2 coding problems a week",
  aws: "Prepare for AWS Cloud Practitioner",
  docker: "Containerise one of your projects",
  documentation: "Write clear requirement docs for a sample project",
  "financial modelling": "Build a 3-statement model for a listed company in Excel",
  accounting: "Learn accounting basics and read a real annual report",
  c: "Write small C programs and port them to a microcontroller board",
  microcontrollers: "Build projects on Arduino, then an STM32 or ESP32 board",
  electronics: "Build and debug simple circuits on a breadboard",
  rtos: "Run FreeRTOS tasks on a dev board",
  debugging: "Learn to use a debugger and logic analyser",
  "circuit design": "Design and simulate circuits in LTspice or Multisim",
  matlab: "Complete the free MATLAB Onramp",
  "power systems": "Study power-system basics and simulate a small grid",
  plc: "Learn ladder logic with a PLC simulator",
  autocad: "Complete a beginner AutoCAD course and draft a floor plan",
  cad: "Model 3 parts in a CAD tool of your choice",
  solidworks: "Follow SolidWorks' beginner tutorials and model an assembly",
  thermodynamics: "Revise core cycles and solve past exam problems",
  materials: "Study material selection for a product you use",
  "staad pro": "Model a simple frame in STAAD.Pro",
  "structural analysis": "Revise and hand-check a beam and frame analysis",
  surveying: "Do a small site-survey exercise with your department",
  "project management": "Plan a student project with milestones",
};

export const tipFor = (skill: string) =>
  resources[skill] ?? "Find a beginner course and build a small project";

export function skillSuggestions(s: Student, top: Career) {
  const have = s.skills.map(norm);
  return top.skills
    .filter((x) => !matches(have, x))
    .slice(0, 4)
    .map((x) => ({ skill: x, tip: tipFor(x) }));
}
