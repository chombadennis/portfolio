// lib/auth.ts
import { createClient, User } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const ALLOWED_EMAIL = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL || ""
).toLowerCase();

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase server environment variables");
}

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function getUserFromRequest(req: Request): Promise<User | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function requireAdmin(req: Request): Promise<User | null> {
  const user = await getUserFromRequest(req);
  if (!user?.email) return null;
  if (!ALLOWED_EMAIL) return null;
  return user.email.toLowerCase() === ALLOWED_EMAIL ? user : null;
}
