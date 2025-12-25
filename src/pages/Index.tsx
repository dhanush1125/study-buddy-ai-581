import { useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { WelcomeMessage } from "@/components/WelcomeMessage";
import { BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { messages, isLoading, sendMessage, stopGeneration, clearChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for suggestion clicks
  useEffect(() => {
    const handleSuggestion = (e: CustomEvent<string>) => {
      sendMessage(e.detail);
    };
    window.addEventListener("suggestion-click", handleSuggestion as EventListener);
    return () => window.removeEventListener("suggestion-click", handleSuggestion as EventListener);
  }, [sendMessage]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">StudyBuddy</h1>
              <p className="text-xs text-muted-foreground">Your AI study assistant</p>
            </div>
          </div>
          
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <WelcomeMessage />
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  isLatest={index === messages.length - 1 && message.role === "assistant"}
                />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="flex-shrink-0 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <ChatInput
            onSend={sendMessage}
            onStop={stopGeneration}
            isLoading={isLoading}
          />
          <p className="text-xs text-muted-foreground text-center mt-2">
            StudyBuddy can make mistakes. Verify important information.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
