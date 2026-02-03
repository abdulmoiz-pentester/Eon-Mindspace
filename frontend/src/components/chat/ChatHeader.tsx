import { Menu, Sun, Moon, Monitor, HelpCircle, MoreVertical, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  chatTitle?: string;
  onSignOut?: () => void;
  onClearChat?: () => void;
  onExportChat?: () => void;
}

export function ChatHeader({ 
  onToggleSidebar, 
  chatTitle, 
  onSignOut,
  onClearChat,
  onExportChat,
}: ChatHeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display font-semibold text-foreground">
            {chatTitle || "New Conversation"}
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Eon Mindspace is ready to help
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Theme toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                {resolvedTheme === "dark" ? (
                  <Moon className="mr-2 h-4 w-4" />
                ) : (
                  <Sun className="mr-2 h-4 w-4" />
                )}
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className={cn("mr-2 h-4 w-4", theme === "light" && "text-primary")} />
                  Light
                  {theme === "light" && <span className="ml-auto text-xs text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className={cn("mr-2 h-4 w-4", theme === "dark" && "text-primary")} />
                  Dark
                  {theme === "dark" && <span className="ml-auto text-xs text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className={cn("mr-2 h-4 w-4", theme === "system" && "text-primary")} />
                  System
                  {theme === "system" && <span className="ml-auto text-xs text-primary">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            {onExportChat && (
              <DropdownMenuItem onClick={onExportChat}>
                Export Chat
              </DropdownMenuItem>
            )}
            {onClearChat && (
              <DropdownMenuItem onClick={onClearChat} className="text-destructive">
                Clear Chat
              </DropdownMenuItem>
            )}
            {onSignOut && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
