"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { emailRateLimiter } from "@/lib/rateLimiter";
import { sanitizeInput, isValidEmail, validateFormData } from "@/lib/security";
import { logger } from "@/lib/logger";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Linkedin,
  Github,
  Twitter,
  CheckCircle,
} from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "dennis.cmunene@gmail.com",
    href: "mailto:dennis.cmunene@gmail.com",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+254 (112) 078 119",
    href: "tel:+254112078119",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "Remote / Global",
    href: null,
  },
  {
    icon: Clock,
    title: "Response Time",
    value: "Within 24 hours",
    href: null,
  },
];

const socialLinks = [
  { icon: Github, href: "https://github.com/chombadennis", label: "GitHub" },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/in/lukk3vdebarezz99l8yy/",
    label: "LinkedIn",
  },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
];

export default function Contact() {
  const formRef = useRef<HTMLFormElement | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!emailRateLimiter.isAllowed(formData.email)) {
        const resetTime = Math.ceil(
          emailRateLimiter.getResetTime(formData.email) / 60000
        );
        toast({
          title: "Rate limit exceeded",
          description: `Please wait ${resetTime} minutes before sending another message.`,
          variant: "destructive",
        });
        return;
      }

      if (formData.name.trim().length < 2) {
        toast({
          title: "Invalid name",
          description: "Name must be at least 2 characters long.",
          variant: "destructive",
        });
        return;
      }

      if (formData.message.trim().length < 10) {
        toast({
          title: "Message too short",
          description:
            "Please provide a more detailed message (at least 10 characters).",
          variant: "destructive",
        });
        return;
      }

      // Keep `title` for your existing validation (EmailJS-era), but also include `subject`
      const sanitizedData = {
        name: sanitizeInput(formData.name),
        email: sanitizeInput(formData.email),
        title: sanitizeInput(formData.subject), // preserves compatibility with your validateFormData
        subject: sanitizeInput(formData.subject), // the field your Nodemailer route expects
        message: sanitizeInput(formData.message),
        time: new Date().toLocaleString(),
      };

      if (!isValidEmail(sanitizedData.email)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }

      const suspiciousPatterns = [
        /bitcoin/i,
        /crypto/i,
        /investment/i,
        /loan/i,
        /credit/i,
        /@.*@/,
        /https?:\/\//i,
        /\$\d+/i,
      ];

      const messageContent = `${sanitizedData.name} ${sanitizedData.title} ${sanitizedData.message}`;
      if (suspiciousPatterns.some((pattern) => pattern.test(messageContent))) {
        logger.warn("Suspicious content detected in contact form", {
          email: sanitizedData.email,
        });
        toast({
          title: "Message flagged",
          description:
            "Your message contains content that may be flagged as spam. Please revise and try again.",
          variant: "destructive",
        });
        return;
      }

      const validation = validateFormData(sanitizedData);
      if (!validation.isValid) {
        logger.warn("Contact form validation failed", {
          errors: validation.errors,
        });
        toast({
          title: "Invalid input detected",
          description: "Please check your input and try again.",
          variant: "destructive",
        });
        return;
      }

      logger.userAction("contact_form_submit", { email: sanitizedData.email });

      // Send to your Nodemailer API route
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sanitizedData.name,
          email: sanitizedData.email,
          subject: sanitizedData.subject || sanitizedData.title,
          message: sanitizedData.message,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Unknown error");
      }

      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });

      toast({
        title: "Message sent successfully!",
        description: "Thank you for reaching out. I'll get back to you soon.",
      });

      logger.info("Contact form submitted successfully", {
        email: sanitizedData.email,
      });
    } catch (error) {
      logger.error("Contact form submission failed", {
        error,
        email: formData.email,
      });
      toast({
        title: "Failed to send message",
        description: "Please try again or contact me directly via email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.name && formData.email && formData.subject && formData.message;

  if (isSubmitted) {
    return (
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-md mx-auto text-center"
          >
            <Card className="border-success/20 bg-success/5">
              <CardContent className="p-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="h-8 w-8 text-success" />
                </motion.div>
                <h2 className="text-2xl font-semibold mb-4">Message Sent!</h2>
                <p className="text-muted-foreground mb-6">
                  Thank you for reaching out. Will review your message and get
                  back to you within 24 hours.
                </p>
                <Button onClick={() => setIsSubmitted(false)} variant="outline">
                  Send Another Message
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4">
            Get In Touch
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Let us <span className="gradient-text">Work Together</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Have a project in mind or want to discuss opportunities? I would
            love to hear from you and explore how we can collaborate.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="h-5 w-5 mr-2" />
                  Send a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Project discussion, collaboration, etc."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell me about your project or what you'd like to discuss..."
                      rows={6}
                      required
                    />
                  </div>

                  {/* These hidden fields can remain; they're no-ops now */}
                  <input type="hidden" name="from_name" value={formData.name} />
                  <input
                    type="hidden"
                    name="from_email"
                    value={formData.email}
                  />
                  <input type="hidden" name="title" value={formData.subject} />
                  <input
                    type="hidden"
                    name="time"
                    value={new Date().toLocaleString()}
                  />

                  <div className="w-full">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-glow"
                      disabled={!isFormValid || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>

                    {/* Helper message when button is disabled */}
                    {!isFormValid && !isSubmitting && (
                      <p className="mt-2 text-sm text-red-500 text-center">
                        Please fill in all required fields before sending.
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info / Social Links / Availability - UNCHANGED */}

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                >
                  <Card className="border-border/50 hover:border-primary/20 transition-colors card-hover">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <info.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{info.title}</h3>
                      {info.href ? (
                        <a
                          href={info.href}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{info.value}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-center">
                    Connect With Me
                  </h3>
                  <div className="flex justify-center space-x-4">
                    {socialLinks.map((social) => (
                      <Button
                        key={social.label}
                        variant="outline"
                        size="lg"
                        className="rounded-full h-12 w-12 p-0 hover:border-primary/40 hover:bg-primary/5"
                        asChild
                      >
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={social.label}
                        >
                          <social.icon className="h-5 w-5" />
                        </a>
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Follow me for updates on projects and industry insights
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Availability */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <Card className="border-border/50 bg-gradient-hero">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-4">Current Availability</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      <span>Available for new projects</span>
                    </div>
                    <p className="text-muted-foreground">
                      Open to both full-time opportunities and freelance
                      projects
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
