"use client";

import type React from "react";

import {
  Car, 
  Gauge, 
  Users, 
  Edit,
  Heart,
  MapPin,
  Star,
  Trash2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveCarImageUrl } from "@/utils/imageUrl";

interface CarCardProps { 
  car: { 
    id: number;
    make: string; 
    model: string; 
    year: number; 
    dealership: { 
      name: string; 
      city: string;
    };
    photoUrls?: string[];
    carType: string; 
    fuelType: string; 
    mileage: number; 
    price: number; 
    averageRating?: number;
    numberOfReviews?: number;
    condition?: string; 
    transmission?: string; 
  };
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  showFavoriteButton?: boolean;
  carLink?: string; 
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (id: number) => void;
  showActions?: boolean;
}

export default function CarCardDashboard({
  car, 
  isFavorite = false,
  onFavoriteToggle,
  showFavoriteButton = true,
  carLink, 
  onDelete,
}: CarCardProps) { 
  const [imgSrc, setImgSrc] = useState(resolveCarImageUrl(car.photoUrls?.[0]));

  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(car.id); 
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/employees/cars/${car.id}/edit`); 
  };

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl border border-[#333] bg-gradient-to-br from-blue-950/80 to-black rounded-xl relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 z-0"></div>
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl"></div>

      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <Image
          src={imgSrc ?? "/placeholder.jpg"}
          alt={`${car.year} ${car.make} ${car.model}`} 
          fill
          className={`object-cover transition-transform duration-500 ${
            isHovered ? "scale-110" : "scale-100"
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(err) => setImgSrc("/placeholder.jpg")}
          priority
        />

        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1112] via-transparent to-[#0F1112]/40 z-10" />

        
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-[#0F1112]/80 backdrop-blur-md text-white px-3 py-1.5 rounded-md flex items-center shadow-lg border border-[#333]">
            <span className="font-bold">
              R{car.price.toFixed(0)} 
            </span>
          </div>
        </div>

        
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 z-20">
          {car.condition && (
            <Badge className="bg-black/70 text-white text-xs font-medium backdrop-blur-sm border border-[#333]">
              {car.condition.replace(/_/g, ' ')} 
            </Badge>
          )}
          {car.transmission && (
            <Badge className="bg-black/70 text-white text-xs font-medium backdrop-blur-sm border border-[#333]">
              {car.transmission.replace(/_/g, ' ')} 
            </Badge>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4 bg-transparent relative z-10">
        <div>
          <div className="flex items-start justify-between mb-1">
            <h2 className="line-clamp-1 text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
              {carLink ? ( 
                <Link
                  href={carLink} 
                  className="hover:text-blue-400"
                  scroll={false}
                >
                  {`${car.year} ${car.make} ${car.model}`} 
                </Link>
              ) : (
                `${car.year} ${car.make} ${car.model}` 
              )}
            </h2>
            {car.averageRating && (
              <div className="flex items-center gap-1 bg-[#111] px-2 py-0.5 rounded-md border border-[#333]">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium text-white">
                  {car.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center text-sm text-gray-400 mb-3">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <p className="line-clamp-1">
              {car.dealership.name}, {car.dealership.city} 
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-[#111]/80 backdrop-blur-sm border border-[#333]">
            <Users className="h-4 w-4 mb-1 text-blue-400" /> 
            <span className="font-medium text-white">{car.carType}</span> 
            <span className="text-xs text-gray-400">Type</span> 
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-[#111]/80 backdrop-blur-sm border-[#333]">
            <Gauge className="h-4 w-4 mb-1 text-blue-400" /> 
            <span className="font-medium text-white">{car.fuelType}</span> 
            <span className="text-xs text-gray-400">Fuel</span> 
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-[#111]/80 backdrop-blur-sm border-[#333]">
            <Car className="h-4 w-4 mb-1 text-blue-400" /> 
            <span className="font-medium text-white">
              {car.mileage.toLocaleString()}
            </span> 
            <span className="text-xs text-gray-400">km</span> 
          </div>
        </div>

        

        <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#333]/80 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-[#111]/80 backdrop-blur-sm border-[#333] hover:bg-[#222] text-white"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="flex-1 bg-red-900/30 hover:bg-red-900/50 border-red-700/50 backdrop-blur-sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        
        {showFavoriteButton && (
          <Button
            size="icon"
            variant="ghost"
            className={`absolute top-4 right-4 h-9 w-9 rounded-full p-0 z-20 transition-all duration-300 ${
              isFavorite
                ? "bg-white/90 text-red-500 shadow-lg"
                : "bg-black/70 text-white backdrop-blur-sm border border-[#333] shadow-lg"
            }`}
            onClick={(e) => {
              e.preventDefault();
              onFavoriteToggle?.();
            }}
          >
            <Heart
              className={`h-5 w-5 transition-all duration-300 ${
                isFavorite ? "fill-red-500 scale-110" : ""
              }`}
            />
            <span className="sr-only">Toggle favorite</span>
          </Button>
        )}
      </div>
    </Card>
  );
}