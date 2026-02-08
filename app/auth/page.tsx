
"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/AuthContext';
import AuthForm from './AuthForm';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && isAdmin) {
      const callbackUrl = searchParams?.get('callbackUrl') || '/nesh';
      router.push(callbackUrl);
    }
  }, [isAdmin, isLoading, router, searchParams]);

  if (isLoading || isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthForm />;
}
