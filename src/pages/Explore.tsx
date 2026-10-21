import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Search,
  GraduationCap,
  Clock,
  Wallet,
  ExternalLink,
  Trophy,
  Sparkles,
  Languages,
  Bot,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COURSE_CATALOG,
  DEFAULT_FILTERS,
  SUBJECT_SUGGESTIONS,
  filterCourses,
  type Course,
  type PortalFilters,
} from "@/lib/courseCatalog";
import { STUDY_LANGUAGES } from "@/lib/agentTemplates";
import { supabase } from "@/integrations/supabase/client";

const LEVEL_OPTIONS = [
  { value: "any", label: "Any level" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const TYPE_OPTIONS = [
  { value: "any", label: "Any type" },
  { value: "video", label: "Video lessons" },
  { value: "interactive", label: "Interactive practice" },
  { value: "university", label: "University course" },
  { value: "bootcamp", label: "Bootcamp / projects" },
  { value: "certification", label: "Certificate course" },
  { value: "text", label: "Reading / articles" },
];

const TIME_OPTIONS = [
  { value: "any", label: "Any duration" },
  { value: "short", label: "Quick (< 15 hrs)" },
  { value: "medium", label: "Medium (< 60 hrs)" },
  { value: "long", label: "Deep (< 150 hrs)" },
  { value: "xl", label: "Full program (150+ hrs)" },
];

const BUDGET_OPTIONS = [
  { value: "any", label: "Any budget" },
  { value: "free", label: "Free only" },
  { value: "cheap", label: "Free or cheap" },
  { value: "paid", label: "Paid OK" },
];

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const TYPE_LABEL: Record<string, string> = {
  video: "Video",
  interactive: "Interactive",
  university: "University",
  bootcamp: "Bootcamp",
  certification: "Certificate",
  text: "Reading",
};

const STORAGE_KEY = "explore-filters-v1";

const loadFilters = (): PortalFilters => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_FILTERS;
};

const Explore = () => {
  const [filters, setFilters] = useState<PortalFilters>(loadFilters);
  const [publicAgents, setPublicAgents] = useState<any[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  // Community study agents are public by RLS policy, so anon learners can see them.
  useEffect(() => {
    supabase
      .from("agents")
      .select("id, name, role, description, avatar_emoji, category, clone_count")
      .eq("is_public", true)
      .eq("category", "education")
      .order("clone_count", { ascending: false })
      .limit(6)
      .then(({ data }) => setPublicAgents(data || []));
  }, []);

  const results = useMemo(() => filterCourses(filters), [filters]);
  const best = results[0] ?? null;
  const rest = results.slice(1);

  const set = (patch: Partial<PortalFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </span>
            <span className="hidden sm:inline">Study Buddy</span>
            <span className="hidden sm:inline text-muted-foreground font-normal">
              Student Portal
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden md:inline">
              Browsing as guest — no sign-in needed
            </span>
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {/* Hero */}
        <section className="py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" /> Free course finder for every student
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            Find the right course, in your language
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tell us what you want to learn and your constraints — level, time, budget,
            language — and we'll point you at the best courses from Khan Academy, Harvard,
            MIT, freeCodeCamp, NPTEL and more.
          </p>
        </section>

        {/* Filters */}
        <Card className="p-4 md:p-6 mb-8 shadow-sm">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => set({ search: e.target.value })}
              placeholder="What do you want to learn? (e.g. Python, Calculus, JEE...)"
              className="pl-9 h-11"
              aria-label="Search subjects"
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {SUBJECT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => set({ search: s })}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filters.search === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                <Languages className="w-3.5 h-3.5" /> Language
              </label>
              <Select value={filters.language} onValueChange={(v) => set({ language: v })}>
                <SelectTrigger aria-label="Language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any language</SelectItem>
                  {STUDY_LANGUAGES.filter((l) => l.code !== "auto").map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Level
              </label>
              <Select value={filters.level} onValueChange={(v) => set({ level: v })}>
                <SelectTrigger aria-label="Level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Course type
              </label>
              <Select value={filters.type} onValueChange={(v) => set({ type: v })}>
                <SelectTrigger aria-label="Course type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                <Clock className="w-3.5 h-3.5" /> Time
              </label>
              <Select value={filters.time} onValueChange={(v) => set({ time: v })}>
                <SelectTrigger aria-label="Time commitment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                <Wallet className="w-3.5 h-3.5" /> Budget
              </label>
              <Select value={filters.budget} onValueChange={(v) => set({ budget: v })}>
                <SelectTrigger aria-label="Budget">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!isDefault && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setFilters(DEFAULT_FILTERS)}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset filters
              </Button>
            </div>
          )}
        </Card>

        {/* Best pick */}
        {best && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Best pick for you
            </h2>
            <CourseCard course={best} featured />
          </section>
        )}

        {/* Results */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-3">
            {results.length === 0
              ? "No courses match those filters"
              : `${results.length} matching course${results.length === 1 ? "" : "s"}`}
          </h2>
          {results.length === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <p className="text-muted-foreground mb-4">
                Try widening a filter — e.g. allow any budget or a longer duration.
              </p>
              <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Clear all filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rest.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}
        </section>

        {/* Study Helper agents */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" /> Study Helper agents
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            AI tutors that answer in your language and can build you a personal course plan.
            Try a sample question — sign in only if you want to save your chats.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AgentCard
              emoji="🎓"
              name="Study Helper (Multi-language)"
              description="Detects your language automatically and explains any subject step by step, with course recommendations."
              prompts={[
                "Recommend the best free course to learn Python from zero",
                "Explain photosynthesis simply, in Hindi",
                "Build me a 4-week plan to prepare for my calculus exam",
              ]}
            />
            <AgentCard
              emoji="📚"
              name="Study Tutor"
              description="A Socratic tutor that teaches with analogies and checks your understanding with quick quizzes."
              prompts={[
                "Quiz me on basic algebra",
                "Explain recursion with a real-world analogy",
              ]}
            />
            {publicAgents.map((a) => (
              <AgentCard
                key={a.id}
                emoji={a.avatar_emoji || "🤖"}
                name={a.name}
                description={a.description || a.role}
                prompts={[]}
                community
              />
            ))}
          </div>
        </section>

        {/* CTA */}
        <Card className="p-8 text-center bg-accent/50 border-primary/20">
          <h2 className="text-2xl font-bold mb-2">Want a personal study plan?</h2>
          <p className="text-muted-foreground mb-5 max-w-xl mx-auto">
            Create a free account to chat with the Study Helper, save your conversations,
            track weekly goals, and get course picks tuned to your exact level and budget.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/auth">
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </Card>
      </main>
    </div>
  );
};

