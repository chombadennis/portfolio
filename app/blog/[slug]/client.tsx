'use client';

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import sanitizeHtml from "sanitize-html";
import { format } from "date-fns";
import type { Post } from "@/lib/models/Post";

interface BlogPostClientProps {
  post: Post;
}

export default function BlogPostClient({ post }: BlogPostClientProps) {
  const sanitizedContent = sanitizeHtml(post.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "div", "span", "figure", "figcaption"]),
    allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        "*": ["class", "style", "id"],
        img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
    },
    allowedStyles: {
        '*': {
            'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
            'text-align': [/^left$/, /^right$/, /^center$/],
            'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/]
        }
    }
  });

  const postDate = post.created_at ? new Date(post.created_at) : new Date();
  const formattedDate = format(postDate, "MMMM d, yyyy");

  return (
    <div className="bg-background text-foreground">
      <header className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center text-white overflow-hidden">
        {post.featured_image_url && (
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center p-4 max-w-4xl mx-auto">
          {post.category && (
            <Badge variant="secondary" className="mb-4 text-sm font-semibold">
              {post.category}
            </Badge>
          )}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg md:text-xl text-slate-200 max-w-3xl mx-auto">
              {post.excerpt}
            </p>
          )}
        </div>
      </header>

      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
                <Avatar className="h-12 w-12">
                    <AvatarImage src="/images/profile/profile.jpg" alt="Author" />
                    <AvatarFallback>DM</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-lg">{post.author_name || "Dennis Munene"}</p>
                    <p className="text-muted-foreground text-sm">{formattedDate}</p>
                </div>
            </div>
            
            <div
              className="prose prose-lg dark:prose-invert max-w-none space-y-6"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
        </div>
      </div>
    </div>
  );
}
