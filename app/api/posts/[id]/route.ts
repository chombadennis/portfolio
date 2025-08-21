// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { PostModel } from "@/lib/models/Post";
import { createServerSupabaseClient } from "@/integrations/supabase/server";

export const runtime = "nodejs"; // ✅ Force Node.js runtime

const ALLOWED_EMAIL = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL || ""
).toLowerCase();

// ✅ Correct type for route params (no custom interface, avoids build error)
type ParamsContext = { params: { id: string } };

/**
 * GET by id (public fetch by id).
 */
export async function GET(_req: Request, context: ParamsContext) {
  const { id } = context.params;
  const Post = await PostModel();
  const doc = await Post.findById(id).lean({ virtuals: true });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
}

/**
 * PUT - update post (admin only).
 */
export async function PUT(req: Request, context: ParamsContext) {
  const { id } = context.params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = !!user && user.email?.toLowerCase() === ALLOWED_EMAIL;
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates: Record<string, unknown> = await req.json();
  const Post = await PostModel();

  const existing = await Post.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const oldSlug = typeof existing.slug === "string" ? existing.slug : "";

  if (typeof updates.slug === "string" && updates.slug !== existing.slug) {
    const dup = await Post.findOne({ slug: updates.slug });
    if (dup) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }
  }

  Object.assign(existing, updates);
  const saved = await existing.save();

  revalidateTag("posts");
  revalidatePath("/blog");
  if (oldSlug) revalidatePath(`/blog/${oldSlug}`);
  revalidatePath(`/blog/${saved.slug}`);

  return NextResponse.json(saved.toJSON());
}

/**
 * DELETE - admin only.
 */
export async function DELETE(_req: Request, context: ParamsContext) {
  const { id } = context.params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = !!user && user.email?.toLowerCase() === ALLOWED_EMAIL;
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const Post = await PostModel();
  const doc = await Post.findByIdAndDelete(id);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  revalidateTag("posts");
  revalidatePath("/blog");
  revalidatePath(`/blog/${doc.slug}`);

  return NextResponse.json({ ok: true });
}
