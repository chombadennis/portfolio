// app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/integrations/supabase/server";

type SupabaseAuthEvent =
  | "SIGNED_IN"
  | "TOKEN_REFRESHED"
  | "SIGNED_OUT"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY";

type CallbackBody = {
  event: SupabaseAuthEvent;
  session?: {
    access_token?: string;
    refresh_token?: string;
  } | null;
};

export async function POST(request: Request) {
  const { event, session } = (await request.json()) as CallbackBody;
  const supabase = await createServerSupabaseClient();

  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    if (session?.access_token && session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  }

  if (event === "SIGNED_OUT") {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ ok: true });
}
