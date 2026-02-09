"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Code,
  Database,
  Building,
  Brain,
  Rocket,
  Award,
  Target,
  Search,
} from "lucide-react";

const skills = [
  {
    category: "Frontend Development",
    icon: Code,
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML"],
    color: "text-blue-500",
  },
  {
    category: "Backend Development",
    icon: Database,
    technologies: ["Node.js", "Express", "MongoDB", "PostgreSQL", "SQlite"],
    color: "text-green-500",
  },
  {
    category: "Data Science & ML",
    icon: Brain,
    technologies: ["Python", "TensorFlow", "Numpy", "Pandas", "Scikit-learn"],
    color: "text-purple-500",
  },
  {
    category: "Civil Engineering",
    icon: Building,
    technologies: [
      "AutoCAD",
      "Revit",
      "Prota",
      "Construction Project Management",
      "AutoCAD Civil-3D",
      "Excel Spreadsheets",
    ],
    color: "text-orange-500",
  },
];

const values = [
  {
    icon: Target,
    title: "Problem Solving",
    description: "Transforming tasks into practical outcomes.",
  },
  {
    icon: Search,
    title: "Curiosity",
    description:
      "Driven to discover, learn, and apply new ideas and approaches in real-world projects.",
  },
  {
    icon: Rocket,
    title: "Innovation",
    description: "Turning creative concepts into useful results.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "Every outcome reflects skill and professionalism",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4">
            About Me
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Building <span className="gradient-text">with Insight</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Leveraging engineering principles and technological expertise, I
            design approaches that are thoughtful, practical, innovative and
            actionable
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-20">
          {/* Story */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-semibold mb-4">My Journey</h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Starting with a foundation in{" "}
                <strong className="text-foreground">Civil Engineering</strong>,
                I developed strong analytical and problem-solving skills working
                on infrastructure projects. This experience taught me the
                importance of precision, planning and systematic thinking.
              </p>
              <p>
                My blend of{" "}
                <strong className="text-foreground">
                  software development
                </strong>{" "}
                is driven by curiosity and passion for the potential of
                technology in addressing problems in the society. I use the MERN
                stack and modern web technologies, building scalable
                applications that serve real business needs.
              </p>
              <p>
                The evolution into{" "}
                <strong className="text-foreground">
                  Data Science and Machine Learning
                </strong>{" "}
                represents my commitment to staying at the forefront of
                technology. I combine domain expertise with insights from data
                to create creative solutions.
              </p>
            </div>

            <div className="pt-6">
              <h4 className="font-semibold mb-4">What Drives Me</h4>
              <div className="grid grid-cols-2 gap-4">
                {values.map((value, index) => (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center space-y-2"
                  >
                    <value.icon className="h-8 w-8 text-primary mx-auto" />
                    <h5 className="font-medium text-sm">{value.title}</h5>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-semibold mb-6">Technical Expertise</h3>
            <div className="space-y-4">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Card className="border-border/50 hover:border-primary/20 transition-colors card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`p-2 rounded-lg bg-muted ${skill.color}`}
                        >
                          <skill.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">
                            {skill.category}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {skill.technologies.map((tech) => (
                              <Badge
                                key={tech}
                                variant="outline"
                                className="text-xs border-primary/20 hover:border-primary/40 transition-colors"
                              >
                                {tech}
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
          </motion.div>
        </div>

        {/* Core Values */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4">Core Values</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The standards I follow to grow, contribute, and deliver.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="border-border/50 hover:border-primary/20 transition-all duration-300 card-hover text-center h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold">{value.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}