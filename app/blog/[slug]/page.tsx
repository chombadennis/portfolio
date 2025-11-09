
import { getPost, getPublishedPosts } from "@/lib/firebase/posts/getPost";
import { notFound } from "next/navigation";
import BlogPostClient from "./client";
import { Post } from "@/lib/models/Post";

// This tells Next.js to re-fetch and regenerate the page in the background 
// every hour, ensuring content is fresh without a full rebuild.
export const revalidate = 3600; 

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

// This function runs at build time to find all published posts
// and pre-render them as static pages for instant loading.
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post: Post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getPost(params.slug);

  if (!post || !post.published) {
    notFound();
  }

  return <BlogPostClient post={post} />;
}
