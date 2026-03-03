// scripts/test-gemini.mjs
import fs from "fs";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Step 1: Load Environment Variables ---
// Get current directory to reliably find the .env.local file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the path to your .env.local file
const envLocalPath = path.resolve(__dirname, "../.env.local");

// Check for and load the .env.local file
if (fs.existsSync(envLocalPath)) {
  console.log("📌 Loading environment variables from .env.local...");
  config({ path: envLocalPath });
} else {
  console.warn("⚠️ .env.local file not found. This script requires it to load the GEMINI_API_KEY.");
}

// --- Step 2: Test the Gemini API Key ---
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is not set. Please ensure it is present in your .env.local file.");
  process.exit(1);
}

console.log("✅ GEMINI_API_KEY loaded successfully.");
const genAI = new GoogleGenerativeAI(apiKey);

async function runTest() {
  try {
    // Read model name from command line, or default to 'gemini-pro-latest'
    const modelName = process.argv[2] || "gemini-pro-latest";
    console.log(`🚀 Attempting to call the Gemini API with the '${modelName}' model...`);
    
    // Use the provided model name for the API call.
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent("Say a short, friendly hello.");
    const response = await result.response;
    
    console.log("🎉 SUCCESS! The API call worked.");
    console.log("🤖 Gemini Model Response: ", response.text());

  } catch (err) {
    console.error("❌ FAILED: There was an error calling the Gemini API.");
    console.error("Error Details:", err);
  }
}

runTest();
