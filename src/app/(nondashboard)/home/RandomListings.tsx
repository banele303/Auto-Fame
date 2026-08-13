"use client";

import React, { useState, useEffect } from "react";
import { useGetPropertiesQuery } from "@/state/api";
import Card from "@/components/Card";
import { useAppSelector } from "@/state/redux";
import { useDispatch } from "react-redux";
import { setFilters } from "@/state";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PropertyTypeIcons } from "@/lib/constants";
import { formatPriceValue } from "@/lib/utils";

const RandomListings = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const filters = useAppSelector((state) => state.global.filters);
  
  
  const [localFilters, setLocalFilters] = useState({
    location: "",
    propertyType: "any",
    priceRange: [2000, 20000] as [number, number],
  });
  
  
  const cities = [
    "Johannesburg",
    "Cape Town",
    "Durban",
    "Pretoria",
    "Bloemfontein",
  ];
  
  const [selectedCity, setSelectedCity] = useState(cities[0]);
  
  
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      location: `${selectedCity}, South Africa`,
    }));
  }, [selectedCity]);
  
  
  const { data: allProperties, isLoading } = useGetPropertiesQuery({
    ...filters,
    location: `${selectedCity}, South Africa`,
  });
  
  
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  
  
  const randomProperties = React.useMemo(() => {
    if (!allProperties || allProperties.length === 0) return [];
    
    
    const propertiesCopy = [...allProperties];
    
    
    for (let i = propertiesCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [propertiesCopy[i], propertiesCopy[j]] = [propertiesCopy[j], propertiesCopy[i]];
    }
    
    
    return propertiesCopy.slice(0, 6).map(property => ({
      ...property,
      price: typeof property.price === 'number' ? property.price : 0,
      squareFeet: typeof property.squareFeet === 'number' ? property.squareFeet : 0,
      images: Array.isArray(property.images) && property.images.length > 0 ? property.images : [],
      numberOfReviews: typeof property.numberOfReviews === 'number' ? property.numberOfReviews : 0,
      location: property.location || {
        address: 'No address provided',
        city: 'Unknown location',
        province: ''
      }
    }));
  }, [allProperties]);
  
  
  useEffect(() => {
    
    setFilteredProperties(randomProperties);
  }, [randomProperties]);
  
  
  useEffect(() => {
    
    if (randomProperties.length > 0) {
      setFilteredProperties(randomProperties);
    }
  }, [selectedCity, randomProperties]);
  
  
  const universityLocations = {
    UP: {
      name: "University of Pretoria",
      coordinates: [-25.7545, 28.2314],
    },
    UKZN: {
      name: "University of KwaZulu-Natal",
      coordinates: [-29.8175, 30.9422],
    },
    DUT: {
      name: "Durban University of Technology",
      coordinates: [-29.8526, 31.0089],
    },
    CPUT: {
      name: "Cape Peninsula University of Technology",
      coordinates: [-33.9321, 18.6400],
    },
    UCT: {
      name: "University of Cape Town",
      coordinates: [-33.9577, 18.4612],
    },
    WITS: {
      name: "University of Witwatersrand",
      coordinates: [-26.1929, 28.0305],
    },
    UJ: {
      name: "University of Johannesburg",
      coordinates: [-26.1825, 28.0100],
    },
    TUT: {
      name: "Tshwane University of Technology",
      coordinates: [-25.7312, 28.1636],
    }
  };

  
  const handleUniversityClick = (universityKey: string) => {
    const university = universityLocations[universityKey as keyof typeof universityLocations];
    if (university) {
      
      const [lat, lng] = university.coordinates;
      
      
      
      const formattedLocation = `${university.name}, Johannesburg, South Africa`;
      
      
      dispatch(
        setFilters({
          location: formattedLocation,
          coordinates: [lng, lat] as [number, number], 
        })
      );

      
      const params = new URLSearchParams({
        location: formattedLocation,
        coordinates: `${lng},${lat}`, 
        lat: lat.toString(),
        lng: lng.toString(),
      });

      router.push(`/search?${params.toString()}`);
    }
  };
    
  
  const handleFilterChange = (key: string, value: any) => {
    if (key === "city") {
      setSelectedCity(value);
      return;
    }
    
    let newValue = value;
    
    if (key === "priceRange") {
      const [min, max] = value;
      newValue = [
        min === "any" ? null : Number(min),
        max === "any" ? null : Number(max)
      ];
    }
    
    setLocalFilters(prev => ({
      ...prev,
      [key]: newValue
    }));
  };
  
  
  const handleApplyFilters = () => {
    
    const fullLocation = `${selectedCity}, South Africa`;
    
    
    const filtersToApply = {
      ...localFilters,
      location: fullLocation,
      priceRange: `${localFilters.priceRange[0]}-${localFilters.priceRange[1]}`,
    };
    
    
    dispatch(setFilters(filtersToApply));
    
    
    if (!allProperties || allProperties.length === 0) {
      setFilteredProperties([]);
      return;
    }
    
    const filtered = allProperties.filter(property => {
      
      if (localFilters.propertyType !== "any" && property.propertyType !== localFilters.propertyType) {
        return false;
      }
      
      
      const propertyPrice = typeof property.price === 'number' ? property.price : 0;
      if (propertyPrice < localFilters.priceRange[0] || propertyPrice > localFilters.priceRange[1]) {
        return false;
      }
      
      
      if (localFilters.location && localFilters.location.trim() !== "") {
        const locationText = localFilters.location.toLowerCase();
        const propertyAddress = property.location?.address?.toLowerCase() || "";
        const propertyCity = property.location?.city?.toLowerCase() || "";
        
        if (!propertyAddress.includes(locationText) && !propertyCity.includes(locationText)) {
          return false;
        }
      }
      
      return true;
    });
    
    
    const processedProperties = filtered.map(property => ({
      ...property,
      price: typeof property.price === 'number' ? property.price : 0,
      squareFeet: typeof property.squareFeet === 'number' ? property.squareFeet : 0,
      images: Array.isArray(property.images) && property.images.length > 0 ? property.images : [],
      numberOfReviews: typeof property.numberOfReviews === 'number' ? property.numberOfReviews : 0,
      location: property.location || {
        address: 'No address provided',
        city: 'Unknown location',
        province: ''
      }
    }));
    
    setFilteredProperties(processedProperties);
  };
  
  
  const handlePropertyClick = (propertyId: number) => {
    router.push(`/search/${propertyId}`);
  };
  
  return (
    <div className="py-16 px-4 md:px-8 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl text-start font-bold text-[#00acee] mb-2">
              Featured Properties
            </h2>
            <p className="text-gray-400 max-w-2xl">
              Discover our handpicked selection of premium accommodations in {selectedCity}. Find your perfect stay today.
            </p>
          </div>
        </div>
        
        
        <div className="relative mb-8">
          
          <div className="absolute inset-0 bg-gradient-to-r from-[#00acee] to-[#00acee] rounded-3xl shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-opacity-20 bg-[#0099d4]"></div>
          </div>
          
          
          <div className="relative p-8 md:p-10">
            
            <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-full shadow-xl overflow-hidden mb-6">
              <div className="flex flex-col md:flex-row items-center">
                
                <div className="flex items-center px-4 py-2 flex-1 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 w-full md:w-auto">
                  <div className="text-[#00acee] mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter location or property name"
                    className="border-0 focus:ring-0 p-0 bg-transparent w-full"
                    value={localFilters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                  />
                </div>
                
                
                <div className="flex items-center px-4 py-2 flex-1 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 w-full md:w-auto">
                  <div className="text-[#00acee] mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 group relative">
                    <div className="relative overflow-hidden rounded-lg bg-white/50 shadow-inner transition-all duration-300 group-hover:bg-white/80 px-2 py-1">
                      <Select
                        value={localFilters.propertyType}
                        onValueChange={(value) => handleFilterChange("propertyType", value)}
                      >
                        <SelectTrigger className="border-0 focus:ring-0 p-0 bg-transparent h-auto text-gray-800 w-full outline-none">
                          <SelectValue placeholder="Property Type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg shadow-lg border-gray-200 bg-white">
                          <SelectItem value="any">Any Type</SelectItem>
                          {Object.keys(PropertyTypeIcons).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#00acee] transition-transform duration-300 group-hover:rotate-180 bg-white/70 rounded-full p-0.5 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                
                <div className="flex items-center px-4 py-2 flex-1 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 w-full md:w-auto">
                  <div className="text-[#00acee] mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 group relative">
                    <div className="relative overflow-hidden rounded-lg bg-white/50 shadow-inner transition-all duration-300 group-hover:bg-white/80 px-2 py-1">
                      <div className="flex space-x-1 items-center">
                        <span className="text-sm text-gray-500">R</span>
                        <Select
                          value={localFilters.priceRange[0].toString()}
                          onValueChange={(value) => handleFilterChange("priceRange", [parseInt(value), localFilters.priceRange[1]])}
                        >
                          <SelectTrigger className="border-0 focus:ring-0 p-0 bg-transparent h-auto text-gray-800 outline-none">
                            <SelectValue placeholder="Min Price" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg shadow-lg border-gray-200 bg-white">
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="1000">1,000</SelectItem>
                            <SelectItem value="2000">2,000</SelectItem>
                            <SelectItem value="3000">3,000</SelectItem>
                            <SelectItem value="5000">5,000</SelectItem>
                            <SelectItem value="7500">7,500</SelectItem>
                            <SelectItem value="10000">10,000</SelectItem>
                            <SelectItem value="15000">15,000</SelectItem>
                            <SelectItem value="20000">20,000</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <span className="text-sm text-gray-500">to</span>
                        
                        <Select
                          value={localFilters.priceRange[1].toString()}
                          onValueChange={(value) => handleFilterChange("priceRange", [localFilters.priceRange[0], parseInt(value)])}
                        >
                          <SelectTrigger className="border-0 focus:ring-0 p-0 bg-transparent h-auto text-gray-800 outline-none">
                            <SelectValue placeholder="Max Price" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg shadow-lg border-gray-200 bg-white">
                            <SelectItem value="5000">5,000</SelectItem>
                            <SelectItem value="10000">10,000</SelectItem>
                            <SelectItem value="15000">15,000</SelectItem>
                            <SelectItem value="20000">20,000</SelectItem>
                            <SelectItem value="25000">25,000</SelectItem>
                            <SelectItem value="30000">30,000</SelectItem>
                            <SelectItem value="50000">50,000</SelectItem>
                            <SelectItem value="75000">75,000</SelectItem>
                            <SelectItem value="100000">100,000+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#00acee] transition-transform duration-300 group-hover:rotate-180 bg-white/70 rounded-full p-0.5 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                
                <div className="px-4 py-2 w-full md:w-auto">
                  <Button 
                    className="relative w-full bg-[#00acee] hover:bg-[#0099d4] text-white rounded-full px-8 py-2 overflow-hidden group"
                    onClick={handleApplyFilters}
                  >
                    <span className="relative z-10 flex items-center justify-center w-full">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search
                    </span>
                    <span className="absolute inset-0 bg-[#0099d4] transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300"></span>
                  </Button>
                </div>
              </div>
            </div>
            
            
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("UJ")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UJ
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("WITS")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to Wits
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("UP")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UP
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("UKZN")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UKZN
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("DUT")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to DUT
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("UCT")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UCT
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full text-xs px-3 py-1 flex items-center cursor-pointer transition-colors"
                onClick={() => handleUniversityClick("TUT")}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to TUT
              </Button>
              <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white text-gray-700 rounded-full text-xs px-3 py-1 flex items-center">
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Close to UFS
              </Button>
            </div>
          </div>
        </div>
        
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-blue-200 dark:bg-blue-800 mb-4"></div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading properties...</div>
            </div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="flex flex-col justify-center items-center min-h-[300px]">
            <div className="text-xl font-semibold mb-2">No properties found</div>
            <p className="text-gray-600">Try adjusting your filters or selecting a different city</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card
                key={property.id}
                property={property}
                isFavorite={false}
                onFavoriteToggle={() => {}}
                propertyLink={`/search/${property.id}`}
                userRole={null}
                showFavoriteButton={false}
                onClick={() => handlePropertyClick(property.id)}
              />
            ))}
          </div>
        )}
        
        
        <div className="mt-10 flex justify-center">
          <Button 
            className="bg-[#00acee] hover:bg-[#00acee] text-white px-8 py-2 rounded-full"
            onClick={() => {
              
              setLocalFilters({
                location: `${selectedCity}, South Africa`,
                propertyType: "any",
                priceRange: [2000, 50000] as [number, number],
              });
              
              
              setTimeout(handleApplyFilters, 0);
            }}
          >
            View All Properties in {selectedCity}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RandomListings;
