import { cn } from "@/lib/utils";
import { BookOpen, User, Download } from "lucide-react";
import type { Message } from "@/hooks/useChat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { StoryPanelGrid } from "./StoryPanelGrid";
import { DownloadOptions } from "./DownloadOptions";
import { ShareOptions } from "./ShareOptions";
import { Button } from "./ui/button";

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
}

export const ChatMessage = ({ message, isLatest, isGeneratingImage, isGeneratingVideo }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const showImageLoader = isLatest && isGeneratingImage && message.content.includes('Generating');
  const showVideoLoader = isLatest && isGeneratingVideo && message.content.includes('Generating');
  
  // Detect if this is story mode content (anime panels)
  const isStoryMode = message.content.includes('Story') || 
                      message.content.includes('Panel') || 
                      message.content.includes('anime') ||
                      (message.generatedImages && message.generatedImages.length > 1);
  
  // Extract style from loading message for display
  const getImageStyle = () => {
    if (message.content.includes('realistic')) return { label: 'realistic image', emoji: '📸' };
    if (message.content.includes('3d')) return { label: '3D render', emoji: '🧊' };
    if (message.content.includes('anime')) return { label: 'anime illustration', emoji: '🎌' };
    return { label: 'diagram', emoji: '📘' };
  };
  const imageStyle = getImageStyle();

  // Extract video style from loading message
  const getVideoStyle = () => {
    if (message.content.includes('anime')) return { label: 'anime video', emoji: '🎌' };
    if (message.content.includes('3d') || message.content.includes('3D')) return { label: '3D video', emoji: '🧊' };
    if (message.content.includes('revision')) return { label: 'revision video', emoji: '🎯' };
    return { label: 'concept video', emoji: '📘' };
  };
  const videoStyle = getVideoStyle();

  // Handle video download
  const handleVideoDownload = async (videoUrl: string, index: number) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studybuddy-video-${index + 1}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Video download failed:', error);
    }
  };

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
                        <p className="text-sm font-medium text-foreground">
                          Generating {imageStyle.label} {imageStyle.emoji}
                        </p>
                        <p className="text-xs text-muted-foreground">Creating visual content...</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Render AI-generated images */}
                {message.generatedImages && message.generatedImages.length > 0 && (
                  <>
                    {isStoryMode ? (
                      <StoryPanelGrid images={message.generatedImages} />
                    ) : (
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
                    
                    {/* Download & Share Options */}
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Save & Share:</span>
                        <DownloadOptions 
                          images={message.generatedImages} 
                          messageContent={message.content}
                        />
                        <ShareOptions 
                          images={message.generatedImages} 
                          messageContent={message.content}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Video generation loading spinner */}
                {showVideoLoader && (
                  <div className="mt-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 border-3 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Generating {videoStyle.label} {videoStyle.emoji}
                        </p>
                        <p className="text-xs text-muted-foreground">Creating animated educational video...</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Render AI-generated videos */}
                {message.generatedVideos && message.generatedVideos.length > 0 && (
                  <>
                    <div className="mt-3 space-y-3">
                      {message.generatedVideos.map((videoUrl, idx) => (
                        <div key={idx} className="rounded-lg overflow-hidden border border-border/50 bg-background/50">
                          <video
                            src={videoUrl}
                            controls
                            className="w-full h-auto max-h-96"
                            preload="metadata"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ))}
                    </div>
                    
                    {/* Video Download Options */}
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Download Video:</span>
                        {message.generatedVideos.map((videoUrl, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleVideoDownload(videoUrl, idx)}
                            className="gap-1.5 h-7 text-xs"
                          >
                            <Download className="w-3 h-3" />
                            MP4
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
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
