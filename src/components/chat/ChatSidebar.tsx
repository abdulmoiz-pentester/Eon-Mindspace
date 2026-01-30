import { useState } from "react";
import { 
  Plus, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  LogOut,
  User,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import eonLogo from "@/assets/eon-logo.png";

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  preview: string;
}

interface ChatSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  chatHistory: ChatHistory[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
 user: { name: string; avatar?: string } | null;
  onSignOut: () => void;
}

export function ChatSidebar({
  isCollapsed,
  onToggle,
  chatHistory,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  user,
  onSignOut,
}: ChatSidebarProps) {
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header with Logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="relative">
              <img src={eonLogo} alt="Eon" className="h-6 w-auto" />
            </div>
            <span className="font-display font-semibold text-lg text-gradient">
              Mindspace
            </span>
          </div>
        )}
        {isCollapsed && (
          <img src={eonLogo} alt="Eon" className="h-5 w-auto mx-auto" />
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            isCollapsed && "hidden"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            className="absolute -right-3 top-4 bg-card border border-border shadow-sm rounded-full text-muted-foreground hover:text-foreground z-10"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          variant="medical"
          className={cn(
            "w-full justify-start gap-2",
            isCollapsed && "justify-center px-0"
          )}
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span>New Conversation</span>}
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {!isCollapsed && chatHistory.length > 0 && (
          <p className="px-2 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Recent Chats
          </p>
        )}
        {chatHistory.length === 0 && !isCollapsed && (
          <div className="px-2 py-8 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Start a new conversation to see your history here
            </p>
          </div>
        )}
        <div className="space-y-1">
          {chatHistory.map((chat, index) => (
            <div
              key={chat.id}
              className={cn(
                "group relative rounded-lg transition-all duration-200",
                activeChatId === chat.id
                  ? "bg-sidebar-accent"
                  : "hover:bg-sidebar-accent/50"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onMouseEnter={() => setHoveredChat(chat.id)}
              onMouseLeave={() => setHoveredChat(null)}
            >
              <button
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 text-left transition-colors",
                  isCollapsed && "justify-center"
                )}
              >
                <MessageSquare
                  className={cn(
                    "h-4 w-4 shrink-0",
                    activeChatId === chat.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        activeChatId === chat.id
                          ? "text-sidebar-accent-foreground"
                          : "text-sidebar-foreground"
                      )}
                    >
                      {chat.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.preview}
                    </p>
                  </div>
                )}
              </button>
              {!isCollapsed && hoveredChat === chat.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors animate-fade-in"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors",
                  isCollapsed && "justify-center"
                )}
              >
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.name || "Guest" }
                      </p>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>
  );
}
