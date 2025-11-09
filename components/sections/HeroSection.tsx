"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowDown, Download, Mail, ExternalLink } from "lucide-react";

const roles = [
  "☸ MERN Stack",
  "📈 Data",
  "🏗️📐👷 Civil Engineering",
  "🤖🧠 Machine Learning",
];

export function HeroSection() {
  const [currentRole, setCurrentRole] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleScroll = () => {
    const nextSection = document.getElementById("about");
    nextSection?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDownloadCV = async () => {
    const cvFiles = ["/downloads/cv.pdf", "/downloads/cv.docx"];

    for (const filePath of cvFiles) {
      try {
        const response = await fetch(filePath, { method: "HEAD" });
        if (response.ok) {
          const link = document.createElement("a");
          link.href = filePath;
          link.download = filePath.split("/").pop() || "cv";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          window.open(filePath, "_blank");
          return;
        }
      } catch (err) {
        console.log(`CV file not found: ${filePath}`, err);
      }
    }

    alert("No CV file found.");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 z-0">
        <div className="relative w-full h-full">
          <Image
            src="/hero-engineer-coding.jpg"
            alt="Engineer Coding"
            fill
            priority
            className="object-cover rounded-lg"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 mb-4"
                >
                  Available for Opportunities
                </Badge>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-muted-foreground text-lg"
              >
                Hello, I&apos;m
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold"
              >
                <span className="gradient-text">Dennis Chomba</span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-xl md:text-2xl lg:text-3xl font-semibold text-muted-foreground"
              >
                <span> ➮ </span>
                <motion.span
                  key={currentRole}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-primary"
                >
                  {roles[currentRole]}
                </motion.span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-lg text-muted-foreground max-w-xl leading-relaxed"
              >
                Bridging the gap between traditional engineering and modern
                technology. Specialized in MERN, data science, machine learning
                and civil engineering solutions.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="group bg-gradient-primary hover:border-primary/40 transition-all duration-300"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Get in Touch
                  <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Button
                variant="outline"
                size="lg"
                onClick={handleDownloadCV}
                className="group border-primary/20 hover:border-primary/40 hover:bg-primary/5"
              >
                <Download className="mr-2 h-4 w-4" />
                Download CV
                <ArrowDown className="ml-2 h-4 w-4 group-hover:translate-y-1 transition-transform" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-wrap gap-8 pt-8"
            >
              {[
                { label: "Years Experience", value: "y=" },
                { label: "Projects Completed", value: "mx" },
                { label: "Technologies", value: "+c" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Profile Image with Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative">
              <Image
                src="/images/profile/profile.jpg"
                alt="Profile"
                width={320}
                height={320}
                onClick={() => setIsModalOpen(true)}
                className="w-72 h-72 md:w-80 md:h-80 rounded-full object-cover object-[30%_25%] cursor-pointer hover:scale-105 transition-transform shadow-lg border-4 border-primary"
              />

              {/* Floating Skills */}
              {["React", "Python", "ML", "Node.js"].map((skill, index) => (
                <motion.div
                  key={skill}
                  className="absolute bg-card border border-border rounded-lg px-3 py-2 shadow-custom-md"
                  style={{
                    top: `${20 + index * 20}%`,
                    left: index % 2 === 0 ? "-10%" : "110%",
                  }}
                  animate={{ y: [-10, 10, -10] }}
                  transition={{
                    duration: 3 + index,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <span className="text-sm font-medium">{skill}</span>
                </motion.div>
              ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
                onClick={() => setIsModalOpen(false)}
              >
                <Image
                  src="/images/profile/profile.jpg"
                  alt="Full Profile"
                  width={1024}
                  height={1024}
                  className="max-w-full max-h-full rounded-lg shadow-xl"
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <button
            onClick={handleScroll}
            className="flex flex-col items-center space-y-2 text-muted-foreground hover:text-primary transition-colors group"
            aria-label="Scroll to next section"
          >
            <span className="text-sm">Scroll Down</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowDown className="h-5 w-5 group-hover:translate-y-1 transition-transform" />
            </motion.div>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
