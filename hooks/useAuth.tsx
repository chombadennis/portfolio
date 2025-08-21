// src/hooks/useAuth.tsx
import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "./AuthContext";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // ✅ Add authFetch to satisfy AuthContextType
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = session?.access_token;
    const headers = {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return fetch(url, { ...options, headers });
  };

  useEffect(() => {
    let mounted = true;

    // Check for existing session first (persistence on refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Set up auth state listener (login/logout events)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [session]);

  // Admin check based on allowed email
  const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL as string;
  const isAdmin = user?.email?.toLowerCase() === ALLOWED_EMAIL?.toLowerCase();

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        signOut,
        authFetch, // ✅ Added here
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
