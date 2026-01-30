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
        const res = await fetch("http://localhost:5000/auth/user", {
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
setUser(null);
window.location.href = "http://localhost:5000/auth/saml/logout";
};

  return { user, loading, signOut };
}
