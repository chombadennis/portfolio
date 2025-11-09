'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ExternalLink,
  Github,
  Calendar,
  Code,
  BarChart,
  Building,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import projectsData from "@/data/projects.json";

// Auto-infer the type of a single project from projectsData
type Project = (typeof projectsData)[keyof typeof projectsData][number];

const tabConfig = [
  {
    value: "development",
    label: "Development",
    icon: Code,
    description: "Full-stack web applications and software solutions",
  },
  {
    value: "datascience",
    label: "Data Science",
    icon: BarChart,
    description: "Machine learning models and data analytics projects",
  },
  {
    value: "civil",
    label: "Civil Engineering",
    icon: Building,
    description: "Infrastructure design and engineering solutions",
  },
];

export default function Projects() {
  const [activeTab, setActiveTab] = useState("development");

  const ProjectCard = ({
    project,
    index,
  }: {
    project: Project;
    index: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
    >
      <Card
        className={`border-border/50 hover:border-primary/20 transition-all duration-300 card-hover h-full ${
          project.featured ? "ring-1 ring-primary/20" : ""
        }`}
      >
        {project.featured && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-primary text-primary-foreground">
              Featured
            </Badge>
          </div>
        )}

        <div className="relative overflow-hidden rounded-t-lg">
          <div className="w-full h-auto overflow-hidden">
            <Image
              src={project.image}
              alt={project.title}
              width={800}
              height={450}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end">
            <div className="p-4 w-full">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="opacity-90"
                  asChild
                >
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Live
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="opacity-90"
                  asChild
                >
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4 mr-1" />
                    Code
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <div className="flex items-center text-muted-foreground text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              {project.date}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

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
            Portfolio
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            My <span className="gradient-text">Projects</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            A showcase of my work across different domains - from full-stack web
            applications to data science projects and civil engineering
            solutions.
          </p>
        </motion.div>

        {/* Project Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-12 bg-muted/50">
              {tabConfig.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col items-center space-y-2 py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <tab.icon className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs opacity-70 hidden sm:block">
                      {tab.description}
                    </div>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabConfig.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="space-y-8"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-2xl font-semibold mb-2 flex items-center justify-center">
                    <tab.icon className="h-6 w-6 mr-2 text-primary" />
                    {tab.label} Projects
                  </h2>
                  <p className="text-muted-foreground">{tab.description}</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projectsData[tab.value as keyof typeof projectsData].map(
                    (project, index) => (
                      <ProjectCard
                        key={project.title}
                        project={project}
                        index={index}
                      />
                    )
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <Card className="border-border/50 bg-gradient-hero">
            <CardContent className="p-8">
              <h3 className="text-2xl font-semibold mb-4">
                Have a Project in Mind?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                I am always excited to work on new challenges across different
                domains. Let us discuss how we can bring your ideas to life.
              </p>
              <Button
                size="lg"
                className="bg-gradient-primary hover:shadow-glow"
                asChild
              >
                <Link href="/contact">Start a Conversation</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
