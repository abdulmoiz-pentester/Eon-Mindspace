import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:5000/auth/check', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        
        if (!data.authenticated) {
          toast({
            title: "Session Expired",
            description: "Please login again to continue.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        toast({
          title: "Connection Error",
          description: "Unable to verify authentication. Please try again.",
          variant: "destructive",
        });
      }
    };

    checkAuth();
  }, [toast]);

  if (isAuthenticated === null) {
    // Show loading state
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl medical-gradient flex items-center justify-center animate-pulse">
            <div className="h-10 w-10 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground animate-pulse">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;