"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import {
  Sparkles,
  Camera,
  CheckCircle2,
  Loader2,
  Globe,
  Facebook,
  Instagram,
  Newspaper,
  ArrowRight,
  Zap,
  Layers,
  UploadCloud,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Wand2,
  Eye,
  Car,
} from "lucide-react";
import Link from "next/link";

export default function QuickPublishOmnichannelPage() {
  const startIntake = useMutation(api.omnichannel.startVehicleIntake);
  const enrichExistingCar = useMutation((api as any).omnichannel.enrichExistingCar);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.files.resolveStorageUrl);

  const allCars = useQuery(api.cars.list, {});
  const recentJobs = useQuery(api.omnichannel.listRecentJobs, { limit: 10 });

  // Default to Car #5 (2018 BMW X2 sDrive20i M Sport - 28 real multi-angle photos)
  const [activeCarId, setActiveCarId] = useState<number | null>(5);
  const [vin, setVin] = useState("GFMS9TWDVN3KRPVAV");
  const [price, setPrice] = useState("299900");
  const [mileage, setMileage] = useState("106908");
  const [manualMake, setManualMake] = useState("BMW");
  const [manualModel, setManualModel] = useState("X2 sDrive20i M Sport (Sports-Auto)");
  const [manualYear, setManualYear] = useState("2018");

  // Uploaded real multi-angle photo URLs for new intake
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "website",
    "facebook",
    "instagram",
    "classifieds",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);
  const [activeCopyTab, setActiveCopyTab] = useState<"website" | "facebook" | "instagram" | "classifieds">("facebook");

  // Real-time reactive subscription to active vehicle job status
  const activeJobData = useQuery(
    api.omnichannel.getJobStatus,
    activeCarId ? { carId: activeCarId } : "skip"
  );

  // Load any real car from Convex into the form + live inspector
  const handleSelectRealCar = (car: any) => {
    setActiveCarId(car.id);
    setVin(car.vin || "");
    setPrice(String(car.price || ""));
    setMileage(String(car.mileage || ""));
    setManualMake(car.make || "");
    setManualModel(car.model || "");
    setManualYear(String(car.year || ""));
    const validPhotos = (car.processedPhotoUrls?.length ? car.processedPhotoUrls : car.photoUrls || []).filter(
      (u: string) => typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"))
    );
    setUploadedPhotoUrls(validPhotos);
  };

  // Run or Re-run AI Enrichment + 3D Multi-Angle Reconstruction on an existing real car
  const handleEnrichRealCar = async (carId: number) => {
    setIsSubmitting(true);
    setActiveCarId(carId);
    try {
      await enrichExistingCar({
        carId,
        channels: selectedChannels,
      });
    } catch (err) {
      console.error("Enrich existing car failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhotos(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "image/jpeg" },
          body: file,
        });
        const { storageId } = await result.json();
        const publicUrl = await resolveStorageUrl({ storageId });
        if (publicUrl) newUrls.push(publicUrl);
      }
      if (newUrls.length > 0) {
        setUploadedPhotoUrls((prev) => [...prev, ...newUrls]);
      }
    } catch (err) {
      console.error("Failed uploading multi-angle photos to Convex storage:", err);
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const handleCreateNewIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vin.trim()) return;
    setIsSubmitting(true);
    try {
      const currentCarPhotos =
        uploadedPhotoUrls.length > 0
          ? uploadedPhotoUrls
          : activeJobData?.car?.photoUrls?.filter((u: string) => u.startsWith("http")) || [];

      const res = await startIntake({
        vin: vin.trim().toUpperCase(),
        dealershipId: 1,
        price: Number(price) || 219900,
        mileage: Number(mileage) || 61014,
        make: manualMake.trim() || undefined,
        model: manualModel.trim() || undefined,
        year: manualYear ? Number(manualYear) : undefined,
        photoUrls: currentCarPhotos,
        channels: selectedChannels,
      });
      setActiveCarId(res.carId);
    } catch (err) {
      console.error("Intake launch failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyText = (text: string, channel: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChannel(channel);
    setTimeout(() => setCopiedChannel(null), 2000);
  };

  const currentCar = activeJobData?.car;
  const currentJob = activeJobData?.job;
  const currentPhotos: string[] = (
    currentCar?.processedPhotoUrls?.length
      ? currentCar.processedPhotoUrls
      : currentCar?.photoUrls || []
  ).filter((u: string) => typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://")));

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-950 text-white min-h-screen">
        {/* Top Navigation Header */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/85 backdrop-blur-xl px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-gray-400 hover:text-white" />
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  Omnichannel Auto-Publisher
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Real Convex Inventory
                  </span>
                </h1>
                <p className="text-xs text-gray-400">
                  Multi-Angle Photo Intake • Vision AI Spec Enrichment • Instant Multi-Channel Broadcast
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/cars/${activeCarId || 3}`}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Listing (Car #{activeCarId || 3})
            </Link>
            <Link
              href="/admin/cars"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 transition"
            >
              All Inventory
            </Link>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Real Example Vehicle Selector Bar */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Real Cars in Convex Database — Select One as Live Example:
                </span>
              </div>
              <span className="text-[11px] text-gray-400">
                Using real multi-angle vehicle images stored in Convex (no fake demo videos/placeholders)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(allCars || []).map((c: any) => {
                const isSelected = activeCarId === c.id;
                const thumb = (c.processedPhotoUrls?.[0] || c.photoUrls?.[0] || "");
                const hasHttpThumb = typeof thumb === "string" && thumb.startsWith("http");
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectRealCar(c)}
                    className={`cursor-pointer rounded-xl p-3 border transition flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-400/50"
                        : "bg-slate-900/80 border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {hasHttpThumb ? (
                        <img
                          src={thumb}
                          alt={`${c.year} ${c.make} ${c.model}`}
                          className="w-14 h-11 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                          <Camera className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          #{c.id} • {c.year} {c.make} {c.model}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-semibold">
                          R {(c.price || 0).toLocaleString()} • {(c.mileage || 0).toLocaleString()} km
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {c.photoUrls?.length || 0} Real Multi-Angle Photos
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRealCar(c);
                          handleEnrichRealCar(c.id);
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] flex items-center justify-center gap-1 transition"
                      >
                        <Sparkles className="w-3 h-3" /> Enrich &amp; Publish
                      </button>
                      <Link
                        href={`/cars/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3 h-3 text-emerald-400" /> View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main 12-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Real Car Intake / Re-Enrichment Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      1. Multi-Angle Image Intake
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5">
                      Vehicle Details &amp; Multi-Angle Photos
                    </h2>
                  </div>
                  {activeCarId && (
                    <button
                      type="button"
                      onClick={() => handleEnrichRealCar(activeCarId)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      Re-Run on Car #{activeCarId}
                    </button>
                  )}
                </div>

                <form onSubmit={handleCreateNewIntake} className="space-y-4">
                  {/* VIN Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">
                      17-Character VIN / Stock Identifier
                    </label>
                    <input
                      type="text"
                      value={vin}
                      onChange={(e) => setVin(e.target.value.toUpperCase())}
                      placeholder="e.g. AHC3PLMXLW5W2WTDP"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  {/* Price & Mileage Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1.5">
                        Retail Price (ZAR)
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1.5">
                        Odometer (km)
                      </label>
                      <input
                        type="number"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Make / Model / Year */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Make</label>
                      <input
                        type="text"
                        value={manualMake}
                        onChange={(e) => setManualMake(e.target.value)}
                        placeholder="Hyundai"
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Model</label>
                      <input
                        type="text"
                        value={manualModel}
                        onChange={(e) => setManualModel(e.target.value)}
                        placeholder="i20 1.4 Motion"
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">Year</label>
                      <input
                        type="number"
                        value={manualYear}
                        onChange={(e) => setManualYear(e.target.value)}
                        placeholder="2022"
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Multi-Angle Image Uploader to Convex Storage */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        Multi-Angle Vehicle Photos
                      </label>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition">
                        {isUploadingPhotos ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3 h-3" />
                            Add Photos to Convex
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={isUploadingPhotos}
                        />
                      </label>
                    </div>

                    {/* Preview of Loaded Real Multi-Angle Images */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                        <span>
                          {currentPhotos.length || uploadedPhotoUrls.length} Real Multi-Angle Photos Active
                        </span>
                        <span className="text-emerald-400 font-medium">
                          Stored in Convex Cloud Storage
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 max-h-28 overflow-y-auto">
                        {(currentPhotos.length > 0 ? currentPhotos : uploadedPhotoUrls)
                          .slice(0, 15)
                          .map((url, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-[4/3] rounded-lg overflow-hidden border border-white/10"
                            >
                              <img
                                src={url}
                                alt={`Angle ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0 right-0 bg-black/75 text-[9px] font-mono px-1 text-emerald-300">
                                #{idx + 1}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Omnichannel Target Toggle */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">
                      Target Distribution Channels
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "website", label: "Dealership Website", icon: Globe },
                        { id: "facebook", label: "Facebook Marketplace", icon: Facebook },
                        { id: "instagram", label: "Instagram Carousel", icon: Instagram },
                        { id: "classifieds", label: "AutoTrader / Cars.co.za", icon: Newspaper },
                      ].map((ch) => {
                        const Icon = ch.icon;
                        const active = selectedChannels.includes(ch.id);
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => toggleChannel(ch.id)}
                            className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-medium ${
                              active
                                ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                                : "bg-black/30 border-white/10 text-gray-400 hover:text-white"
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{ch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {activeCarId && (
                      <button
                        type="button"
                        onClick={() => handleEnrichRealCar(activeCarId)}
                        disabled={isSubmitting}
                        className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        Enrich Car #{activeCarId} Now
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <UploadCloud className="w-4 h-4 text-emerald-400" />
                      Upload as New Car Listing
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT COLUMN: Live Example Car Output, Multi-Angle Gallery Preview & AI Ad Copies (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Live Pipeline & Vehicle Output Card */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-6 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      2. Real Vehicle Enrichment &amp; Multi-Channel Output
                    </span>
                    <h2 className="text-xl font-bold text-white mt-0.5">
                      {currentCar
                        ? `#${currentCar.id} — ${currentCar.year} ${currentCar.make} ${currentCar.model} ${currentCar.trimLevel || ""}`
                        : "Loading Real Vehicle..."}
                    </h2>
                  </div>

                  {currentCar && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/cars/${currentCar.id}`}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Live Listing
                      </Link>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Status: {currentJob?.currentStep || currentCar?.publishingStatus || "PUBLISHED"}
                    </span>
                    <span className="font-mono text-white font-bold">
                      {currentJob?.progressPercent ?? 100}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 transition-all duration-500"
                      style={{ width: `${currentJob?.progressPercent ?? 100}%` }}
                    />
                  </div>
                </div>

                {/* Real Multi-Angle Photo Grid Preview */}
                {currentPhotos.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        Vehicle Gallery Photos ({currentPhotos.length} Photos in Convex)
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {currentPhotos.slice(0, 12).map((url, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 hover:border-emerald-400 transition"
                        >
                          <img
                            src={url}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-emerald-300">
                            #{idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spec Summary Pills */}
                {currentCar && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase text-gray-400 block">Price</span>
                      <span className="text-sm font-bold text-emerald-400">
                        R {(currentCar.price || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase text-gray-400 block">Mileage</span>
                      <span className="text-sm font-bold text-white">
                        {(currentCar.mileage || 0).toLocaleString()} km
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase text-gray-400 block">Powertrain</span>
                      <span className="text-xs font-bold text-white">
                        {currentCar.engine} • {currentCar.transmission}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-[10px] uppercase text-gray-400 block">Public Listing</span>
                      <Link
                        href={`/cars/${currentCar.id}`}
                        className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        /cars/{currentCar.id} <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Channel-Specific AI Ad Copy Tabs */}
                {currentCar?.adCopy && (
                  <div className="rounded-xl bg-black/50 border border-white/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        AI Generated Multi-Channel Ad Copy
                      </span>
                      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
                        {(["facebook", "instagram", "website", "classifieds"] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveCopyTab(tab)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition ${
                              activeCopyTab === tab
                                ? "bg-emerald-500 text-black"
                                : "text-gray-400 hover:text-white"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-gray-200 leading-relaxed font-sans">
                      <p className="pr-8">{currentCar.adCopy[activeCopyTab]}</p>
                      <button
                        onClick={() =>
                          handleCopyText(currentCar.adCopy[activeCopyTab], activeCopyTab)
                        }
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                        title="Copy Ad Copy"
                      >
                        {copiedChannel === activeCopyTab ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Enrichment Step Audit Log */}
                {currentCar?.enrichmentLog && currentCar.enrichmentLog.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
                      Convex Pipeline Telemetry Log
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {currentCar.enrichmentLog.map((log: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2.5 text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-mono text-[10px] text-emerald-400 font-semibold mr-2">
                              [{log.step}]
                            </span>
                            <span className="text-gray-300">{log.details}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
