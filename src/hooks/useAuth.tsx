import { useState, useEffect } from "react";

interface SSOUser {
  userId: string;
  email: string;
  sessionId: string;
}

export function useAuth() {
  const [user, setUser] = useState<SSOUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // FIX: Use hardcoded URL or import.meta.env for Vite
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        
        const res = await fetch(`${backendUrl}/auth/user`, {
          credentials: "include",
        });
        
        if (!res.ok) throw new Error("Not authenticated");

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const signOut = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    setUser(null);
    window.location.href = `${backendUrl}/auth/saml/logout`;
  };

  return { user, loading, signOut };
}