"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class" // controls <html class="dark"> or "light"
      defaultTheme="system" // respect OS preference by default
      enableSystem={true}
      disableTransitionOnChange
    >
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
