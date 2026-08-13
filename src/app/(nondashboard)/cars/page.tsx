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
import Image from "next/image";

const CarsContent = () => {
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
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  
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
      // STRICT FILTER: Public users should only see AVAILABLE cars
      // (Optionally could include RESERVED or PENDING if they are allowed to see them)
      if (car.status !== "AVAILABLE") {
        return false;
      }

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
          return new Date(b.updatedAt || b.postedDate || 0).getTime() - new Date(a.updatedAt || a.postedDate || 0).getTime();
        case "oldest":
          return new Date(a.updatedAt || a.postedDate || 0).getTime() - new Date(b.updatedAt || b.postedDate || 0).getTime();
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "mileage-low":
          return (a.mileage || 0) - (b.mileage || 0);
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        default:
          return 0;
      }
    });
    return filtered;
  }, [carsData, searchQuery, selectedMake, priceRange, selectedCondition, selectedFuelType, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCars.length / pageSize);
  const paginatedCars = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCars.slice(start, start + pageSize);
  }, [filteredCars, currentPage, pageSize]);

  
  const carMakes = React.useMemo(() => {
    if (!carsData) return [];
    return [...new Set(carsData.filter(c => c.status === "AVAILABLE").map(car => car.make))];
  }, [carsData]);

  const carTypes = ["Sedan", "SUV", "Hatchback", "Pickup Truck", "Convertible", "Sports Car"];
  const conditions = React.useMemo(() => {
    if (!carsData) return [];
    // Only show relevant public statuses in the filter
    const allowed = ["AVAILABLE", "RESERVED", "PENDING"];
    return [...new Set(carsData.filter(c => allowed.includes(c.status)).map(car => car.status))];
  }, [carsData]);

  const fuelTypes = React.useMemo(() => {
    if (!carsData) return [];
    return [...new Set(carsData.map(car => car.fuelType))];
  }, [carsData]);

  const formatPrice = (price: number) => {
    return `R ${price.toLocaleString()}`;
  };

  const { user } = useConvexAuth();
  const cognitoId = (user as any)?.userId || (user as any)?.username || null;

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
    toast.success("Test drive request sent! We'll contact you soon.");
    
  };

  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-600 dark:text-gray-400">Loading cars...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Discovering the perfect vehicle for you
          </p>
        </div>
      </div>
    );
  }

  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load cars</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Browse Our Cars
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Discover our premium collection of vehicles
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

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredCars.length} of {carsData?.length || 0} vehicles
          </p>
        </div>

        
        {filteredCars.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-4">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No cars found
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                Try adjusting your search criteria or clear filters to see all available cars.
              </p>
            </div>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setSelectedMake("all");
                setSelectedType("all");
                setSelectedCondition("all");
                setSelectedFuelType("all");
                setPriceRange([0, 2000000]);
              }}
              variant="outline"
            >
              Clear All Filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {paginatedCars.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <CarCard
                    id={car.id}
                    make={car.make}
                    model={car.model}
                    year={car.year}
                    price={car.price}
                    mileage={car.mileage || 0}
                    fuelType={car.fuelType}
                    condition={car.status}
                    transmission={car.transmission}
                    photoUrls={car.photoUrls || ["/placeholder.jpg"]}
                    features={car.features || []}
                    averageRating={car.averageRating || undefined}
                    isFavorited={favorites.includes(car.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onViewDetails={handleViewDetails}
                    onScheduleTestDrive={handleScheduleTestDrive}
                  />
                </motion.div>
              ))}
            </motion.div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {paginatedCars.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <div className="w-full sm:w-36 h-44 sm:h-40 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                          <Image 
                            src={car.photoUrls?.[0] || "/placeholder.jpg"} 
                            alt={`${car.make} ${car.model}`}
                            width={144}
                            height={176}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-center sm:text-left">{car.year} {car.make} {car.model}</h3>
                            <p className="text-2xl font-bold text-[#00acee] text-center sm:text-left">{formatPrice(car.price)}</p>
                            <div className="mt-2 text-sm text-gray-600 text-center sm:text-left">
                              {car.mileage?.toLocaleString() || 0} km • {car.fuelType} • {car.transmission}
                            </div>
                          </div>
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-2 w-full">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewDetails(car.id)}
                              className="w-full sm:w-auto"
                            >
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-[#00acee] w-full sm:w-auto" 
                              onClick={() => handleScheduleTestDrive(car.id)}
                            >
                              Test Drive
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const CarsPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#00acee]" />
        <p className="text-gray-600">Loading cars...</p>
      </div>
    </div>}>
      <CarsContent />
    </Suspense>
  );
};

export default CarsPage;
