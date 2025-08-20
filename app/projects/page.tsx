"use client";

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

const projectsData = {
  development: [
    {
      title: "Portfolio Platform",
      description:
        "A full-stack portfolio showcase application. Built with React (Vite) for a fast, responsive frontend and Node.js/Express for the backend API. Supports secure authentication via Supabase, project creation, editing and dynamic image uploads in its Projects Management Dashboard, with real-time previews. Features a clean UI powered by shadcn/ui and TailwindCSS, with optimized workflows for adding, updating and showcasing projects. Deployed on Render with environment-specific configurations for seamless integration between frontend and backend services.",
      image: "/images/projects/portfolio.png",
      technologies: [
        "React (Vite)",
        "TypeScript",
        "Node.js",
        "Express",
        "Supabase",
        "PostgreSQL",
        "TailwindCSS",
        "ShadCN UI",
        "Lucide Icons",
        "Render",
      ],
      liveUrl: "https://jseph.onrender.com/",
      githubUrl: "https://github.com/dennismuhnene/responsive-engineer-hub",
      date: "2025",
      featured: true,
    },
    {
      title: "Datum – Cloud File Storage & Management",
      description:
        "A modern cloud-based file storage and management platform built with Next.js and TypeScript. Supports folder navigation, file previews, and secure sharing, powered by Neon Postgres for persistent data storage, ImageKit for optimized image delivery, and Zod for strict input validation. Includes role-based access controls, a responsive UI built with shadcn/ui, and efficient file operations through an ORM for structured database access.",
      image: "/images/projects/datumImg.png",
      technologies: [
        "Next.js",
        "TypeScript",
        "tsx",
        "Neon Postgres",
        "ImageKit",
        "Clerk",
        "Zod",
        "Drizzle ORM",
        "ShadCN UI",
        "Lucide Icons",
      ],
      liveUrl: "https://datum-murex.vercel.app/",
      githubUrl: "https://github.com/chombadennis/datum.git",
      date: "2025",
      featured: true,
    },
    {
      title: "Teekit- Ticketing App",
      description:
        "A full-stack ticket management system built with Next.js 14, MongoDB, and Clerk for secure authentication. Features include creating, editing, viewing, and deleting tickets, dynamic dashboard filtering and a responsive UI.",
      image: "/images/projects/teekitImg.png",
      technologies: [
        "Next.js 14",
        "Tailwind CSS",
        "JavaScript XML",
        "JavaScript",
        "MongoDB",
        "Mongoose",
        "ShadCN UI",
        "Clerk Auth",
        "FontAwesome",
      ],
      liveUrl: "https://teekit.vercel.app/",
      githubUrl: "https://github.com/chombadennis/ticket-app.git",
      date: "2025",
      featured: true,
    },
    {
      title: "TravelBoom – Travel Recommendation Platform",
      description:
        "A functional travel recommendation website built with HTML, CSS and vanilla JavaScript. Fetches destination data from a JSON file using the Fetch API and provides interactive search for countries, beaches, temples, and African destinations.",
      image: "/images/projects/Tboom.png",
      technologies: ["HTML", "CSS", "JavaScript", "JSON", "Fetch API"],
      liveUrl: "https://dennismuhnene.github.io/travelRecommendation/",
      githubUrl: "https://github.com/dennismuhnene/travelRecommendation",
      date: "2025",
      featured: false,
    },
  ],
  datascience: [
    {
      title: "Clustering of the Daily Energy Consumption Load Profiles",
      description:
        "K-Means clustering on daily building energy usage (Building Genome Project) to identify consumption patterns, detect anomalies, and enhance demand forecasting. Presented through a Streamlit web app.",
      image: "/images/projects/cluster.png",
      technologies: [
        "Python",
        "Machine Learning",
        "Version Control",
        "K-Means Clustering",
        "Building Energy Analysis",
        "Streamlit",
        "Exploratory Data Analysis",
        "Data Visualization",
        "Jupyter Notebook",
      ],
      liveUrl: "https://buildinggenome-j8ambtrvuqu9rktsapvxek.streamlit.app/",
      githubUrl:
        "https://github.com/chombadennis/BuildingGenome_KNN/blob/main/Machine_Learning.ipynb",
      date: "2025",
      featured: true,
    },
    {
      title: "Electricity Prediction via K-Nearest Neighbor Regression",
      description:
        "Forecasted electricity consumption from enrgy load patterns using K-NN regression built from weather and historical energy data. Integrated into an interactive Streamlit interface for exploration.",
      image: "/images/projects/KNN.png",
      technologies: [
        "Python",
        "Machine Learning",
        "K-Nearest Neighbor Regression",
        "Building Energy Analysis",
        "Version Control",
        "Streamlit",
        "EDA",
        "Jupyter Notebook",
      ],
      liveUrl: "https://builindgenomeknnpred0t9828fs9z4q.streamlit.app/",
      githubUrl:
        "https://github.com/chombadennis/BuildingGenome_KNN/blob/main/Machine_Learning.ipynb",
      date: "2025",
      featured: false,
    },
    {
      title: "Thermal Comfort & Energy Forecasting with XGBoost",
      description:
        "Used XGBoost models to forecast building occupants’ thermal comfort and energy usage. Delivered results through a Streamlit app and detailed exploratory data analysis.",
      image: "/images/projects/xg.png",
      technologies: [
        "Python",
        "XGBoost",
        "Streamlit",
        "EDA",
        "Forecasting",
        "Building Energy Analysis",
        "Jupyter Notebook",
      ],
      liveUrl:
        "https://ashraebuildinggenome078980classification.streamlit.app/",
      githubUrl:
        "https://github.com/chombadennis/BuildingGenome_RFClustering/blob/main/Machine_Learning.ipynb",
      date: "2025",
      featured: false,
    },
    {
      title: "Heavy Equipment Data Scraping, Cleaning & Consolidation",
      description:
        "Developed a suite of automated scrapers for  heavy equipment to extract specifications and features from websites, APIs and auction listings. Implemented dynamic schema creation for varying equipment categories, stored data in SQLite and built cleaning pipelines to normalize units (imperial to metric), handle missing values and export cleaned datasets for analysis. Consolidated all scripts into a main runner for streamlined execution. Currently creating a system that enables automated updates, error handling and database management functions. Use cases will include market analysis, inventory management and cost estimation, with future plans for machine learning integration, API development and dashboards. Stay tuned.",
      image: "/images/projects/mach.png",
      technologies: [
        "Python",
        "BeautifulSoup",
        "Requests",
        "Selenium",
        "SQLite",
        "Pandas",
        "NumPy",
      ],
      liveUrl: "",
      githubUrl: "https://github.com/chombadennis/Heavy_Machines",
      date: "2025",
      featured: true,
    },
    {
      title:
        "Job Posting Data Extraction, Exploratory Data Analysis and Visualization",
      description:
        "Automated extraction and analysis of job posting data using Beautiful Soup for ETL and visualization, uncovering hiring trends and requirements in the job market.",
      image: "/images/projects/webscraps.png",
      technologies: [
        "Python",
        "Web Scraping",
        "Beautiful Soup",
        "ETL",
        "Data Visualization",
        "Jupyter Notebook",
      ],
      liveUrl: "",
      githubUrl:
        "https://github.com/chombadennis/Web-scrapping/blob/main/webscrabbber.ipynb",
      date: "2024",
      featured: false,
    },
    {
      title: "Exploratory Data Analysis on Online Store Operations",
      description:
        "Performed EDA to uncover patterns, outliers, and correlations to optimize online store operations and drive data-informed recommendations for improving customer satisfaction.",
      image: "/images/projects/eda.png",
      technologies: ["Python", "EDA", "Data Visualization", "Jupyter Notebook"],
      liveUrl: "<your_project_live_url_here>",
      githubUrl: "<your_github_url_here>",
      date: "2024",
      featured: false,
    },
  ],
  civil: [
    {
      title: "Smart Building Design",
      description:
        "Sustainable building design with IoT integration for energy monitoring and automated climate control systems.",
      image: "/api/placeholder/400/250",
      technologies: ["AutoCAD", "Revit", "IoT Sensors", "Energy Analysis"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com/example",
      date: "2024",
      featured: true,
    },
    {
      title: "Bridge Structural Analysis",
      description:
        "Comprehensive structural analysis and design of a cable-stayed bridge using advanced engineering software.",
      image: "/api/placeholder/400/250",
      technologies: ["SAP2000", "AutoCAD", "MATLAB", "Structural Analysis"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com/example",
      date: "2023",
      featured: false,
    },
    {
      title: "Urban Planning System",
      description:
        "GIS-based urban planning tool for city development with traffic flow analysis and infrastructure optimization.",
      image: "/api/placeholder/400/250",
      technologies: ["GIS", "AutoCAD", "Traffic Modeling", "Urban Design"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com/example",
      date: "2023",
      featured: false,
    },
  ],
} as const;

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
