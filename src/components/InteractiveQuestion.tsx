import { useState, useEffect } from "react";
import { TeacherAvatar, TeacherExpression } from "./avatar/TeacherAvatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { Send, Sparkles } from "lucide-react";
import { AvatarConfig, defaultAvatarConfig } from "./avatar/avatarParts";

export type QuestionFeedback = "correct" | "almost" | "try_again" | null;

interface InteractiveQuestionProps {
  question: string;
  hint?: string;
  onAnswer: (answer: string) => void;
  feedback?: QuestionFeedback;
  correctAnswer?: string;
  avatarConfig?: AvatarConfig;
  isWaiting?: boolean;
}

export const InteractiveQuestion = ({
  question,
  hint,
  onAnswer,
  feedback,
  correctAnswer,
  avatarConfig = defaultAvatarConfig,
  isWaiting = true,
}: InteractiveQuestionProps) => {
  const [answer, setAnswer] = useState("");
  const [expression, setExpression] = useState<TeacherExpression>("neutral");
  const [showHint, setShowHint] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Update expression based on feedback
  useEffect(() => {
    if (feedback === "correct") {
      setExpression("celebrating");
    } else if (feedback === "almost") {
      setExpression("encouraging");
    } else if (feedback === "try_again") {
      setExpression("thinking");
    } else if (isWaiting) {
      setExpression("thinking");
    } else {
      setExpression("neutral");
    }
  }, [feedback, isWaiting]);

  const handleSubmit = () => {
    if (answer.trim()) {
      setSubmitted(true);
      onAnswer(answer.trim());
    }
  };

  const getFeedbackMessage = () => {
    switch (feedback) {
      case "correct":
        return "🎉 Excellent! That's correct!";
      case "almost":
        return "👍 Almost there! Good thinking!";
      case "try_again":
        return "🤔 Not quite. Let's think about this...";
      default:
        return null;
    }
  };

  const getFeedbackColor = () => {
    switch (feedback) {
      case "correct":
        return "border-green-500/50 bg-green-500/10";
      case "almost":
        return "border-yellow-500/50 bg-yellow-500/10";
      case "try_again":
        return "border-orange-500/50 bg-orange-500/10";
      default:
        return "border-primary/30 bg-primary/5";
    }
  };

  return (
    <div className={cn(
      "rounded-xl border-2 p-4 transition-all duration-300",
      getFeedbackColor()
    )}>
      {/* Teacher Avatar with expression */}
      <div className="flex items-start gap-4 mb-4">
        <TeacherAvatar 
          config={avatarConfig} 
          expression={expression} 
          size={64} 
          animated={true}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Quick Check!</span>
          </div>
          <p className="text-foreground font-medium leading-relaxed">
            {question}
          </p>
        </div>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div className={cn(
          "mb-4 p-3 rounded-lg animate-in fade-in slide-in-from-bottom-2",
          feedback === "correct" && "bg-green-500/20",
          feedback === "almost" && "bg-yellow-500/20",
          feedback === "try_again" && "bg-orange-500/20"
        )}>
          <p className="text-sm font-medium">{getFeedbackMessage()}</p>
          {feedback !== "correct" && correctAnswer && (
            <p className="text-xs text-muted-foreground mt-1">
              💡 The answer is: <span className="font-medium text-foreground">{correctAnswer}</span>
            </p>
          )}
        </div>
      )}

      {/* Answer input */}
      {!submitted && isWaiting && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <Button 
              onClick={handleSubmit} 
              disabled={!answer.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Hint toggle */}
          {hint && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(!showHint)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {showHint ? "Hide hint" : "💡 Need a hint?"}
              </Button>
              {showHint && (
                <p className="text-xs text-muted-foreground mt-1 pl-2 border-l-2 border-primary/30">
                  {hint}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submitted state without feedback yet */}
      {submitted && !feedback && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Checking your answer...
        </div>
      )}
    </div>
  );
};
