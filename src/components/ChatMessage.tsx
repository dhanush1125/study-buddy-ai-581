import { cn } from "@/lib/utils";
import { BookOpen, User } from "lucide-react";
import type { Message } from "@/hooks/useChat";

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

export const ChatMessage = ({ message, isLatest }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-message-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-soft">
          <BookOpen className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-soft",
          isUser
            ? "bg-user-bubble text-user-bubble-foreground rounded-br-md"
            : "bg-ai-bubble text-ai-bubble-foreground rounded-bl-md"
        )}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
          {!isUser && isLatest && message.content === "" && (
            <span className="inline-flex gap-1 ml-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce-dot" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce-dot" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce-dot" />
            </span>
          )}
        </p>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-secondary flex items-center justify-center shadow-soft">
          <User className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};
