"use client"

import { Car, Gauge, Heart, MapPin, Star, Users } from "lucide-react" 
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from 'next/navigation'
import { resolveCarImageUrl } from "@/utils/imageUrl"

interface CarCardCompactProps { 
  car: { 
    id: number
    make: string
    model: string
    year: number
    dealership: {
      name: string
      city: string
    }
    photoUrls?: string[]
    carType: string 
    fuelType: string 
    mileage: number 
    price: number 
    averageRating: number
    numberOfReviews: number
    condition?: string 
    transmission?: string 
  }
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  showFavoriteButton?: boolean
  carLink?: string 
}

export default function DashboardCompactCarCard({ 
  car, 
  isFavorite = false,
  onFavoriteToggle,
  showFavoriteButton = true,
  carLink, 
}: CarCardCompactProps) { 
  const [imgSrc, setImgSrc] = useState(resolveCarImageUrl(car.photoUrls?.[0]) || "/placeholder.svg?height=300&width=300")
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  const targetHref = carLink || `/cars/${car.id}`
  const go = () => router.push(targetHref)
  const onKey: React.KeyboardEventHandler<HTMLDivElement> = e => { if (e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } }

  return (
    <Card 
      className="flex flex-row h-auto min-h-[160px] overflow-hidden transition-all duration-300 hover:shadow-xl border border-[#333] bg-black rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={go}
      role="link"
      tabIndex={0}
      onKeyDown={onKey}
      aria-label={`${car.year} ${car.make} ${car.model}`}
    >
      <Link href={targetHref} className="absolute inset-0 z-10" aria-hidden tabIndex={-1} />
      <div className="relative h-full w-1/3 min-w-[120px] overflow-hidden">
        <Image
          src={imgSrc || "/placeholder.svg"}
          alt={`${car.year} ${car.make} ${car.model}`} 
          fill
          className={`object-cover transition-transform duration-500 ${isHovered ? "scale-110" : "scale-100"}`}
          sizes="(max-width: 768px)"
          onError={() => setImgSrc("/placeholder.svg?height=300&width=300")}
          priority
        />
        
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-10" />
        
        
        <div className="absolute bottom-2 left-2 flex flex-col gap-1.5 z-20">
          {car.condition && (
            <Badge className="bg-black/80 text-white text-xs font-medium backdrop-blur-sm border border-[#333]">
              {car.condition.replace(/_/g, ' ')} 
            </Badge>
          )}
          {car.transmission && (
            <Badge className="bg-black/80 text-white text-xs font-medium backdrop-blur-sm border border-[#333]">
              {car.transmission.replace(/_/g, ' ')} 
            </Badge>
          )}
        </div>
      </div>
      
      <div className="relative flex w-2/3 flex-col justify-between p-3 sm:p-4 bg-black text-white">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="line-clamp-1 text-base font-bold sm:text-lg group-hover:text-blue-400 transition-colors relative z-20">
              {`${car.year} ${car.make} ${car.model}`}
            </h2>
            {showFavoriteButton && (
              <Button
                size="icon"
                variant="ghost"
                className={`h-6 w-6 shrink-0 rounded-full p-0 transition-colors ${
                  isFavorite ? "text-red-500" : "text-gray-400 hover:text-white"
                }`}
                onClick={onFavoriteToggle}
              >
                <Heart className={`h-4 w-4 transition-all duration-300 ${isFavorite ? "fill-red-500 scale-110" : ""}`} />
                <span className="sr-only">Toggle favorite</span>
              </Button>
            )}
          </div>
          
          <div className="flex items-center text-xs text-gray-400">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <p className="line-clamp-1">
              {car.dealership.name}, {car.dealership.city} 
            </p>
          </div>
          
          <div className="flex items-center gap-1 bg-[#111] px-2 py-0.5 rounded-md border border-[#333] w-fit">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium">{car.averageRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({car.numberOfReviews})</span>
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-2 text-xs text-gray-400 sm:text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> 
              <span>{car.carType}</span> 
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" /> 
              <span>{car.fuelType}</span> 
            </div>
            <div className="flex items-center gap-1">
              <Car className="h-3.5 w-3.5" /> 
              <span>{car.mileage.toLocaleString()} km</span> 
            </div>
          </div>
          
          <div className="bg-black/80 backdrop-blur-md text-white px-2 py-1 rounded-md flex items-center shadow-md border border-[#333]">
            <span className="font-bold text-sm sm:text-base">
              R{car.price.toFixed(0)} 
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}