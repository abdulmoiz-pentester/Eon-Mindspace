import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Login page loaded');
    console.log('Cookies:', document.cookie);
    
    // Quick check for JWT cookie
    const hasJWT = document.cookie.includes('jwt=');
    console.log('Has JWT cookie on login page?', hasJWT);
    
    if (hasJWT) {
      console.log('Login: JWT found, checking with backend...');
      
      // Verify with backend before redirecting
      const checkAuth = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/check`, {
            credentials: 'include',
            cache: 'no-store',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
              console.log('Login: Backend confirms authentication, redirecting to /');
              navigate("/", { replace: true });
            } else {
              console.log('Login: JWT exists but backend says not authenticated');
              // Stay on login page
            }
          }
        } catch (error) {
          console.error('Login: Auth check failed:', error);
        }
      };
      
      checkAuth();
    } else {
      console.log('Login: No JWT found, showing login form');
    }
  }, [navigate]);

  const handleSSOLogin = () => {
    console.log('Initiating AWS SSO login...');
    // Clear any stale cookies first
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'eon.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to backend SAML login
   window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/saml/login`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to Eon Mindspace</h2>
          <p className="mt-2 text-gray-600">
            Sign in with your AWS SSO credentials
          </p>
        </div>
        
        <div className="mt-8">
          <Button
  onClick={handleSSOLogin}
  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
>
  <LogIn className="h-5 w-5 mr-2" />
  Sign in with AWS SSO
</Button>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Secure authentication with AWS Single Sign-On</p>
        </div>
      </div>
    </div>
  );
};

export default Login;