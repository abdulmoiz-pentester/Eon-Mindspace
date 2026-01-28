import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, CheckCircle2, LogIn } from "lucide-react";
import eonLogo from "@/assets/eon_black_transparent.png";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
   
    const checkAuth = async () => {
      try {
        const response = await fetch('/auth/check', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.authenticated) {
          navigate("/");
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleSSOLogin = () => {

  window.location.href = 'http://localhost:5000/auth/saml/login';
};

  const features = [
    "Fast, reliable security answers",
    "Internal knowledge base access", 
    "24/7 security guidance",
  ];

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
                Sign in with your company credentials
              </p>
            </div>

            {/* AWS SSO Login Button */}
            <Button
              variant="default"
              className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
              onClick={handleSSOLogin}
            >
              <LogIn className="h-5 w-5 mr-3" />
              Sign in with AWS SSO
            </Button>

            {/* Development Login Button (only in dev) */}
            {process.env.NODE_ENV === 'development' && (
  <div className="mt-4">
    <Button
      variant="outline"
      className="w-full h-12 text-base"
      onClick={() => {
        // ADD returnTo parameter
        window.location.href = 'http://localhost:5000/auth/dev/login?returnTo=/';
      }}
    >
      Development Login (Test)
    </Button>
    <p className="text-xs text-muted-foreground mt-2 text-center">
      Use this for testing without AWS SSO
    </p>
  </div>
)}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>Enterprise SSO Security</span>
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