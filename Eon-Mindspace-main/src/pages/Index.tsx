import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { streamChat } from "@/lib/streamChat";

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
  const { user, loading, signOut } = useGoogleAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const { toast } = useToast();
  const streamingContentRef = useRef<string>("");

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

      const assistantMessageId = (Date.now() + 1).toString();
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);
      streamingContentRef.current = "";

      // Create placeholder assistant message
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      
      setMessages([...updatedMessages, assistantMessage]);
      setIsLoading(false);
      setIsStreaming(true);
      setStreamingMessageId(assistantMessageId);

      const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      await streamChat({
        messages: apiMessages,
        onDelta: (chunk) => {
          streamingContentRef.current += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIdx = newMessages.length - 1;
            if (newMessages[lastIdx]?.id === assistantMessageId) {
              newMessages[lastIdx] = {
                ...newMessages[lastIdx],
                content: streamingContentRef.current,
              };
            }
            return newMessages;
          });
        },
        onDone: () => {
          setIsStreaming(false);
          setStreamingMessageId(null);
          
          // Save final messages to history
          setMessages(prev => {
            const finalMessages = prev.map(m => 
              m.id === assistantMessageId 
                ? { ...m, content: streamingContentRef.current, timestamp: new Date() }
                : m
            );
            saveToHistory(finalMessages);
            return finalMessages;
          });
        },
        onError: (error) => {
          setIsStreaming(false);
          setStreamingMessageId(null);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          // Remove the empty assistant message on error
          setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
        },
      });
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
    signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
    navigate("/login");
  }, [signOut, toast, navigate]);

  const handleRegenerate = useCallback(
    async (messageId: string) => {
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;
      
      const previousMessages = messages.slice(0, messageIndex);
      streamingContentRef.current = "";
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[messageIndex] = { ...newMessages[messageIndex], content: "" };
        return newMessages;
      });
      
      setIsStreaming(true);
      setStreamingMessageId(messageId);

      const apiMessages = previousMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      await streamChat({
        messages: apiMessages,
        onDelta: (chunk) => {
          streamingContentRef.current += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[messageIndex]) {
              newMessages[messageIndex] = {
                ...newMessages[messageIndex],
                content: streamingContentRef.current,
              };
            }
            return newMessages;
          });
        },
        onDone: () => {
          setIsStreaming(false);
          setStreamingMessageId(null);
          
          setMessages(prev => {
            const finalMessages = prev.map((m, i) => 
              i === messageIndex 
                ? { ...m, content: streamingContentRef.current, timestamp: new Date() }
                : m
            );
            saveToHistory(finalMessages);
            return finalMessages;
          });
        },
        onError: (error) => {
          setIsStreaming(false);
          setStreamingMessageId(null);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
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
        user={user}
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
          isStreaming={isStreaming}
          streamingMessageId={streamingMessageId}
          onSend={handleSend}
          onRegenerate={handleRegenerate}
          user={user}
        />
      </main>
    </div>
  );
};

export default Index;