const CourseCard = ({ course, featured }: { course: Course; featured?: boolean }) => (
  <Card
    className={`p-5 flex flex-col hover:border-primary/50 transition-colors ${
      featured ? "border-primary/40 bg-accent/40" : ""
    }`}
  >
    <div className="flex items-start justify-between gap-3 mb-2">
      <div>
        <h3 className="font-semibold leading-snug">{course.title}</h3>
        <p className="text-sm text-muted-foreground">{course.provider}</p>
      </div>
      {featured && (
        <Badge className="shrink-0 gap-1">
          <Trophy className="w-3 h-3" /> Top match
        </Badge>
      )}
    </div>
    <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
    <p className="text-sm mb-4">
      <span className="font-medium">Best for:</span> {course.bestFor}
    </p>
    <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
      <Badge variant="outline">{LEVEL_LABEL[course.level]}</Badge>
      <Badge variant="outline">{TYPE_LABEL[course.type]}</Badge>
      <Badge variant="outline" className="gap-1">
        <Clock className="w-3 h-3" /> ~{course.hours}h
      </Badge>
      <Badge variant="outline">{course.priceLabel}</Badge>
      <Badge variant="outline" className="gap-1">
        <Languages className="w-3 h-3" /> {course.languages.join(", ")}
      </Badge>
    </div>
    <Button asChild variant={featured ? "default" : "outline"} size="sm" className="gap-1.5 self-start">
      <a href={course.url} target="_blank" rel="noopener noreferrer">
        Open course <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </Button>
  </Card>
);

const AgentCard = ({
  emoji,
  name,
  description,
  prompts,
  community,
}: {
  emoji: string;
  name: string;
  description: string;
  prompts: string[];
  community?: boolean;
}) => (
  <Card className="p-5 flex flex-col hover:border-primary/50 transition-colors">
    <div className="flex items-center gap-3 mb-2">
      <span className="text-3xl">{emoji}</span>
      <div>
        <h3 className="font-semibold leading-tight">{name}</h3>
        {community && (
          <span className="text-xs text-muted-foreground">Community agent</span>
        )}
      </div>
    </div>
    <p className="text-sm text-muted-foreground mb-3">{description}</p>
    {prompts.length > 0 && (
      <div className="space-y-1.5 mb-4 mt-auto">
        <p className="text-xs font-medium text-muted-foreground">Try asking:</p>
        {prompts.map((p) => (
          <p key={p} className="text-xs bg-secondary text-secondary-foreground rounded-lg px-2.5 py-1.5">
            “{p}”
          </p>
        ))}
      </div>
    )}
    <Button asChild size="sm" className="gap-1.5 self-start mt-auto">
      <Link to="/auth">
        Chat with this agent <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </Button>
  </Card>
);

export default Explore;
