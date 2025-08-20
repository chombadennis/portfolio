import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Github, Linkedin, Mail, Twitter, MapPin } from "lucide-react";

const socialLinks = [
  { icon: Github, href: "https://github.com/chombadennis", label: "GitHub" },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/in/lukk3vdebarezz99l8yy/",
    label: "LinkedIn",
  },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Mail, href: "mailto:dennis.cmuhnene@gmail.com", label: "Email" },
];

const quickLinks = [
  { name: "About", href: "/about" },
  { name: "Projects", href: "/projects" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-xl gradient-text">Portfolio</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Versatile engineer specializing in full-stack development, data
              science, and infrastructure design.
            </p>
            <div className="flex items-center space-x-2 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4" />
              <span>Remote / Global</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <div className="space-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Services</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>Full-Stack Development</div>
              <div>Data Science & ML</div>
              <div>Civil Engineering</div>
              <div>Technical help?</div>
            </div>
          </div>

          {/* Social & Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Connect</h3>
            <div className="flex space-x-2">
              {socialLinks.map((social) => (
                <Button
                  key={social.label}
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-9 w-9 p-0"
                  asChild
                >
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Available for freelance projects and collaboration opportunities.
            </p>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Portfolio. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
