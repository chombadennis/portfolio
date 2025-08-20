// scripts/test-db.js
import fs from "fs";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// resolve env file
const envLocalPath = path.resolve(__dirname, "../.env.local");
const envPath = path.resolve(__dirname, "../.env");

if (fs.existsSync(envLocalPath)) {
  console.log("📌 Loading .env.local");
  config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log("📌 Loading .env");
  config({ path: envPath });
} else {
  console.warn("⚠️ No .env.local or .env found. Make sure MONGODB_URI is set.");
}

// now import compiled db.js (from dist)
import("../dist/db.js")
  .then(async ({ connectDB }) => {
    try {
      const db = await connectDB();
      console.log("✅ MongoDB connected:", db.connection.name);
    } catch (err) {
      console.error("❌ Connection failed:", err);
    } finally {
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error("❌ Could not import db.js:", err);
    process.exit(1);
  });
