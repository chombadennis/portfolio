import mongoose, { Mongoose } from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

type Cache = { conn: Mongoose | null; promise: Promise<Mongoose> | null };

// Allow caching across hot reloads in dev
declare global {
  // Extend globalThis properly so TS knows about _mongoose
  // eslint-disable-next-line no-var
  var _mongoose: Cache | undefined;
}

const cached: Cache = globalThis._mongoose ?? { conn: null, promise: null };

export async function connectDB(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(uri!);
  cached.conn = await cached.promise;
  globalThis._mongoose = cached;
  return cached.conn;
}
