"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Explicit type for everything the context should expose
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

// ✅ Provide undefined as default so we can enforce usage via hook
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const ALLOWED_EMAIL = (
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL || ""
  ).toLowerCase();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    // Subscribe to auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Compute admin flag
  const isAdmin = !!user?.email && user.email.toLowerCase() === ALLOWED_EMAIL;

  // Sign out method
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  // Authenticated fetch with JWT
  const authFetch = useCallback(
    async (url: string, options?: RequestInit): Promise<Response> => {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      return fetch(url, {
        ...options,
        headers: {
          ...(options?.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        signOut,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Strongly typed hook that guarantees context is available
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
