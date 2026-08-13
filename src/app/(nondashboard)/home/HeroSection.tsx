"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
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
  CalendarDays,
  ShieldCheck,
  Calculator,
  Car,
  Sparkles,
  CheckCircle2,
  MapPin,
  Clock,
  ChevronRight,
  TrendingUp,
  Sliders,
  Award,
  Zap,
  RotateCcw,
} from "lucide-react";
import { useGetCarsQuery } from "@/state/api";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
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
    condition: "EXCELLENT",
    category: "Sedan",
    images: ["/mbb.jpg", "/hero-1.jpg"],
    featuredTag: "SHOWROOM HIGHLIGHT",
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
    condition: "LIKE_NEW",
    category: "Performance",
    images: ["/hero-1.jpg", "/hero-2.jpg"],
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
    condition: "VERY_GOOD",
    category: "Bakkie / 4x4",
    images: ["/hero-2.jpg", "/mbb.jpg"],
    featuredTag: "POPULAR CHOICE",
  },
];

const BODY_TYPE_PILLS = [
  { label: "All Vehicles", icon: Car, value: "all" },
  { label: "SUVs & Crossovers", icon: Zap, value: "SUV" },
  { label: "Sedans & Luxury", icon: Award, value: "Sedan" },
  { label: "Hatchbacks", icon: Sparkles, value: "Hatchback" },
  { label: "Bakkies & 4x4", icon: Sliders, value: "Bakkie" },
];

