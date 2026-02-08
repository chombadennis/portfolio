
"use client";

import dynamic from "next/dynamic";

// Dynamically import BlogAdmin with SSR disabled using an absolute path
const BlogAdmin = dynamic(() => import("@/components/admin/BlogAdmin"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export default function AdminBlogPage() {
  return <BlogAdmin />;
}
