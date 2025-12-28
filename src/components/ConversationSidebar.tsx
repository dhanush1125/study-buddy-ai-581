import { MessageSquarePlus, Trash2, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { Conversation } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  loading: boolean;
}

export const ConversationSidebar = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  loading,
}: ConversationSidebarProps) => {
  const { user, signOut } = useAuth();

  return (
    <div className="w-64 h-full bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* New Chat Button */}
      <div className="p-3 border-b border-sidebar-border">
        <Button
          onClick={onNewConversation}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                  currentConversationId === conversation.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <span className="flex-1 truncate text-sm">
                  {conversation.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="flex-1 text-sm truncate text-sidebar-foreground">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={signOut}
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};
