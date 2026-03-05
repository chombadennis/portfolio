// scripts/test-gemini.mjs
import fs from "fs";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

// --- Step 1: Load Environment Variables ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envLocalPath = path.resolve(__dirname, "../.env.local");

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
const genAI = new GoogleGenAI({ apiKey });

async function tryModel(modelName) {
    console.log(`🚀 Attempting to call the Gemini API with the '${modelName}' model...`);
    
    const result = await genAI.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: "Say a short, friendly hello." }] }]
    });

    const candidates = result.response ? result.response.candidates : result.candidates;
    const text = candidates[0].content.parts[0].text;

    console.log(`🎉 SUCCESS with ${modelName}!`);
    console.log("🤖 Gemini Model Response: ", text);
    return true;
}

async function runTest() {
  const primaryModel = 'gemini-2.5-pro';
  const fallbackModel = 'gemini-pro-latest';

  try {
    await tryModel(primaryModel);
  } catch (primaryError) {
    console.error(`❌ FAILED: Primary model '${primaryModel}' failed.`);
    console.error("Error Details:", primaryError.message);
    console.log("--- Attempting fallback model ---");
    try {
        await tryModel(fallbackModel);
    } catch (fallbackError) {
        console.error(`❌ FAILED: Fallback model '${fallbackModel}' also failed.`);
        console.error("Error Details:", fallbackError.message);
    }
  }
}

runTest();
