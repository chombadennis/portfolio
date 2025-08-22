// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

const ALLOWED_EMAIL = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL || ""
).toLowerCase();

export async function middleware(req: NextRequest) {
  // Create a Supabase client for edge functions (middleware runs at the edge)
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get session from cookies
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user not logged in → redirect to /auth
  if (!session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user logged in but ALLOWED_EMAIL is set and email != ALLOWED_EMAIL → redirect to /blog
  if (ALLOWED_EMAIL && session.user.email?.toLowerCase() !== ALLOWED_EMAIL) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/blog";
    return NextResponse.redirect(redirectUrl);
  }

  // ✅ Allow access if logged in + email matches ALLOWED_EMAIL (or ALLOWED_EMAIL not set)
  return res;
}

// Apply middleware only to /admin routes
export const config = {
  matcher: ["/admin/:path*"],
};
