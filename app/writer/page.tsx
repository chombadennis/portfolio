
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/AuthContext';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, LogOut } from 'lucide-react';

export default function CoverLetterGenerator() {
  const { isAdmin, isLoading: isAuthLoading, authFetch, signOut } = useAuth();
  const router = useRouter();

  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !isAdmin) {
      router.push('/auth?callbackUrl=/writer');
    }
  }, [isAdmin, isAuthLoading, router]);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setCoverLetter('Please paste a job description first.');
      return;
    }

    setIsLoading(true);
    setCoverLetter('');

    try {
      const response = await authFetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription }),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || 'Failed to generate cover letter');
      }

      setCoverLetter(text);
    } catch (error) {
      console.error(error);
      setCoverLetter(`An error occurred: ${error instanceof Error ? error.message : 'Please check the console.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading || !isAdmin) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
    );
  }

  return (
    <div className="bg-muted/40 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
        <header className="flex justify-between items-center pb-6 pt-16">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Writer Dashboard</h1>
          <Button variant="outline" onClick={() => { signOut(); router.push("/"); }}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </header>

        <main>
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">AI Cover Letter Generator</CardTitle>
              <CardDescription>
                Paste a job description below, and the AI will draft a tailored cover letter based on your portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="job-description" className="font-semibold">Job Description</label>
                <Textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={10}
                  className="bg-muted/50 w-full text-sm sm:text-base"
                />
              </div>

              <Button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Cover Letter</>
                )}
              </Button>

              {coverLetter && (
                <div className="space-y-2 pt-4">
                  <h3 className="font-semibold text-lg sm:text-xl">Generated Cover Letter:</h3>
                  <Card className="bg-muted/50 p-4 sm:p-6">
                    <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base">{coverLetter}</pre>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
