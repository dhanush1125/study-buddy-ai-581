import { BookOpen, Sparkles } from "lucide-react";

export const WelcomeMessage = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 animate-message-in">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center shadow-glow">
          <BookOpen className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-soft">
          <Sparkles className="w-4 h-4 text-accent-foreground" />
        </div>
      </div>
      
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        Hey there, StudyBuddy here!
      </h2>
      
      <p className="text-muted-foreground max-w-md text-[15px] leading-relaxed">
        I'm your friendly AI study assistant. Ask me about any subject – I'll explain 
        concepts in simple terms and help you understand better. Let's make learning fun!
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {[
          "Explain photosynthesis",
          "Help with algebra",
          "Summarize a topic",
        ].map((suggestion) => (
          <button
            key={suggestion}
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            onClick={() => {
              const event = new CustomEvent("suggestion-click", { detail: suggestion });
              window.dispatchEvent(event);
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
