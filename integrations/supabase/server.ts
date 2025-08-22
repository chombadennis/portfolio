// integrations/supabase/server.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// import type { Database } from "@/lib/types/supabase"; // if you generated types

export async function createServerSupabaseClient() {
  return createRouteHandlerClient({ cookies });
}
