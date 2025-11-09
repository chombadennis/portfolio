
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "react-quill/dist/quill.snow.css";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/hooks/AuthContext";
import { ThemeProvider } from "next-themes";
import RetroChatbot from "@/components/ai/RetroChatbot";
import { logPageView } from '@/lib/firebase/analytics';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      logPageView(pathname);
    }
  }, [pathname]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Navigation />
            <main>{children}</main>
            <Footer />
            <RetroChatbot />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
