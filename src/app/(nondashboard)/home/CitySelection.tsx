"use client";

import React, { useEffect, KeyboardEvent, ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setFilters } from "@/state";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CityCardProps {
  city: {
    name: string;
    shortName?: string;
    description: string;
    image: string;
    coordinates?: [number, number];
    lat?: number;
    lng?: number;
  };
  index: number;
}

const cities = [
  {
    name: "Johannesburg",
    shortName: "Jo'burg",
    description: "Find res in Jo'burg",
    image:
      "https://images.unsplash.com/photo-1577948000111-9c970dfe3743?q=80&w=1974&auto=format&fit=crop",
    coordinates: [28.042114, -26.204678] as [number, number],
    lat: -26.1825,
    lng: 28.0002,
  },
  {
    name: "Cape Town",
    description: "Find res in Cape Town",
    image:
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?q=80&w=2071&auto=format&fit=crop",
    coordinates: [18.4241, -33.9249] as [number, number],
    lat: -33.9249,
    lng: 18.4241,
  },
  {
    name: "Durban",
    description: "Accommodations Durban",
    image:
      "/durban.png",
    coordinates: [31.0218, -29.8587] as [number, number],
    lat: -29.8587,
    lng: 31.0218,
  },
  {
    name: "Pretoria",
    description: "Find res in Pretoria",
    image:
      "/pretoria.png",
    coordinates: [28.1881, -25.7461] as [number, number],
    lat: -25.7461,
    lng: 28.1881,
  },
  {
    name: "Bloemfontein",
    description: "Find res in Bloemfontein",
    image:
      "/Bloemfontein.jpg",
    coordinates: [26.2041, -29.0852] as [number, number],
    lat: -29.0852,
    lng: 26.2041,
  },
];

const CityCard = ({ city, index }: CityCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleCityClick = () => {
    
    const fullLocation = `${city.name}, South Africa`;
    
    
    dispatch(
      setFilters({
        location: fullLocation,
        coordinates: city.coordinates || [0, 0] as [number, number],
      })
    );
    
    
    const params = new URLSearchParams({
      location: fullLocation,
      coordinates: city.coordinates ? city.coordinates.toString() : '0,0',
      lat: city.lat?.toString() || '0',
      lng: city.lng?.toString() || '0',
    });
    
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleCityClick}
    >
      <div className="relative h-[180px] w-full overflow-hidden rounded-2xl">
        <Image
          src={city.image || "/placeholder.svg"}
          alt={city.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        
        <div className="absolute bottom-0 left-0 w-full p-5 z-10">
          <div className="flex items-center mb-1">
            <MapPin className="w-4 h-4 text-[#4F9CF9] mr-1" />
            <h3 className="text-xl font-bold text-white">{city.name}</h3>
          </div>
          <p className="text-sm text-gray-300">{city.description}</p>

          <motion.div
            className="flex items-center mt-3 text-[#4F9CF9] text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <span>Explore properties in {city.name}</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </motion.div>
        </div>

        
        <motion.div
          className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
};

export default function CitySelection() {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("rent");
  const [scrolled, setScrolled] = useState<boolean>(false);

  const handleLocationSearch = async () => {
    try {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) return;
      
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          trimmedQuery
        )}.json?access_token=${
          process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        }&fuzzyMatch=true&types=place,locality,neighborhood,address,poi`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        
        const locationName = feature.place_name.split(',')[0];
        
        
        dispatch(
          setFilters({
            location: locationName,
            coordinates: [lng, lat] as [number, number],
          })
        );
        
        
        const params = new URLSearchParams({
          location: locationName,
          coordinates: `${lng},${lat}`,
          lat: lat.toString(),
          lng: lng.toString(),
        });
        
        router.push(`/search?${params.toString()}`);
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLocationSearch();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="py-12 px-4 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {cities.map((city, index) => (
            <CityCard key={city.name} city={city} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
