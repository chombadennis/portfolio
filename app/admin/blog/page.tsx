// app/admin/blog/page.tsx
"use client";

import dynamic from "next/dynamic";

// Dynamically import BlogAdmin with SSR disabled
const BlogAdmin = dynamic(() => import("@/components/admin/BlogAdmin"), {
  ssr: false,
});

export default function AdminBlog() {
  return <BlogAdmin />;
}
