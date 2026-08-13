"use client"

import type React from "react"
import type { ImageLoaderProps } from "next/image"
import { Bath, Bed, Edit, Heart, Home, MapPin, Star, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { resolveCarImageUrl } from "@/utils/imageUrl"

interface PropertyCardProps {
  property: {
    id: number
    name: string
    location: {
      address: string
      city: string
    }
    photoUrls?: string[]
    images?: string[]
    beds: number
    baths: number
    squareFeet: number
    pricePerMonth?: number
    price?: number
    averageRating?: number
    numberOfReviews: number
    isPetsAllowed?: boolean
    isParkingIncluded?: boolean
    isNsfassAccredited?: boolean
    availableRooms?: number
  }
  isFavorite?: boolean
  onFavoriteToggle?: () => void
  showFavoriteButton?: boolean
  propertyLink?: string
  showActions?: boolean
  userRole?: "tenant" | "manager" | "admin" | null
  onClick?: () => void
}

function PropertyCard({
  property,
  isFavorite = false,
  onFavoriteToggle,
  showFavoriteButton = true,
  propertyLink,
  showActions = false,
  userRole = null,
  onClick,
}: PropertyCardProps) {
  
  const [imgSrc, setImgSrc] = useState<string>(
    resolveCarImageUrl(
      property.images && property.images.length > 0 ? property.images[0] :
      property.photoUrls && property.photoUrls.length > 0 ? property.photoUrls[0] :
      "/placeholder.jpg"
    )
  )
  const [isHovered, setIsHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

  
  const loaderFunc = ({ src }: ImageLoaderProps) => {
    return src
  }

  
  const handleImageError = () => {
    console.error(`Failed to load image: ${imgSrc}`)
    setImgError(true)
    setImgSrc("/placeholder.jpg")
  }

  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <Card
      className="group overflow-hidden transition-all mt-6 duration-300 hover:shadow-md border border-gray-200 bg-white rounded-xl relative max-w-sm cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative w-full aspect-[4/3] px-2 overflow-hidden">
        <div className="relative w-full h-full">
          {!imgError ? (
            <Image
              src={imgSrc}
              alt={property.name}
              fill
              loader={loaderFunc}
              unoptimized={true}
              className={`object-cover   transition-transform rounded-xl duration-500 ${isHovered ? "scale-110" : "scale-100"}`}
              onError={handleImageError}
              
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Home className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        
        

        
        <div className="absolute top-3 right-4 z-20">
          <div className="bg-[#00acee] shadow-md text-white px-3 py-1.5 rounded-lg flex items-center border border-[#00acee]">
            <span className="font-bold">R {(property.price || property.pricePerMonth || 0).toLocaleString('en-ZA')}</span>
            <span className="text-xs text-blue-100 ml-1">/month</span>
          </div>
        </div>
        
        
        {property.availableRooms !== undefined && property.availableRooms > 0 && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-green-500 text-white text-xs font-medium">
              {property.availableRooms} {property.availableRooms === 1 ? 'Room' : 'Rooms'} Available
            </Badge>
          </div>
        )}

        
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 z-20">
          {property.isPetsAllowed && (
            <Badge className="bg-white/90 text-gray-800 text-xs font-medium backdrop-blur-sm border border-gray-200">
              Pets Allowed
            </Badge>
          )}
          {property.isParkingIncluded && (
            <Badge className="bg-white/90 text-gray-800 text-xs font-medium backdrop-blur-sm border border-gray-200">
              Parking Included
            </Badge>
          )}
          {property.isNsfassAccredited && (
            <Badge className="bg-green-100/90 text-green-800 text-xs font-medium backdrop-blur-sm border border-green-300">
              NSFAS Accredited
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 bg-white">
        <div>
          <div className="flex items-start justify-between mb-1">
            <h2 className="line-clamp-1 text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              {propertyLink ? (
                <Link href={propertyLink} className="hover:text-blue-600" scroll={false}>
                  {property.name}
                </Link>
              ) : (
                property.name
              )}
            </h2>
            <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-gray-800">{(property.averageRating || 0).toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <p className="line-clamp-1">
              {property.location.address}, {property.location.city}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-gray-50 border border-gray-100">
            <Bed className="h-4 w-4 mb-1 text-blue-500" />
            <span className="font-medium text-gray-800">{property.beds}</span>
            <span className="text-xs text-gray-500">Beds</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-gray-50 border border-gray-100">
            <Bath className="h-4 w-4 mb-1 text-blue-500" />
            <span className="font-medium text-gray-800">{property.baths}</span>
            <span className="text-xs text-gray-500">Baths</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-md bg-gray-50 border border-gray-100">
            <Home className="h-4 w-4 mb-1 text-blue-500" />
            <span className="font-medium text-gray-800">{property.squareFeet}</span>
            <span className="text-xs text-gray-500">m²</span>
          </div>
        </div>
        
        
        {property.availableRooms !== undefined && property.availableRooms > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <Bed className="h-4 w-4 mr-1" /> Available Rooms
            </h3>
            <div className="space-y-2">
              
              <div className="bg-white p-2 rounded border border-blue-100 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Standard Room</p>
                  <p className="text-xs text-gray-500">Private Bath • 18m²</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#00acee]">R {Math.round((property.pricePerMonth || property.price || 0) * 0.6).toLocaleString('en-ZA')}</p>
                  <p className="text-xs text-gray-500">per month</p>
                </div>
              </div>
              
              
              {property.availableRooms > 1 && (
                <div className="bg-white p-2 rounded border border-blue-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Deluxe Room</p>
                    <p className="text-xs text-gray-500">Private Bath • 22m²</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">R {Math.round((property.pricePerMonth || property.price || 0) * 0.8).toLocaleString('en-ZA')}</p>
                    <p className="text-xs text-gray-500">per month</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center mt-1">
                <Link href={propertyLink || `#`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  View all {property.availableRooms} available rooms
                </Link>
              </div>
            </div>
          </div>
        )}

        
        {showFavoriteButton && (
          <Button
            size="icon"
            variant="ghost"
            className={`absolute top-3 right-3 h-8 w-8 rounded-full p-0 z-20 transition-all duration-300 ${
              isFavorite 
                ? "bg-white text-red-500 shadow-md border border-red-200" 
                : "bg-white/90 text-gray-600 backdrop-blur-sm border border-gray-200 shadow-sm hover:text-red-400"
            }`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onFavoriteToggle?.()
            }}
            title="Add to favorites"
          >
            <Heart className={`h-4 w-4 transition-all duration-300 ${isFavorite ? "fill-red-500 scale-110" : ""}`} />
            <span className="sr-only">Toggle favorite</span>
          </Button>
        )}
        
        
      </div>
    </Card>
  );
}

export default PropertyCard;
