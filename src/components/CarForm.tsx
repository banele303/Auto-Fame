"use client";

import { useState, useRef } from "react";
import { concurrentUpload } from "@/lib/concurrentUploads";
import { batchCompress } from "@/lib/imageCompression";
import { CAR_UPLOAD_SINGLE_MAX_MB, CAR_UPLOAD_TOTAL_MAX_MB, CAR_UPLOAD_MAX_FILES } from "@/config/uploadLimits";
import { toast } from "sonner";
import { Car } from "@/types/prismaTypes"; 
import { normalizeFuelType } from '@/lib/constants';
import Image from "next/image";
import { useCreateCarMutation } from "@/state/api";
import { useRouter } from "next/navigation";

interface CarFormProps {
  initialData?: Car;
}

export const CarForm = ({ initialData }: CarFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    initialData?.photoUrls || []
  );
  const [createCar, { isLoading: isSubmitting }] = useCreateCarMutation();
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<{done:number,total:number,name:string}|null>(null);
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState<{total:number;completed:number;success:number;failed:number;inFlight:number;currentFile?:string}|null>(null);
  const [uploading, setUploading] = useState(false);

  const MAX_SINGLE_MB = CAR_UPLOAD_SINGLE_MAX_MB;
  const MAX_TOTAL_MB = CAR_UPLOAD_TOTAL_MAX_MB;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Reset the input so the same files can be re-selected if needed
    e.target.value = '';

    // Validate count: existing selected + new must not exceed limit
    if (selectedFiles.length + files.length > CAR_UPLOAD_MAX_FILES) {
      const remaining = CAR_UPLOAD_MAX_FILES - selectedFiles.length;
      toast.error(`You can only add ${remaining} more photo(s). Maximum is ${CAR_UPLOAD_MAX_FILES}.`);
      return;
    }

    // Pre-validate individual file sizes before compression
    const oversized = files.filter(f => f.size / (1024 * 1024) > 50); // reject files > 50MB raw (too big even for compression)
    if (oversized.length > 0) {
      toast.error(`${oversized.length} file(s) are too large (>50MB). Please use smaller images.`);
      return;
    }

    // Compress images client-side (WebP output, batched to prevent OOM)
    setIsCompressing(true);
    setCompressionProgress({ done: 0, total: files.length, name: '' });
    
    try {
      const compressed = await batchCompress(
        files,
        (done, total, name) => {
          setCompressionProgress({ done, total, name });
        },
        { maxWidth: 1920, maxHeight: 1920, quality: 0.80 },
        3 // compress 3 at a time to avoid memory issues
      );

      // Post-compression size validation
      for (const f of compressed) {
        const mb = f.size / (1024 * 1024);
        if (mb > MAX_SINGLE_MB) {
          toast.error(`File ${f.name} is still ${mb.toFixed(1)}MB after compression (limit: ${MAX_SINGLE_MB}MB). Try a smaller image.`);
          setIsCompressing(false);
          setCompressionProgress(null);
          return;
        }
      }

      // Check total size (existing + new)
      const existingBytes = selectedFiles.reduce((a, f) => a + f.size, 0);
      const newBytes = compressed.reduce((a, f) => a + f.size, 0);
      const totalMB = (existingBytes + newBytes) / (1024 * 1024);
      if (MAX_TOTAL_MB > 0 && totalMB > MAX_TOTAL_MB) {
        toast.error(`Total size ${totalMB.toFixed(1)}MB exceeds ${MAX_TOTAL_MB}MB limit. Remove some images first.`);
        setIsCompressing(false);
        setCompressionProgress(null);
        return;
      }

      // FIXED: Append to existing files instead of replacing
      setSelectedFiles(prev => [...prev, ...compressed]);
      const newPreviewUrls = compressed.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

      // Show compression summary
      const originalMB = files.reduce((a, f) => a + f.size, 0) / (1024 * 1024);
      const compressedMB = compressed.reduce((a, f) => a + f.size, 0) / (1024 * 1024);
      const savings = originalMB > 0 ? ((1 - compressedMB / originalMB) * 100).toFixed(0) : '0';
      toast.success(`${compressed.length} photo(s) compressed: ${originalMB.toFixed(1)}MB → ${compressedMB.toFixed(1)}MB (${savings}% saved)`);
    } catch (err) {
      console.error('Compression error:', err);
      toast.error('Failed to compress images. Please try again with fewer or smaller images.');
    } finally {
      setIsCompressing(false);
      setCompressionProgress(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    // Split: send metadata first (no photos) to avoid large multipart 413
    const allInputs = new FormData(formRef.current);
    const metadata = new FormData();
    for (const [k,v] of allInputs.entries()) {
      if (k === 'photos') continue;
      metadata.append(k,v);
    }
    toast.loading('Creating car...');
    let createdCar: any = null;
    try {
      createdCar = await createCar(metadata).unwrap();
    } catch (err:any) {
      toast.dismiss();
      toast.error(err?.data?.message || 'Failed to create car.');
      console.error('Create car error:', err);
      return;
    }
    toast.dismiss();
    if (!selectedFiles.length) {
      toast.success('Car created successfully!');
      router.push('/admin/cars');
      return;
    }
    // Concurrent photo uploads with retry + timeout
    setUploading(true);
    toast.loading(`Uploading ${selectedFiles.length} photos...`);
    const results = await concurrentUpload(selectedFiles, async (file, signal) => {
      const fd = new FormData();
      fd.append('photo', file);
      return await fetch(`/api/cars/${createdCar.id}/photos`, { method: 'POST', body: fd, signal });
    }, {
      concurrency: 2,       // 2 parallel uploads for reliability
      retries: 3,           // 3 retries per file
      baseDelayMs: 500,
      timeoutMs: 60_000,    // 60s per file timeout
      onProgress: (p) => {
        setUploadProgress(p);
        toast.loading(`Uploading ${p.completed}/${p.total} photos`, {
          description: `${p.success} succeeded • ${p.failed} failed${p.currentFile ? ` • ${p.currentFile}` : ''}`
        });
      }
    });
    toast.dismiss();
    setUploading(false);
    setUploadProgress(null);
    const success = results.filter(r=>r.success).length;
    const failed = results.length - success;
    if (failed === 0) toast.success(`Car created with all ${success} photos uploaded!`);
    else if (success === 0) toast.error('All photo uploads failed. Edit the car later to retry.');
    else toast.warning(`${success} photos uploaded, ${failed} failed. You can retry in edit page.` as any);
    router.push('/admin/cars');
  };

  // FIXED: removeImage now removes from both previewUrls AND selectedFiles
  const removeImage = (index: number) => {
    // Determine if this is an existing URL or a newly selected file
    const existingCount = initialData?.photoUrls?.length || 0;
    
    // Revoke object URL to free memory (blob URLs only)
    const url = previewUrls[index];
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }

    // Remove from previews
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    
    // If it's a newly added file (index >= existing count), remove from selectedFiles too
    if (index >= existingCount) {
      const fileIndex = index - existingCount;
      setSelectedFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
  };

  // Calculate current stats for the info banner
  const totalFiles = selectedFiles.length;
  const totalSizeMB = selectedFiles.reduce((a, f) => a + f.size, 0) / (1024 * 1024);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Car Information</h3>

          {/* VIN removed: now auto-generated on backend */}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Make
            </label>
            <input
              type="text"
              name="make"
              defaultValue={initialData?.make}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Model
            </label>
            <input
              type="text"
              name="model"
              defaultValue={initialData?.model}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Year
            </label>
            <input
              type="number"
              name="year"
              defaultValue={initialData?.year}
              min="1900"
              max={new Date().getFullYear() + 1}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <input
              type="number"
              name="price"
              defaultValue={initialData?.price}
              min="0"
              step="0.01"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mileage (km)
            </label>
            <input
              type="number"
              name="mileage"
              defaultValue={initialData?.mileage}
              min="0"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Condition
            </label>
            <select
              name="condition"
              defaultValue={initialData?.condition}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="NEW">New</option>
              <option value="USED">Used</option>
              <option value="CERTIFIED_PRE_OWNED">Certified Pre-Owned</option>
              <option value="DEALER_DEMO">Dealer Demo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Car Type
            </label>
            <select
              name="carType"
              defaultValue={initialData?.carType}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="HATCHBACK">Hatchback</option>
              <option value="COUPE">Coupe</option>
              <option value="CONVERTIBLE">Convertible</option>
              <option value="WAGON">Wagon</option>
              <option value="PICKUP_TRUCK">Pickup Truck</option>
              <option value="VAN">Van</option>
              <option value="MINIVAN">Minivan</option>
              <option value="CROSSOVER">Crossover</option>
              <option value="SPORTS_CAR">Sports Car</option>
              <option value="LUXURY">Luxury</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ELECTRIC">Electric</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Petrol
            </label>
            <select
              name="fuelType"
              defaultValue={normalizeFuelType(initialData?.fuelType as any) || initialData?.fuelType || 'PETROL'}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ELECTRIC">Electric</option>
              <option value="PLUG_IN_HYBRID">Plug-in Hybrid</option>
              <option value="HYDROGEN">Hydrogen</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Transmission
            </label>
            <select
              name="transmission"
              defaultValue={initialData?.transmission}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="MANUAL">Manual</option>
              <option value="AUTOMATIC">Automatic</option>
              <option value="CVT">CVT</option>
              <option value="DUAL_CLUTCH">Dual-Clutch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Engine
            </label>
            <input
              type="text"
              name="engine"
              defaultValue={initialData?.engine}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Exterior Color
            </label>
            <input
              type="text"
              name="exteriorColor"
              defaultValue={initialData?.exteriorColor}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {/* Interior Color removed per requirement */}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={initialData?.description}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Features (comma-separated)
            </label>
            <input
              type="text"
              name="features"
              defaultValue={initialData?.features?.join(", ")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Dealership ID
            </label>
            <input
              type="number"
              name="dealershipId"
              defaultValue={initialData?.dealershipId}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Employee ID (Optional)
            </label>
            <input
              type="text"
              name="employeeId"
              defaultValue={initialData?.employeeId || ""}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        
        <div className="col-span-2 space-y-4">
          <h3 className="text-lg font-semibold">Photos</h3>

          {/* Upload info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium">📸 Upload up to {CAR_UPLOAD_MAX_FILES} photos per car</p>
            <p className="text-xs mt-1 text-blue-600">
              Images are automatically compressed to WebP for fast uploads.
              {totalFiles > 0 && ` Currently: ${totalFiles} photo(s), ${totalSizeMB.toFixed(1)}MB total.`}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <div className="relative w-full h-32 rounded-lg overflow-hidden">
                  <Image
                    src={url}
                    alt={`Car photo ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                    unoptimized={
                      url.startsWith("blob:") || url.startsWith("data:")
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Add Photos ({previewUrls.length}/{CAR_UPLOAD_MAX_FILES})
            </label>
            <input
              type="file"
              name="photos"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={isCompressing || uploading}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {previewUrls.length >= CAR_UPLOAD_MAX_FILES && (
              <p className="text-xs text-amber-600 mt-1">Maximum {CAR_UPLOAD_MAX_FILES} images reached.</p>
            )}
          </div>
        </div>
      </div>

      {/* Compression progress */}
      {isCompressing && compressionProgress && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-indigo-700">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Compressing {compressionProgress.done}/{compressionProgress.total}: {compressionProgress.name}
          </div>
          <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
            <div
              className="h-full bg-indigo-400 transition-all"
              style={{ width: `${(compressionProgress.done / compressionProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isCompressing || uploading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isCompressing
            ? `Compressing ${compressionProgress?.done || 0}/${compressionProgress?.total || 0}`
            : isSubmitting
              ? "Saving..."
              : uploading && uploadProgress
                ? `Uploading ${uploadProgress.completed}/${uploadProgress.total}`
                : "Create Car"}
        </button>
      </div>
      {uploadProgress && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">
            {uploadProgress.success} uploaded • {uploadProgress.failed} failed • {uploadProgress.inFlight} in progress
          </p>
        </div>
      )}
    </form>
  );
};