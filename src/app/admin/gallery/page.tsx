"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Plus,
  Trash2,
  Loader2,
  ImageIcon,
  Upload,
  X,
  RefreshCw,
  ExternalLink,
  Search,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  _id?: string;
  id: number | string;
  url: string;
  title: string | null;
  category: string | null;
  createdAt?: string;
}

const CATEGORIES = [
  { value: "showroom", label: "Showroom & Lot", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { value: "inventory", label: "Vehicle Inventory", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { value: "commercial", label: "Commercial & Bakkies", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { value: "deliveries", label: "Customer Deliveries", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { value: "branding", label: "Dealership & Facilities", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  { value: "2025", label: "2025 Highlights", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  { value: "other", label: "Other", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
];

export default function AdminGalleryPage() {
  // 100% Real-time Convex Queries & Mutations
  const convexGalleryItems = useQuery(api.gallery.list, {});
  const createGalleryItem = useMutation(api.gallery.create);
  const removeGalleryItem = useMutation(api.gallery.remove);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.files.resolveStorageUrl);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("showroom");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // Lightbox & Delete State
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  // Fallback local items if convex query is loading
  const items: GalleryItem[] = (convexGalleryItems || []) as GalleryItem[];
  const loading = convexGalleryItems === undefined;

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previewUrls]);

  const handleFilesSelected = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file.`);
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 15MB limit.`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setPreviewUrls((prev) => [...prev, ...newPreviews]);

      if (!uploadTitle && validFiles.length === 1) {
        const cleanName = validFiles[0].name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ");
        setUploadTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeSelectedFile = (index: number) => {
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) {
      setUploadTitle("");
    }
  };

  const resetUploadForm = () => {
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setUploadTitle("");
    setUploadCategory("showroom");
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload directly to Convex Storage & Convex DB
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image to upload.");
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadProgress({ current: i + 1, total: selectedFiles.length });

      const fileTitle =
        selectedFiles.length === 1 && uploadTitle
          ? uploadTitle
          : uploadTitle
          ? `${uploadTitle} (${i + 1})`
          : file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      try {
        // 1. Generate upload URL from Convex
        const postUrl = await generateUploadUrl();

        // 2. Upload file bytes directly to Convex CDN storage
        const uploadRes = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "image/jpeg" },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Convex upload failed with HTTP ${uploadRes.status}`);
        }

        const { storageId } = await uploadRes.json();

        // 3. Resolve public Convex CDN URL
        let publicUrl = await resolveStorageUrl({ storageId });
        if (!publicUrl) {
          const convexUrl =
            process.env.NEXT_PUBLIC_CONVEX_URL || "https://reliable-sturgeon-574.convex.cloud";
          publicUrl = `${convexUrl}/api/storage/${storageId}`;
        }

        // 4. Save to Convex DB gallery table
        await createGalleryItem({
          url: publicUrl,
          title: fileTitle.charAt(0).toUpperCase() + fileTitle.slice(1),
          category: uploadCategory,
        });

        successCount++;
      } catch (err) {
        console.error("Convex upload error for file:", file.name, err);
        // Fallback to server endpoint if direct client upload hit an error
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("title", fileTitle);
          formData.append("category", uploadCategory);

          const fallbackRes = await fetch("/api/gallery", {
            method: "POST",
            body: formData,
          });

          if (fallbackRes.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }
    }

    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? "Image added to Convex gallery successfully!"
          : `${successCount} images added to Convex gallery successfully!`
      );
      resetUploadForm();
    }

    if (failCount > 0) {
      toast.error(`Failed to upload ${failCount} image(s).`);
    }

    setUploading(false);
    setUploadProgress(null);
  };

  // Delete directly in Convex DB
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setIsDeleting(true);

    try {
      const deleteId = typeof target.id === "number" ? target.id : (target._id || target.id);
      const res = await removeGalleryItem({ id: deleteId });

      if (res) {
        toast.success(`"${target.title || "Image"}" deleted from Convex gallery`);
      } else {
        // Fallback call to DELETE API
        await fetch(`/api/gallery/${encodeURIComponent(String(target.id))}`, {
          method: "DELETE",
        });
        toast.success("Image deleted");
      }
    } catch (err) {
      console.error("Convex delete error:", err);
      try {
        await fetch(`/api/gallery/${encodeURIComponent(String(target.id))}`, {
          method: "DELETE",
        });
        toast.success("Image deleted");
      } catch {
        toast.error("Error occurred while deleting image.");
      }
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Filtered Items from Convex
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategoryFilter === "all" ||
      (item.category || "showroom").toLowerCase() === selectedCategoryFilter.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl w-full min-w-0 mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">Gallery Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
              Convex Cloud: {items.length} Photos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time Convex gallery engine. Upload, organize, and delete photos displayed across AutoFame.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/gallery"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Public Gallery
          </Link>
        </div>
      </div>

      {/* ── SECTION 1: ADD NEW IMAGES SECTION (Directly on Dashboard via Convex) ── */}
      <Card className="border-emerald-500/20 shadow-md bg-gradient-to-br from-card via-card to-emerald-500/[0.03] overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">Add Images to Gallery</CardTitle>
                <CardDescription className="text-xs">
                  Upload showroom, vehicle inventory, or customer delivery photos directly to Convex Storage.
                </CardDescription>
              </div>
            </div>
            {selectedFiles.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetUploadForm}
                disabled={uploading}
                className="self-end sm:self-auto text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                Clear Selection
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-1">
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center px-4",
                isDragOver
                  ? "border-emerald-500 bg-emerald-500/5 scale-[0.99]"
                  : "border-border hover:border-emerald-500/50 hover:bg-muted/40",
                selectedFiles.length > 0 ? "py-3 sm:py-4 bg-muted/20" : "py-5 sm:py-7"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                disabled={uploading}
              />

              <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                Click to browse or drag &amp; drop images here
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 max-w-sm">
                Supports JPG, PNG, WebP up to 15MB • Uploads directly to Convex CDN
              </p>
            </div>

            {/* Selected Previews Grid */}
            {previewUrls.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>
                    Selected {selectedFiles.length} {selectedFiles.length === 1 ? "image" : "images"}
                  </span>
                  <span className="text-[11px]">Click ✕ to remove</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-40 overflow-y-auto p-2 bg-muted/30 rounded-xl border">
                  {previewUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-lg overflow-hidden border bg-background shadow-sm"
                    >
                      <Image
                        src={url}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelectedFile(idx);
                        }}
                        disabled={uploading}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center transition shadow z-10"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/75 text-[9px] text-white px-1 rounded truncate max-w-[85%]">
                        {selectedFiles[idx]?.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Image Title / Caption <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder={
                    selectedFiles.length > 1
                      ? "e.g. Saturday Showroom Lineup"
                      : "e.g. 2024 Toyota Hilux Double Cab"
                  }
                  disabled={uploading}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Gallery Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  disabled={uploading}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button & Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="text-xs text-muted-foreground order-2 sm:order-1">
                {uploadProgress ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    Uploading image {uploadProgress.current} of {uploadProgress.total} to Convex...
                  </span>
                ) : (
                  <span className="text-[11px] sm:text-xs">Photos are published immediately upon upload.</span>
                )}
              </div>

              <Button
                type="submit"
                disabled={uploading || selectedFiles.length === 0}
                className="w-full sm:w-auto px-5 h-9 font-semibold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md text-xs sm:text-sm order-1 sm:order-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    Uploading ({uploadProgress?.current}/{uploadProgress?.total})...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 shrink-0" />
                    Upload {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ""}to Convex Gallery
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── SECTION 2: CONVEX GALLERY BROWSER & DELETE MANAGEMENT ── */}
      <div className="space-y-4">
        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-xl border">
          {/* Category Filter Pills (Wrapping, No Scroll) */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setSelectedCategoryFilter("all")}
              className={cn(
                "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition",
                selectedCategoryFilter === "all"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              All Photos ({items.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = items.filter(
                (i) => (i.category || "showroom").toLowerCase() === cat.value.toLowerCase()
              ).length;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategoryFilter(cat.value)}
                  className={cn(
                    "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition",
                    selectedCategoryFilter === cat.value
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title..."
              className="w-full pl-9 pr-7 py-1.5 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-card rounded-2xl border">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
            <p className="text-xs text-muted-foreground">Loading Convex gallery...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-muted/20 rounded-2xl border border-dashed text-center px-4">
            <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground mb-2.5">
              <ImageIcon className="h-6 w-6 opacity-75" />
            </div>
            <h3 className="font-semibold text-sm">No images found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {searchQuery || selectedCategoryFilter !== "all"
                ? "No photos match your current search or category filter. Try clearing filters."
                : "There are no images in your gallery yet. Use the upload section above to add your first photo."}
            </p>
            {(searchQuery || selectedCategoryFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategoryFilter("all");
                }}
                className="mt-3 text-xs h-8"
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredItems.map((item) => {
              const catConfig = CATEGORIES.find(
                (c) => c.value === (item.category || "showroom").toLowerCase()
              ) || CATEGORIES[0];

              return (
                <div
                  key={String(item._id || item.id || item.url)}
                  className="group relative rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
                >
                  {/* Image Display */}
                  <div
                    onClick={() => setLightboxItem(item)}
                    className="relative aspect-square w-full bg-muted/40 cursor-pointer overflow-hidden"
                  >
                    <Image
                      src={item.url}
                      alt={item.title || "Gallery Item"}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Quick View Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition">
                        <Eye className="h-4 w-4" />
                      </span>
                    </div>

                    {/* Category Badge */}
                    <span
                      className={cn(
                        "absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold border backdrop-blur-md",
                        catConfig.color
                      )}
                    >
                      {catConfig.label}
                    </span>

                    {/* Delete Button on Hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(item);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 hover:bg-red-600 text-white transition-colors shadow-sm opacity-90 group-hover:opacity-100"
                      title="Delete Image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Card Footer Info */}
                  <div className="p-2.5 flex items-center justify-between gap-2 border-t bg-card">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-foreground" title={item.title || "Image"}>
                        {item.title || "Showroom Image"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.url.split("/").pop()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="text-muted-foreground hover:text-red-500 p-1 rounded transition"
                      title="Delete from Convex gallery"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── LIGHTBOX PREVIEW MODAL ── */}
      {lightboxItem && (
        <div
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] bg-card rounded-2xl overflow-hidden border shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-3.5 border-b bg-card">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {lightboxItem.title || "Gallery Preview"}
                </h3>
                <span className="text-[11px] text-muted-foreground capitalize">
                  Category: {lightboxItem.category || "showroom"}
                </span>
              </div>
              <button
                onClick={() => setLightboxItem(null)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative flex-1 min-h-[400px] max-h-[70vh] w-full bg-black flex items-center justify-center p-2">
              <img
                src={lightboxItem.url}
                alt={lightboxItem.title || "Gallery Preview"}
                className="max-h-[68vh] max-w-full object-contain"
              />
            </div>

            <div className="p-3 border-t bg-muted/30 flex items-center justify-between">
              <a
                href={lightboxItem.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                <ExternalLink className="h-3 w-3" />
                Open Original Image URL
              </a>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleteTarget(lightboxItem);
                  setLightboxItem(null);
                }}
                className="flex items-center gap-1.5 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Image
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle className="text-base font-bold">Delete Gallery Image?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This action cannot be undone. This image will be permanently removed from Convex.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteTarget && (
            <div className="my-2 p-2.5 rounded-xl border bg-muted/40 flex items-center gap-3">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden border bg-background shrink-0">
                <Image
                  src={deleteTarget.url}
                  alt={deleteTarget.title || "Preview"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {deleteTarget.title || "Untitled Image"}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                  Category: {deleteTarget.category || "showroom"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {deleteTarget.url}
                </p>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="text-xs font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete from Convex"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
