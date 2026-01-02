import { cn } from "@/lib/utils";
import { BookOpen, User } from "lucide-react";
import type { Message } from "@/hooks/useChat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
  isGeneratingImage?: boolean;
}

export const ChatMessage = ({ message, isLatest, isGeneratingImage }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const showImageLoader = isLatest && isGeneratingImage && message.content.includes('Generating educational image');

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
          <div className="text-[15px] leading-relaxed break-words prose prose-sm max-w-none prose-headings:text-ai-bubble-foreground prose-p:text-ai-bubble-foreground prose-strong:text-ai-bubble-foreground prose-code:text-ai-bubble-foreground prose-li:text-ai-bubble-foreground prose-a:text-primary prose-pre:p-0 prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none">
            {message.content === "" && isLatest ? (
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce-dot" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce-dot" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce-dot" />
              </span>
            ) : (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match && !className;
                      
                      if (isInline) {
                        return (
                          <code
                            className="bg-background/30 px-1.5 py-0.5 rounded text-sm font-mono"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }
                      
                      return (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match ? match[1] : "text"}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                          }}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                
                {/* Image generation loading spinner */}
                {showImageLoader && (
                  <div className="mt-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Generating diagram...</p>
                        <p className="text-xs text-muted-foreground">Creating educational visual</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Render AI-generated images */}
                {message.generatedImages && message.generatedImages.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.generatedImages.map((imgUrl, idx) => (
                      <div key={idx} className="rounded-lg overflow-hidden border border-border/50 bg-background/50">
                        <img
                          src={imgUrl}
                          alt={`AI-generated educational diagram ${idx + 1}`}
                          className="w-full h-auto max-h-96 object-contain"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
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
