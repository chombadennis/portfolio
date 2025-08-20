// integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

// Supabase client for BROWSER (AuthContext, etc.)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
