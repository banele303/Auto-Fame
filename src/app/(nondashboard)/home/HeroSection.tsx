"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowRight,
  Gauge,
  ShieldCheck,
  Sparkles,
  Award,
} from "lucide-react";
import { useGetCarsQuery } from "@/state/api";
import { resolveCarImageUrl } from "@/utils/imageUrl";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// Fallback showcase cars when inventory query is loading or empty
const FALLBACK_SHOWCASE_CARS = [
  {
    id: "fb-1",
    make: "MERCEDES-BENZ",
    model: "C200 AMG Line",
    year: 2021,
    price: 489900,
    mileage: 45000,
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    photoUrls: ["/hero-bg.jpg"],
    featuredTag: "FEATURED HIGHLIGHT",
  },
  {
    id: "fb-2",
    make: "VOLKSWAGEN",
    model: "Golf 8 R 2.0 TSI",
    year: 2022,
    price: 649900,
    mileage: 28000,
    fuelType: "PETROL",
    transmission: "AUTOMATIC",
    photoUrls: ["/hero-bg.jpg"],
    featuredTag: "JUST ARRIVED",
  },
  {
    id: "fb-3",
    make: "TOYOTA",
    model: "Hilux 2.8 GD-6 Legend",
    year: 2020,
    price: 529900,
    mileage: 62000,
    fuelType: "DIESEL",
    transmission: "AUTOMATIC",
    photoUrls: ["/hero-bg.jpg"],
    featuredTag: "POPULAR CHOICE",
  },
];

