import { cn } from "@/lib/utils";
import { BookOpen, User, Download, Volume2, VolumeX, Pause, ChevronDown } from "lucide-react";
import type { Message } from "@/hooks/useChat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { StoryPanelGrid } from "./StoryPanelGrid";
import { VideoPlayer } from "./VideoPlayer";
import { DownloadOptions } from "./DownloadOptions";
import { ShareOptions } from "./ShareOptions";
import { Button } from "./ui/button";
import { useSpeech } from "@/hooks/useSpeech";
import { useEffect, useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { InteractiveQuestion, QuestionFeedback } from "./InteractiveQuestion";
import { TeacherAvatar } from "./avatar/TeacherAvatar";
import { defaultAvatarConfig, AvatarConfig } from "./avatar/avatarParts";

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
  savedVoiceName?: string | null;
  onVoiceChange?: (name: string | null) => void;
}

export const ChatMessage = ({ message, isLatest, isGeneratingImage, isGeneratingVideo, savedVoiceName, onVoiceChange }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const showImageLoader = isLatest && isGeneratingImage && message.content.includes('Generating');
  const showVideoLoader = isLatest && isGeneratingVideo && message.content.includes('Generating');
  
  // Interactive question state
  const [questionFeedback, setQuestionFeedback] = useState<QuestionFeedback>(null);
  const [questionAnswered, setQuestionAnswered] = useState(false);
  
  // Parse quick check questions from content
  const parsedContent = useMemo(() => {
    const questionRegex = /\[QUICK_CHECK:\s*([^\|]+)\|?([^\|]*)\|?([^\]]*)\]/;
    const match = message.content.match(questionRegex);
    
    if (match) {
      return {
        hasQuestion: true,
        question: match[1].trim(),
        hint: match[2]?.trim() || undefined,
        correctAnswer: match[3]?.trim() || undefined,
        cleanContent: message.content.replace(questionRegex, '').trim(),
      };
    }
    
    return {
      hasQuestion: false,
      question: '',
      hint: undefined,
      correctAnswer: undefined,
      cleanContent: message.content,
    };
  }, [message.content]);
  
  // Handle answer submission
  const handleQuestionAnswer = (answer: string) => {
    const correct = parsedContent.correctAnswer?.toLowerCase().trim() || '';
    const userAnswer = answer.toLowerCase().trim();
    
    let feedback: QuestionFeedback;
    if (correct && userAnswer === correct) {
      feedback = 'correct';
    } else if (correct) {
      // Check for partial match
      const correctWords = correct.split(/\s+/);
      const matchingWords = correctWords.filter((word) => 
        word.length > 3 && userAnswer.includes(word)
      );
      feedback = matchingWords.length >= correctWords.length * 0.5 ? 'almost' : 'try_again';
    } else {
      feedback = 'almost'; // Be encouraging if no correct answer provided
    }
    
    setQuestionFeedback(feedback);
    setQuestionAnswered(true);
  };
  
  // Text-to-speech hook
  const { speak, stop, isSpeaking, isPaused, toggleSpeaking, isSupported, voices, selectedVoice, setSelectedVoice } = useSpeech({ rate: 0.95 });
  
  // Sync with saved voice preference when voices are loaded
  useEffect(() => {
    if (savedVoiceName && voices.length > 0 && selectedVoice?.name !== savedVoiceName) {
      const voice = voices.find(v => v.name === savedVoiceName);
      if (voice) {
        setSelectedVoice(voice);
      }
    }
  }, [savedVoiceName, voices, selectedVoice?.name, setSelectedVoice]);
  
  // Handle voice change and save to preferences
  const handleVoiceChange = (voiceName: string) => {
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
      onVoiceChange?.(voiceName);
    }
  };
  
  // Get a short display name for a voice
  const getVoiceDisplayName = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.replace(/Microsoft|Google|Apple|Amazon|Polly|Neural|Premium|Enhanced/gi, '').trim();
    const shortName = name.split(' ').slice(0, 2).join(' ');
    return `${shortName} (${voice.lang.split('-')[0]})`;
  };
  
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
        <div className="flex-shrink-0">
          <TeacherAvatar 
            config={defaultAvatarConfig}
            expression={
              questionFeedback === 'correct' ? 'celebrating' :
              questionFeedback === 'almost' ? 'encouraging' :
              questionFeedback === 'try_again' ? 'thinking' :
              parsedContent.hasQuestion && !questionAnswered ? 'thinking' :
              'neutral'
            }
            size={36}
            animated={parsedContent.hasQuestion}
          />
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
                  {parsedContent.cleanContent}
                </ReactMarkdown>
                
                {/* Interactive Question */}
                {parsedContent.hasQuestion && (
                  <div className="mt-4">
                    <InteractiveQuestion
                      question={parsedContent.question}
                      hint={parsedContent.hint}
                      correctAnswer={parsedContent.correctAnswer}
                      onAnswer={handleQuestionAnswer}
                      feedback={questionFeedback}
                      isWaiting={!questionAnswered}
                      avatarConfig={defaultAvatarConfig}
                    />
                  </div>
                )}
                
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
                          <VideoPlayer
                            src={videoUrl}
                            className="w-full h-auto max-h-96"
                          />
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
            
            {/* Text-to-Speech Button for AI messages */}
            {message.content && !showImageLoader && !showVideoLoader && isSupported && (
              <div className="mt-3 pt-2 border-t border-border/20">
                <div className="flex items-center gap-2 flex-wrap">
                  {!isSpeaking ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speak(message.content)}
                        className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Read Aloud
                      </Button>
                      
                      {/* Voice Selection Dropdown */}
                      {voices.length > 0 && (
                        <Select
                          value={selectedVoice?.name || ''}
                          onValueChange={handleVoiceChange}
                        >
                          <SelectTrigger className="h-7 w-auto min-w-[120px] max-w-[180px] text-xs gap-1 bg-background/50">
                            <SelectValue placeholder="Select voice" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] bg-popover z-50">
                            {voices.map((voice) => (
                              <SelectItem 
                                key={voice.name} 
                                value={voice.name}
                                className="text-xs"
                              >
                                {getVoiceDisplayName(voice)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSpeaking}
                        className="gap-1.5 h-7 text-xs text-primary"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={stop}
                        className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>
              </div>
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
