"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { v4 as uuidv4 } from 'uuid';

export default function NewPostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to create a post.");
      return;
    }

    try {
      await addDoc(collection(firestore, "posts"), {
        title,
        content,
        category,
        excerpt,
        slug: `${title.toLowerCase().replace(/\s+/g, '-')}-${uuidv4()}`,
        author_name: user.displayName || "User",
        published: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      router.push("/blog");
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl py-24">
      <h1 className="text-4xl font-bold mb-8">Create New Post</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-lg font-medium mb-2">Title</label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title"
            required
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-lg font-medium mb-2">Category</label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Enter a category"
          />
        </div>
        <div>
          <label htmlFor="excerpt" className="block text-lg font-medium mb-2">Excerpt</label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Enter a brief excerpt"
            rows={3}
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-lg font-medium mb-2">Content</label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your blog post content here..."
            required
            rows={15}
          />
        </div>
        <Button type="submit">Create Post</Button>
      </form>
    </div>
  );
}