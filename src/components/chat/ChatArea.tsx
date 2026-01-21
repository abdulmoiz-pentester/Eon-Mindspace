import { useRef, useEffect } from "react";
import { Shield, Lock, Key, FileCheck, Zap, Globe } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { cn } from "../../lib/utils";
//import eonLogo from "./assets/eon-logo.png";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming?: boolean;
  streamingMessageId?: string | null;
  onSend: (message: string) => void;
  onRegenerate?: (messageId: string) => void;
  user?: {
    name: string;
    avatar?: string;
  } | null;
}

const welcomeFeatures = [
  {
    icon: Shield,
    title: "Security Policies",
    description: "Get answers about company security policies",
    gradient: "from-teal-500 to-cyan-500",
  },
  {
    icon: Lock,
    title: "Access Control",
    description: "Understand authentication and authorization",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Key,
    title: "Credentials & Keys",
    description: "Best practices for secret management",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: FileCheck,
    title: "Compliance",
    description: "Stay compliant with security standards",
    gradient: "from-blue-500 to-indigo-500",
  },
];

const quickActions = [
  { icon: Zap, label: "Password policy", prompt: "What is our password policy?" },
  { icon: Shield, label: "Report incident", prompt: "How do I report a security incident?" },
  { icon: Globe, label: "VPN setup", prompt: "How do I set up VPN access?" },
];

export function ChatArea({
  messages,
  isLoading,
  isStreaming,
  streamingMessageId,
  onSend,
  onRegenerate,
  user,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isStreaming]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in">
            {/* Logo with enhanced animation */}
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-2xl medical-gradient flex items-center justify-center shadow-medical-lg animate-float">
                {/*<img src={eonLogo} alt="Eon" className="h-12 w-auto brightness-0 invert" />*/}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl animate-pulse-ring" />
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-3xl animate-pulse opacity-50" />
            </div>

            {/* Welcome Text */}
            <h1 className="text-4xl font-display font-bold text-foreground mb-3 text-center">
              Welcome to{" "}
              <span className="text-gradient">Eon Mindspace</span>
            </h1>
            <p className="text-muted-foreground text-center mb-10 max-w-lg text-lg">
              Your intelligent security assistant. Ask anything about security policies, compliance, and best practices.
            </p>

            {/* Feature Cards with enhanced styling */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-8">
              {welcomeFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className={cn(
                    "group p-5 rounded-2xl border border-border bg-card/50 backdrop-blur-sm",
                    "hover:bg-card hover:border-primary/30 transition-all duration-300",
                    "cursor-pointer hover:-translate-y-1 hover:shadow-medical animate-slide-up"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => onSend(`Tell me about ${feature.title.toLowerCase()}`)}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4",
                    "group-hover:scale-110 transition-transform duration-300",
                    feature.gradient
                  )}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => onSend(action.prompt)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full",
                    "bg-secondary/50 hover:bg-secondary text-secondary-foreground",
                    "border border-border hover:border-primary/30",
                    "transition-all duration-200 hover:shadow-sm"
                  )}
                >
                  <action.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                isStreaming={isStreaming && streamingMessageId === message.id}
                userAvatar={user?.avatar}
                userName={user?.name}
                onRegenerate={
                  message.role === "assistant" && onRegenerate && !isStreaming
                    ? () => onRegenerate(message.id)
                    : undefined
                }
              />
            ))}
            {isLoading && !isStreaming && (
              <ChatMessage
                role="assistant"
                content=""
                isLoading
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput onSend={onSend} isLoading={isLoading || isStreaming} />
    </div>
  );
}
