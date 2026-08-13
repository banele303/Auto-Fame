"use client"

import type { ImageLoaderProps } from "next/image"
import { Car, Gauge, Heart, MapPin, Star, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from 'next/navigation'
import { resolveCarImageUrl } from "@/utils/imageUrl"

interface ModernCarCardProps {
  car: {
    id: number
    make: string
    model: string
    year: number
    price: number
    mileage: number
    condition: string
    carType: string
    fuelType: string
    transmission: string
    engine: string
    exteriorColor: string
    interiorColor: string
    description: string
    features?: string[]
    photoUrls?: string[]
    status: string
    postedDate: string
    updatedAt: string
    averageRating?: number
    numberOfReviews?: number
    dealershipId: number
    employeeId?: string | null
    dealership: {
      id: number
      name: string
      address: string
      city: string
      state: string
      country: string
      postalCode: string
      phoneNumber: string
      email: string
      website?: string | null
    }
  }
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  showFavoriteButton?: boolean
  carLink?: string
  showActions?: boolean
  userRole?: "customer" | "employee" | null
}

function ModernCarCard({
  car,
  isFavorite = false,
  onFavoriteToggle,
  showFavoriteButton = true,
  carLink,
  showActions = false,
  userRole = null,
}: ModernCarCardProps) {
  const [imgSrc, setImgSrc] = useState<string>(resolveCarImageUrl(car.photoUrls?.[0]) || "/placeholder.jpg")
  const [isHovered, setIsHovered] = useState(false)
  const [imgError, setImgError] = useState(false)
  const router = useRouter()

  const handleImageError = () => {
    console.error(`Failed to load image: ${imgSrc}`)
    setImgError(true)
    setImgSrc("/placeholder.jpg")
  }

  const targetHref = carLink || `/cars/${car.id}`

  const handleNavigate = () => router.push(targetHref)
  const handleKey: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigate();
    }
  }

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-md bg-white dark:bg-slate-950 md:ml-[1.8rem] border border-gray-200 dark:border-[#333] rounded-lg relative h-[180px] w-full max-w-lg mx-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleNavigate}
      role="link"
      tabIndex={0}
      onKeyDown={handleKey}
      aria-label={`${car.year} ${car.make} ${car.model}`}
    >
      {/* Full-card invisible link overlay for semantics (non-interactive due to role on Card) */}
      <Link href={targetHref} aria-hidden className="absolute inset-0 z-10" tabIndex={-1} />
      <div className="flex h-full">
        
        <div className="w-2/5 h-full p-2">
          <div className="relative w-full h-full rounded-lg overflow-hidden">
            {!imgError ? (
              <Image
                src={imgSrc || "/placeholder.svg"}
                alt={`${car.make} ${car.model}`}
                fill
                className={`object-cover transition-transform duration-500 ${isHovered ? "scale-105" : "scale-100"}`}
                onError={handleImageError}
                sizes="(max-width: 768px) 40vw, 160px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg">
                <Car className="h-10 w-10 text-gray-400 dark:text-gray-600" />
              </div>
            )}

            
            <div className="absolute top-2 left-2 z-20">
              <div className="bg-blue-600 backdrop-blur-md text-white px-2 py-1 rounded text-xs flex items-center shadow-sm border border-blue-700">
                <span className="font-bold">
                  {`R${car.price.toLocaleString()}`}
                </span>
              </div>
            </div>

            
            {showFavoriteButton && (
              <Button
                size="icon"
                variant="ghost"
                className={`absolute top-2 right-2 h-6 w-6 rounded-full p-0 z-20 transition-all duration-300 ${
                  isFavorite
                    ? "bg-[#0F1112]/80 text-red-500 shadow-sm border border-red-500/50"
                    : "bg-[#0F1112]/80 text-white/80 backdrop-blur-sm border border-[#333] shadow-sm"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  onFavoriteToggle?.()
                }}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={`h-3 w-3 transition-all duration-300 ${isFavorite ? "fill-red-500 scale-110" : ""}`}
                />
                <span className="sr-only">Toggle favorite</span>
              </Button>
            )}
          </div>
        </div>

        
        <div className="flex-1 flex flex-col justify-between p-3">
          <div className="relative z-20">
            <h2 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-0.5">
              {`${car.year} ${car.make} ${car.model}`}
            </h2>

            <div className="flex items-center text-sm text-gray-700 dark:text-white/80 mb-1">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0 text-gray-500 dark:text-gray-400" />
              <p className="line-clamp-1 text-[10px]">
                {car.dealership.name}, {car.dealership.city}
              </p>
            </div>

            <div className="flex gap-2">
              <div className="flex items-center text-[10px] text-gray-700 dark:text-white/80">
                <Users className="h-3 w-3 mr-0.5 text-blue-500 dark:text-blue-400" />
                <span>{car.carType}</span>
              </div>

              <div className="flex items-center text-[10px] text-gray-700 dark:text-white/80">
                <Gauge className="h-3 w-3 mr-0.5 text-blue-500 dark:text-blue-400" />
                <span>{car.mileage.toLocaleString()} km</span>
              </div>
            </div>
          </div>

          {car.averageRating && (
            <div className="flex items-center mt-1 text-[10px]">
              <div className="flex items-center">
                <Star className="h-3 w-3 mr-0.5 text-yellow-400 fill-yellow-400" />
                <span className="text-gray-900 dark:text-white/90 font-medium">
                  {car.averageRating.toFixed(1)}
                </span>
              </div>
              {car.numberOfReviews && (
                <span className="text-[10px] text-gray-500 dark:text-white/60 ml-1">({car.numberOfReviews})</span>
              )}
            </div>
          )}

          
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-[8px] px-1.5 py-0.5 rounded-full font-medium border border-green-300 dark:border-green-700">
              Available
            </span>
            {car.fuelType && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-[8px] px-1.5 py-0.5 rounded-full font-medium border border-blue-300 dark:border-blue-700">
                {car.fuelType.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ModernCarCard
