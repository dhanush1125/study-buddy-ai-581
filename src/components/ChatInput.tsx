import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from "react";
import { Send, Square, ImagePlus, X, BookOpen, Compass, Video, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface ChatInputProps {
  onSend: (message: string, imageBase64?: string, storyMode?: boolean, careerMode?: boolean, videoMode?: boolean) => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, onStop, isLoading, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [storyMode, setStoryMode] = useState(false);
  const [careerMode, setCareerMode] = useState(false);
  const [videoMode, setVideoMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Speech recognition hook
  const { 
    isListening, 
    transcript, 
    interimTranscript, 
    startListening, 
    stopListening, 
    resetTranscript,
    isSupported: isSpeechSupported 
  } = useSpeechRecognition({ continuous: true });
  
  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(prev => {
        // If we had previous input, add a space before the new transcript
        if (prev && !prev.endsWith(' ')) {
          return prev + ' ' + transcript;
        }
        return prev + transcript;
      });
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim() || imageBase64) && !disabled) {
      onSend(input, imageBase64 || undefined, storyMode, careerMode, videoMode);
      setInput("");
      setImagePreview(null);
      setImageBase64(null);
    }
  };

  const toggleStoryMode = () => {
    setStoryMode(!storyMode);
    if (!storyMode) {
      setCareerMode(false);
      setVideoMode(false);
    }
  };

  const toggleCareerMode = () => {
    setCareerMode(!careerMode);
    if (!careerMode) {
      setStoryMode(false);
      setVideoMode(false);
    }
  };

  const toggleVideoMode = () => {
    setVideoMode(!videoMode);
    if (!videoMode) {
      setStoryMode(false);
      setCareerMode(false);
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
                onClick={toggleStoryMode}
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

        {/* Career Mode toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={toggleCareerMode}
                disabled={disabled || isLoading}
                className={cn(
                  "flex-shrink-0 h-10 w-10 rounded-xl transition-all",
                  careerMode 
                    ? "bg-accent/20 text-accent hover:bg-accent/30 ring-2 ring-accent/50" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Compass className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="font-medium">{careerMode ? "Career Mode ON" : "Career Mode OFF"}</p>
              <p className="text-xs text-muted-foreground">Visual career roadmaps & guidance</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Video Mode toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={toggleVideoMode}
                disabled={disabled || isLoading}
                className={cn(
                  "flex-shrink-0 h-10 w-10 rounded-xl transition-all",
                  videoMode 
                    ? "bg-destructive/20 text-destructive hover:bg-destructive/30 ring-2 ring-destructive/50" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Video className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="font-medium">{videoMode ? "Video Mode ON" : "Video Mode OFF"}</p>
              <p className="text-xs text-muted-foreground">Generate educational animated videos</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Speech-to-Text toggle */}
        {isSpeechSupported && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={toggleListening}
                  disabled={disabled || isLoading}
                  className={cn(
                    "flex-shrink-0 h-10 w-10 rounded-xl transition-all",
                    isListening 
                      ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 ring-2 ring-red-500/50 animate-pulse" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-medium">{isListening ? "Stop Recording" : "Voice Input"}</p>
                <p className="text-xs text-muted-foreground">Speak instead of typing</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <textarea
          value={input + (interimTranscript ? (input ? ' ' : '') + interimTranscript : '')}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening 
              ? "Listening... speak now" 
              : imageBase64 
                ? "Add a message about this image..." 
                : "Ask me anything about your studies..."
          }
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] placeholder:text-muted-foreground focus:outline-none",
            "min-h-[44px] max-h-[120px] overflow-y-auto",
            isListening && "placeholder:text-red-400"
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
