"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User } from "lucide-react";
import { useAuth } from "@/hooks/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useEffect, useState } from "react";

interface BlogPost {
  id: string;
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

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "posts"), (snapshot) => {
      const postsData: BlogPost[] = [];
      snapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as BlogPost);
      });
      setPosts(postsData);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoadError("Failed to load posts");
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-foreground">
            Career & Other Insights
          </h1>
        </header>

        {user && user.email === 'dennis_mchomba@outlook.com' && (
          <div className="text-center mb-8">
            <Button asChild>
              <Link href="/admin/blog">Admin Dashboard</Link>
            </Button>
          </div>
        )}

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

                  <div className="flex justify-between items-center mt-auto">
                    <Button
                      asChild
                      variant="default"
                      className="rounded-xl"
                    >
                      <Link href={`/blog/${post.slug}`}>Read More</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
