"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import {
  Award,
  ExternalLink,
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Specialization {
  id: string;
  title: string;
  issuer: string;
  issuerUrl: string;
  date: string;
  credentialId?: string;
  credentialUrl?: string;
  status: "completed" | "in-progress";
  skills: string[];
  description: string;
  imageUrl?: string;
}

const specializations: Specialization[] = [
  {
    id: "1",
    title: "JavaScript Programming with React, Node & MongoDB Specialization",
    issuer: "IBM",
    issuerUrl:
      "https://www.coursera.org/account/accomplishments/specialization/T3SFIFS2ZR06",
    date: "Jun 2025",
    credentialId: "T3SFIFS2ZR06",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/specialization/certificate/T3SFIFS2ZR06",
    status: "completed",
    skills: ["MERN", "React.js", "Express", "Node,js", "MongoDB", "JavaScript"],
    description:
      "Comprehensive specialization covering JavaScript Programming Essentials, Developing Front-End Apps with React, Developing Back-End Apps with Node.js and Express, Developing Back-end Database Applications with Node.js and MongoDB with hands-on projects.",
    imageUrl: "/images/certifications/stanford-ml.png",
  },
  {
    id: "2",
    title: "Machine Learning Specialization",
    issuer: "DeepLearning.AI & Stanford Online",
    issuerUrl:
      "https://www.coursera.org/account/accomplishments/specialization/IB1AFS7G1FBT",
    date: "October 2024",
    credentialId: "IB1AFS7G1FBT",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/specialization/certificate/IB1AFS7G1FBT",
    status: "completed",
    skills: ["Machine Learning", "Python", "TensorFlow", "Neural Networks"],
    description:
      "Comprehensive specialization covering supervised learning, Regression & Classification, unsupervised learning, Recommenders & reinforcement learning, and Advanced Algorithms with hands-on projects.",
    imageUrl: "/images/certifications/ml.png",
  },
  {
    id: "3",
    title: "Machine Learning in Production",
    issuer: "DeepLearning.AI",
    issuerUrl:
      "https://www.coursera.org/account/accomplishments/specialization/certificate/IB1AFS7G1FBT",
    date: "October 2024",
    credentialId: "0PW1LT4L05JK",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/specialization/certificate/0PW1LT4L05JK",
    status: "completed",
    skills: [
      "Deployment",
      "FastAPI",
      "Docker",
      "Project Scope Development",
      "ML Model Optimization",
    ],
    description:
      "Course covering  the management of the full machine learning project lifecycle—including pipeline design, deployment, and monitoring—optimize models by focusing on critical data slices, and tackle real-world production challenges across various data types while ensuring label consistency.",
    imageUrl: "/images/certifications/mlp.png",
  },
  {
    id: "4",
    title: "Statistics for Data Science",
    issuer: "IBM",
    issuerUrl:
      "https://www.coursera.org/account/accomplishments/verify/BXPJ2TBPM66N",
    date: "August 2024",
    credentialId: "BXPJ2TBPM66N",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/specialization/certificate/BXPJ2TBPM66N",
    status: "completed",
    skills: [
      "Hypothesis testing",
      "T-test",
      "ANOVA",
      "Regression analysis",
      "Descriptive statistics",
      "Data visualization with Python",
      "Statistical interpretation",
      "Python programming",
    ],
    description:
      "Covers performance and interpretation of statistical analysis in Python—including T-tests, ANOVA, regression, and descriptive statistics—through coding, visualization, and a hands-on final project.",
    imageUrl: "/images/certifications/stats.png",
  },
  {
    id: "5",
    title: "Databases and SQL for Data Science with Python",
    issuer: "IBM",
    issuerUrl:
      "https://www.coursera.org/account/accomplishments/verify/HZC4VEMCAR78",
    date: "June 2024",
    credentialId: "HZC4VEMCAR78",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/specialization/certificate/HZC4VEMCAR78",
    status: "completed",
    skills: [
      "Database Design",
      "Transaction Processing",
      "Database Management",
      "Databases",
      "Data Analysis",
      "Pandas (Python Package)",
      "Data Manipulation",
    ],
    description:
      "Covers the design, management and analysis of relational databases using SQL and Python, applying advanced querying techniques to extract, manipulate, and process data effectively.",
    imageUrl: "/images/certifications/sql.png",
  },
  {
    id: "6",
    title: "Operations Analytics",
    issuer: "UPenn",
    issuerUrl:
      "https://www.coursera.org/account/accomplishments/verify/QAM2R8Y9VGLX",
    date: "April 2024",
    credentialId: "QAM2R8Y9VGLX",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/specialization/certificate/QAM2R8Y9VGLX",
    status: "completed",
    skills: [
      "Advanced Analytics",
      "Operations Management",
      "Inventory Control",
      "Spreadsheet Software",
      "Forecasting",
      "Predictive Analytics",
      "Process Optimization",
      "Data-Driven Decision-Making",
      "Business Risk Management",
      "Business Analytics",
      "Demand Planning",
      "Microsoft Excel",
    ],
    description:
      "This course provides a deep understanding of how to use advanced analytics and spreadsheet tools to optimize operations, forecast demand, manage inventory, and make data-driven decisions for minimizing business risks and improving efficiency",
    imageUrl: "/images/certifications/ops.png",
  },
  {
    id: "7",
    title: "Data Analysis with Python",
    issuer: "FreeCodeCamp",
    issuerUrl:
      "https://www.freecodecamp.org/certification/fcc6fd18c87-18ea-44b8-98d2-7b61f0852ab7/data-analysis-with-python-v7",
    date: "March 2024",
    credentialId: "fcc6fd18c87-18ea-44b8-98d2-7b61f0852ab7",
    credentialUrl:
      "https://www.freecodecamp.org/certification/fcc6fd18c87-18ea-44b8-98d2-7b61f0852ab7/data-analysis-with-python-v7",
    status: "completed",
    skills: [
      "Python",
      "NumPy",
      "Pandas",
      "Matplotlib",
      "Seaborn",
      "Data Analysis",
      "Data Visualization",
    ],
    description:
      "A comprehensive FreeCodeCamp certification focused on equipping learners to analyze and visualize data using Python libraries like NumPy, Pandas, Matplotlib, and Seaborn",
    imageUrl: "/images/certifications/da.png",
  },
  {
    id: "8",
    title: "Business Analytics: Communicating with Data",
    issuer:
      "University of Illinois at Urbana-Champaign, School of Information Sciences",
    issuerUrl:
      "https://www.freecodecamp.org/certification/fcc6fd18c87-18ea-44b8-98d2-7b61f0852ab7/data-analysis-with-python-v7",
    date: "March 2024",
    credentialId: "P9MWPWBQ3JLR",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/verify/P9MWPWBQ3JLR",
    status: "completed",
    skills: [
      "Data Analysis",
      "Data Storytelling",
      "Data-Driven Decision-Making",
      "Business Analytics",
      "Analytics",
      "Data Presentation",
      "Exploratory Data Analysis",
      "Marketing Analytics",
      "Data Access",
      "Data Transformation",
      "Data Visualization",
    ],
    description:
      "This course builds practical skills in analyzing, transforming, and visualizing data to communicate insights effectively, enabling data-driven decision-making and storytelling across business and marketing contexts.",
    imageUrl: "/images/certifications/coms.png",
  },
  {
    id: "9",
    title: "Learn To Program: The Fundamentals",
    issuer: "University of Toronto",
    issuerUrl:
      "https://www.coursera.org/account/accomplishments/verify/QZ3SMDMEV6ZH",
    date: "February 2024",
    credentialId: "QZ3SMDMEV6ZH",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/specialization/certificate/QZ3SMDMEV6ZH",
    status: "completed",
    skills: [
      "Python Programming",
      "Program Development",
      "Computer Programming",
      "Programming Principles",
      "Integrated Development Environments",
      "Debugging",
      "File Management",
      "Data Structures",
      "Software Documentation",
    ],
    description:
      "This course introduces the fundamentals of programming using Python, covering program development, core programming principles, data structures, debugging, software documentation, and file management within an IDE.",
    imageUrl: "/images/certifications/progs.png",
  },
  {
    id: "10",
    title: "Data Science for Construction Architecture and Engineering",
    issuer: "National University of Singapore",
    issuerUrl:
      "https://courses.edx.org/certificates/4162d15a141c4004a08838dd513d018d",
    date: "July 2024",
    credentialId: "4162d15a141c4004a08838dd513d018d",
    credentialUrl:
      "https://courses.edx.org/certificates/4162d15a141c4004a08838dd513d018d",
    status: "completed",
    skills: [
      "Python",
      "Pandas",
      "Data Loading",
      "Time Series Analysis",
      "Data Visualization",
      "Machine Learning",
      "Building Lifecycle Analytics",
      "IoT Data Processing",
      "Statistical Aggregation",
    ],
    description:
      "This course is tailored to building industry professionals—such as architects, engineers, and construction or facilities managers—that teaches practical Python-based data science techniques (including data loading, time-series analysis, visualization, and basic machine learning) applied across design, construction, and operations of buildings.",
    imageUrl: "/images/certifications/aec.png",
  },
  {
    id: "10",
    title:
      "Autodesk Certified Professional in Civil 3D for Infrastructure Design",
    issuer: "Autodesk",
    issuerUrl:
      "https://www.autodesk.com/certification/all-certifications/civil-3d-infrastructure-design-professional",
    date: "",
    credentialId: "",
    credentialUrl: "",
    status: "in-progress",
    skills: [
      "Civil 3D workflows",
      "site design",
      "grading",
      "alignment and profile creation",
      "corridor modeling",
      "pipe networks",
      "plan production",
      "data management",
    ],
    description:
      "Demonstrates proficiency in using Autodesk Civil 3D for designing, modeling, and documenting civil infrastructure projects.",
    imageUrl: "/images/certifications/aec.png",
  },
];

