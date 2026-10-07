// Curated course catalog for the public Student Portal.
// Each course is tagged so learners can filter by subject, level, type,
// time commitment, budget, and language availability.

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseType =
  | "video"
  | "interactive"
  | "text"
  | "university"
  | "bootcamp"
  | "certification";
export type BudgetTier = "free" | "cheap" | "paid";

export type Course = {
  id: string;
  title: string;
  provider: string;
  url: string;
  level: CourseLevel;
  type: CourseType;
  hours: number; // estimated total hours
  budget: BudgetTier;
  priceLabel: string;
  subjects: string[]; // lowercase keywords for search matching
  languages: string[]; // "English", "Hindi", ... use "Many" for broad subtitle support
  description: string;
  bestFor: string;
};

export const SUBJECT_SUGGESTIONS = [
  "Python",
  "Web Development",
  "Math",
  "Calculus",
  "Physics",
  "Chemistry",
  "Biology",
  "Data Science",
  "Machine Learning",
  "English",
  "Exam Prep",
  "Computer Science",
];

export const COURSE_CATALOG: Course[] = [
  {
    id: "cs50",
    title: "CS50: Introduction to Computer Science",
    provider: "Harvard / edX",
    url: "https://cs50.harvard.edu/x/",
    level: "beginner",
    type: "university",
    hours: 120,
    budget: "free",
    priceLabel: "Free (certificate paid)",
    subjects: ["computer science", "programming", "python", "c", "web development", "algorithms"],
    languages: ["English", "Many (subtitles)"],
    description:
      "Harvard's legendary intro course. Teaches you how to think algorithmically and solve problems efficiently, with real projects in C, Python, and web.",
    bestFor: "Students who want a serious, complete foundation in computer science.",
  },
  {
    id: "khan-math",
    title: "Math: Pre-K to College (full path)",
    provider: "Khan Academy",
    url: "https://www.khanacademy.org/math",
    level: "beginner",
    type: "interactive",
    hours: 100,
    budget: "free",
    priceLabel: "Free",
    subjects: ["math", "algebra", "geometry", "calculus", "statistics", "exam prep"],
    languages: ["English", "Hindi", "Spanish", "French", "Portuguese", "Many"],
    description:
      "Bite-sized videos plus unlimited practice exercises with instant feedback. Covers everything from arithmetic to calculus and SAT prep.",
    bestFor: "School students who want to learn at their own pace, in their own language.",
  },
  {
    id: "fcc-python",
    title: "Scientific Computing with Python",
    provider: "freeCodeCamp",
    url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
    level: "beginner",
    type: "interactive",
    hours: 300,
    budget: "free",
    priceLabel: "Free (with free certificate)",
    subjects: ["python", "programming", "computer science", "data science"],
    languages: ["English"],
    description:
      "Learn Python by building real projects — no videos to passively watch, you code from lesson one and earn a free verified certificate.",
    bestFor: "Hands-on learners who want to build a portfolio while learning Python.",
  },
  {
    id: "mit-ocw-calc",
    title: "Single Variable Calculus",
    provider: "MIT OpenCourseWare",
    url: "https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/",
    level: "intermediate",
    type: "university",
    hours: 60,
    budget: "free",
    priceLabel: "Free",
    subjects: ["math", "calculus", "physics", "engineering"],
    languages: ["English"],
    description:
      "A real MIT course with lecture videos, notes, exams, and solutions — the exact material MIT first-years study.",
    bestFor: "Advanced school or early college students preparing for engineering or science.",
  },
  {
    id: "coursera-ml",
    title: "Machine Learning Specialization",
    provider: "Coursera (Stanford / DeepLearning.AI)",
    url: "https://www.coursera.org/specializations/machine-learning-introduction",
    level: "intermediate",
    type: "certification",
    hours: 90,
    budget: "cheap",
    priceLabel: "Free to audit, ~$49/mo for certificate",
    subjects: ["machine learning", "data science", "python", "ai", "math"],
    languages: ["English", "Many (subtitles)"],
    description:
      "Andrew Ng's updated flagship: regression, neural networks, and practical ML advice, taught gently with optional math deep-dives.",
    bestFor: "Students with basic Python who want a recognized ML credential.",
  },
  {
    id: "nptel-eng",
    title: "NPTEL Engineering & Science Courses",
    provider: "NPTEL / IITs (SWAYAM)",
    url: "https://nptel.ac.in/courses",
    level: "advanced",
    type: "university",
    hours: 40,
    budget: "free",
    priceLabel: "Free (exam certificate ~₹1000)",
    subjects: ["engineering", "physics", "chemistry", "math", "computer science", "exam prep"],
    languages: ["English", "Hindi"],
    description:
      "University-level courses taught by IIT professors, aligned with Indian university syllabi and GATE-style depth.",
    bestFor: "Indian college students who want IIT-quality teaching matched to their syllabus.",
  },
  {
    id: "odin-project",
    title: "The Odin Project — Full Stack Path",
    provider: "The Odin Project",
    url: "https://www.theodinproject.com/",
    level: "intermediate",
    type: "bootcamp",
    hours: 400,
    budget: "free",
    priceLabel: "Free",
    subjects: ["web development", "javascript", "programming", "html", "css", "react"],
    languages: ["English"],
    description:
      "A free, open-source full-stack curriculum that makes you build everything yourself — the closest thing to a real bootcamp without the price tag.",
    bestFor: "Committed learners aiming for a web developer job on a zero budget.",
  },
  {
    id: "khan-physics",
    title: "Physics (high school to AP)",
    provider: "Khan Academy",
    url: "https://www.khanacademy.org/science/physics",
    level: "beginner",
    type: "interactive",
    hours: 40,
    budget: "free",
    priceLabel: "Free",
    subjects: ["physics", "science", "exam prep"],
    languages: ["English", "Hindi", "Spanish", "Many"],
    description:
      "Clear video explanations of mechanics, electricity, and waves with practice problems after every concept.",
    bestFor: "School students who find textbook physics confusing.",
  },
  {
    id: "pw-jee-neet",
    title: "Physics Wallah — JEE / NEET Batches",
    provider: "Physics Wallah",
    url: "https://www.pw.live/",
    level: "intermediate",
    type: "video",
    hours: 200,
    budget: "cheap",
    priceLabel: "Free content + low-cost batches",
    subjects: ["physics", "chemistry", "math", "biology", "exam prep", "jee", "neet"],
    languages: ["Hindi", "Hinglish", "English"],
    description:
      "India's most popular affordable exam-prep platform with live classes, doubt solving, and huge free YouTube libraries in Hindi and Hinglish.",
    bestFor: "JEE/NEET aspirants who learn best in Hindi or Hinglish.",
  },
  {
    id: "duolingo-style-eng",
    title: "English for Career Development",
    provider: "Coursera (University of Pennsylvania)",
    url: "https://www.coursera.org/learn/careerdevelopment",
    level: "beginner",
    type: "certification",
    hours: 40,
    budget: "cheap",
    priceLabel: "Free to audit, ~$49 for certificate",
    subjects: ["english", "language", "career", "communication"],
    languages: ["English", "Many (subtitles)"],
    description:
      "Build job-ready English: resumes, interviews, and workplace communication, designed for non-native speakers.",
    bestFor: "Students improving English for studies abroad or their first job.",
  },
  {
    id: "3b1b-math",
    title: "Essence of Linear Algebra / Calculus",
    provider: "3Blue1Brown (YouTube)",
    url: "https://www.3blue1brown.com/",
    level: "intermediate",
    type: "video",
    hours: 12,
    budget: "free",
    priceLabel: "Free",
    subjects: ["math", "linear algebra", "calculus", "machine learning"],
    languages: ["English", "Many (subtitles)"],
    description:
      "Beautifully animated visual explanations that finally make the *why* behind math click — perfect before or alongside a formal course.",
    bestFor: "Visual learners who want intuition, not just formulas.",
  },
  {
    id: "udacity-nanodegree",
    title: "Programming Nanodegrees",
    provider: "Udacity",
    url: "https://www.udacity.com/",
    level: "intermediate",
    type: "bootcamp",
    hours: 120,
    budget: "paid",
    priceLabel: "Paid (~$249/mo, frequent discounts)",
    subjects: ["programming", "data science", "web development", "ai", "machine learning"],
    languages: ["English"],
    description:
      "Project-based nanodegrees with human code reviews and career services — structured like a job training program.",
    bestFor: "Learners with a budget who want mentorship and reviewed projects.",
  },
  {
    id: "ocw-scholar-bio",
    title: "Introduction to Biology",
    provider: "MIT OpenCourseWare",
    url: "https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/",
    level: "intermediate",
    type: "university",
    hours: 50,
    budget: "free",
    priceLabel: "Free",
    subjects: ["biology", "science", "chemistry", "exam prep"],
    languages: ["English"],
    description:
      "MIT's complete intro biology course — lectures, problem sets, and exams covering genetics, biochemistry, and molecular biology.",
    bestFor: "Pre-med and life-science students who want rigorous depth for free.",
  },
  {
    id: "khan-sat",
    title: "Official SAT & Exam Prep",
    provider: "Khan Academy",
    url: "https://www.khanacademy.org/sat",
    level: "beginner",
    type: "interactive",
    hours: 30,
    budget: "free",
    priceLabel: "Free",
    subjects: ["exam prep", "sat", "math", "english", "test"],
    languages: ["English"],
    description:
      "The official SAT practice partner — full-length adaptive tests and personalized practice plans based on your weak areas.",
    bestFor: "Students with a specific exam date who need focused, free practice.",
  },
];

