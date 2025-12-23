import { useState, FormEvent, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, onStop, isLoading, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-end gap-2 bg-card rounded-2xl shadow-card border border-border p-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about your studies..."
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] placeholder:text-muted-foreground focus:outline-none",
            "min-h-[44px] max-h-[120px] overflow-y-auto"
          )}
          style={{ height: "44px" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "44px";
            target.style.height = Math.min(target.scrollHeight, 120) + "px";
          }}
        />
        
        {isLoading ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={onStop}
            className="flex-shrink-0 h-10 w-10 rounded-xl"
          >
            <Square className="w-4 h-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || disabled}
            className="flex-shrink-0 h-10 w-10 rounded-xl gradient-hero hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        )}
      </div>
    </form>
  );
};
