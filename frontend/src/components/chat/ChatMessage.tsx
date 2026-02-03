import { Bot, User, Copy, Check, RefreshCw } from "lucide-react";
import { useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  isLoading?: boolean;
  userAvatar?: string;
  userName?: string;
  onRegenerate?: () => void;
}

function ChatMessageComponent({
  role,
  content,
  timestamp,
  isLoading,
  userAvatar,
  userName,
  onRegenerate,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-6 group",
        isUser ? "animate-slide-in-right" : "animate-slide-in-left",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl medical-gradient flex items-center justify-center shadow-medical">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className={cn(
            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
            "bg-accent"
          )} />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-2 max-w-[70%]",
          isUser && "items-end"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-soft",
            isUser
              ? "bg-medical-user text-medical-user-foreground rounded-tr-sm"
              : "bg-medical-bot text-medical-bot-foreground rounded-tl-sm border border-border"
          )}
        >
          {isLoading ? (
            <div className="typing-indicator flex items-center gap-1 py-1">
              <span />
              <span />
              <span />
            </div>
          ) : isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm">{children}</li>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-xs">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className={cn("block p-3 rounded-lg bg-muted/50 font-mono text-xs overflow-x-auto", className)} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="mb-2 overflow-x-auto">{children}</pre>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold mb-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold mb-1">{children}</h3>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isLoading && !isUser && content && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-accent" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onRegenerate}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {timestamp && (
          <span className="text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {isUser && (
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/20">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            {userName
              ? userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export const ChatMessage = memo(ChatMessageComponent);