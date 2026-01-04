import { useState, FormEvent, KeyboardEvent, useRef } from "react";
import { Send, Square, ImagePlus, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatInputProps {
  onSend: (message: string, imageBase64?: string, storyMode?: boolean) => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, onStop, isLoading, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [storyMode, setStoryMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim() || imageBase64) && !disabled) {
      onSend(input, imageBase64 || undefined, storyMode);
      setInput("");
      setImagePreview(null);
      setImageBase64(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img
            src={imagePreview}
            alt="Upload preview"
            className="h-20 w-20 object-cover rounded-lg border border-border"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="relative flex items-end gap-2 bg-card rounded-2xl shadow-card border border-border p-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Image upload button */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleImageSelect}
          disabled={disabled || isLoading}
          className="flex-shrink-0 h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground"
        >
          <ImagePlus className="w-5 h-5" />
        </Button>

        {/* Story Mode toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setStoryMode(!storyMode)}
                disabled={disabled || isLoading}
                className={cn(
                  "flex-shrink-0 h-10 w-10 rounded-xl transition-all",
                  storyMode 
                    ? "bg-primary/20 text-primary hover:bg-primary/30 ring-2 ring-primary/50" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="font-medium">{storyMode ? "Story Mode ON" : "Story Mode OFF"}</p>
              <p className="text-xs text-muted-foreground">Visual anime stories for complex concepts</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={imageBase64 ? "Add a message about this image..." : "Ask me anything about your studies..."}
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
            disabled={(!input.trim() && !imageBase64) || disabled}
            className="flex-shrink-0 h-10 w-10 rounded-xl gradient-hero hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        )}
      </div>
    </form>
  );
};
