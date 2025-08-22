"use client";

// app/auth/page.tsx
import { useState, useMemo, useEffect } from "react";
import type { FormEvent, ChangeEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";

// interface
interface AuthProps {
  onLogin?: (session: Session | null) => void;
}

type Stage = "credentials" | "otp";

const STRONG_PASSWORD_HINT =
  "Use 12+ chars with upper/lowercase, numbers & symbols (avoid common words).";

const OTP_LENGTH = 6;
const MAX_FAILED_ATTEMPTS = 8;

const emailRegex =
  /^(?:[a-zA-Z0-9_'^&/.+-])+(?:\.(?:[a-zA-Z0-9_'^&/.+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

function normalizeEmail(e: string) {
  return e.trim().toLowerCase();
}

function isValidEmail(e: string) {
  return emailRegex.test(e);
}

function isLikelyNumericOtp(otp: string) {
  return /^\d+$/.test(otp) && otp.length === OTP_LENGTH;
}

function getBackoffMillis(failures: number) {
  const base = Math.min(failures, 6);
  return Math.min(30000, Math.pow(2, base) * 250);
}

const Auth = ({ onLogin }: AuthProps) => {
  const [stage, setStage] = useState<Stage>("credentials");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tempSession, setTempSession] = useState<Session | null>(null);

  const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL as string;
  const router = useRouter();

  // Create a new supabase client per render (per @supabase/ssr docs)
  const supabase = createClient();

  const normalizedAllowed = useMemo(
    () => normalizeEmail(ALLOWED_EMAIL),
    [ALLOWED_EMAIL]
  );
  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);

  useEffect(() => {
    // Bridge client auth state to server cookies for middleware
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, session }),
      });
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const resetState = () => {
    setErrorMessage(null);
    setAuthError(null);
    setSuccessMessage(null);
    setLoading(false);
    setOtpCode("");
    setPassword("");
  };

  // Unicode-aware strong password check (letters/numbers/symbols OR space)
  const isPasswordStrong = useMemo(() => {
    if (password.length < 12) return false;
    const hasLetter = /\p{L}/u.test(password);
    const hasNumber = /\p{N}/u.test(password);
    const hasSymbol = /[\p{S}\p{P}]/u.test(password);
    const hasSpace = /\s/u.test(password);
    return hasLetter && hasNumber && (hasSymbol || hasSpace);
  }, [password]);

  const guardAllowedEmail = () => {
    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }

    if (normalizedEmail !== normalizedAllowed) {
      setErrorMessage(
        "Access denied. This dashboard is restricted to authorized users only. Check out my published 🧽nuggets..."
      );
      onLogin?.(null);

      // Wait a few seconds before redirecting
      setTimeout(() => {
        router.push("/blog");
      }, 4500);

      return false;
    }

    return true;
  };

  const recordFailure = () => {
    const key = `auth-failures:${normalizedEmail}`;
    const failures = Number(localStorage.getItem(key) || "0") + 1;
    localStorage.setItem(key, String(failures));
    return failures;
  };

  const clearFailures = () => {
    const key = `auth-failures:${normalizedEmail}`;
    localStorage.removeItem(key);
  };

  // --- New explicit signup handler ---
  const handleSignUP = async (): Promise<void> => {
    // Enforce strong password before attempting sign-up
    if (!isPasswordStrong) {
      setErrorMessage(STRONG_PASSWORD_HINT);
      setLoading(false);
      return;
    }

    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

      // Duplicate detection: explicit error OR Supabase returns user with identities: []
      if (
        signUpError ||
        (signUpData?.user?.identities &&
          signUpData.user.identities.length === 0)
      ) {
        setIsSignUp(false);
        setStage("credentials");
        setSuccessMessage(
          "Account already exists. Please sign in or use 'Forgot password?'."
        );
        return;
      }

      // Email confirmation flow (no session until confirmed)
      if (signUpData?.user && !signUpData.session) {
        setSuccessMessage("Check your email for a confirmation link!");
        return;
      }

      // If a session is returned, move to OTP as 2nd factor
      if (signUpData?.session) {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: window.location.origin,
          },
        });
        if (otpError) throw otpError;
        setTempSession(signUpData.session);
        setStage("otp");
        setSuccessMessage("OTP has been sent to your email.");
      }
    } catch (error) {
      const failuresNow = recordFailure();
      const wait = getBackoffMillis(failuresNow);
      setTimeout(() => setLoading(false), wait);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      onLogin?.(null);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!guardAllowedEmail()) {
      setLoading(false);
      return;
    }

    const failures = Number(
      localStorage.getItem(`auth-failures:${normalizedEmail}`) || "0"
    );
    if (failures >= MAX_FAILED_ATTEMPTS) {
      setLoading(false);
      setErrorMessage(
        "Too many attempts. Please try again later or reset your password."
      );
      return;
    }

    if (isSignUp) {
      await handleSignUP();
      return;
    }

    // --- Sign in path ---
    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
      if (signInError) throw signInError;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: window.location.origin,
        },
      });
      if (otpError) throw otpError;

      setTempSession(data.session);
      setStage("otp");
      setSuccessMessage("OTP has been sent to your email.");
    } catch {
      const failuresNow = recordFailure();
      const wait = getBackoffMillis(failuresNow);
      setTimeout(() => setLoading(false), wait);
      setErrorMessage("Invalid credentials. Please try again.");
      onLogin?.(null);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (!isLikelyNumericOtp(otpCode)) {
      setLoading(false);
      setErrorMessage("Invalid code. Please check the OTP sent to your email.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        type: "email",
        token: otpCode,
      });
      if (error) throw error;

      if (data.session?.user.email?.toLowerCase() !== normalizedAllowed) {
        await supabase.auth.signOut();
        throw new Error("Unauthorized email");
      }

      onLogin?.(data.session ?? tempSession);
      clearFailures();
      setSuccessMessage("Successfully authenticated!");
      // Explicitly wait for callback to finish before redirecting
      await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "SIGNED_IN", session: data.session }),
      });
      router.push("/admin/blog");
    } catch {
      const failuresNow = recordFailure();
      const wait = getBackoffMillis(failuresNow);
      setTimeout(() => setLoading(false), wait);
      setErrorMessage("Invalid or expired OTP. Please try again.");
      onLogin?.(null);
      setStage("credentials");
    }
  };

  const handleResetPassword = async (emailToReset: string) => {
    const target = normalizeEmail(emailToReset);
    if (!target || !isValidEmail(target)) {
      setAuthError("Please enter a valid email before requesting a reset.");
      return;
    }
    if (target !== normalizedAllowed) {
      setAuthError("Password reset is restricted to authorized users only.");
      return;
    }

    setAuthError(null);
    setSuccessMessage(null);
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccessMessage(
        "If the email exists, a password reset link has been sent."
      );
    } catch {
      setAuthError("If the email exists, a password reset link has been sent.");
    } finally {
      setResetLoading(false);
    }
  };

  const renderCredentialsStage = () => (
    <form onSubmit={handleCredentialsSubmit} className="space-y-5">
      <input
        type="email"
        autoComplete="username"
        placeholder="Email"
        value={email}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setEmail(e.target.value)
        }
        required
        className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
      />
      <input
        type="password"
        autoComplete={isSignUp ? "new-password" : "current-password"}
        placeholder="Password"
        value={password}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setPassword(e.target.value)
        }
        required
        minLength={isSignUp ? 12 : 6}
        aria-describedby={isSignUp ? "password-hint" : undefined}
        className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
      />

      {isSignUp && (
        <p id="password-hint" className="text-sm text-gray-700">
          {STRONG_PASSWORD_HINT}
        </p>
      )}

      {!isSignUp && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => handleResetPassword(email)}
            disabled={resetLoading}
            className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
          >
            {resetLoading ? "Sending..." : "Forgot password?"}
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 rounded-md text-white font-semibold transition-colors ${
          loading
            ? "bg-indigo-300 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
      </button>
    </form>
  );

  const renderOTPStage = () => (
    <form onSubmit={handleOTPVerification} className="space-y-5">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Enter OTP"
        value={otpCode}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setOtpCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
        }
        required
        className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary tracking-widest text-center"
      />
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 rounded-md text-white font-semibold transition-colors ${
          loading
            ? "bg-indigo-300 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
      <button
        type="button"
        onClick={() => setStage("credentials")}
        className="w-full py-2 text-indigo-600 hover:underline"
      >
        Back to Credentials
      </button>
    </form>
  );

  return (
    <div className="w-full max-w-md mx-auto bg-card rounded-lg shadow-lg p-8 my-12">
      <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
        {stage === "credentials"
          ? isSignUp
            ? "Sign Up"
            : "Sign In"
          : "Verify OTP"}
      </h2>

      {stage === "credentials" ? renderCredentialsStage() : renderOTPStage()}

      {errorMessage && (
        <p className="mt-4 text-center text-red-600 font-medium">
          {errorMessage}
        </p>
      )}
      {authError && (
        <p className="mt-4 text-center text-red-600 font-medium">{authError}</p>
      )}
      {successMessage && (
        <p className="mt-4 text-center text-green-700 font-medium">
          {successMessage}
        </p>
      )}

      {stage === "credentials" && (
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            resetState();
          }}
          type="button"
          className="mt-6 block mx-auto text-indigo-600 hover:underline font-medium"
        >
          {isSignUp ? "Switch to Sign In" : "Switch to Sign Up"}
        </button>
      )}

      {/* Home button here */}
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
