import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const location = useLocation();

  useEffect(() => {
    console.log('🔄 ProtectedRoute: Starting auth check');
    console.log('📍 Current path:', location.pathname);
    console.log('🍪 Cookies:', document.cookie);
    
    const checkAuth = async () => {
      try {
        // Test if we can even reach the backend
        console.log('🔍 Testing backend connection...');
        
        const timestamp = Date.now();
        const response = await fetch(
          `http://localhost:5000/auth/check?_=${timestamp}`,
          {
            credentials: 'include', // IMPORTANT: sends cookies
            mode: 'cors',
            cache: 'no-store',
          }
        );
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          console.error('❌ Backend returned error:', response.status);
          setAuthStatus('unauthenticated');
          return;
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        if (data.authenticated) {
          console.log('✅ Authentication successful!');
          setAuthStatus('authenticated');
        } else {
          console.log('❌ Not authenticated according to backend');
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        console.error('💥 Auth check failed:', error);
        console.error('💥 Error details:', error.message);
        setAuthStatus('unauthenticated');
      }
    };

    checkAuth();
  }, [location.pathname]);

  // Show loading state
  if (authStatus === 'loading') {
    console.log('⏳ Showing loading state...');
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-900">Checking authentication</p>
          <p className="mt-2 text-sm text-gray-600">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (authStatus === 'unauthenticated') {
    console.log('🔀 Redirecting to /login from:', location.pathname);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Render children if authenticated
  console.log('🎉 Rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;