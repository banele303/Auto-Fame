"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Car, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Gauge, 
  ClipboardList, 
  Users,
  Building,
  Eye,
  DollarSign,
  MessageSquare,
  Calendar,
  Key,
  Fuel,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetCarQuery } from "@/state/api";
import { DetailPageSkeleton } from "@/components/ui/skeletons";


export default function AdminCarDetailsPage() {
  const params = useParams();
  const carId = Number(params.id);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  
  const { data: car, isLoading: carLoading, error: carError } = useGetCarQuery(carId);

  if (carLoading) {
    return <DetailPageSkeleton />;
  }
  
  if (carError) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <Card className="p-6">
          <p className="text-red-500">{(carError as any)?.data?.message || "Failed to load car information. Please try again."}</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push("/admin/cars")}
          >
            Go to Cars List
          </Button>
        </Card>
      </div>
    );
  }
  
  const carData = {
    id: car?.id || carId,
    make: car?.make || "Unknown",
    model: car?.model || "Car",
    year: car?.year || 0,
    price: car?.price || 0,
    mileage: car?.mileage || 0,
    condition: car?.condition || "Unknown",
    carType: car?.carType || "",
    fuelType: car?.fuelType || "",
    transmission: car?.transmission || "",
    engine: car?.engine || "",
    exteriorColor: car?.exteriorColor || "",
    interiorColor: car?.interiorColor || "",
    description: car?.description || "",
    features: car?.features || [],
    photoUrls: car?.photoUrls || [],
    status: car?.status || "UNKNOWN",
    postedDate: car?.postedDate || "",
    updatedAt: car?.updatedAt || "",
    averageRating: car?.averageRating || 0,
    numberOfReviews: car?.numberOfReviews || 0,
    vin: car?.vin || "N/A",
    dealership: (car as any)?.dealership || { id: 0, name: "Unknown Dealership" },
    employee: (car as any)?.employee || { id: 0, name: "Unknown Employee" },
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Car Details</h1>
      </div>
      
      
      <Card className={cn(
        "p-6 mb-6",
        isDark ? "bg-slate-800" : "bg-white"
      )}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold mr-4",
              isDark ? "bg-blue-800 text-white" : "bg-blue-100 text-blue-800"
            )}>
              {carData.make && carData.make.length > 0 ? carData.make.charAt(0).toUpperCase() : "C"}
            </div>
            <div>
              <h2 className="text-xl font-bold">{`${carData.year} ${carData.make} ${carData.model}`}</h2>
              <div className="flex items-center text-sm mt-1">
                <Key className="h-4 w-4 mr-1 text-blue-500" />
                <span>VIN: {carData.vin}</span>
              </div>
              <div className="flex items-center text-sm mt-1">
                <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                <span>{carData.dealership?.name || "N/A"}</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className={cn(
              "px-3 py-1 rounded-full inline-block",
              carData.status === "AVAILABLE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
              carData.status === "SOLD" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
              "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            )}>
              {carData.status}
            </div>
          </div>
        </div>
      </Card>
      
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className={cn(
          "p-4",
          isDark ? "bg-slate-800" : "bg-white"
        )}>
          <div className="flex items-center">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center mr-3",
              isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"
            )}>
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="text-xl font-bold">R{carData.price.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className={cn(
          "p-4",
          isDark ? "bg-slate-800" : "bg-white"
        )}>
          <div className="flex items-center">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center mr-3",
              isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-600"
            )}>
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Mileage</p>
              <p className="text-xl font-bold">{carData.mileage.toLocaleString()} km</p>
            </div>
          </div>
        </Card>
        
        <Card className={cn(
          "p-4",
          isDark ? "bg-slate-800" : "bg-white"
        )}>
          <div className="flex items-center">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center mr-3",
              isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-600"
            )}>
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Year</p>
              <p className="text-xl font-bold">{carData.year}</p>
            </div>
          </div>
        </Card>
        
        <Card className={cn(
          "p-4",
          isDark ? "bg-slate-800" : "bg-white"
        )}>
          <div className="flex items-center">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center mr-3",
              isDark ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-600"
            )}>
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Reviews</p>
              <p className="text-xl font-bold">{carData.numberOfReviews || 0}</p>
            </div>
          </div>
        </Card>
      </div>
      
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        
        
        <TabsContent value="overview" className="mt-4">
          <div className="space-y-4">
            <Card className={cn(
              "p-4 hover:shadow-md transition-shadow",
              isDark ? "bg-slate-800" : "bg-white"
            )}>
              <h3 className="font-medium mb-2">Vehicle Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Condition</p>
                  <p className="font-medium">{carData.condition}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Car Type</p>
                  <p className="font-medium">{carData.carType || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fuel Type</p>
                  <p className="font-medium">{carData.fuelType || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transmission</p>
                  <p className="font-medium">{carData.transmission || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Engine</p>
                  <p className="font-medium">{carData.engine || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">VIN</p>
                  <p className="font-medium">{carData.vin}</p>
                </div>
              </div>
            </Card>
            
            <Card className={cn(
              "p-4 hover:shadow-md transition-shadow",
              isDark ? "bg-slate-800" : "bg-white"
            )}>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-gray-500">{carData.description || "No description available."}</p>
            </Card>
            
            <Card className={cn(
              "p-4 hover:shadow-md transition-shadow",
              isDark ? "bg-slate-800" : "bg-white"
            )}>
              <h3 className="font-medium mb-2">Features</h3>
              <div className="flex flex-wrap gap-2">
                {carData.features.length > 0 ? (
                  carData.features.map((feature, index) => (
                    <Badge key={index} variant="secondary">{feature}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No features listed.</p>
                )}
              </div>
            </Card>
            
            <Card className={cn(
              "p-4 hover:shadow-md transition-shadow",
              isDark ? "bg-slate-800" : "bg-white"
            )}>
              <h3 className="font-medium mb-2">Colors</h3>
              <p className="text-sm text-gray-500">Exterior: {carData.exteriorColor || "N/A"}, Interior: {carData.interiorColor || "N/A"}</p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
