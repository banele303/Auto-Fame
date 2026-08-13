"use client";
import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Search, Filter, SlidersHorizontal, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CarCard from "@/components/CarCard";
import { useGetCarsQuery, useAddFavoriteCarMutation, useRemoveFavoriteCarMutation } from "@/state/api";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useConvexAuth } from "@/components/ConvexAuthProvider";
import { toast } from "sonner";
import { CarCardSkeleton } from "@/components/ui/skeletons";
import Image from "next/image";

const InventoryContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [selectedMake, setSelectedMake] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [selectedFuelType, setSelectedFuelType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [favorites, setFavorites] = useState<number[]>([]);

  
  const { data: carsData, isLoading, error } = useGetCarsQuery({});
  
  
  const [addFavorite] = useAddFavoriteCarMutation();
  const [removeFavorite] = useRemoveFavoriteCarMutation();

  
  useEffect(() => {
    if (searchParams.get('make')) setSelectedMake(searchParams.get('make') || "all");
    if (searchParams.get('model')) setSearchQuery(searchParams.get('model') || "");
    if (searchParams.get('search')) setSearchQuery(searchParams.get('search') || "");
    if (searchParams.get('priceRange')) {
      const range = searchParams.get('priceRange') || "";
      if (range !== "any") {
        const [min, max] = range.split('-').map(Number);
        setPriceRange([min || 0, max || 2000000]);
      }
    }
  }, [searchParams]);

  
  const filteredCars = React.useMemo(() => {
    if (!carsData) return [];
    
    let filtered = carsData.filter((car) => {
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!car.make.toLowerCase().includes(query) && 
            !car.model.toLowerCase().includes(query) &&
            !`${car.make} ${car.model}`.toLowerCase().includes(query)) {
          return false;
        }
      }

      
      if (selectedMake !== "all" && car.make !== selectedMake) {
        return false;
      }

      
      if (car.price < priceRange[0] || car.price > priceRange[1]) {
        return false;
      }

      
      if (selectedCondition !== "all" && car.status !== selectedCondition) {
        return false;
      }

      
      if (selectedFuelType !== "all" && car.fuelType !== selectedFuelType) {
        return false;
      }

      return true;
    });

    
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        case "oldest":
          return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "mileage-low":
          return (a.mileage || 0) - (b.mileage || 0);
        case "rating":
          return ((b as any).averageRating || 0) - ((a as any).averageRating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [carsData, searchQuery, selectedMake, priceRange, selectedCondition, selectedFuelType, sortBy]);

  
  const carMakes = React.useMemo(() => {
    if (!carsData) return [];
    return [...new Set(carsData.map(car => car.make))];
  }, [carsData]);

  const carTypes = ["Sedan", "SUV", "Hatchback", "Pickup Truck", "Convertible", "Sports Car"];
  const conditions = React.useMemo(() => {
    if (!carsData) return [];
    return [...new Set(carsData.map(car => car.status))];
  }, [carsData]);

  const fuelTypes = React.useMemo(() => {
    if (!carsData) return [];
    return [...new Set(carsData.map(car => car.fuelType))];
  }, [carsData]);

  const formatPrice = (price: number) => {
    return `R ${price.toLocaleString()}`;
  };

  const { user } = useConvexAuth();
  const userId = user?.id || null;
  const cognitoId = userId;

  const handleFavoriteToggle = async (carId: number) => {
    try {
      if (!cognitoId) {
        toast.error("Please sign in to manage favorites");
        router.push('/signin');
        return;
      }
      if (favorites.includes(carId)) {
        await removeFavorite({ cognitoId, carId }).unwrap();
        setFavorites(prev => prev.filter(id => id !== carId));
        toast.success("Removed from favorites");
      } else {
        await addFavorite({ cognitoId, carId }).unwrap();
        setFavorites(prev => [...prev, carId]);
        toast.success("Added to favorites");
      }
    } catch (error) {
      toast.error("Failed to update favorites");
    }
  };

  const handleViewDetails = (carId: number) => {
    router.push(`/cars/${carId}`);
  };

  const handleScheduleTestDrive = (carId: number) => {
    router.push(`/cars/${carId}?action=test-drive`);
  };

  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="h-12 w-96 bg-white/20 animate-pulse rounded mx-auto mb-4"></div>
              <div className="h-6 w-[500px] bg-white/10 animate-pulse rounded mx-auto"></div>
            </div>
          </div>
        </div>

        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/4 space-y-6">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
            </div>
            
            
            <div className="lg:w-3/4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <CarCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load vehicles</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-[70px]">
      <div className="container mx-auto px-4 py-8">
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Vehicle Inventory
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Browse our premium collection of vehicles
              </p>
            </div>
          </div>

          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-4">
              
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Search by make, model, year..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              
              <div className="flex gap-2">
                <Select value={selectedMake} onValueChange={setSelectedMake}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Makes</SelectItem>
                    {carMakes.map((make) => (
                      <SelectItem key={make} value={make}>{make}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conditions</SelectItem>
                    {conditions.map((condition) => (
                      <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-[#00acee] text-[#00acee] hover:bg-[#00acee] hover:text-white"
                >
                  <SlidersHorizontal size={16} className="mr-2" />
                  Filters
                </Button>
              </div>

              
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-[#00acee] text-white" : ""}
                >
                  <Grid size={16} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-[#00acee] text-white" : ""}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>

            
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={2000000}
                      min={0}
                      step={50000}
                      className="w-full"
                    />
                  </div>

                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Type</SelectItem>
                        {carTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fuel Type
                    </label>
                    <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any Fuel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Fuel</SelectItem>
                        {fuelTypes.map((fuel) => (
                          <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sort By
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="mileage-low">Mileage: Low to High</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredCars.length} vehicle{filteredCars.length !== 1 ? 's' : ''}
          </p>
        </div>

        
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car) => (
              <CarCard
                key={car.id}
                id={car.id}
                make={car.make}
                model={car.model}
                year={car.year}
                price={car.price}
                mileage={car.mileage || 0}
                fuelType={car.fuelType}
                condition={car.status}
                transmission={car.transmission}
                photoUrls={car.photoUrls || []}
                features={car.features || []}
                averageRating={(car as any).averageRating}
                isFavorited={favorites.includes(car.id)}
                onFavoriteToggle={handleFavoriteToggle}
                onViewDetails={handleViewDetails}
                onScheduleTestDrive={handleScheduleTestDrive}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCars.map((car) => (
              <Card
                key={car.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(car.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewDetails(car.id); } }}
              >
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-32 h-24 bg-gray-200 rounded-lg overflow-hidden">
                      <Image 
                        src={car.photoUrls?.[0] || "/placeholder.jpg"} 
                        alt={`${car.make} ${car.model}`}
                        width={128}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold">{car.year} {car.make} {car.model}</h3>
                          <p className="text-2xl font-bold text-[#00acee]">{formatPrice(car.price)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleViewDetails(car.id); }}
                          >
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-[#00acee]"
                            onClick={(e) => { e.stopPropagation(); handleScheduleTestDrive(car.id); }}
                          >
                            Test Drive
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {(car.mileage || 0).toLocaleString()} km • {car.fuelType} • {car.transmission}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        
        {filteredCars.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
              No vehicles found matching your criteria
            </p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setSelectedMake("all");
                setSelectedCondition("all");
                setSelectedFuelType("all");
                setPriceRange([0, 2000000]);
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const InventoryPage = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <InventoryContent />
    </Suspense>
  );
};

export default InventoryPage;
