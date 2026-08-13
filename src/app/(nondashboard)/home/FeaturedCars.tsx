"use client";
import React, { useState } from "react";
import { Car, Camera, Gauge, Cog, ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useGetCarsQuery } from "@/state/api";
import { useRouter } from "next/navigation";
import TestDriveForm from "@/components/forms/TestDriveForm";
import ReserveCarForm from "@/components/forms/ReserveCarForm";

const FeaturedCars = () => {
  const router = useRouter();
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [isTestDriveFormOpen, setIsTestDriveFormOpen] = useState(false);
  const [isReserveFormOpen, setIsReserveFormOpen] = useState(false);

  // Fetch all cars
  const { data: cars, isLoading, error, refetch, isError } = useGetCarsQuery({});

  const pageSize = 12;
  const [currentPage, setCurrentPage] = useState(1);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(price);

  const handleViewAllCars = () => router.push("/cars");
  const handleReserveCar = (car: any) => { setSelectedCar(car); setIsReserveFormOpen(true); };

  const Skeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 animate-pulse" />
      <div className="p-6">
        <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
        <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
        <div className="h-8 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <section className="py-20 bg-[#F9FAFB] dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
            <p className="text-gray-900 dark:text-white font-semibold mb-2">Failed to load showroom</p>
            <p className="text-sm text-gray-500 mb-6">We're having trouble connecting to the inventory.</p>
            <Button onClick={() => refetch()} variant="outline" className="rounded-full px-8">Try Again</Button>
          </div>
        </div>
      </section>
    );
  }

  const allCars = (cars || []).filter((c: any) => c.status === "AVAILABLE");
  const totalPages = Math.ceil(allCars.length / pageSize) || 1;
  const paginatedCars = allCars.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (p: number) => {
    setCurrentPage(p);
    const el = document.getElementById('inventory-showcase');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="inventory-showcase" className="py-24 bg-[#F9FAFB] dark:bg-gray-950">
      <div className="container mx-auto px-4">
        {/* Modern Header Layout */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="text-[#00A211] font-bold tracking-widest text-xs uppercase mb-3 block">Premium Selection</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Explore Our <span className="text-[#00A211]">Latest</span> Arrivals
            </h2>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleViewAllCars}
            className="group text-gray-600 dark:text-gray-400 hover:text-[#00A211] font-semibold text-lg p-0"
          >
            View Full Inventory <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {paginatedCars.map((car: any) => (
            <div
              key={car.id}
              className="group relative bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800/50 overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
              onClick={() => router.push(`/cars/${car.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/cars/${car.id}`); }}
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={car.photoUrls?.[0] || "/placeholder.jpg"}
                  alt={`${car.make} ${car.model}`}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Floating Badge */}
                <div className="absolute top-4 left-4">
                  <div className="bg-[#00A211] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center shadow-lg">
                    Available
                  </div>
                </div>

                {/* Photo Count badge */}
                {car.photoUrls?.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[10px] font-medium flex items-center">
                    <Camera size={12} className="mr-1" /> {car.photoUrls.length} Photos
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{car.carType}</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-[#00A211] transition-colors">
                  {car.year} {car.make} {car.model}
                </h3>

                <div className="text-2xl font-black text-[#00A211] mb-6">
                  {formatPrice(car.price)}
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50 dark:border-gray-800 mb-6">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Gauge size={16} className="mr-2 text-[#00A211]/60" />
                    <span className="text-xs font-semibold">{car.mileage ? `${(car.mileage / 1000).toFixed(0)}k km` : "—"}</span>
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Cog size={16} className="mr-2 text-[#00A211]/60" />
                    <span className="text-xs font-semibold capitalize">{car.transmission?.toLowerCase() || "Auto"}</span>
                  </div>
                </div>

                <Button
                  className="w-full h-12 bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-[#00A211] dark:hover:bg-[#00A211] hover:text-white transition-all duration-300 rounded-2xl font-bold text-sm shadow-lg shadow-gray-200 dark:shadow-none"
                  onClick={(e) => { e.stopPropagation(); handleReserveCar(car); }}
                >
                  Reserve Now
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Improved Pagination Section */}
        {allCars.length > pageSize && (
          <div className="mt-20 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl h-10 px-4"
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
              >Prev</Button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNumber = i + 1;
                  const isCurrent = currentPage === pageNumber;
                  return (
                    <Button
                      key={pageNumber}
                      variant={isCurrent ? 'default' : 'ghost'}
                      size="sm"
                      className={`w-10 h-10 rounded-xl font-bold ${isCurrent ? 'bg-[#00A211] text-white' : 'text-gray-400'}`}
                      onClick={() => goToPage(pageNumber)}
                    >{pageNumber}</Button>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl h-10 px-4"
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >Next</Button>
            </div>
          </div>
        )}
      </div>

      {selectedCar && (
        <TestDriveForm
          isOpen={isTestDriveFormOpen}
          onClose={() => setIsTestDriveFormOpen(false)}
          carId={selectedCar.id}
          carDetails={{ make: selectedCar.make, model: selectedCar.model, year: selectedCar.year, price: selectedCar.price }}
        />
      )}

      {selectedCar && (
        <ReserveCarForm
          isOpen={isReserveFormOpen}
          onClose={() => setIsReserveFormOpen(false)}
          carId={selectedCar.id}
          carDetails={{ make: selectedCar.make, model: selectedCar.model, year: selectedCar.year, price: selectedCar.price }}
        />
      )}
    </section>
  );
};

export default FeaturedCars;