export default function HeroSection() {
  const router = useRouter();
  const { data: carsData } = useGetCarsQuery({});

  const availableCars = useMemo(
    () => (carsData || []).filter((c: any) => c.status === "AVAILABLE"),
    [carsData]
  );

  const showcaseList = useMemo(() => {
    if (availableCars.length > 0) return availableCars.slice(0, 4);
    return FALLBACK_SHOWCASE_CARS;
  }, [availableCars]);

  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const currentFeaturedCar = showcaseList[activeCarIndex] || showcaseList[0];

  const carMakes = useMemo(() => {
    if (!availableCars.length) {
      return ["TOYOTA", "VOLKSWAGEN", "FORD", "HYUNDAI", "MERCEDES-BENZ", "BMW", "NISSAN", "KIA", "AUDI"];
    }
    return [...new Set(availableCars.map((c: any) => c.make))];
  }, [availableCars]);

  const carModelsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const c of availableCars as any[]) {
      if (!map[c.make]) map[c.make] = [];
      if (!map[c.make].includes(c.model)) map[c.make].push(c.model);
    }
    return map;
  }, [availableCars]);

  // Multi-tab state: 'search' | 'finance' | 'tradein'
  const [activeTab, setActiveTab] = useState<"search" | "finance" | "tradein">("search");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMake, setSelectedMake] = useState<string>("any");
  const [selectedModel, setSelectedModel] = useState<string>("any");
  const [priceRange, setPriceRange] = useState<string>("any");

  // Finance Calculator state
  const [finVehiclePrice, setFinVehiclePrice] = useState<number>(350000);
  const [finDepositPercent, setFinDepositPercent] = useState<number>(10); // 10%
  const [finMonths, setFinMonths] = useState<number>(60);
  const finInterestRate = 11.75; // ~Prime rate in SA

  // Trade-In Quick Form state
  const [tradeCarDetails, setTradeCarDetails] = useState("");
  const [tradeYear, setTradeYear] = useState("");
  const [tradeMileage, setTradeMileage] = useState("");

  // Calculate estimated monthly payment (PMT formula)
  const calculatedMonthlyRepayment = useMemo(() => {
    const depositAmount = (finVehiclePrice * finDepositPercent) / 100;
    const principal = finVehiclePrice - depositAmount;
    if (principal <= 0) return 0;
    const monthlyRate = finInterestRate / 100 / 12;
    if (monthlyRate === 0) return Math.round(principal / finMonths);
    const pmt =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, finMonths))) /
      (Math.pow(1 + monthlyRate, finMonths) - 1);
    return Math.round(pmt);
  }, [finVehiclePrice, finDepositPercent, finMonths, finInterestRate]);

  // Estimate monthly payment for showcase car card
  const getCarEstimatedPmt = (price: number) => {
    const principal = price * 0.9; // 10% deposit default
    const monthlyRate = 0.1175 / 12;
    const months = 72;
    const pmt = (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(pmt);
  };

  const handleCarSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedMake !== "any") params.set("make", selectedMake);
    if (selectedModel !== "any") params.set("model", selectedModel);
    if (priceRange !== "any") params.set("priceRange", priceRange);
    router.push(`/cars${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleCategoryPillClick = (val: string) => {
    if (val === "all") {
      router.push("/cars");
    } else {
      router.push(`/cars?category=${encodeURIComponent(val)}`);
    }
  };

  const handleTradeInWhatsApp = () => {
    const msg = `Hi Advance Auto! I would like to get a trade-in evaluation for my vehicle:${tradeCarDetails ? `\n- Vehicle: ${tradeCarDetails}` : ""}${tradeYear ? `\n- Year: ${tradeYear}` : ""}${tradeMileage ? `\n- Mileage: ${tradeMileage} km` : ""}`;
    window.open(`https://wa.me/27680720424?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(n);

  const makesTicker = carMakes.length ? carMakes : ["TOYOTA", "VW", "FORD", "HYUNDAI", "MERCEDES-BENZ", "BMW", "NISSAN", "KIA"];
  const tickerRow = [...makesTicker, ...makesTicker, ...makesTicker];

  return (
    <section className="relative min-h-[96vh] bg-[#0A0E0C] text-white overflow-hidden pt-28 md:pt-32 pb-12">
      {/* Background visual graphics */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "url('/grid.svg')", backgroundSize: "50px 50px" }}
      />
      {/* Radial green brand glows */}
      <div className="absolute top-10 left-1/4 w-[38rem] h-[38rem] rounded-full bg-[#00A211]/12 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-[30rem] h-[30rem] rounded-full bg-[#35D04A]/10 blur-[130px] pointer-events-none" />

      {/* Giant Ghost Text */}
      <div
        aria-hidden
        className="absolute right-0 top-1/3 -translate-y-1/2 hidden lg:block select-none pointer-events-none font-display font-black text-[18rem] leading-none tracking-tighter opacity-[0.03]"
        style={{ color: "#35D04A" }}
      >
        ADVANCE
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* TOP STATUS BAR & LOCATION BADGE */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
          className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-white/[0.08]"
        >
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35D04A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00A211]"></span>
            </span>
            <span className="font-mono text-xs tracking-wider uppercase text-white/80">
              Johannesburg South · 2A Amanda Ave, Gleneagles
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-6 font-mono text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#35D04A]" /> Mon–Sat 08:00–17:00
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#35D04A]" /> RWC Certified Lot
            </span>
          </div>
        </motion.div>

        {/* HERO MAIN GRID */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* LEFT COLUMN: HERO HEADLINE & VALUE STACK */}
          <div className="lg:col-span-6">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#00A211]/20 border border-[#00A211]/40 text-[#35D04A] text-xs font-semibold tracking-wide uppercase mb-4"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {availableCars.length > 0 ? `${availableCars.length} Verified Vehicles In Stock` : "Premium Pre-Owned Vehicles"}
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.02]"
            >
              Drive The <br />
              <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                Extraordinary.
              </span>
              <br />
              <span className="text-[#35D04A] drop-shadow-[0_0_25px_rgba(53,208,74,0.3)]">
                No Games.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-5 max-w-xl text-white/70 text-base sm:text-lg leading-relaxed"
            >
              Johannesburg&apos;s trusted destination for luxury sedans, reliable hatchbacks, and rugged bakkies. 100% inspected, roadworthy certified, with instant bank financing and fair trade-ins.
            </motion.p>

            {/* ACTION BUTTONS */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button
                onClick={() => router.push("/cars")}
                className="group h-[3.4rem] px-8 rounded-xl bg-[#00A211] hover:bg-[#00870e] text-white text-sm font-semibold shadow-[0_10px_35px_rgba(0,162,17,0.4)] transition-all hover:scale-[1.02]"
              >
                Browse All Vehicles
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>

              <a
                href="https://wa.me/27680720424?text=Hi%20Advance%20Auto!%20I%27m%20interested%20in%20viewing%20your%20current%20vehicle%20stock."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 h-[3.4rem] px-6 rounded-xl border border-white/20 hover:border-[#35D04A] bg-white/[0.03] hover:bg-[#35D04A]/10 text-sm font-semibold text-white transition-all"
              >
                <svg viewBox="0 0 32 32" className="h-5 w-5 fill-current text-[#25D366]">
                  <path d="M16 0c8.8 0 16 7.18 16 16 0 2.84-.74 5.5-2.05 7.8L32 32l-8.63-2.24A15.93 15.93 0 0 1 16 32C7.18 32 0 24.82 0 16S7.18 0 16 0Z"/>
                  <path fill="#FFF" d="M25.04 22.47c-.37 1-1.82 1.86-2.55 1.97-.65.1-1.48.15-2.38-.15-.55-.18-1.25-.41-2.17-.82-3.82-1.65-6.32-5.47-6.52-5.75-.2-.28-1.56-2.07-1.56-3.94 0-1.87.99-2.8 1.34-3.18.35-.38.76-.47 1-.47.25 0 .51.003.73.014.23.01.56-.09.88.69.33.78 1.07 2.62 1.16 2.81.09.19.15.41.03.66-.12.25-.19.41-.38.62-.19.21-.4.47-.16.92.22.44 1 1.63 2.14 2.64 1.48 1.3 2.7 1.71 3.08 1.9.37.18.6.15.83-.09.22-.24.94-1.09 1.2-1.47.25-.38.5-.31.85-.19.35.12 2.21 1.04 2.58 1.22.38.19.64.28.74.44.1.17.09.91-.16 1.91Z"/>
                </svg>
                WhatsApp Dealership
              </a>
            </motion.div>

            {/* BODY TYPE QUICK-FILTER PILLS */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={5}
              className="mt-8"
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/40 mb-3">
                Quick Category Shortcuts:
              </p>
              <div className="flex flex-wrap gap-2">
                {BODY_TYPE_PILLS.map((pill) => {
                  const Icon = pill.icon;
                  return (
                    <button
                      key={pill.value}
                      onClick={() => handleCategoryPillClick(pill.value)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-white/10 hover:border-[#35D04A]/60 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-white/80 hover:text-white transition-all"
                    >
                      <Icon className="h-3.5 w-3.5 text-[#35D04A]" />
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE FEATURED SHOWCASE CAROUSEL */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="lg:col-span-6 relative"
          >
            <div className="relative bg-[#121915]/90 backdrop-blur-xl border border-white/15 rounded-3xl p-4 sm:p-5 shadow-[0_30px_90px_rgba(0,0,0,0.7)]">
              {/* Top Card Header Badge */}
              <div className="flex items-center justify-between gap-2 mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#35D04A] animate-pulse" />
                  <span className="font-mono text-[11px] tracking-widest uppercase text-[#35D04A] font-semibold">
                    {currentFeaturedCar.featuredTag || "FEATURED SHOWROOM VEHICLE"}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-white/40">
                  0{activeCarIndex + 1} / 0{showcaseList.length}
                </span>
              </div>

              {/* Main Image Viewport with Animated Transition */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeaturedCar.id || activeCarIndex}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={
                        currentFeaturedCar.images?.[0] ||
                        currentFeaturedCar.primaryImage ||
                        "/mbb.jpg"
                      }
                      alt={`${currentFeaturedCar.make} ${currentFeaturedCar.model}`}
                      fill
                      priority
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E0C] via-transparent to-black/30" />
                  </motion.div>
                </AnimatePresence>

                {/* Floating Price Tag */}
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-right">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/60">Price</p>
                  <p className="font-display font-extrabold text-lg sm:text-xl text-[#35D04A]">
                    {formatPrice(currentFeaturedCar.price)}
                  </p>
                </div>

                {/* Live Monthly Repayment Pill */}
                <div className="absolute bottom-4 left-4 bg-[#0A0E0C]/85 backdrop-blur-md border border-[#35D04A]/40 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-[#35D04A]" />
                  <span className="font-mono text-xs text-white/90">
                    Est. <strong className="text-[#35D04A] font-bold">R{getCarEstimatedPmt(currentFeaturedCar.price).toLocaleString()}/pm*</strong>
                  </span>
                </div>
              </div>

              {/* Car Info Body */}
              <div className="mt-4 px-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                      {currentFeaturedCar.make} {currentFeaturedCar.model}
                    </h3>
                    <p className="font-mono text-xs text-white/50 mt-0.5">
                      {currentFeaturedCar.year} · {currentFeaturedCar.condition?.replace(/_/g, " ") || "Excellent"}
                    </p>
                  </div>

                  <Button
                    onClick={() =>
                      currentFeaturedCar.id && !currentFeaturedCar.id.startsWith("fb-")
                        ? router.push(`/cars/${currentFeaturedCar.id}`)
                        : router.push("/cars")
                    }
                    className="bg-[#00A211] hover:bg-[#00870e] text-white text-xs font-semibold px-4 h-9 rounded-lg"
                  >
                    View Vehicle
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Specs Strip */}
                <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 font-mono text-xs text-white/70">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="h-4 w-4 text-[#35D04A]" />
                    <span>{currentFeaturedCar.mileage?.toLocaleString("en-ZA") || "45,000"} km</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-[#35D04A]" />
                    <span>{currentFeaturedCar.fuelType?.replace(/_/g, " ") || "PETROL"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-[#35D04A]" />
                    <span>{currentFeaturedCar.transmission?.replace(/_/g, " ") || "AUTOMATIC"}</span>
                  </div>
                </div>
              </div>

              {/* THUMBNAIL SELECTOR ROW */}
              {showcaseList.length > 1 && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] tracking-wider uppercase text-white/40">
                    Switch vehicle:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {showcaseList.map((car, idx) => (
                      <button
                        key={car.id || idx}
                        onClick={() => setActiveCarIndex(idx)}
                        className={`relative h-12 w-16 rounded-lg overflow-hidden border transition-all ${
                          activeCarIndex === idx
                            ? "border-[#35D04A] ring-2 ring-[#35D04A]/40 scale-105"
                            : "border-white/15 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={car.images?.[0] || car.primaryImage || "/mbb.jpg"}
                          alt={car.model}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ---------------- MULTI-TAB DEALERSHIP TOOL BOX ---------------- */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={6}
          className="mt-14 sm:mt-16"
        >
          <div className="bg-[#121915]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            {/* TAB CONTROLS */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10">
              <div className="flex items-center gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
                <button
                  onClick={() => setActiveTab("search")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === "search"
                      ? "bg-[#00A211] text-white shadow-lg"
                      : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Search className="h-4 w-4" />
                  Search Inventory
                </button>

                <button
                  onClick={() => setActiveTab("finance")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === "finance"
                      ? "bg-[#00A211] text-white shadow-lg"
                      : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Calculator className="h-4 w-4" />
                  Finance Calculator
                </button>

                <button
                  onClick={() => setActiveTab("tradein")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === "tradein"
                      ? "bg-[#00A211] text-white shadow-lg"
                      : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <RotateCcw className="h-4 w-4" />
                  Value Trade-In
                </button>
              </div>

              <div className="hidden md:flex items-center gap-2 font-mono text-xs text-[#35D04A]">
                <CheckCircle2 className="h-4 w-4" /> Instant Results & Repayment Estimates
              </div>
            </div>

            {/* TAB CONTENT 1: SEARCH INVENTORY */}
            {activeTab === "search" && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    Keyword Search
                  </label>
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCarSearch()}
                    placeholder="Make, model, e.g. Golf, Hilux, C200..."
                    className="h-12 border-white/15 bg-black/40 text-white placeholder-white/40 rounded-xl focus:border-[#35D04A] focus:ring-1 focus:ring-[#35D04A]"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    Make
                  </label>
                  <Select
                    value={selectedMake}
                    onValueChange={(val) => {
                      setSelectedMake(val);
                      setSelectedModel("any");
                    }}
                  >
                    <SelectTrigger className="h-12 border-white/15 bg-black/40 text-white rounded-xl focus:border-[#35D04A]">
                      <SelectValue placeholder="Any Make" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-[#121915] border-white/15 text-white max-h-60">
                      <SelectItem value="any">Any Make</SelectItem>
                      {carMakes.map((make) => (
                        <SelectItem key={make} value={make}>
                          {make}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    Model
                  </label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    disabled={!selectedMake || selectedMake === "any"}
                  >
                    <SelectTrigger className="h-12 border-white/15 bg-black/40 text-white rounded-xl focus:border-[#35D04A] disabled:opacity-40">
                      <SelectValue placeholder="Any Model" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-[#121915] border-white/15 text-white max-h-60">
                      <SelectItem value="any">Any Model</SelectItem>
                      {(carModelsMap[selectedMake] || []).map((model: string) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    Budget
                  </label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="h-12 border-white/15 bg-black/40 text-white rounded-xl focus:border-[#35D04A]">
                      <SelectValue placeholder="Any Price" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-[#121915] border-white/15 text-white">
                      <SelectItem value="any">Any Price</SelectItem>
                      <SelectItem value="0-100000">Under R100,000</SelectItem>
                      <SelectItem value="100000-200000">R100k – R200k</SelectItem>
                      <SelectItem value="200000-350000">R200k – R350k</SelectItem>
                      <SelectItem value="350000-500000">R350k – R500k</SelectItem>
                      <SelectItem value="500000-750000">R500k – R750k</SelectItem>
                      <SelectItem value="750000+">R750,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-1">
                  <Button
                    onClick={handleCarSearch}
                    aria-label="Search Inventory"
                    className="w-full h-12 bg-[#00A211] hover:bg-[#00870e] text-white rounded-xl shadow-[0_8px_25px_rgba(0,162,17,0.4)] transition-all"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: QUICK FINANCE CALCULATOR */}
            {activeTab === "finance" && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <div className="flex justify-between text-xs font-mono text-white/70 mb-2">
                      <span>Vehicle Price:</span>
                      <strong className="text-[#35D04A] font-bold text-sm">
                        {formatPrice(finVehiclePrice)}
                      </strong>
                    </div>
                    <input
                      type="range"
                      min={50000}
                      max={1200000}
                      step={10000}
                      value={finVehiclePrice}
                      onChange={(e) => setFinVehiclePrice(Number(e.target.value))}
                      className="w-full accent-[#35D04A] bg-black/40 h-2 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs font-mono text-white/70 mb-2">
                        <span>Deposit:</span>
                        <strong className="text-white">
                          {finDepositPercent}% ({formatPrice((finVehiclePrice * finDepositPercent) / 100)})
                        </strong>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        step={5}
                        value={finDepositPercent}
                        onChange={(e) => setFinDepositPercent(Number(e.target.value))}
                        className="w-full accent-[#35D04A] bg-black/40 h-2 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono text-white/70 mb-2">
                        <span>Loan Term:</span>
                        <strong className="text-white">{finMonths} Months</strong>
                      </div>
                      <div className="flex gap-2">
                        {[36, 48, 60, 72].map((m) => (
                          <button
                            key={m}
                            onClick={() => setFinMonths(m)}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                              finMonths === m
                                ? "border-[#35D04A] bg-[#35D04A]/20 text-[#35D04A]"
                                : "border-white/10 bg-black/30 text-white/60 hover:text-white"
                            }`}
                          >
                            {m}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-black/40 border border-white/10 rounded-2xl p-5 text-center sm:text-left">
                  <p className="font-mono text-xs uppercase tracking-wider text-white/50">
                    Estimated Monthly Payment
                  </p>
                  <p className="font-display font-extrabold text-3xl sm:text-4xl text-[#35D04A] mt-1">
                    R{calculatedMonthlyRepayment.toLocaleString("en-ZA")}
                    <span className="text-sm font-normal text-white/50"> / pm*</span>
                  </p>
                  <p className="font-mono text-[11px] text-white/40 mt-2 leading-tight">
                    *Est. based on ~{finInterestRate}% prime rate, {finMonths} months with {finDepositPercent}% deposit. Excludes bank admin fees & subject to credit approval.
                  </p>
                  <Button
                    onClick={() => router.push("/cars")}
                    className="mt-4 w-full bg-[#00A211] hover:bg-[#00870e] text-white font-semibold h-11 rounded-xl"
                  >
                    Find Cars In This Budget
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: TRADE-IN VALUATION */}
            {activeTab === "tradein" && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                <div className="md:col-span-5">
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    Your Current Car (Make & Model)
                  </label>
                  <Input
                    type="text"
                    value={tradeCarDetails}
                    onChange={(e) => setTradeCarDetails(e.target.value)}
                    placeholder="e.g. 2018 Polo Vivo 1.4 Comfortline"
                    className="h-12 border-white/15 bg-black/40 text-white placeholder-white/40 rounded-xl"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-1.5">
                    Year Model
                  </label>
                  <Input
                    type="text"
                    value={tradeYear}
                    onChange={(e) => setTradeYear(e.target.value)}
                    placeholder="e.g. 2018"
                    className="h-12 border-white/15 bg-black/40 text-white placeholder-white/40 rounded-xl"
                  />
                </div>

                <div className="md:col-span-4">
                  <Button
                    onClick={handleTradeInWhatsApp}
                    className="w-full h-12 bg-[#00A211] hover:bg-[#00870e] text-white font-semibold rounded-xl"
                  >
                    Get Instant Trade-In Valuation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ---------------- DEALERSHIP TRUST BADGES ---------------- */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={7}
          className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#00A211]/20 text-[#35D04A] shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white">DEKRA Inspected</h4>
              <p className="font-mono text-xs text-white/50 mt-0.5">Multi-point roadworthy certification</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#00A211]/20 text-[#35D04A] shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white">In-House Finance</h4>
              <p className="font-mono text-xs text-white/50 mt-0.5">Approved with major SA banks</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#00A211]/20 text-[#35D04A] shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white">Top Trade-In Value</h4>
              <p className="font-mono text-xs text-white/50 mt-0.5">Fair market valuations guaranteed</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#00A211]/20 text-[#35D04A] shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white">Gleneagles Showroom</h4>
              <p className="font-mono text-xs text-white/50 mt-0.5">Visit us in Johannesburg South</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ---------------- BOTTOM MARQUEE ---------------- */}
      <div className="relative z-10 mt-12 border-t border-white/[0.08] py-4 overflow-hidden">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
          {tickerRow.map((make, i) => (
            <span
              key={i}
              className="flex items-center gap-10 font-mono text-[11px] tracking-[0.35em] uppercase text-white/40"
            >
              {make}
              <span className="text-[#35D04A]">◆</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