export default function HeroSection() {
  const router = useRouter();
  const { data: carsData } = useGetCarsQuery({});

  const availableCars = useMemo(
    () => (carsData || []).filter((c: any) => c.status === "AVAILABLE"),
    [carsData]
  );

  const showcaseList = useMemo(() => {
    if (availableCars.length > 0) return availableCars.slice(0, 3);
    return FALLBACK_SHOWCASE_CARS;
  }, [availableCars]);

  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const currentCar = showcaseList[activeCarIndex] || showcaseList[0];

  const carMakes = useMemo(() => {
    if (!availableCars.length) {
      return ["TOYOTA", "VOLKSWAGEN", "FORD", "HYUNDAI", "MERCEDES-BENZ", "BMW", "NISSAN", "KIA", "AUDI", "HAVAL"];
    }
    return [...new Set(availableCars.map((c: any) => c.make))];
  }, [availableCars]);

  // Search state
  const [selectedMake, setSelectedMake] = useState<string>("any");
  const [selectedModel, setSelectedModel] = useState<string>("any");
  const [priceRange, setPriceRange] = useState<string>("any");

  const carModelsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const c of availableCars as any[]) {
      if (!c.make) continue;
      if (!map[c.make]) map[c.make] = [];
      if (!map[c.make].includes(c.model)) map[c.make].push(c.model);
    }
    return map;
  }, [availableCars]);

  const availableModelsForMake = useMemo(() => {
    if (selectedMake === "any" || !selectedMake) {
      return [...new Set((availableCars as any[]).map((c: any) => c.model))].filter(Boolean);
    }
    return carModelsMap[selectedMake] || [];
  }, [selectedMake, availableCars, carModelsMap]);

  const handleCarSearch = () => {
    const params = new URLSearchParams();
    if (selectedMake !== "any") params.set("make", selectedMake);
    if (selectedModel !== "any") params.set("model", selectedModel);
    if (priceRange !== "any") params.set("priceRange", priceRange);
    router.push(`/cars${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <section className="relative min-h-[92vh] bg-[#070A08] text-white overflow-hidden pt-24 sm:pt-28 md:pt-36 pb-12 flex flex-col justify-between">
      {/* Background Image with Dark Vignette Gradient */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.jpg"
          alt="Luxury vehicle background"
          fill
          priority
          className="object-cover object-center sm:object-[center_35%] opacity-65 sm:opacity-60 filter contrast-125 brightness-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070A08]/90 via-[#070A08]/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070A08] via-transparent to-[#070A08]/50" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        {/* Minimal Location & Status Pill */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md mb-6 max-w-full overflow-hidden"
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35D04A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00A211]"></span>
          </span>
          <span className="font-mono text-[11px] sm:text-xs text-white/80 tracking-wider uppercase truncate">
            Johannesburg South · 1 Rifle Range Rd, Baragwanath
          </span>
        </motion.div>

        {/* HERO MAIN CONTENT GRID */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* LEFT COLUMN: MINIMALIST HEADLINE & ACTIONS */}
          <div className="lg:col-span-7">
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="font-display font-extrabold tracking-tight text-3xl sm:text-5xl xl:text-6xl leading-[1.12]"
            >
              Drive The{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-white/60">
                Extraordinary
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A211] via-[#35D04A] to-[#00A211]/80 text-2xl sm:text-4xl xl:text-5xl font-semibold tracking-normal">
                For Quality Used Cars
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-4 sm:mt-6 max-w-xl text-white/70 text-sm sm:text-lg font-light leading-relaxed"
            >
              Hand-picked, roadworthy certified pre-owned vehicles with transparent pricing and instant bank financing in Johannesburg South.
            </motion.p>

            {/* RESPONSIVE MOBILE & DESKTOP SEARCH WIDGET */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-6 sm:mt-8 p-3.5 sm:p-4 rounded-2xl bg-white/[0.05] border border-white/15 backdrop-blur-xl max-w-2xl shadow-2xl"
            >
              <div className="space-y-3">
                {/* MAKE & MODEL ON THE EXACT SAME ROW ON MOBILE! */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Make Select */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1 pl-1">
                      Make
                    </label>
                    <Select
                      value={selectedMake}
                      onValueChange={(val) => {
                        setSelectedMake(val);
                        setSelectedModel("any");
                      }}
                    >
                      <SelectTrigger className="h-10 bg-white/[0.06] border-white/15 text-white text-xs rounded-xl focus:ring-[#00A211]">
                        <SelectValue placeholder="All Makes" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 text-white border-slate-800">
                        <SelectItem value="any">All Makes</SelectItem>
                        {carMakes.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Model Select */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1 pl-1">
                      Model
                    </label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-10 bg-white/[0.06] border-white/15 text-white text-xs rounded-xl focus:ring-[#00A211]">
                        <SelectValue placeholder="All Models" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 text-white border-slate-800">
                        <SelectItem value="any">All Models</SelectItem>
                        {availableModelsForMake.map((mod) => (
                          <SelectItem key={mod} value={mod}>
                            {mod}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* BUDGET & SEARCH BUTTON ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Price Range */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1 pl-1">
                      Budget
                    </label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger className="h-10 bg-white/[0.06] border-white/15 text-white text-xs rounded-xl focus:ring-[#00A211]">
                        <SelectValue placeholder="Any Price" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 text-white border-slate-800">
                        <SelectItem value="any">Any Price</SelectItem>
                        <SelectItem value="under-150k">Under R150,000</SelectItem>
                        <SelectItem value="150k-300k">R150,000 - R300,000</SelectItem>
                        <SelectItem value="300k-500k">R300,000 - R500,000</SelectItem>
                        <SelectItem value="over-500k">Over R500,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search Button */}
                  <div className="flex items-end">
                    <Button
                      onClick={handleCarSearch}
                      className="w-full h-10 rounded-xl bg-[#00A211] hover:bg-[#00870e] text-white text-xs font-bold shadow-lg shadow-[#00A211]/25 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Search className="h-4 w-4" />
                      Search Stock
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* QUICK HIGHLIGHT BADGES */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-6 sm:mt-8 flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs text-white/60"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#35D04A]" />
                100% Inspected
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#35D04A]" />
                Instant Finance
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-[#35D04A]" />
                Fair Trade-In
              </span>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: FEATURED MINIMALIST CAR SHOWCASE CARD */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="lg:col-span-5 hidden sm:block"
          >
            {currentCar && (
              <div className="relative rounded-2xl overflow-hidden bg-white/[0.04] border border-white/15 backdrop-blur-xl p-4 sm:p-5 shadow-2xl group">
                {/* Floating Tag */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-md bg-[#00A211]/20 text-[#35D04A] border border-[#00A211]/30">
                    {currentCar.featuredTag || "FEATURED VEHICLE"}
                  </span>
                  <span className="text-xs font-mono text-white/50">
                    {activeCarIndex + 1} / {showcaseList.length}
                  </span>
                </div>

                {/* Car Image Display */}
                <div className="relative h-48 sm:h-60 w-full rounded-xl overflow-hidden bg-black/40 mb-4">
                  <Image
                    src={resolveCarImageUrl(currentCar.photoUrls?.[0])}
                    alt={`${currentCar.make} ${currentCar.model}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/80 font-mono">
                    <span className="flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5 text-[#35D04A]" />
                      {currentCar.mileage ? `${currentCar.mileage.toLocaleString()} km` : "Low Mileage"}
                    </span>
                    <span>{currentCar.year}</span>
                  </div>
                </div>

                {/* Car Title & Price */}
                <div className="flex items-end justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-white">
                      {currentCar.make} {currentCar.model}
                    </h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      {currentCar.transmission} · {currentCar.fuelType}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-extrabold text-[#35D04A] font-mono">
                      {formatPrice(currentCar.price)}
                    </span>
                  </div>
                </div>

                {/* Card Action Links & Carousel Navigation */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    {showcaseList.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCarIndex(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === activeCarIndex ? "w-6 bg-[#35D04A]" : "w-1.5 bg-white/20 hover:bg-white/40"
                        }`}
                        aria-label={`View car ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={() => router.push(currentCar.id ? `/cars/${currentCar.id}` : "/cars")}
                    size="sm"
                    className="h-8 text-xs px-4 rounded-lg bg-white/10 hover:bg-[#00A211] text-white transition-all flex items-center gap-1"
                  >
                    View Details
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* BOTTOM BRAND LOGO TICKER BAR */}
      <div className="relative z-10 mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center font-mono text-[10px] uppercase tracking-widest text-white/40 mb-3">
            Trusted Brands Available In Our Showroom
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-10 text-xs font-mono font-bold tracking-wider text-white/40 uppercase">
            {carMakes.map((m) => (
              <span key={m} className="hover:text-white transition-colors cursor-pointer" onClick={() => router.push(`/cars?make=${m}`)}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
