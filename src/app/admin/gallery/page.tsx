"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Trash2, Loader2, ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { configureAdminAuth, fetchAuthSession } from "../adminAuth";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GalleryItem {
  id: number;
  url: string;
  title: string | null;
  category: string | null;
  createdAt: string;
}

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("2025");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        toast.error("Failed to fetch gallery items");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while fetching gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (!title) setTitle(file.name);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", title);
    formData.append("category", category);

    try {
      configureAdminAuth();
      const session = await fetchAuthSession({ forceRefresh: true });
      const token = session.tokens?.idToken?.toString();

      const res = await fetch("/api/gallery", {
        method: "POST",
        body: formData,
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (res.ok) {
        const newItem = await res.json();
        setItems([newItem, ...items]);
        toast.success("Image uploaded successfully");
        resetForm();
        setIsModalOpen(false);
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to upload");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      configureAdminAuth();
      const session = await fetchAuthSession({ forceRefresh: true });
      const token = session.tokens?.idToken?.toString();

      const res = await fetch(`/api/gallery/${deleteId}`, {
        method: "DELETE",
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (res.ok) {
        setItems(items.filter((item) => item.id !== deleteId));
        toast.success("Image deleted");
      } else {
        toast.error("Failed to delete image");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setUploadFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setTitle("");
    setCategory("2025");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gallery Management</h1>
          <p className="text-muted-foreground mt-1">Upload and manage your website gallery images.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Image
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium">No images in your gallery yet.</p>
          <Button variant="outline" onClick={() => setIsModalOpen(true)} className="mt-4">
            Upload your first image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border bg-background shadow-sm">
              <Image
                src={item.url}
                alt={item.title || "Gallery Item"}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-end">
                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-white text-xs truncate font-medium">
                  {item.title || "Image"}
                  <div className="opacity-70 font-normal">{item.category}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Upload Image</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-1 hover:bg-muted rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div 
                className={cn(
                  "relative aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-colors",
                  previewUrl ? "border-solid border-primary/20" : "hover:border-primary/40"
                )}
              >
                {previewUrl ? (
                  <>
                    <Image src={previewUrl} alt="Preview" fill className="object-contain bg-muted/50" />
                    <button 
                      onClick={() => resetForm()} 
                      className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">Click to select or drag and drop</span>
                    <span className="text-xs text-muted-foreground mt-1">Support JPEG, PNG, WebP (Max 5MB)</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Image title"
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="2025">2025</option>
                  <option value="showroom">Showroom</option>
                  <option value="branding">Branding</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t bg-muted/30">
              <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !uploadFile} className="flex-1">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the image from your gallery and storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
