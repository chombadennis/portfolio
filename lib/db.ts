// lib/db.ts
import mongoose, { Mongoose } from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

type Cache = { conn: Mongoose | null; promise: Promise<Mongoose> | null };

// Allow caching across hot reloads in dev //eslint-disable-next-line no-var
declare global {
  var _mongoose: Cache | undefined;
}

const cached: Cache = global._mongoose ?? { conn: null, promise: null };

export async function connectDB(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(uri!);
  cached.conn = await cached.promise;
  global._mongoose = cached;
  return cached.conn;
}
