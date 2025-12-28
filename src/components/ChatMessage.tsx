import { cn } from "@/lib/utils";
import { BookOpen, User } from "lucide-react";
import type { Message } from "@/hooks/useChat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
        {/* Show image if present */}
        {isUser && message.image && (
          <img
            src={message.image}
            alt="Uploaded"
            className="max-w-full h-auto max-h-48 rounded-lg mb-2 object-contain"
          />
        )}
        
        {isUser ? (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          <div className="text-[15px] leading-relaxed break-words prose prose-sm max-w-none prose-headings:text-ai-bubble-foreground prose-p:text-ai-bubble-foreground prose-strong:text-ai-bubble-foreground prose-code:text-ai-bubble-foreground prose-li:text-ai-bubble-foreground prose-a:text-primary prose-pre:bg-background/20 prose-pre:rounded-lg prose-code:bg-background/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
            {message.content === "" && isLatest ? (
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce-dot" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce-dot" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce-dot" />
              </span>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-secondary flex items-center justify-center shadow-soft">
          <User className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};
