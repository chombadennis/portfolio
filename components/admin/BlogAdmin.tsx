"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/AuthContext"; // your existing hook
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Save, X, LogOut, FileDown } from "lucide-react";
import RichContentEditor from "@/components/admin/RichContentEditor";
import { exportHtmlToPdf } from "@/utils/pdf";
import * as mammoth from "mammoth";
import { marked } from "marked";

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
  category: string;
  content_background?: string;
  content_font?: string;
}

const CATEGORIES: string[] = [
  "All",
  "Web Development",
  "Data Engineering",
  "Machine Learning",
  "DevOps",
  "Engineering",
  "Full Stack",
];

const FONT_OPTIONS = [
  "Arial, sans-serif",
  "Georgia, serif",
  "Times New Roman, Times, serif",
  "Courier New, monospace",
  "Verdana, sans-serif",
  "Roboto, sans-serif",
  "Ubuntu, sans-serif",
];

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/** Helpers to safely normalize API responses into BlogPost */
function getIdFromRecord(p: Record<string, unknown>): string {
  if (typeof p.id === "string" && p.id.length > 0) return p.id;
  if (typeof p._id === "string" && p._id.length > 0) return p._id;
  // if _id is an object (ObjectId), stringify it
  if (
    p._id != null &&
    typeof (p._id as { toString?: unknown }).toString === "function"
  ) {
    return String((p._id as { toString: () => string }).toString());
  }
  return "";
}

function normalizePostData(raw: unknown): BlogPost {
  const p = (raw as Record<string, unknown>) || {};
  const id = getIdFromRecord(p) || String(p.id ?? p._id ?? "");
  return {
    id,
    title: String(p.title ?? ""),
    slug: String(p.slug ?? ""),
    content: String(p.content ?? ""),
    excerpt: String(p.excerpt ?? ""),
    featured_image_url: String(p.featured_image_url ?? ""),
    author_name: String(p.author_name ?? "Dennis Munene"),
    published: Boolean(p.published ?? false),
    created_at: String(p.created_at ?? p.createdAt ?? ""),
    updated_at: String(p.updated_at ?? p.updatedAt ?? ""),
    category: String(p.category ?? ""),
    content_background: String(p.content_background ?? "#ffffff"),
    content_font: String(p.content_font ?? "Arial, sans-serif"),
  };
}

