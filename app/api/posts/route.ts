// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { PostModel } from "@/lib/models/Post";
import { createServerSupabaseClient } from "@/integrations/supabase/server";

interface PostCreateBody {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  author_name?: string;
  published?: boolean;
  category?: string;
  content_background?: string;
  content_font?: string;
}

function serializePosts(docs: unknown[]): unknown[] {
  return docs;
}

const ALLOWED_EMAIL = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL || ""
).toLowerCase();

/**
 * GET - list posts
 * - Uses cookie-aware supabase client to determine if requester is admin.
 * - Admins see all posts (including content); public sees only published posts and a minimal projection.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = !!user && user.email?.toLowerCase() === ALLOWED_EMAIL;

  const Post = await PostModel();
  const query = isAdmin ? {} : { published: true };

  // For admins include editor fields (content, author, published, styling fields).
  // For public requests keep a small projection for performance and safety.
  if (isAdmin) {
    const posts = await Post.find(
      query,
      "title slug excerpt featured_image_url content author_name published category content_background content_font createdAt updatedAt"
    )
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    return NextResponse.json(serializePosts(posts));
  }

  const posts = await Post.find(
    query,
    "title slug excerpt featured_image_url createdAt"
  )
    .sort({ createdAt: -1 })
    .lean({ virtuals: true });

  return NextResponse.json(serializePosts(posts), {
    headers: { "Cache-Control": "s-maxage=60" },
  });
}

/**
 * POST - create a post (admin only)
 */
export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = !!user && user.email?.toLowerCase() === ALLOWED_EMAIL;
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as PostCreateBody;
  const Post = await PostModel();

  const slug = (body.slug || body.title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  try {
    const created = await Post.create({
      ...body,
      slug,
      author_name: body.author_name || user?.email || "Admin",
    });

    // keep cached pages in sync
    revalidateTag("posts");
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);

    return NextResponse.json(created.toJSON(), { status: 201 });
  } catch (err) {
    if (
      typeof err === "object" &&
      err &&
      (err as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
