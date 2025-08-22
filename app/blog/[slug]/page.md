// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BlogPost {
id: string;
title: string;
slug: string;
content: string;
excerpt: string;
featured_image_url?: string;
author_name: string;
published: boolean;
created_at: string;
updated_at: string;
category?: string;
content_background?: string;
content_font?: string;
}

const DEFAULT_BG = "#ffffff";
const DEFAULT_FONT =
"system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, sans-serif";

/\*_ tolerate null/undefined HTML _/
function stripHtmlToText(html?: string | null): string {
const input = typeof html === "string" ? html : "";
return input
.replace(/<[^>]+>/g, " ")
.replace(/\s+/g, " ")
.trim();
}

/\*_ tolerate null/undefined HTML _/
function getReadTime(html?: string | null): string {
const wordsPerMinute = 200;
const text = stripHtmlToText(html);
if (text.length === 0) return "1 min read";
const words = text.split(/\s+/).filter(Boolean).length;
const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
return `${minutes} min read`;
}

/\*_ Robust date formatter: returns formatted string or "Unknown" if invalid _/
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

async function getPostBySlug(
slug: string
): Promise<{ post: BlogPost | null; error: string | null; notFound: boolean }> {
try {
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(
      `${baseUrl}/api/posts/slug/${encodeURIComponent(slug)}`,
      {
        next: { tags: ["posts"] },
        cache: "no-store", // or revalidate if you want ISR
      }
    );

    if (res.status === 404) return { post: null, error: null, notFound: true };
    if (!res.ok)
      return { post: null, error: "Failed to load post", notFound: false };

    const post = (await res.json()) as BlogPost;
    return { post, error: null, notFound: false };

} catch {
return { post: null, error: "Failed to load post", notFound: false };
}
}

/\*\*

- Blog Post Page
  \*/
  export default async function BlogPostPage({
  params,
  }: {
  params: Promise<{ slug: string }>;
  }) {
  const { slug } = await params;
  const { post, error, notFound: is404 } = await getPostBySlug(slug);

if (is404) {
notFound();
}

if (!post) {
return (
<div className="pt-24 pb-16 bg-background">
<div className="container mx-auto px-4 max-w-4xl">
<div className="mb-8">
<Button
              variant="ghost"
              asChild
              className="hover:bg-accent hover:text-accent-foreground transition-colors rounded-lg"
            >
<Link href="/blog">
<ArrowLeft className="h-4 w-4 mr-2" />
Back to Blog
</Link>
</Button>
</div>

          <div className="text-center py-24">
            <h1 className="text-2xl font-semibold mb-4">
              Unable to load this post
            </h1>
            <p className="text-muted-foreground">
              {error ?? "An unexpected error occurred."}
            </p>
          </div>
        </div>
      </div>
    );

}

const safeHtml = DOMPurify.sanitize(post.content);
const created = post.created_at;
const updated = post.updated_at;

return (
<div className="pt-24 pb-16 bg-background">
<div className="container mx-auto px-4 max-w-4xl">
{/_ Back Button _/}
<div className="mb-8">
<Button
            variant="ghost"
            asChild
            className="hover:bg-accent hover:text-accent-foreground transition-colors rounded-lg"
          >
<Link href="/blog">
<ArrowLeft className="h-4 w-4 mr-2" />
Back to Blog
</Link>
</Button>
</div>

        {/* Featured Image */}
        {post.featured_image_url ? (
          <div className="mb-10 rounded-2xl overflow-hidden shadow-md">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              width={1200}
              height={600}
              className="w-full h-72 md:h-[28rem] object-cover transition-transform duration-700 hover:scale-105"
              unoptimized
            />
          </div>
        ) : null}

        {/* Article Header */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.2] mb-4 pb-1 tracking-tight bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed max-w-2xl mx-auto">
              {post.excerpt}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-primary" />
              {post.author_name}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              {formatDate(created)}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              {getReadTime(post.content)}
            </div>
            {post.category ? (
              <Badge variant="outline" className="ml-2 text-xs">
                {post.category}
              </Badge>
            ) : null}
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <div
            className="rounded-2xl p-8 shadow-sm bg-card/40 border border-border/50 leading-relaxed backdrop-blur-sm"
            style={{
              backgroundColor: post.content_background ?? DEFAULT_BG,
              fontFamily: post.content_font ?? DEFAULT_FONT,
            }}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        </article>

        {/* Article Footer */}
        <footer className="mt-16 pt-10 border-t border-border/60">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Published on {formatDate(created)}
              </p>
              {updated !== created ? (
                <p className="text-sm text-muted-foreground">
                  Updated on {formatDate(updated)}
                </p>
              ) : null}
            </div>
            <Button
              asChild
              variant="default"
              size="lg"
              className="rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <Link href="/contact">Get in Touch</Link>
            </Button>
          </div>
        </footer>
      </div>
    </div>

);
}
