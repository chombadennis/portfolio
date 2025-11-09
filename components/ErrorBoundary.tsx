
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error: error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
          <Card className="w-full max-w-lg text-center shadow-lg">
            <CardHeader>
              <div className="mx-auto bg-destructive/10 p-3 rounded-full">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="mt-4 text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                We've encountered an unexpected issue. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDevelopment && this.state.error && (
                <div className="bg-destructive/5 p-4 rounded-md text-left my-4">
                  <h3 className="font-semibold text-destructive">Error Details (Development Only)</h3>
                  <pre className="text-sm whitespace-pre-wrap break-words mt-2 font-mono text-destructive/80">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              <div className="flex justify-center gap-4 mt-6">
                <Button onClick={() => this.setState({ hasError: false, error: undefined })}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  <Home className="mr-2 h-4 w-4" /> Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
