
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/AuthContext'; // Import useAuth
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from 'lucide-react';

export default function CoverLetterGenerator() {
  const { isAdmin, isLoading: isAuthLoading, authFetch } = useAuth(); // Use the auth hook
  const router = useRouter(); // Use the router hook

  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Effect to handle redirection
  useEffect(() => {
    // If auth is not loading and the user is not an admin, redirect them
    if (!isAuthLoading && !isAdmin) {
      router.push('/auth?callbackUrl=/writer'); // Redirect to login page with callback
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
        // Use the error message from the API, or a default one
        throw new Error(text || 'Failed to generate cover letter');
      }

      setCoverLetter(text);
    } catch (error) {
      console.error(error);
      // Display the error message to the user
      setCoverLetter(`An error occurred: ${error instanceof Error ? error.message : 'Please check the console.'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render a loading state or null while checking auth
  if (isAuthLoading || !isAdmin) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
    );
  }

  // If user is admin, render the page
  return (
    <div className="container mx-auto pt-8 sm:pt-16 md:pt-32 pb-10 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-4xl mx-auto">
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
    </div>
  );
}
