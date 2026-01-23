import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendToAgent } from "@/lib/bedrock-api"; 

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  onStop?: () => void;
}

const suggestions = [
  "What is our password policy?",
  "How do I report a security incident?",
  "VPN setup guide",
  "MFA best practices",
];

export function ChatInput({ onSend, isLoading, disabled, onStop }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);
const [loading, setLoading] = useState(false);
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (message.trim() && !isLoading && !disabled) {
    const userMessage = message.trim();
    setMessage(""); // clear textarea

    if (onSend) onSend(userMessage); // show user's message

    try {
      setLoading(true); // show loader
      const reply = await sendToAgent(userMessage); // wait backend
      if (onSend) onSend(reply); // show agent message
    } catch (err) {
      console.error(err);
      if (onSend) onSend("Sorry, something went wrong.");
    } finally {
      setLoading(false); // hide loader
    }
  }
};



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div
          className={cn(
            "relative flex items-end gap-3 p-3 rounded-2xl border bg-card transition-all duration-300",
            isFocused
              ? "border-primary shadow-medical ring-2 ring-primary/20"
              : "border-border shadow-soft hover:border-primary/30"
          )}
        >
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask a security question..."
              disabled={disabled}
              className={cn(
                "w-full bg-transparent resize-none text-sm text-foreground",
                "placeholder:text-muted-foreground focus:outline-none max-h-[200px] py-2 px-1",
                "transition-colors"
              )}
              rows={1}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pb-0.5">
            {isLoading && onStop ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={onStop}
                className="rounded-xl"
              >
                <StopCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="send"
                size="icon"
                disabled={!message.trim() || isLoading || disabled}
                className={cn(
                  "rounded-xl transition-all duration-300",
                  message.trim() && !isLoading
                    ? "opacity-100 scale-100"
                    : "opacity-50 scale-95"
                )}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Try asking:
          </span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setMessage(suggestion)}
              disabled={isLoading}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full",
                "bg-secondary/50 hover:bg-secondary text-secondary-foreground",
                "border border-transparent hover:border-primary/20",
                "transition-all duration-200 hover:shadow-sm",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted-foreground/70 mt-4">
          Eon Mindspace provides internal security guidance. For urgent security issues, contact the Security Team directly.
        </p>
      </form>
    </div>
  );
}
