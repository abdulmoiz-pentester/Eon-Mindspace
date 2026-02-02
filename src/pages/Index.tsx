import { useState, useCallback, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { sendToAgent } from "@/lib/bedrock-api";
import { useAuth } from "@/hooks/useAuth";


interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  preview: string;
  messages: Message[];
}

const CHAT_HISTORY_KEY = "eon_chat_history";

const Index = () => {
  const navigate = useNavigate();
 // const { user, loading, signOut } = useGoogleAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading, signOut } = useAuth();
  const mappedUser = user
    ? { name: user.email || user.userId, avatar: undefined }
    : null;

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const restored = parsed.map((chat: ChatHistory) => ({
          ...chat,
          messages: chat.messages.map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
        setChatHistory(restored);
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  }, []);

  // Save chat history to localStorage when it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  // Save current conversation to history when messages change
  const saveToHistory = useCallback((msgs: Message[]) => {
    if (msgs.length === 0) return;
    
    const firstUserMessage = msgs.find(m => m.role === "user");
    const title = firstUserMessage?.content.slice(0, 50) || "New Conversation";
    const lastMessage = msgs[msgs.length - 1];
    const preview = lastMessage.content.slice(0, 100);
    
    setChatHistory(prev => {
      if (activeChatId) {
        return prev.map(chat => 
          chat.id === activeChatId 
            ? { ...chat, messages: msgs, preview, title: chat.title || title }
            : chat
        );
      } else {
        const newId = Date.now().toString();
        setActiveChatId(newId);
        return [{
          id: newId,
          title,
          date: new Date().toLocaleDateString(),
          preview,
          messages: msgs,
        }, ...prev];
      }
    });
  }, [activeChatId]);

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      // Add user message immediately
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        console.log("🔄 Calling agent...");
        const reply = await sendToAgent(content); // Call your backend API
        
        console.log("✅ Agent reply received:", reply.substring(0, 100));
        
        // Add assistant response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        };
        
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        saveToHistory(finalMessages);
        
      } catch (err) {
        console.error("❌ Error in handleSend:", err);
        
        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        };
        
        const finalMessages = [...updatedMessages, errorMessage];
        setMessages(finalMessages);
        
        toast({
          title: "Error",
          description: "Failed to get response from agent.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, saveToHistory, toast]
  );

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setActiveChatId(null);
    toast({
      title: "New Conversation Started",
      description: "You can now start a fresh conversation.",
    });
  }, [toast]);

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
    const chat = chatHistory.find((c) => c.id === id);
    if (chat && chat.messages) {
      setMessages(chat.messages);
    }
  }, [chatHistory]);

  const handleDeleteChat = useCallback((id: string) => {
    const updatedHistory = chatHistory.filter((chat) => chat.id !== id);
    setChatHistory(updatedHistory);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));
    
    if (activeChatId === id) {
      setMessages([]);
      setActiveChatId(null);
    }
    toast({
      title: "Chat Deleted",
      description: "The conversation has been removed from your history.",
    });
  }, [chatHistory, activeChatId, toast]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    if (activeChatId) {
      setChatHistory(prev => prev.filter(c => c.id !== activeChatId));
      setActiveChatId(null);
    }
    toast({
      title: "Chat Cleared",
      description: "The current conversation has been cleared.",
    });
  }, [activeChatId, toast]);

  const handleExportChat = useCallback(() => {
    if (messages.length === 0) {
      toast({
        title: "Nothing to Export",
        description: "Start a conversation first.",
      });
      return;
    }

    const exportContent = messages
      .map(m => `[${m.role.toUpperCase()}] ${m.timestamp.toLocaleString()}\n${m.content}`)
      .join("\n\n---\n\n");
    
    const blob = new Blob([exportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eon-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Chat Exported",
      description: "Your conversation has been downloaded.",
    });
  }, [messages, toast]);

const handleSignOut = useCallback(() => {
  console.log('🚪 Frontend: Signing out...');
  
  try {
    // Clear frontend state
    localStorage.removeItem(CHAT_HISTORY_KEY);
    
    // Clear JWT cookie on frontend too
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;';
    document.cookie = 'eon.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;';
    
    // Clear user state if using useAuth
    signOut && signOut();
    
    // Redirect to backend logout endpoint
    window.location.href = 'http://localhost:5000/auth/saml/logout';
  } catch (e) {
    console.error("Logout failed", e);
    toast({
      title: "Logout Error",
      description: "Failed to logout properly. Please try again.",
      variant: "destructive",
    });
  }
}, [signOut, toast]);


  const handleRegenerate = useCallback(
    async (messageId: string) => {
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;
      
      // Get all messages up to the one before the one being regenerated
      const previousMessages = messages.slice(0, messageIndex);
      const lastUserMessage = [...previousMessages].reverse().find(m => m.role === "user");
      
      if (!lastUserMessage) {
        toast({
          title: "Error",
          description: "No user message found to regenerate from.",
          variant: "destructive",
        });
        return;
      }
      
      // Remove the message being regenerated and all messages after it
      const messagesUpToUser = previousMessages;
      
      setIsLoading(true);
      
      try {
        console.log("🔄 Regenerating response...");
        const reply = await sendToAgent(lastUserMessage.content);
        
        console.log("✅ Regenerated reply received:", reply.substring(0, 100));
        
        // Create new assistant message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        };
        
        // Replace messages from the regeneration point
        const finalMessages = [...messagesUpToUser, assistantMessage];
        setMessages(finalMessages);
        saveToHistory(finalMessages);
        
      } catch (err) {
        console.error("❌ Error in handleRegenerate:", err);
        toast({
          title: "Error",
          description: "Failed to regenerate response.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, saveToHistory, toast]
  );

  const currentChat = chatHistory.find((c) => c.id === activeChatId);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl medical-gradient flex items-center justify-center animate-pulse">
            <div className="h-10 w-10 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* Sidebar */}
      <ChatSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        user={mappedUser}
        onSignOut={handleSignOut}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          chatTitle={currentChat?.title}
          onSignOut={handleSignOut}
          onClearChat={handleClearChat}
          onExportChat={handleExportChat}
        />
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSend={handleSend}
          onRegenerate={handleRegenerate}
          user={mappedUser}
        />
      </main>
    </div>
  );
};

export default Index;
