// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { PostModel } from "@/lib/models/Post";
import { createServerSupabaseClient } from "@/integrations/supabase/server";

export const runtime = "nodejs";

const ALLOWED_EMAIL = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL || ""
).toLowerCase();

// ✅ Define expected post fields for TypeScript
export interface PostDoc {
  _id: string | number;
  slug?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown;
}

// ✅ Correct type for route params
type ParamsContext = { params: { id: string } };

/**
 * GET by id (public fetch by id).
 */
export async function GET(_req: Request, context: ParamsContext) {
  const { id } = context.params;
  const Post = await PostModel();
  const doc = (await Post.findById(id).lean({
    virtuals: true,
  })) as PostDoc | null;

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const out: Record<string, unknown> = { ...doc };

  // Normalize timestamps
  if (doc.createdAt instanceof Date) {
    out.created_at = doc.createdAt.toISOString();
    delete out.createdAt;
  } else if (typeof doc.createdAt === "string") {
    out.created_at = doc.createdAt;
    delete out.createdAt;
  }

  if (doc.updatedAt instanceof Date) {
    out.updated_at = doc.updatedAt.toISOString();
    delete out.updatedAt;
  } else if (typeof doc.updatedAt === "string") {
    out.updated_at = doc.updatedAt;
    delete out.updatedAt;
  }

  // Normalize id
  if (doc._id) {
    out.id = String(doc._id);
    delete out._id;
  }

  return NextResponse.json(out);
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

  const updates: Partial<PostDoc> = await req.json();
  const Post = await PostModel();

  const existing = (await Post.findById(id)) as
    | (PostDoc & { save: () => Promise<PostDoc> })
    | null;
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

  return NextResponse.json(saved);
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
  const doc = (await Post.findByIdAndDelete(id)) as PostDoc | null;
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  revalidateTag("posts");
  revalidatePath("/blog");
  revalidatePath(`/blog/${doc.slug}`);

  return NextResponse.json({ ok: true });
}