const LEVEL_ORDER: Record<CourseLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

export type PortalFilters = {
  search: string;
  language: string; // "any" or a language label
  level: string; // "any" | CourseLevel
  type: string; // "any" | CourseType
  time: string; // "any" | "short" | "medium" | "long"
  budget: string; // "any" | BudgetTier
};

export const DEFAULT_FILTERS: PortalFilters = {
  search: "",
  language: "any",
  level: "any",
  type: "any",
  time: "any",
  budget: "any",
};

const TIME_MAX: Record<string, number> = {
  short: 15,
  medium: 60,
  long: 150,
  xl: Infinity,
};

/** Returns courses matching hard filters, sorted by relevance score (best first). */
export function filterCourses(f: PortalFilters): Course[] {
  const q = f.search.trim().toLowerCase();
  return COURSE_CATALOG.map((c) => ({ c, score: scoreCourse(c, f, q) }))
    .filter(({ c, score }) => {
      if (score < 0) return false; // hard mismatch
      if (q && score === 0) return false; // search must match something
      return true;
    })
    .sort((a, b) => b.score - a.score || a.c.hours - b.c.hours)
    .map(({ c }) => c);
}

/** Score a course against filters. -1 means hard-excluded. Higher = better match. */
function scoreCourse(c: Course, f: PortalFilters, q: string): number {
  let score = 0;

  if (q) {
    const hay = [c.title, c.provider, c.description, ...c.subjects].join(" ").toLowerCase();
    if (!hay.includes(q)) return -1;
    score += c.subjects.some((s) => s.includes(q)) ? 30 : 10;
  }

  if (f.language !== "any") {
    const lang = f.language.toLowerCase();
    const ok = c.languages.some(
      (l) => l.toLowerCase().includes(lang) || l.toLowerCase().includes("many"),
    );
    if (!ok) return -1;
    score += c.languages.some((l) => l.toLowerCase().includes(lang)) ? 15 : 5;
  }

  if (f.level !== "any") {
    const wanted = LEVEL_ORDER[f.level as CourseLevel];
    const diff = Math.abs(LEVEL_ORDER[c.level] - wanted);
    if (diff > 1) return -1;
    score += diff === 0 ? 20 : 5;
  }

  if (f.type !== "any") {
    if (c.type !== f.type) return -1;
    score += 15;
  }

  if (f.time !== "any") {
    if (c.hours > TIME_MAX[f.time]) return -1;
    score += 10;
  }

  if (f.budget !== "any") {
    const ok =
      c.budget === f.budget ||
      (f.budget === "cheap" && c.budget === "free") ||
      (f.budget === "paid" && c.budget !== "paid");
    if (!ok) return -1;
    score += c.budget === "free" ? 12 : 6;
  } else if (c.budget === "free") {
    score += 4; // gentle nudge toward free options
  }

  return score;
}

/** Pick the single best course for the current filters (top scored). */
export function bestPick(f: PortalFilters): Course | null {
  return filterCourses(f)[0] ?? null;
}
