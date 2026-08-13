"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Car, Calendar, Fuel, Gauge, Heart, Eye, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveCarImageUrl } from "@/utils/imageUrl";

interface CarCardProps {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  condition: string;
  transmission: string;
  photoUrls: string[];
  features: string[];
  averageRating?: number;
  isFavorited?: boolean;
  onFavoriteToggle?: (id: number) => void;
  
  onViewDetails?: (id: number) => void;
  onScheduleTestDrive?: (id: number) => void;
}

const CarCard: React.FC<CarCardProps> = ({
  id,
  make,
  model,
  year,
  price,
  mileage,
  fuelType,
  condition,
  transmission,
  photoUrls,
  features,
  averageRating,
  isFavorited = false,
  onFavoriteToggle,
  onViewDetails,
  onScheduleTestDrive,
}) => {
  const formatPrice = (price: number) => {
    return `R ${price.toLocaleString()}`;
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'certified pre-owned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'used':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const router = useRouter();
  const goToDetails = () => {
    if (onViewDetails) onViewDetails(id); else router.push(`/cars/${id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-200 dark:border-gray-700 cursor-pointer"
      onClick={goToDetails}
      role="button"
      tabIndex={0}
      onKeyDown={(e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToDetails(); } }}
    >
      
      <div className="relative h-48 overflow-hidden rounded-t-2xl">
        <Image
          src={resolveCarImageUrl(photoUrls[0]) || "/placeholder.jpg"}
          alt={`${year} ${make} ${model}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Floating Badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-[#00A211] hover:bg-[#009210] text-white font-semibold px-3 py-1 rounded-full text-xs">
            Available
          </Badge>
        </div>

        
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => { e.stopPropagation(); onFavoriteToggle?.(id); }}
            className={`p-2 rounded-full shadow-md transition-all duration-200 ${
              isFavorited 
                ? 'bg-red-500 text-white' 
                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
          >
            <Heart size={18} className={isFavorited ? 'fill-current' : ''} />
          </button>
        </div>

        
        {photoUrls.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2.5 py-1 rounded-full text-xs font-medium">
            +{photoUrls.length - 1}
          </div>
        )}
      </div>

      
      <div className="p-5">
        
        <div className="mb-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 leading-tight">
            {year} {make} {model}
          </h3>
          <div className="text-3xl font-bold text-[#00acee]">
            {formatPrice(price)}
          </div>
          
          {averageRating && (
            <div className="flex items-center mt-1">
              <div className="flex text-yellow-400">
                {'★'.repeat(Math.floor(averageRating))}
                {'☆'.repeat(5 - Math.floor(averageRating))}
              </div>
              <span className="text-sm text-gray-500 ml-1">
                ({averageRating.toFixed(1)})
              </span>
            </div>
          )}
        </div>

        
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Calendar size={16} className="mr-2 text-gray-500" />
            <span>{year}</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Gauge size={16} className="mr-2 text-gray-500" />
            <span>{mileage.toLocaleString()} km</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Fuel size={16} className="mr-2 text-gray-500" />
            <span>{fuelType}</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Car size={16} className="mr-2 text-gray-500" />
            <span>{transmission}</span>
          </div>
        </div>

        
        <div className="mb-5">
          <div className="flex flex-wrap gap-2">
            {features.slice(0, 3).map((feature, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full"
              >
                {feature}
              </Badge>
            ))}
            {features.length > 3 && (
              <Badge
                variant="secondary"
                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full"
              >
                +{features.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={(e) => { e.stopPropagation(); onViewDetails ? onViewDetails(id) : router.push(`/cars/${id}`); }}
            className="w-full border-[#00acee] text-[#00acee] hover:bg-[#00acee] hover:text-white transition-colors font-bold py-2 rounded-xl shadow-md hover:shadow-lg"
          >
            <Eye size={18} className="mr-2" />
            View Details
          </Button>
          <Button
            size="lg"
            onClick={(e) => { e.stopPropagation(); onScheduleTestDrive?.(id); }}
            className="w-full bg-[#00acee] hover:bg-[#0099d4] text-white font-bold py-2 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Phone size={18} className="mr-2" />
            Test Drive
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default CarCard;
