// app/api/posts/slug/[slug]/route.ts
import { NextResponse } from "next/server";
import { PostModel } from "@/lib/models/Post";
import { createServerSupabaseClient } from "@/integrations/supabase/server";

type RouteContext = { params: Promise<{ slug: string }> };

const ALLOWED_EMAIL = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL || ""
).toLowerCase();

/**
 * GET single post by slug
 * - Admins can view unpublished posts.
 * - Public can only view published posts.
 */
export async function GET(_req: Request, ctx: RouteContext) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = !!user && user.email?.toLowerCase() === ALLOWED_EMAIL;

  // await params before using properties (required by Next.js dynamic APIs)
  const { slug } = await ctx.params;

  const Post = await PostModel();
  const query = isAdmin ? { slug } : { slug, published: true };

  type PostDoc = {
    slug: string;
    published?: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    [key: string]: unknown;
  };

  const doc = (await Post.findOne(query).lean({
    virtuals: true,
  })) as PostDoc | null;

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Normalize timestamps to snake_case for the client
  const createdAtISO =
    doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : typeof doc.createdAt === "string"
      ? doc.createdAt
      : undefined;

  const updatedAtISO =
    doc.updatedAt instanceof Date
      ? doc.updatedAt.toISOString()
      : typeof doc.updatedAt === "string"
      ? doc.updatedAt
      : undefined;

  const payload: Record<string, unknown> = {
    ...doc,
    ...(createdAtISO ? { created_at: createdAtISO } : {}),
    ...(updatedAtISO ? { updated_at: updatedAtISO } : {}),
  };

  const res = NextResponse.json(payload);
  if (!isAdmin && doc.published) {
    res.headers.set("Cache-Control", "s-maxage=60");
  }
  return res;
}
