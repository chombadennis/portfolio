/**
* This component provides a secure, sign-in-only form for the site administrator.
*
* Key Security Features:
* 1.  Sign-Up Disabled: The UI and logic for creating new accounts have been completely removed.
* 2.  Email Whitelisting: The form explicitly checks if the sign-in attempt is from the email address stored in the `NEXT_PUBLIC_ALLOWED_EMAIL` environment variable. Any other email is immediately rejected.
* 3.  Attempt Limiting (Brute-Force Protection): The form locks out a user after 5 failed login attempts for the session, preventing password guessing.
* 4.  Vague Error Messages: On a failed login (e.g., wrong password), the error message is intentionally generic to avoid confirming whether an email account exists or not.
* 5.  Redirection on Rejection: If an unauthorized email is used or the attempt limit is exceeded, the user is shown a message and then redirected to the public-facing blog page.
*/
"use client";

import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import type { AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);

  const router = useRouter();
  const { toast } = useToast();
  
  const MAX_LOGIN_ATTEMPTS = 5;
  const REDIRECT_DELAY = 3000; // 3 seconds

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      toast({ 
        title: "Too many attempts", 
        description: "Read something here. Redirecting...", 
        variant: "destructive" 
      });
      setTimeout(() => router.push("/blog"), REDIRECT_DELAY);
      return;
    }

    const allowedEmail = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
    if (!allowedEmail || email.toLowerCase() !== allowedEmail.toLowerCase()) {
      toast({ 
        title: "Access Denied", 
        description: "See my published nuggets. Redirecting...", 
        variant: "destructive" 
      });
      setTimeout(() => router.push("/blog"), REDIRECT_DELAY);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoginAttempts(0); 
      setLoading(false);
      // On success, AuthContext handles the redirect to /admin
    } catch (error) {
      const authError = error as AuthError;
      const newAttemptCount = loginAttempts + 1;
      setLoginAttempts(newAttemptCount);

      if (newAttemptCount >= MAX_LOGIN_ATTEMPTS) {
         toast({ 
           title: "Too many attempts", 
           description: "Read something here. Redirecting...", 
           variant: "destructive" 
         });
         setTimeout(() => router.push("/blog"), REDIRECT_DELAY);
      } else {
        setErrorMessage("Invalid credentials.");
        setLoading(false);
      }
      console.error("Authentication Error Code:", authError.code);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card rounded-lg shadow-lg p-8 mt-32 mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
        Sign In
      </h2>

      <form onSubmit={handleSignIn} className="space-y-5">
        <input
          type="email"
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />

        <button
          type="submit"
          disabled={loading || loginAttempts >= MAX_LOGIN_ATTEMPTS}
          className="w-full flex justify-center items-center py-3 rounded-md text-white font-semibold transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
        </button>
      </form>

      {errorMessage && (
        <p className="mt-4 text-center text-red-600 font-medium">
          {errorMessage}
        </p>
      )}

      <button
        type="button"
        onClick={() => router.push("/")}
        className="mt-6 flex items-center justify-center mx-auto w-12 h-12 
             rounded-full bg-indigo-600 text-white shadow-lg 
             hover:bg-indigo-700 hover:scale-105 transition-all"
        aria-label="Go to Home"
      >
        <Home className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Auth;