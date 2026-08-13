"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetCarQuery } from "@/state/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Car, DollarSign, Calendar, MapPin, Key, Shield, Users } from "lucide-react";
import { resolveCarImageUrl } from "@/utils/imageUrl";

export default function AdminCarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idStr = params?.id as string;
  const numericId = parseInt(idStr, 10);

  const { data: car, isLoading, error } = useGetCarQuery(numericId, {
    skip: !numericId || isNaN(numericId),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
        Loading vehicle details...
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Vehicle Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400">
          The requested vehicle record could not be found or has been removed.
        </p>
        <Button onClick={() => router.push("/admin/cars")}>Back to Inventory</Button>
      </div>
    );
  }

  const carData = {
    id: car.id,
    make: car.make || "Unknown",
    model: car.model || "Unknown",
    year: car.year || 0,
    price: car.price || 0,
    mileage: car.mileage || 0,
    condition: car.condition || "Pre-Owned",
    carType: car.carType || "",
    fuelType: car.fuelType || "",
    transmission: car.transmission || "",
    description: car.description || "",
    features: car.features || [],
    photoUrls: car.photoUrls || [],
    status: car.status || "AVAILABLE",
    vin: car.vin || "N/A",
    dealership: (car as any)?.dealership || { name: "AutoFame Flagship Showroom" },
  };

  const primaryImage = resolveCarImageUrl(carData.photoUrls?.[0]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200 dark:border-slate-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
          Vehicle Overview
        </h1>
      </div>

      {/* Main Header Card */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-[#00A211] font-bold text-2xl flex items-center justify-center border border-emerald-500/30">
              {carData.make.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {carData.year} {carData.make} {carData.model}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-[#00A211]" />
                  VIN: {carData.vin}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#00A211]" />
                  {carData.dealership?.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide uppercase border ${
                carData.status === "AVAILABLE"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : carData.status === "SOLD"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                  : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30"
              }`}
            >
              {carData.status}
            </span>
          </div>
        </div>
      </Card>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-[#00A211] flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-slate-400">Price</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                R {carData.price.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-slate-400">Mileage</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {carData.mileage.toLocaleString()} km
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-slate-400">Year</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {carData.year}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-slate-400">Condition</p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {carData.condition}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
          <TabsTrigger value="overview">Overview & Specifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Technical Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-mono uppercase">Body Style</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {carData.carType || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-mono uppercase">Fuel Type</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {carData.fuelType || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-mono uppercase">Transmission</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {carData.transmission || "N/A"}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
