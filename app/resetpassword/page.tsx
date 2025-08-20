"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [validSession, setValidSession] = useState(false);

  // Check if we have a valid session from the reset-password link
  useEffect(() => {
    const verifySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setValidSession(true);
      } else {
        router.push("/auth");
      }
      setSessionChecked(true);
    };

    verifySession();
  }, [router]);

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMessage(
        "Password updated successfully! Redirecting to sign in..."
      );
      setTimeout(() => {
        router.push("/auth");
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMessage(err.message);
      else setErrorMessage(String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Checking link...
      </div>
    );
  }

  if (!validSession) {
    return null; // router.push already handled redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md bg-slate-400 rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Reset Password
        </h2>

        <form onSubmit={handlePasswordUpdate} className="space-y-5">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewPassword(e.target.value)
            }
            required
            minLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
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
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        {errorMessage && (
          <p className="mt-4 text-center text-red-600 font-medium">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="mt-4 text-center text-green-700 font-medium">
            {successMessage}
          </p>
        )}
      </div>
    </div>
  );
}
