import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Button } from "@/components/ui/button";
import { Shield, Lock, CheckCircle2 } from "lucide-react";
import eonLogo from "@/assets/eon-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle } = useGoogleAuth();

  useEffect(() => {
    // Redirect to home if user is logged in
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const features = [
    "Fast, reliable security answers",
    "Internal knowledge base access", 
    "24/7 security guidance",
  ];

  // Show loading while checking auth or processing callback
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center items-center p-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-md text-center">
          <div className="mb-8 animate-float">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-card shadow-elevated">
              <img src={eonLogo} alt="Eon" className="h-12 w-auto" />
            </div>
          </div>
          
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Eon <span className="text-gradient">Mindspace</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Your internal security chatbot for fast, reliable answers to security-related questions across the organization.
          </p>
          
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div 
                key={feature}
                className="flex items-center gap-3 text-left animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-card shadow-elevated mb-4">
              <img src={eonLogo} alt="Eon" className="h-8 w-auto" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Eon Mindspace
            </h1>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-elevated border border-border">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Welcome</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in with your company email to continue
              </p>
            </div>

            <Button
              variant="google"
              className="w-full h-12 text-base"
              onClick={signInWithGoogle}
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>Enterprise-grade security</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to Eon's security policies and terms of use.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
