// app/components/layout/Navigation.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { Menu, Sun, Moon } from "lucide-react"; // ❌ removed X (unused import)
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Projects", href: "/projects" },
  { name: "Admin Blog", href: "/admin/blog" }, // 🔑 new link
  { name: "🧽Nuggets", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ❌ Removed theme initialization useEffect (handled by layout.tsx now)

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newTheme);
    document.body.classList.toggle("light", !newTheme);
  };

  const NavLink = ({
    item,
    mobile = false,
  }: {
    item: (typeof navigationItems)[0];
    mobile?: boolean;
  }) => {
    const isActive = pathname === item.href;

    return (
      <Link
        href={item.href}
        onClick={mobile ? () => setIsOpen(false) : undefined}
        className={cn(
          "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300",
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-foreground/80 hover:text-foreground hover:bg-accent/50",
          mobile && "w-full text-left"
        )}
      >
        {item.name}
      </Link>
    );
  };

  return (
    <header
      className={cn(
        "fixed top-4 left-4 right-4 z-50 transition-all duration-300 rounded-2xl",
        isScrolled
          ? "bg-card/95 backdrop-blur-xl border border-border shadow-lg"
          : "bg-card/80 backdrop-blur-md border border-border/50 shadow-md"
      )}
    >
      <div className="container mx-auto px-6">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center text-primary-foreground font-bold text-sm transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-lg">
              DC
            </div>
            <span className="font-bold text-lg text-foreground">
              Dennis Chomba
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>

          {/* Theme Toggle & Mobile Menu */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-10 h-10 p-0 rounded-xl hover:bg-accent/50 transition-all duration-300"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Mobile Menu Button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden w-10 h-10 p-0 rounded-xl hover:bg-accent/50 transition-all duration-300"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[400px] bg-card/95 backdrop-blur-xl border-l border-border"
              >
                <nav className="flex flex-col space-y-4 mt-8">
                  {navigationItems.map((item) => (
                    <NavLink key={item.name} item={item} mobile />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
