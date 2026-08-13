"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gauge, ArrowRight, Camera, Sparkles, Check, Car as CarIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetCarsQuery } from "@/state/api";
import { resolveCarImageUrl, getFallbackImageForCar } from "@/utils/imageUrl";
import TestDriveForm from "@/components/forms/TestDriveForm";
import ReserveCarForm from "@/components/forms/ReserveCarForm";

const FALLBACK_NEW_ARRIVALS = [
  {
    id: 12,
    year: 2022,
    make: "Volkswagen",
    model: "Polo Vivo Hatch 1.4 Trendline",
    price: 164900,
    mileage: 38000,
    carType: "Hatchback",
    transmission: "Manual",
    fuelType: "Petrol",
    photoUrls: ["/cars/volkswagen_polovivo_28640896_1.jpg"],
    status: "AVAILABLE",
  },
  {
    id: 11,
    year: 2020,
    make: "Volkswagen",
    model: "T-Cross 1.0TSI 85kW Comfortline R-Line",
    price: 244900,
    mileage: 45000,
    carType: "SUV",
    transmission: "Automatic",
    fuelType: "Petrol",
    photoUrls: ["/cars/volkswagen_tcross_28544392_1.jpg"],
    status: "AVAILABLE",
  },
  {
    id: 10,
    year: 2025,
    make: "Haval",
    model: "Jolion Pro 1.5T Premium",
    price: 259900,
    mileage: 12000,
    carType: "SUV",
    transmission: "Automatic",
    fuelType: "Petrol",
    photoUrls: ["/cars/haval_jolionpro_28674518_1.jpg"],
    status: "AVAILABLE",
  },
  {
    id: 9,
    year: 2019,
    make: "Volkswagen",
    model: "Polo Hatch 1.0TSI Comfortline Auto",
    price: 209900,
    mileage: 52000,
    carType: "Hatchback",
    transmission: "Automatic",
    fuelType: "Petrol",
    photoUrls: ["/cars/volkswagen_polo_27844862_1.jpg"],
    status: "AVAILABLE",
  },
  {
    id: 8,
    year: 2018,
    make: "Toyota",
    model: "Fortuner 2.8GD-6 4x4 Auto",
    price: 429900,
    mileage: 89000,
    carType: "SUV / 4x4",
    transmission: "Automatic",
    fuelType: "Diesel",
    photoUrls: ["/cars/toyota_fortuner_28663155_1.jpg"],
    status: "AVAILABLE",
  },
  {
    id: 7,
    year: 2018,
    make: "Kia",
    model: "Rio Hatch 1.4 Tec Auto",
    price: 229900,
    mileage: 67000,
    carType: "Hatchback",
    transmission: "Automatic",
    fuelType: "Petrol",
    photoUrls: ["/cars/kia_rio_28672837_1.jpg"],
    status: "AVAILABLE",
  },
  {
    id: 6,
    year: 2024,
    make: "Toyota",
    model: "Rumion 1.5 SX Auto",
    price: 309900,
    mileage: 18000,
    carType: "MPV",
    transmission: "Automatic",
    fuelType: "Petrol",
    photoUrls: ["/cars/toyota_rumion_28675872_1.jpg"],
    status: "AVAILABLE",
  },
  {
    id: 5,
    year: 2018,
    make: "BMW",
    model: "X2 sDrive20i M Sport (Sports-Auto)",
    price: 299900,
    mileage: 74000,
    carType: "Crossover",
    transmission: "Automatic",
    fuelType: "Petrol",
    photoUrls: ["/cars/bmw_x2_28685698_1.jpg"],
    status: "AVAILABLE",
  },
];

