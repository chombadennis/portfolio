
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/AuthContext';
import AuthForm from './AuthForm';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.push('/admin/blog');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || isAdmin) {
    // While checking auth or if admin is detected and redirecting, show a loader
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If not loading and not an admin, show the login form
  return <AuthForm />;
}
