// integrations/supabase/server.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// import type { Database } from "@/lib/types/supabase"; // if you generated types

export async function createServerSupabaseClient() {
  // Next.js 15: cookies() is async at runtime
  const store = await cookies();

  // Supabase expects a sync function, so cast
  return createRouteHandlerClient({
    cookies: () => store as unknown as ReturnType<typeof cookies>,
  });
}
