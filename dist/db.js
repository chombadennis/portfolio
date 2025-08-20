// lib/db.ts
import mongoose from "mongoose";
const uri = process.env.MONGODB_URI;
if (!uri)
    throw new Error("MONGODB_URI is not set");
const cached = global._mongoose ?? { conn: null, promise: null };
export async function connectDB() {
    if (cached.conn)
        return cached.conn;
    if (!cached.promise)
        cached.promise = mongoose.connect(uri);
    cached.conn = await cached.promise;
    global._mongoose = cached;
    return cached.conn;
}