export function CertificationsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const completedSpecs = specializations.filter(
    (spec) => spec.status === "completed"
  );
  const inProgressSpecs = specializations.filter(
    (spec) => spec.status === "in-progress"
  );
  const allSpecs = [...completedSpecs, ...inProgressSpecs];

  // Auto-scroll functionality
  useEffect(() => {
    if (!isPaused && allSpecs.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % allSpecs.length);
      }, 4000); // Change every 4 seconds

      return () => clearInterval(interval);
    }
  }, [isPaused, allSpecs.length]);

  // Scroll to current index
  useEffect(() => {
    if (scrollContainerRef.current) {
      const cardWidth = 320; // Approximate card width + gap
      scrollContainerRef.current.scrollTo({
        left: currentIndex * cardWidth,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  const scrollLeft = () => {
    setCurrentIndex((prev) => (prev === 0 ? allSpecs.length - 1 : prev - 1));
  };

  const scrollRight = () => {
    setCurrentIndex((prev) => (prev + 1) % allSpecs.length);
  };

  const SpecializationCard = ({
    spec,
    status,
  }: {
    spec: Specialization;
    status: "completed" | "in-progress";
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="flex-shrink-0 w-80"
    >
      <Card
        className={`h-full ${
          status === "in-progress" ? "border-warning/30" : ""
        } hover:shadow-lg transition-all duration-300`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  status === "completed" ? "bg-success/10" : "bg-warning/10"
                }`}
              >
                {status === "completed" ? (
                  <GraduationCap className="h-6 w-6 text-success" />
                ) : (
                  <Clock className="h-6 w-6 text-warning" />
                )}
              </div>
              <div>
                <Badge
                  className={`text-xs ${
                    status === "completed"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-warning/10 text-warning border-warning/20"
                  }`}
                >
                  {status === "completed" ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      In Progress
                    </>
                  )}
                </Badge>
              </div>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {spec.date}
            </div>
          </div>

          <h4 className="font-semibold text-lg mb-2 line-clamp-2">
            {spec.title}
          </h4>

          <div className="mb-3">
            <a
              href={spec.issuerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors font-medium text-sm inline-flex items-center"
            >
              {spec.issuer}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {spec.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {spec.skills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {spec.skills.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{spec.skills.length - 4} more
              </Badge>
            )}
          </div>

          {spec.credentialUrl && status === "completed" && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                ID: {spec.credentialId}
              </span>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs w-fit"
              >
                <a
                  href={spec.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Verify
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4">
            <Award className="h-3 w-3 mr-2" />
            Courses & Specializations
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Professional <span className="gradient-text">Specializations</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Continuous learning through industry-recognized courses and
            specialized programs from leading universities and technology
            companies.
          </p>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {completedSpecs.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Completed Courses & Specializations
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning mb-2">
              {inProgressSpecs.length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success mb-2">
              {
                [...new Set(specializations.flatMap((spec) => spec.skills))]
                  .length
              }
            </div>
            <div className="text-sm text-muted-foreground">
              Skills Acquired & Polishing
            </div>
          </div>
        </motion.div>

        {/* Scrollable Specializations */}
        <div className="relative">
          <div className="mb-6">
            <h3 className="text-xl font-semibold flex items-center">
              <Award className="h-5 w-5 text-primary mr-2" />
              All Courses & Specializations
            </h3>
          </div>

          {/* Scrollable Container with Side Navigation */}
          <div className="relative flex items-center">
            {/* Left Navigation Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 h-10 w-10 p-0 shadow-lg bg-card/90 backdrop-blur-sm border-border/50 hover:bg-accent"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 mx-12"
              style={{ scrollBehavior: "smooth" }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {completedSpecs.map((spec) => (
                <SpecializationCard
                  key={spec.id}
                  spec={spec}
                  status="completed"
                />
              ))}
              {inProgressSpecs.map((spec) => (
                <SpecializationCard
                  key={spec.id}
                  spec={spec}
                  status="in-progress"
                />
              ))}
            </div>

            {/* Right Navigation Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={scrollRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 h-10 w-10 p-0 shadow-lg bg-card/90 backdrop-blur-sm border-border/50 hover:bg-accent"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {allSpecs.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30"
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