export default function FeaturedCars() {
  const router = useRouter();
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [isReserveFormOpen, setIsReserveFormOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const { data: cars, isLoading } = useGetCarsQuery({});

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(price);

  const availableCars = (cars && Array.isArray(cars) && cars.length > 0)
    ? cars.filter((c: any) => c.status === "AVAILABLE").slice(0, 8)
    : FALLBACK_NEW_ARRIVALS;

  const handleImageError = (id: string | number) => {
    setFailedImages((prev) => ({ ...prev, [String(id)]: true }));
  };

  const handleReserve = (e: React.MouseEvent, car: any) => {
    e.stopPropagation();
    setSelectedCar(car);
    setIsReserveFormOpen(true);
  };

  return (
    <section className="py-20 md:py-28 bg-[#0B0F0C] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* SECTION HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A211]/15 text-[#35D04A] text-xs font-semibold uppercase tracking-wider mb-2 border border-[#00A211]/30">
              <Sparkles className="h-3.5 w-3.5" />
              Latest Inventory
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight">
              New <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A211] to-[#35D04A]">Arrivals</span>
            </h2>
          </div>

          <Link
            href="/cars"
            className="group inline-flex items-center gap-2 text-sm font-bold text-[#35D04A] hover:text-white transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* CARS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {availableCars.map((car: any) => {
            const rawUrl = car.photoUrls?.[0];
            const resolvedUrl = resolveCarImageUrl(rawUrl);
            const isFailed = failedImages[String(car.id)];
            const displayUrl = isFailed ? getFallbackImageForCar(car.make, car.model) : resolvedUrl;

            return (
              <div
                key={car.id}
                onClick={() => router.push(`/cars/${car.id}`)}
                className="group relative bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#35D04A]/60 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
              >
                {/* Image Container with Inner Framed Padding */}
                <div className="p-3 pb-0">
                  <div className="relative aspect-[16/10] min-h-[210px] sm:min-h-0 w-full overflow-hidden rounded-xl bg-black/40">
                    <Image
                      src={displayUrl}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
                      onError={() => handleImageError(car.id)}
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Year Tag */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-[11px] font-mono font-semibold border border-white/10">
                        {car.year}
                      </span>
                    </div>

                    {/* Price Tag */}
                    <div className="absolute bottom-3 right-3">
                      <span className="px-3 py-1 rounded-lg bg-[#00A211] text-white text-xs font-mono font-extrabold shadow-lg">
                        {formatPrice(car.price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-1">
                      {car.carType || "Pre-Owned"}
                    </span>
                    <h3 className="font-display font-bold text-base text-white group-hover:text-[#35D04A] transition-colors line-clamp-2 leading-snug mb-3">
                      {car.year} {car.make} {car.model}
                    </h3>
                  </div>

                  <div>
                    {/* Specs Row */}
                    <div className="flex items-center justify-between py-3 border-t border-b border-white/10 text-xs font-mono text-white/60 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5 text-[#35D04A]" />
                        {car.mileage ? `${(car.mileage / 1000).toFixed(0)}k km` : "Low KM"}
                      </span>
                      <span>{car.transmission || "Auto"}</span>
                      <span>{car.fuelType || "Petrol"}</span>
                    </div>

                    {/* Actions - High-Contrast Visible Reserve & Details Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleReserve(e, car)}
                        className="h-10 text-xs rounded-xl bg-[#00A211] hover:bg-[#00870e] text-white font-extrabold transition-all shadow-md flex items-center justify-center border-0 active:scale-95"
                      >
                        Reserve
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/cars/${car.id}`);
                        }}
                        className="h-10 text-xs rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/15 flex items-center justify-center active:scale-95"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Bottom CTA */}
        <div className="mt-12 text-center">
          <Button
            onClick={() => router.push("/cars")}
            className="h-12 px-8 rounded-xl bg-white/10 hover:bg-[#00A211] text-white text-sm font-bold border border-white/10 hover:border-transparent transition-all shadow-lg inline-flex items-center gap-2"
          >
            Explore Complete Inventory ({availableCars.length}+ Available)
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedCar && (
        <ReserveCarForm
          isOpen={isReserveFormOpen}
          onClose={() => setIsReserveFormOpen(false)}
          carId={selectedCar.id}
          carDetails={{
            make: selectedCar.make,
            model: selectedCar.model,
            year: selectedCar.year,
            price: selectedCar.price,
          }}
        />
      )}
    </section>
  );
}
