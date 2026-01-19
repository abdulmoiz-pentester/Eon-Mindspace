import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_CLIENT_ID = "593013096007-q1gq0e3hf7lrq8k4l40tc2vcv57gnjrm.apps.googleusercontent.com";
const AUTH_STORAGE_KEY = "eon_google_auth";

// DEV MODE: Set to true to bypass Google OAuth for testing
const DEV_BYPASS_AUTH = true;

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  verified_email?: boolean;
}

interface AuthState {
  user: GoogleUser | null;
  accessToken: string | null;
  expiresAt: number | null;
}

export function useGoogleAuth() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    // DEV MODE: Auto-login with mock user
    if (DEV_BYPASS_AUTH) {
      setUser({
        id: "dev-user-123",
        email: "dev@eonhealth.com",
        name: "Dev User",
        verified_email: true,
      });
      setLoading(false);
      return;
    }

    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const authState: AuthState = JSON.parse(stored);
        // Check if token is still valid
        if (authState.expiresAt && authState.expiresAt > Date.now()) {
          setUser(authState.user);
        } else {
          // Token expired, clear storage
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;

    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");

      // Verify state matches what we stored
      const storedState = sessionStorage.getItem("oauth_state");
      
      if (code && state && state === storedState) {
        setLoading(true);
        sessionStorage.removeItem("oauth_state");
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);

        try {
          const redirectUri = `${window.location.origin}/login`;
          
          const { data, error } = await supabase.functions.invoke("google-oauth", {
            body: { code, redirect_uri: redirectUri },
          });

          if (error) throw error;

          const authState: AuthState = {
            user: data.user,
            accessToken: data.access_token,
            expiresAt: Date.now() + (data.expires_in * 1000),
          };

          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
          setUser(data.user);
        } catch (error) {
          console.error("OAuth callback error:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    handleCallback();
  }, []);

  const signInWithGoogle = useCallback(() => {
    if (DEV_BYPASS_AUTH) {
      setUser({
        id: "dev-user-123",
        email: "dev@eonhealth.com",
        name: "Dev User",
        verified_email: true,
      });
      return;
    }

    const redirectUri = `${window.location.origin}/login`;
    const state = crypto.randomUUID();
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "consent",
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);

  return { user, loading, signInWithGoogle, signOut };
}
