"use client";

import { motion } from "framer-motion";
import type { ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  GraduationCap,
  Briefcase,
  Code,
  Database,
  Cpu,
  Brain,
  Layers,
  Wrench,
  ClipboardList,
  Ruler,
} from "lucide-react";
import { CertificationsSection } from "@/components/sections/CertificationsSection";

const timeline = [
  {
    year: "2023",
    title: "Data Science, Machine Learning & MERN Stack Development",
    company: "Coursera",
    companyUrl: "https://www.coursera.org/",
    type: "education",
    description:
      "Completed a series of industry-recognized courses and specializations on Coursera, covering data science, machine learning and sustainable engineering practices, taught by top universities and organizations.",
    skills: [
      "JavaScript",
      "React",
      "Node.js",
      "MongoDB",
      "Python",
      "R",
      "Machine Learning",
      "Deep Learning",
      "Data Science",
      "Data Analytics",
      "Data Visualization",
      "SQL",
      "Business Analytics",
      "Operational Analytics",
      "Project Management Analytics",
      "Excel for Analysis",
      "Statistical Modeling",
      "Database Management",
      "Communication with Data",
      "Engineering Data Applications",
    ],
  },
  {
    year: "2021",
    title: "Engineering",
    company: "Sobetra Limited",
    companyUrl: "https://sobetrainternational.com/",
    type: "work",
    description:
      "Cost analysis, Design, report standardization, infrastructure detailing, auditing of payments while negotiating with suppliers to streamline project execution and enhance financial oversight.",
    skills: [
      "Budgeting",
      "Cost Analysis",
      "AutoCAD",
      "Revit",
      "AutoCAD Civi-3D",
      "Construction Supervision",
      "Communication",
    ],
  },
  {
    year: "2020",
    title: "CAD Drafting & Civil Engineering",
    company: "China Wu Yi Ltd",
    companyUrl: "https://www.chinawuyi.com.cn/",
    type: "work",
    description: "CAD Drafting, Quantity Take-offs and Design",
    skills: [
      "AutoCAD",
      "Excel Spreadsheets",
      "AutoCAD Civi-3D",
      "Construction Supervision",
    ],
  },
  {
    year: "2018",
    title: "Attache",
    company: "Struhig Africa Ltd",
    companyUrl: "https://example.com",
    type: "Attachment",
    description:
      "Assisted in design, drafting and supervision of structural engineering projects",
    skills: ["Excel Spreadsheets", "AutoCAD", "BS Codes", "Site Supervision"],
  },
  {
    year: "2018",
    title: "Bachelor of Science in Civil Engineering",
    company: "Dedan kimathi University of Technology",
    companyUrl: "https://www.dkut.ac.ke/",
    type: "education",
    description:
      "Bachelor of Science in Civil Engineering with focus on civil and structural design and project management.",
    skills: [
      "AutoCAD",
      "Project Management",
      "Structural Analysis",
      "Highway Engineering",
      "Water & Waste Water Enigneering",
      "Traffic Engineering",
    ],
  },
];

// Icon map for skills
const skillIcons: Record<string, ReactElement> = {
  "JavaScript/TypeScript": <Code className="h-8 w-8 text-yellow-400" />,
  "React/Next.js": <Layers className="h-8 w-8 text-cyan-400" />,
  "Node.js/Express": <Cpu className="h-8 w-8 text-green-400" />,
  Python: <Code className="h-8 w-8 text-blue-400" />,
  "Machine Learning": <Brain className="h-8 w-8 text-purple-400" />,
  "MongoDB/PostgreSQL": <Database className="h-8 w-8 text-green-300" />,
  "Civil Engineering": <Ruler className="h-8 w-8 text-orange-400" />,
  "Project Management": <ClipboardList className="h-8 w-8 text-pink-400" />,
  "JavaScript/ TypeScript": <Code className="h-8 w-8 text-yellow-400" />,
  "React / Next.js": <Layers className="h-8 w-8 text-cyan-400" />,
  "Node.js / Express": <Cpu className="h-8 w-8 text-green-400" />,
  "MongoDB / PsgSQL": <Database className="h-8 w-8 text-green-300" />,
};

