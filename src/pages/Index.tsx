import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { WelcomeMessage } from "@/components/WelcomeMessage";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ProgressTracker } from "@/components/ProgressTracker";
import { QuickRevisionDialog } from "@/components/QuickRevisionDialog";
import { BookOpen, Menu, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const {
    conversations,
    loading: conversationsLoading,
    createConversation,
    deleteConversation,
  } = useConversations();

  const { messages, isLoading, messagesLoading, sendMessage, stopGeneration } = useChat(currentConversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle new conversation with first message
  const handleSendMessage = async (input: string, imageBase64?: string) => {
    if (!currentConversationId) {
      // Create new conversation with title from first message
      const title = input.trim().slice(0, 50) || "New Conversation";
      const conversation = await createConversation(title);
      if (conversation) {
        setCurrentConversationId(conversation.id);
        // Wait for state to update then send
        setTimeout(() => {
          sendMessage(input, imageBase64);
        }, 100);
      }
    } else {
      sendMessage(input, imageBase64);
    }
  };

  // Listen for suggestion clicks
  useEffect(() => {
    const handleSuggestion = (e: CustomEvent<string>) => {
      handleSendMessage(e.detail);
    };
    window.addEventListener("suggestion-click", handleSuggestion as EventListener);
    return () => window.removeEventListener("suggestion-click", handleSuggestion as EventListener);
  }, [currentConversationId]);

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  const handleQuickRevision = (topic: string, timeframe: string) => {
    const timeframeText = timeframe === "hours" ? "in a few hours" : timeframe === "tomorrow" ? "tomorrow" : "in a few days";
    const revisionPrompt = `🎯 QUICK REVISION MODE: My exam is ${timeframeText}. Help me revise "${topic}" quickly with:
- Only high-priority points
- Memory tricks and mnemonics
- Key diagrams
- Common exam questions
Keep it stress-free and focused!`;
    handleSendMessage(revisionPrompt);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-200 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          loading={conversationsLoading}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">StudyBuddy</h1>
                <p className="text-xs text-muted-foreground">Your AI Career Guide & Study Mentor</p>
              </div>
            </div>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevisionOpen(true)}
                className="gap-2 bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Revision</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProgressOpen(true)}
                className="gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Progress</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <WelcomeMessage />
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id || index}
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
              onSend={handleSendMessage}
              onStop={stopGeneration}
              isLoading={isLoading}
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
              StudyBuddy can make mistakes. Verify important information.
            </p>
          </div>
        </footer>
      </div>

      {/* Progress Tracker Modal */}
      <ProgressTracker isOpen={progressOpen} onClose={() => setProgressOpen(false)} />

      {/* Quick Revision Dialog */}
      <QuickRevisionDialog
        isOpen={revisionOpen}
        onClose={() => setRevisionOpen(false)}
        onStartRevision={handleQuickRevision}
      />
    </div>
  );
};

export default Index;
