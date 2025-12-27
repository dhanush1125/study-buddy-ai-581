import { BookOpen, Compass, GraduationCap, Briefcase, TrendingUp, FileText, Sparkles } from "lucide-react";

export const WelcomeMessage = () => {
  const suggestions = [
    {
      icon: Compass,
      text: "Help me choose a career path",
      query: "I'm confused about my career. Can you help me discover the right path based on my interests and skills?"
    },
    {
      icon: GraduationCap,
      text: "Guide for higher studies",
      query: "What are my options for higher studies after graduation? Should I go for MS abroad or MBA in India?"
    },
    {
      icon: Briefcase,
      text: "Job market & placements",
      query: "What skills are most in-demand in the current job market? How can I improve my placement chances?"
    },
    {
      icon: TrendingUp,
      text: "Skill roadmap for tech",
      query: "Create a learning roadmap for me to become a software developer. What skills should I learn step by step?"
    },
    {
      icon: FileText,
      text: "Resume & interview tips",
      query: "Give me tips to create a strong resume and prepare for technical interviews"
    },
    {
      icon: BookOpen,
      text: "Exam preparation strategy",
      query: "Help me create a study plan for competitive exams like GATE/CAT. What's the best preparation strategy?"
    }
  ];

  const handleSuggestionClick = (query: string) => {
    const event = new CustomEvent("suggestion-click", { detail: query });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4 animate-message-in">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center shadow-glow">
          <GraduationCap className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-soft">
          <Sparkles className="w-4 h-4 text-accent-foreground" />
        </div>
      </div>
      
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        Hey there, StudyBuddy here! 👋
      </h2>
      
      <p className="text-muted-foreground max-w-md text-[15px] leading-relaxed mb-2">
        Your AI-powered career counselor and study mentor. I'm here to help you navigate your academic journey and find the perfect career path.
      </p>

      <p className="text-sm text-muted-foreground max-w-md mb-6">
        📸 Upload images of notes, problems, or documents for analysis!
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion.query)}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-left group"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <suggestion.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-foreground font-medium">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
