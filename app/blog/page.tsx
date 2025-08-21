// app/blog/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User } from "lucide-react";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url?: string;
  author_name: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  category?: string;
  content: string;
}

type ReqCookie = { name: string; value: string };
type ReadonlyCookies = {
  get(name: string): ReqCookie | undefined;
  getAll(): ReqCookie[];
};

function extractTokenFromCookieValue(value: string): string | null {
  const decoded = decodeURIComponent(value);
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    parsed = null;
  }
  if (Array.isArray(parsed)) {
    const first = parsed[0];
    if (typeof first === "string" && first.length > 0) return first;
  }
  if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as {
      access_token?: unknown;
      currentSession?: { access_token?: unknown };
    };
    if (typeof obj.access_token === "string") return obj.access_token;
    if (
      obj.currentSession &&
      typeof obj.currentSession.access_token === "string"
    )
      return obj.currentSession.access_token;
  }
  return null;
}

async function getBearerFromCookies(): Promise<string | null> {
  const store = (await cookies()) as ReadonlyCookies;

  const direct = store.get("sb-access-token")?.value;
  if (direct) return direct;

  const supa = store.get("supabase-auth-token")?.value;
  if (supa) {
    const t = extractTokenFromCookieValue(supa);
    if (t) return t;
  }

  const all = store.getAll();
  const proj = all.find(
    (ck: ReqCookie) =>
      ck.name.startsWith("sb-") && ck.name.endsWith("-auth-token")
  );
  if (proj) {
    const t = extractTokenFromCookieValue(proj.value);
    if (t) return t;
  }

  return null;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getBearerFromCookies();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function stripHtmlToText(html?: string | null): string {
  const input = typeof html === "string" ? html : "";
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getReadTime(html?: string | null): string {
  const wordsPerMinute = 200;
  const text = stripHtmlToText(html);
  if (text.length === 0) return "1 min read";
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return `${minutes} min read`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Fetch posts with full metadata
async function getPosts(): Promise<{
  posts: BlogPost[];
  error: string | null;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/posts`, {
      next: { tags: ["posts"] },
      headers,
    });
    if (!res.ok) return { posts: [], error: "Failed to load posts" };
    const posts = (await res.json()) as BlogPost[];

    // Normalize metadata to ensure author, category, and content exist
    const normalizedPosts: BlogPost[] = posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || "",
      featured_image_url: p.featured_image_url,
      author_name: p.author_name || "Unknown Author",
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || p.created_at || new Date().toISOString(),
      category: p.category || "",
      published: p.published,
      content: p.content || p.excerpt || "",
    }));

    return { posts: normalizedPosts, error: null };
  } catch {
    return { posts: [], error: "Failed to load posts" };
  }
}

export default async function BlogPage() {
  const { posts, error: loadError } = await getPosts();

  return (
    <div className="pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Career Insights & Guidance
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto italic">
            Explore strategies, professional development tips, and industry
            knowledge to elevate your career and skills.
          </p>
        </header>

        {loadError ? (
          <p className="text-center text-red-500">{loadError}</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No posts available at the moment.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts.map((post) => (
              <div
                key={post.slug}
                className="flex flex-col rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow bg-card border border-border/50"
              >
                {post.featured_image_url && (
                  <Image
                    src={post.featured_image_url}
                    alt={post.title}
                    width={600}
                    height={350}
                    className="w-full h-56 md:h-64 object-cover transition-transform duration-500 hover:scale-105"
                    unoptimized
                  />
                )}
                <div className="p-6 flex flex-col flex-1">
                  <h2 className="text-2xl font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors">
                    {post.title}
                  </h2>

                  {post.category && (
                    <p className="text-xs text-primary uppercase font-semibold mb-2">
                      {post.category}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-primary" />
                      {post.author_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-primary" />
                      {formatDate(post.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" />
                      {getReadTime(post.content)}
                    </span>
                  </div>

                  <Button
                    asChild
                    variant="default"
                    className="w-full mt-auto rounded-xl"
                  >
                    <Link href={`/blog/${post.slug}`}>Read More</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