const skillsProgress = [
  { skill: "JavaScript/ TypeScript", note: "Used in my projects" },
  { skill: "React / Next.js", note: "Built full-stack apps" },
  { skill: "Node.js / Express", note: "Created scalable APIs" },
  { skill: "Python", note: "Data science & automation" },
  { skill: "Machine Learning", note: "Data Science & AI" },
  { skill: "MongoDB / PsgSQL", note: "Efficient DB design" },
  { skill: "Civil Engineering", note: "Structural & infrastructure projects" },
];

export default function About() {
  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4">
            About Me
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            My <span className="gradient-text">Evolving Career</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            An overview of my background, experience and path across disiplines.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Professional Timeline */}
            <motion.section
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-2xl font-semibold mb-8">
                Professional Timeline
              </h2>
              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    className="relative"
                  >
                    <Card className="border-border/50 hover:border-primary/20 transition-colors">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start space-x-4 flex-wrap">
                          <div
                            className={`p-2 rounded-full ${
                              item.type === "work"
                                ? "bg-primary/10 text-primary"
                                : "bg-success/10 text-success"
                            }`}
                          >
                            {item.type === "work" ? (
                              <Briefcase className="h-4 w-4" />
                            ) : (
                              <GraduationCap className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                              <h3 className="font-semibold">{item.title}</h3>
                              <Badge
                                variant="secondary"
                                className="bg-primary/10 text-primary border-primary/20"
                              >
                                {item.year}
                              </Badge>
                            </div>
                            <a
                              href={item.companyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary font-medium mb-2 hover:text-primary-glow transition-colors duration-200 hover:underline inline-flex items-center"
                            >
                              {item.company}
                            </a>
                            <p className="text-muted-foreground mb-4">
                              {item.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.skills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Philosophy */}
            <motion.section
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold mb-6">My Perspective</h2>
              <Card className="border-border/50">
                <CardContent className="p-8">
                  <blockquote className="text-lg italic text-muted-foreground leading-relaxed">
                    &ldquo;Technology exists to empower people, not constrain
                    them. With my background, I make my contribution from
                    multiple perspectives, designing solutions that are both
                    technically robust and practically effective.&rdquo;
                  </blockquote>
                  <p className="mt-6 text-foreground">
                    This mindset drives my continuous learning and inspires my
                    approach at the intersection of traditional engineering and
                    modern software,ensuring my contributions are innovative,
                    effective and user-centered.
                  </p>
                </CardContent>
              </Card>
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Skills Grid */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Card className="border-border/50 h-full">
                <CardContent className="p-6 sm:p-4 space-y-6">
                  <h3 className="font-semibold text-orange-400 text-center">
                    Featured Skills & Expertise*
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 sm:gap-4">
                    {skillsProgress.map((item) => (
                      <motion.div
                        key={item.skill}
                        className="flex flex-col items-center text-center cursor-pointer group min-w-0"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="p-4 sm:p-3 bg-muted rounded-xl shadow-md group-hover:shadow-lg group-hover:bg-primary/10 transition-all duration-300 w-full flex justify-center">
                          {skillIcons[item.skill] || (
                            <Wrench className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <span className="mt-2 text-sm font-medium whitespace-normal break-words text-center">
                          {item.skill}
                        </span>
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                          {item.note}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Personal Info */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-6">
                  <h3 className="font-semibold">Personal Info</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Remote / Global</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Available for opportunities
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Data Science, ML & MERN</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">B.Sc. Civil Engineering</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Interests */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-6">
                  <h3 className="font-semibold">Interests</h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div>🚀 Emerging Technologies</div>
                    <div>🧠 AI & Machine Learning</div>
                    <div>🏗️ Sustainable Engineering</div>
                    <div>📚 Continuous Learning</div>
                    <div>🌍 Open Source Contribution</div>
                    <div>⚡ Performance Optimization</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Certifications Section */}
        <CertificationsSection />
      </div>
    </div>
  );
}