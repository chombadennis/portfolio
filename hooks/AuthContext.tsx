"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Explicit type for everything the context should expose
export interface AuthContextType {
  user: FirebaseUser | null;
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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const ALLOWED_EMAIL = (
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL || ""
  ).toLowerCase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Compute admin flag
  const isAdmin = !!user?.email && user.email.toLowerCase() === ALLOWED_EMAIL;

  // Sign out method
  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  // Authenticated fetch with JWT
  const authFetch = useCallback(
    async (url: string, options?: RequestInit): Promise<Response> => {
      const token = user ? await user.getIdToken() : null;

      return fetch(url, {
        ...options,
        headers: {
          ...(options?.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
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
