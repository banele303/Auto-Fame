
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; 
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { configureAdminAuth, fetchAuthSession } from "../../../adminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save, Trash2, Upload, X, ImageIcon } from "lucide-react";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
import { MarkdownEditor } from "@/components/blog/MarkdownEditor";

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  slug: z.string().min(3, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug usually contains lowercase letters, numbers, and hyphens only"),
  excerpt: z.string().optional(),
  content: z.string().min(20, "Content must be at least 20 characters"),
  coverImage: z.string().optional(),
  published: z.boolean().default(false),
  authorName: z.string().optional(),
  tags: z.string().optional(),
});

export default function EditPostPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Amplify auth on mount (same as car edit page)
  useEffect(() => {
    configureAdminAuth();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      published: false,
      authorName: "",
      tags: "",
    },
  });

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/posts/${params.slug}`);
        if (!response.ok) {
            if (response.status === 404) {
                toast.error("Post not found");
                router.push("/admin/blog");
                return;
            }
            throw new Error("Failed to fetch post");
        }
        const post = await response.json();
        
        form.reset({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || "",
          content: post.content,
          coverImage: post.coverImage || "",
          published: post.published,
          authorName: post.authorName || "",
          tags: post.tags ? post.tags.join(", ") : "",
        });

        // Show existing cover image
        if (post.coverImage) {
          setCoverImagePreview(post.coverImage);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load post details");
      } finally {
        setIsLoading(false);
      }
    }

    if (params.slug) {
        fetchPost();
    }
  }, [params.slug, router, form]);
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      configureAdminAuth();
      const session = await fetchAuthSession({ forceRefresh: true });
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        return "";
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "blog");

      const res = await fetch("/api/presign-uploads", {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const text = await res.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || `Upload failed`);
      }

      return data.url;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image.");
      return "";
    }
  }, []);

  const handleCoverImageUpload = async (file: File) => {
    setIsUploading(true);
    const url = await handleImageUpload(file);
    if (url) {
      form.setValue("coverImage", url);
      setCoverImagePreview(url);
      toast.success("Cover image updated!");
    }
    setIsUploading(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file) handleCoverImageUpload(file);
    },
    [handleCoverImageUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const removeCoverImage = () => {
    form.setValue("coverImage", "");
    setCoverImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${params.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          tags: values.tags ? values.tags.split(",").map((t) => t.trim()) : [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      toast.success("Post updated successfully!");
      router.push("/admin/blog");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onDelete() {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/posts/${params.slug}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Failed to delete post");
        }
        
        toast.success("Post deleted successfully");
        router.push("/admin/blog");
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete post");
        setIsDeleting(false);
      }
  }

  if (isLoading) {
      return (
          <div className="flex h-[50vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/blog">
                <ArrowLeft className="h-4 w-4" />
            </Link>
            </Button>
            <div>
            <h2 className="text-3xl font-bold tracking-tight">Edit Post</h2>
            <p className="text-muted-foreground">
                Make changes to your blog post.
            </p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <Button 
                type="submit" 
                form="blog-post-form" 
                disabled={isSubmitting}
                className="bg-[#00A211] hover:bg-[#008d0f]"
            >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
            </Button>
        
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the post
                        from the database.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>

      <Form {...form}>
        <form id="blog-post-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter post title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                             <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-sm text-muted-foreground whitespace-nowrap">
                                /blog/
                             </span>
                             <Input placeholder="post-url-slug" {...field} className="rounded-l-none" readOnly disabled title="Slug cannot be changed after creation easily" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Slug is currently locked for editing to preserve SEO.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content (Markdown supported)</FormLabel>
                        <FormControl>
                          <MarkdownEditor 
                            value={field.value}
                            onChange={field.onChange}
                            onImageUpload={handleImageUpload}
                            placeholder="Write your article content here..." 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
               <Card>
                <CardHeader>
                  <CardTitle>SEO &amp; Meta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Short summary for preview cards and SEO..." 
                            className="h-24 resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                            Appears on the blog listing page.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
               </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publishing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Publish
                          </FormLabel>
                          <FormDescription>
                            Make this post visible to the public.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cover Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image Upload Area */}
                  {coverImagePreview ? (
                    <div className="relative group rounded-lg overflow-hidden border">
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Replace
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeCoverImage}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Uploading image...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Click to upload or drag & drop</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              JPEG, PNG, WebP or GIF (max 5MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverImageUpload(file);
                    }}
                  />

                  {/* Hidden form field for the URL */}
                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input type="hidden" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (comma separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="Reviews, News, SUV" {...field} />
                        </FormControl>
                        <FormDescription>
                          Add tags to categorize your post.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
