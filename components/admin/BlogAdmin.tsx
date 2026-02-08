
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/AuthContext"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Save, X, LogOut, Loader2, Upload, Image as ImageIcon, ExternalLink } from "lucide-react";
import RichContentEditor from "@/components/admin/RichContentEditor";
import * as mammoth from "mammoth";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// BlogPost Interface
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

// Constants
const CATEGORIES: string[] = [ "Web Development", "Data Engineering", "Machine Learning", "DevOps", "Engineering", "Full Stack" ];
const FONT_OPTIONS = [ "Arial, sans-serif", "Georgia, serif", "Times New Roman, Times, serif", "Courier New, monospace", "Verdana, sans-serif", "Roboto, sans-serif", "Ubuntu, sans-serif" ];

// Helper functions
function getIdFromRecord(p: Record<string, unknown>): string {
  if (typeof p.id === "string" && p.id.length > 0) return p.id;
  if (typeof p._id === "string" && p._id.length > 0) return p._id;
  if (p._id && typeof (p._id as { toString?: unknown }).toString === "function") {
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
      content_font: String(p.content_font ?? "Roboto, sans-serif"),
    };
}


export default function BlogAdmin() {
  const { isAdmin, isLoading: authLoading, signOut, authFetch } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  const initialFormData = {
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featured_image_url: "",
    author_name: "Dennis Munene",
    published: false,
    category: "",
    content_background: "#ffffff",
    content_font: "Roboto, sans-serif",
  };

  const [formData, setFormData] = useState<Omit<BlogPost, "id" | "created_at" | "updated_at">>(initialFormData);

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/auth?callbackUrl=/nesh");
    }
  }, [isAdmin, authLoading, router]);

  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const res = await authFetch("/api/posts", { cache: "no-store" });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.details || `Failed to load posts (${res.status})`);
      }
      const rawData = await res.json();
      const normalized = Array.isArray(rawData) ? rawData.map(normalizePostData).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [];
      setPosts(normalized);
    } catch (error) {
      console.error("Failed to load posts:", error);
      toast({ title: "Error Loading Posts", description: error instanceof Error ? error.message : "An unknown error occurred.", variant: "destructive" });
    } finally {
      setIsLoadingPosts(false);
    }
  }, [authFetch, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchPosts();
    }
  }, [isAdmin, fetchPosts]);

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "title" && !editingPost) {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
  };
  
  const resetForm = () => {
    setEditingPost(null);
    setFormData(initialFormData);
    titleInputRef.current?.focus();
  };

  const handleSelectPost = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content ?? "",
      excerpt: post.excerpt ?? "",
      featured_image_url: post.featured_image_url || "",
      author_name: post.author_name,
      published: post.published,
      category: post.category,
      content_background: post.content_background ?? "#ffffff",
      content_font: post.content_font ?? "Roboto, sans-serif",
    });
    titleInputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const isUpdating = !!editingPost;
    try {
      const res = await authFetch(isUpdating ? `/api/posts/${editingPost.id}` : "/api/posts", {
        method: isUpdating ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.details || `Request failed with status ${res.status}`);
      }
      
      const updatedPost = normalizePostData(await res.json());
      
      if (isUpdating) {
          setPosts(prev => prev.map(p => (p.id === editingPost.id ? updatedPost : p)));
          toast({ title: "Post Updated", description: `The post "${updatedPost.title}" has been successfully updated.` });
      } else {
          setPosts(prev => [updatedPost, ...prev]);
          toast({ title: "Post Created", description: `The post "${updatedPost.title}" has been successfully created.` });
      }
      handleSelectPost(updatedPost);

    } catch (e) {
      console.error("Failed to save post:", e);
      toast({ 
        title: isUpdating ? "Update Failed" : "Creation Failed", 
        description: e instanceof Error ? e.message : "Could not save the post.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    const { id, featured_image_url, title } = postToDelete;

    try {
      const res = await authFetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.details || 'Failed to delete post from database.');
      }

      if (featured_image_url) {
        try {
          const imageRef = ref(storage, featured_image_url);
          await deleteObject(imageRef);
        } catch (storageError: any) {
            if (storageError.code !== 'storage/object-not-found') {
                console.warn("Could not delete image from storage:", storageError);
            }
        }
      }

      setPosts(prev => prev.filter(p => p.id !== id));
      if (editingPost?.id === id) {
        resetForm();
      }
      toast({ title: "Post Deleted", description: `The post "${title}" and its assets have been removed.` });
    } catch (error) {
      console.error("Delete operation failed:", error);
      toast({ title: "Delete Failed", description: error instanceof Error ? error.message : "Could not delete the post.", variant: "destructive" });
    } finally {
        setPostToDelete(null); 
    }
  };

  const handleImportFile = async (file: File) => {
    toast({ title: "Importing..."});
    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            if (arrayBuffer) {
                try {
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    handleInputChange("content", result.value);
                    toast({ title: "Import Successful" });
                } catch (mammothError) {
                    toast({ title: "Import Failed", variant: "destructive" });
                }
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        const text = await file.text();
        handleInputChange("content", text);
        toast({ title: "Import Successful" });
    }
  };
  
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    toast({ title: "Uploading Image..." });
    try {
      const storageRef = ref(storage, `images/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      handleInputChange("featured_image_url", downloadURL);
      toast({ title: "Image Uploaded" });
    } catch (error) {
      console.error("Image upload error:", error);
      toast({ title: "Image Upload Failed", variant: "destructive" });
    }
  };

  if (authLoading || !isAdmin) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <>
    <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the post titled "<span className='font-bold'>{postToDelete?.title}</span>" and its associated image from the servers.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <div className="bg-muted/40 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-8xl">
        <header className="flex justify-between items-center pb-6 pt-16">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Blog Dashboard</h1>
          <Button variant="outline" onClick={async () => { await signOut(); router.push("/"); }}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Posts</CardTitle>
                  <CardDescription>{posts.length} posts</CardDescription>
                </div>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" /> New
                </Button>
              </CardHeader>
              <CardContent className="max-h-[65vh] overflow-y-auto pr-3">
                {isLoadingPosts ? (
                  <div className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-10">
                    <h3 className="text-lg font-semibold">No posts yet</h3>
                    <p className="text-sm text-muted-foreground">Click "New Post" to start.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => handleSelectPost(post)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${editingPost?.id === post.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                      >
                        <h4 className="font-semibold truncate">{post.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">{post.excerpt || `/${post.slug}`}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={post.published ? "default" : "secondary"}>{post.published ? "Published" : "Draft"}</Badge>
                          {post.category && <Badge variant="outline">{post.category}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl">{editingPost ? "Edit Post" : "Create New Post"}</CardTitle>
                        <CardDescription>{editingPost ? `Editing "${editingPost.title}"` : "Fill out the details below."}</CardDescription>
                    </div>
                    {editingPost && (
                        <Button variant="outline" size="sm" asChild>
                            <a href={`/blog/${editingPost.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2"/> View Live
                            </a>
                        </Button>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" ref={titleInputRef} value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} placeholder="Enter a catchy title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input id="slug" value={formData.slug} onChange={(e) => handleInputChange("slug", e.target.value)} placeholder="post-url-slug" />
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea id="excerpt" value={formData.excerpt} onChange={(e) => handleInputChange("excerpt", e.target.value)} placeholder="A short summary of the post" rows={2}/>
                </div>

                <div className="space-y-2 mb-6">
                  <Label>Main Content</Label>
                  <RichContentEditor content={formData.content} onChange={(html) => handleInputChange("content", html)} />
                </div>
                
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Post Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Featured Image</Label>
                            <div className="flex items-center gap-2">
                                <Input id="image-upload" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="hidden" />
                                <Button variant="outline" asChild><Label htmlFor="image-upload" className="cursor-pointer w-full"><ImageIcon className="h-4 w-4 mr-2" /> Upload</Label></Button>
                                {formData.featured_image_url && <Image src={formData.featured_image_url} alt="Preview" width={48} height={48} className="w-12 h-12 object-cover rounded-lg border" unoptimized/>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Content Font</Label>
                            <Select value={formData.content_font} onValueChange={(value) => handleInputChange("content_font", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_OPTIONS.map((font) => <SelectItem key={font} value={font} style={{fontFamily: font}}>{font.split(',')[0]}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Import</Label>
                            <Input id="file-import" type="file" accept=".docx,.md,.txt,.html" onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])} className="hidden"/>
                            <Button variant="outline" asChild><Label htmlFor="file-import" className="cursor-pointer w-full"><Upload className="h-4 w-4 mr-2" /> Import File</Label></Button>
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-6">
                           <Switch id="published" checked={formData.published} onCheckedChange={(checked) => handleInputChange("published", checked)} />
                           <Label htmlFor="published" className="cursor-pointer">Publish</Label>
                        </div>
                    </CardContent>
                </Card>

              </CardContent>
              <CardFooter className="flex justify-end gap-3">
                {editingPost && (
                    <Button variant="destructive" onClick={() => setPostToDelete(editingPost)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                )}
                <Button variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {editingPost ? "Save Changes" : "Create Post"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
