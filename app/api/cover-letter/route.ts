
import { GoogleGenerativeAI } from "@google/generative-ai";
import { portfolioContext } from "@/lib/ai/context";
import { 
    heroContent,
    aboutContent,
    contactContent,
} from "@/lib/ai/static-context";
import projectsData from "@/data/projects.json";

const API_KEY = process.env.GEMINI_API_KEY || "";

if (!API_KEY) {
  console.warn("Gemini API key is not set. Please set the GEMINI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const projectsContext = JSON.stringify(projectsData, null, 2);

// Assemble the new, stable context from static sources
const comprehensiveContext = `
  ${portfolioContext}

  ## Website Content

  ### Home Page (Hero Section)
  ${heroContent}

  ### About Page
  ${aboutContent}

  ### Contact Page
  ${contactContent}

  ## Projects
  ${projectsContext}
`;

export async function POST(req: Request) {
  if (!API_KEY) {
    return new Response("API key not configured", { status: 500 });
  }

  try {
    const { jobDescription } = await req.json();

    if (!jobDescription) {
      return new Response("Job description is required", { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

    const prompt = `
    Based on the following portfolio context and the job description provided, write a professional and compelling cover letter. The cover letter should be tailored to the job description, highlighting the most relevant skills and experiences from the portfolio.

    **Formatting and Style Guidelines:**
    - The output must be a single, clean string of text.
    - Do not include any markdown, special characters, or symbols like asterisks or hyphens.
    - Use standard paragraph spacing with double line breaks between paragraphs.
    - Do not use the Oxford comma. For example, in a list of three items, write "item one, item two and item three" not "item one, item two, and item three".

    **Title Guidance (Absolute Mandate):**
    - You are strictly forbidden from using the term \'full-stack developer\'. You MUST use \'developer\' or \'engineer\' instead. There are no exceptions.

    **Portfolio Context:**
    ${comprehensiveContext}

    **Job Description:**
    ${jobDescription}
    `;

    const result = await model.generateContent({ 
        contents: [{ role: "user", parts: [{text: prompt}] }]
    });
    const response = await result.response;
    const text = await response.text();

    return new Response(text, { 
      status: 200, 
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error("Fatal Error in Cover Letter API:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