export default function BlogAdmin() {
  const { isAdmin, isLoading: authLoading, signOut, authFetch } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featured_image_url: "",
    author_name: "Dennis Munene",
    published: false,
    category: "",
    content_background: "#ffffff",
    content_font: "Arial, sans-serif",
  });

  const formRef = useRef<HTMLDivElement | null>(null);
  const postsListRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // Track load errors for graceful UI
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/auth");
  }, [isAdmin, authLoading, router]);

  // Load posts from DB (send Authorization so API treats us as admin)
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`${getBaseUrl()}/api/posts`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const msg = `Failed to load posts (${res.status})`;
          setLoadError(msg);
          throw new Error(msg);
        }

        const rawData = await res.json();
        const list = Array.isArray(rawData) ? rawData : [];
        const normalized = list.map(normalizePostData);
        setPosts(normalized);

        if (normalized.length === 0) {
          setLoadError(
            "No posts found yet. You can create your first post using the form above."
          );
        } else {
          setLoadError(null);
        }
      } catch {
        setLoadError(
          "Could not load posts from server. You can still use the editor and create posts."
        );
        toast({
          title: "Error",
          description: "Could not load posts from server.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [toast, authFetch]);

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value } as typeof prev;
      if (field === "title") updated.slug = generateSlug(value as string);
      return updated;
    });
  };

  async function createPost(): Promise<void> {
    const res = await authFetch(`${getBaseUrl()}/api/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    if (res.status === 409) {
      throw new Error("Slug already exists.");
    }
    if (!res.ok) throw new Error("Failed to create post.");
    const createdRaw = await res.json();
    const created = normalizePostData(createdRaw);
    setPosts((prev) => [created, ...prev]);
    setLoadError(null);
  }

  async function updatePost(id: string): Promise<void> {
    const res = await authFetch(`${getBaseUrl()}/api/posts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    if (res.status === 409) {
      throw new Error("Slug already exists.");
    }
    if (!res.ok) throw new Error("Failed to update post.");
    const updatedRaw = await res.json();
    const updated = normalizePostData(updatedRaw);
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function removePost(id: string): Promise<void> {
    const res = await authFetch(`${getBaseUrl()}/api/posts/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete post.");
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Missing required fields",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingPost) {
        // ensure we have an ID (normalized posts guarantee .id)
        const id =
          editingPost.id ||
          getIdFromRecord(editingPost as unknown as Record<string, unknown>);
        if (!id) throw new Error("Missing post id");
        await updatePost(id);
        toast({
          title: "Post updated",
          description: "Successfully updated post",
        });
      } else {
        await createPost();
        toast({ title: "Post created", description: "New blog post added" });
      }
      resetForm();
      postsListRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save post",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (post: BlogPost) => {
    // post comes from normalized `posts` list, but be defensive anyway
    const normalized = normalizePostData(post);
    setEditingPost(normalized);
    // Defensive fallbacks: ensure content/excerpt are never undefined.
    setFormData({
      title: normalized.title,
      slug: normalized.slug,
      content: normalized.content ?? "",
      excerpt: normalized.excerpt ?? "",
      featured_image_url: normalized.featured_image_url || "",
      author_name: normalized.author_name,
      published: normalized.published,
      category: normalized.category,
      content_background: normalized.content_background ?? "#ffffff",
      content_font: normalized.content_font ?? "Arial, sans-serif",
    });
    setIsCreating(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
      titleInputRef.current?.focus();
    }, 100);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await removePost(id);
      toast({ title: "Post deleted", description: "Blog post removed" });
    } catch {
      toast({
        title: "Delete failed",
        description: "Could not delete post",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featured_image_url: "",
      author_name: "Dennis Munene",
      published: false,
      category: "",
      content_background: "#ffffff",
      content_font: "Arial, sans-serif",
    });
    setEditingPost(null);
    setIsCreating(false);
    postsListRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const exportCurrentToPdf = () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Nothing to export",
        description: "Please add a title and content first.",
        variant: "destructive",
      });
      return;
    }
    exportHtmlToPdf({
      title: formData.title,
      author: formData.author_name,
      contentHtml: formData.content,
      createdAt: editingPost?.created_at,
      updatedAt: editingPost?.updated_at,
      fileName: formData.slug || undefined,
    });
  };

  const handleImportFile = async (file: File) => {
    try {
      if (file.name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        handleInputChange("content", result.value);
      } else if (file.name.endsWith(".md")) {
        const text = await file.text();
        const html = await marked(text);
        handleInputChange("content", html as string);
      } else if (file.name.endsWith(".txt")) {
        const text = await file.text();
        handleInputChange("content", `<p>${text.replace(/\n/g, "<br>")}</p>`);
      } else if (file.name.endsWith(".html")) {
        const text = await file.text();
        handleInputChange("content", text);
      } else {
        toast({
          title: "Unsupported file",
          description: "Only .docx, .md, .txt, or .html are supported.",
          variant: "destructive",
        });
      }
      toast({ title: "Imported", description: "File imported successfully" });
    } catch {
      toast({
        title: "Import failed",
        description: "Could not import file",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    // For now store small data URLs; for production use S3/Supabase Storage/Cloudinary.
    const reader = new FileReader();
    reader.onload = () => {
      handleInputChange("featured_image_url", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (authLoading || isLoading)
    return <div className="container mx-auto p-6 text-center">Loading...</div>;

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto p-6 max-w-6xl pt-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Blog Administration</h1>
          <Button
            onClick={() => setIsCreating(true)}
            className="mt-4"
            title="Create a new blog post"
          >
            <Plus className="h-4 w-4 mr-2" /> New Post
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          title="Sign out from admin"
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-6" ref={formRef}>
          <CardHeader>
            <CardTitle>
              {editingPost ? "Edit Post" : "Create New Post"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  ref={titleInputRef}
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => handleInputChange("excerpt", e.target.value)}
                rows={3}
              />
            </div>

            {/* Featured Image Upload */}
            <div>
              <Label>Featured Image</Label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                />
                {formData.featured_image_url && (
                  <Image
                    src={formData.featured_image_url}
                    alt="Preview"
                    width={96}
                    height={64}
                    className="w-24 h-16 object-cover rounded"
                    unoptimized
                  />
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="w-full border rounded-md p-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
              >
                <option value="">Select a category</option>
                {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Background + Font */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Background Color</Label>
                <input
                  type="color"
                  value={formData.content_background}
                  onChange={(e) =>
                    handleInputChange("content_background", e.target.value)
                  }
                  className="w-16 h-10 p-0 border rounded mt-2 cursor-pointer"
                  title="Pick background color"
                />
              </div>
              <div>
                <Label>Font Style</Label>
                <select
                  value={formData.content_font}
                  onChange={(e) =>
                    handleInputChange("content_font", e.target.value)
                  }
                  className="w-full border rounded-md p-2 mt-2"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rich Editor */}
            <RichContentEditor
              content={formData.content}
              onChange={(html) => handleInputChange("content", html)}
            />

            {/* Import Document */}
            <div>
              <Label>Import Document</Label>
              <input
                type="file"
                accept=".docx,.md,.txt,.html"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImportFile(e.target.files[0]);
                  }
                }}
                className="block mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported: .docx, .md, .txt, .html
              </p>
            </div>

            {/* Publish */}
            <div className="flex items-center gap-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) =>
                  handleInputChange("published", checked)
                }
              />
              <Label htmlFor="published">Published</Label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSubmit} title="Save or update blog post">
                <Save className="h-4 w-4 mr-2" />
                {editingPost ? "Update" : "Create"} Post
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={exportCurrentToPdf}
                title="Export current post as PDF"
              >
                <FileDown className="h-4 w-4 mr-2" /> Export PDF
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
                title="Cancel editing"
              >
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* All Posts */}
      <h2 className="text-2xl font-semibold mb-4" ref={postsListRef}>
        All Posts ({posts.length})
      </h2>

      {loadError && (
        <Card className="mb-4">
          <CardContent className="p-4 text-sm text-muted-foreground">
            {loadError}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No posts to display yet.
              {isCreating
                ? " Fill in the form above to create one."
                : " Click “New Post” to create your first post."}
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id || post.slug || Math.random()}>
              <CardContent className="p-4 flex justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    <Badge variant={post.published ? "default" : "secondary"}>
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                    {post.category && (
                      <Badge variant="outline">{post.category}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">/{post.slug}</p>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      exportHtmlToPdf({
                        title: post.title,
                        author: post.author_name,
                        contentHtml: post.content,
                        createdAt: post.created_at,
                        updatedAt: post.updated_at,
                        fileName: post.slug,
                      })
                    }
                    title="Export this post to PDF"
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(post)}
                    title="Edit this post"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(post.id)}
                    title="Delete this post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
