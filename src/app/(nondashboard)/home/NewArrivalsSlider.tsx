"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, Gauge, Sparkles } from "lucide-react";
import { resolveCarImageUrl, getFallbackImageForCar } from "@/utils/imageUrl";

interface CarItem {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  transmission?: string;
  fuelType?: string;
  photoUrls: string[];
  postedDate?: string;
}

const FALLBACK_NEW_ARRIVALS: CarItem[] = [
  {
    id: 12,
    year: 2022,
    make: "Volkswagen",
    model: "Polo Vivo Hatch 1.4 Trendline",
    price: 164900,
    mileage: 38000,
    transmission: "Manual",
    fuelType: "Petrol",
    photoUrls: ["/cars/volkswagen_polovivo_28640896_1.jpg"],
  },
  {
    id: 11,
    year: 2020,
    make: "Volkswagen",
    model: "T-Cross 1.0TSI 85kW Comfortline R-Line",
    price: 244900,
    mileage: 45000,
    transmission: "Automatic",
    fuelType: "Petrol",
    photoUrls: ["/cars/volkswagen_tcross_28544392_1.jpg"],
  },
  {
    id: 10,
    year: 2025,
    make: "Haval",
    model: "Jolion Pro 1.5T Premium",
    price: 259900,
    mileage: 12000,
    transmission: "Automatic",
    fuelType: "Petrol",
    photoUrls: ["/cars/haval_jolionpro_28674518_1.jpg"],
  },
  {
    id: 9,
    year: 2019,
    make: "Volkswagen",
    model: "Polo Hatch 1.0TSI Comfortline Auto",
    price: 209900,
    mileage: 52000,
    transmission: "Automatic",
    fuelType: "Petrol",
    photoUrls: ["/cars/volkswagen_polo_27844862_1.jpg"],
  },
  {
    id: 8,
    year: 2018,
    make: "Toyota",
    model: "Fortuner 2.8GD-6 4x4 Auto",
    price: 429900,
    mileage: 89000,
    transmission: "Automatic",
    fuelType: "Diesel",
    photoUrls: ["/cars/toyota_fortuner_28663155_1.jpg"],
  },
  {
    id: 7,
    year: 2018,
    make: "Kia",
    model: "Rio Hatch 1.4 Tec Auto",
    price: 229900,
    mileage: 67000,
    transmission: "Automatic",
    fuelType: "Petrol",
    photoUrls: ["/cars/kia_rio_28672837_1.jpg"],
  },
  {
    id: 6,
    year: 2024,
    make: "Toyota",
    model: "Rumion 1.5 SX Auto",
    price: 309900,
    mileage: 18000,
    transmission: "Automatic",
    fuelType: "Petrol",
    photoUrls: ["/cars/toyota_rumion_28675872_1.jpg"],
  },
  {
    id: 5,
    year: 2018,
    make: "BMW",
    model: "X2 sDrive20i M Sport (Sports-Auto)",
    price: 299900,
    mileage: 74000,
    transmission: "Automatic",
    fuelType: "Petrol",
    photoUrls: ["/cars/bmw_x2_28685698_1.jpg"],
  },
];

export default function NewArrivalsSlider() {
  const router = useRouter();
  const [cars, setCars] = useState<CarItem[]>(FALLBACK_NEW_ARRIVALS);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const res = await fetch("/api/cars?limit=12&order=desc");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCars(data.slice(0, 12));
          }
        }
      } catch (e) {
        console.error("Failed to load new arrivals", e);
      }
    };
    fetchCars();
  }, []);

  const handleImageError = (id: number) => {
    setFailedImages((prev) => ({ ...prev, [String(id)]: true }));
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(p);

  return (
    <div className="mt-16 pt-10 border-t border-white/10">
      {/* Slider Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest text-[#35D04A] uppercase mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            Just Landed
          </div>
          <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
            New Arrivals
          </h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Scroll Control Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-all"
              aria-label="Previous cars"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-all"
              aria-label="Next cars"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Link
            href="/cars"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#35D04A] hover:text-white transition-colors uppercase tracking-wider font-mono"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {cars.map((car) => {
          const rawUrl = car.photoUrls?.[0];
          const resolvedUrl = resolveCarImageUrl(rawUrl);
          const isFailed = failedImages[String(car.id)];
          const displayUrl = isFailed ? getFallbackImageForCar(car.make, car.model) : resolvedUrl;

          return (
            <motion.div
              key={car.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
              onClick={() => router.push(`/cars/${car.id}`)}
              className="min-w-[280px] max-w-[280px] sm:min-w-[300px] sm:max-w-[300px] snap-start bg-white/[0.04] hover:bg-white/[0.08] rounded-2xl border border-white/10 hover:border-[#35D04A]/60 overflow-hidden transition-all duration-300 shadow-xl cursor-pointer flex-shrink-0 flex flex-col justify-between group"
            >
              {/* Image Container with Inner Framed Padding */}
              <div className="p-2.5 pb-0">
                <div className="relative h-44 w-full overflow-hidden rounded-xl bg-black/40">
                  <Image
                    src={displayUrl}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    fill
                    sizes="300px"
                    className="object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
                    onError={() => handleImageError(car.id)}
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-semibold border border-white/10">
                      {car.year}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-[#00A211] text-white text-xs font-mono font-extrabold shadow-md">
                      {formatPrice(car.price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specs & Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-white group-hover:text-[#35D04A] transition-colors line-clamp-2 leading-tight mb-2">
                    {car.year} {car.make} {car.model}
                  </h4>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3 text-[#35D04A]" />
                    {car.mileage ? `${(car.mileage / 1000).toFixed(0)}k km` : "Low KM"}
                  </span>
                  <span>{car.transmission || "Auto"}</span>
                  <span className="text-[#35D04A] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Details <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
