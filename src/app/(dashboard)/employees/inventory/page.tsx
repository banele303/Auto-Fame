"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetAuthUserQuery, useGetEmployeeCarsQuery, useDeleteCarMutation } from "@/state/api"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CarCardSkeleton } from "@/components/ui/skeletons";
import {
  Plus,
  Loader2,
  Search,
  Car,
  Gauge,
  Users,
  MapPin,
  Edit3,
  Trash2,
  ArrowUpDown,
  Fuel,
  Key,
  Truck,
  Filter
} from 'lucide-react'; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Inventory = () => { 
  const router = useRouter();
  const { data: authUser } = useGetAuthUserQuery();
  const {
    data: employeeCars,
    isLoading,
    error,
    refetch,
  } = useGetEmployeeCarsQuery(authUser?.cognitoInfo?.userId || "", { 
    skip: !authUser?.cognitoInfo?.userId,
  });
  
  const [deleteCar, { isLoading: isDeleteCarLoading }] = useDeleteCarMutation(); 

  const [deleteCarId, setDeleteCarId] = useState<number | null>(null); 
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"make" | "price" | "year">("make"); 

  
  const filteredCars = employeeCars?.filter(car => 
    car.make.toLowerCase().includes(searchTerm.toLowerCase()) || 
    car.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
    car.vin.toLowerCase().includes(searchTerm.toLowerCase()) 
  );

  
  const sortedCars = [...(filteredCars || [])].sort((a, b) => { 
    if (sortBy === "price") return a.price - b.price; 
    if (sortBy === "year") return a.year - b.year; 
    return a.make.localeCompare(b.make); 
  });

  const handleEditCar = (id: number) => { 
    router.push(`/employees/inventory/${id}/edit`); 
  };

  const handleDeleteCar = (id: number) => { 
    setDeleteCarId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteCarId || !authUser?.cognitoInfo?.userId) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteCar(deleteCarId.toString()).unwrap();
      
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting car:", error);

      if (error.message?.includes("token") || error.message?.includes("unauthorized") || error.message?.includes("Unauthorized")) {
        setErrorMessage("Your session has expired. Please log in again.");
      } else {
        setErrorMessage(error.data?.message || error.message || "An unexpected error occurred.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2"></div>
          <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <CarCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg max-w-md text-center">
          <h3 className="font-semibold mb-2">Error Loading Inventory</h3> 
          <p className="text-sm">{(error as any)?.data?.message || "Failed to load inventory. Please try again later."}</p> 
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            My Inventory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            View and manage your car listings
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push("/employees/newcar")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 shadow-sm dark:shadow-blue-900/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Car
          </Button>
        </div>
      </div>
      
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search cars by make, model, or VIN..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span>Sort by</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="make">Make</SelectItem> 
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="year">Year</SelectItem> 
            </SelectContent>
          </Select>
        </div>
      </div>

      
      <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
        <Filter className="h-4 w-4 mr-2 text-blue-500" />
        Showing <span className="font-semibold mx-1 text-blue-600 dark:text-blue-400">{sortedCars.length}</span> of <span className="font-semibold mx-1 text-blue-600 dark:text-blue-400">{employeeCars?.length || 0}</span> cars
      </div>
      
      
      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}
      
      
      {sortedCars && sortedCars.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-[1700px] mx-auto">
          {sortedCars.map((car) => (
            <CarCard 
              key={car.id} 
              car={car} 
              onEdit={handleEditCar} 
              onDelete={handleDeleteCar} 
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full mb-4">
            <Car className="h-8 w-8 text-slate-400" /> 
          </div>
          <h3 className="text-xl font-semibold mb-2">No Cars Found</h3> 
          <p className="text-slate-500 dark:text-slate-400 mb-6">You don&apos;t have any car listings yet. Add your first car to get started.</p> 
          <Button
            onClick={() => router.push("/employees/newcar")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Car
          </Button>
        </div>
      )}
      
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this car? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Car" 
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


const CarCard = ({ car, onEdit, onDelete }: { 
  car: any; 
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  return (
    <Card className="overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200 w-full min-w-[400px] max-w-[800px] mx-auto">
      <div className="flex flex-col lg:flex-row">
        
        <div className="relative w-full lg:w-2/5 h-56 lg:h-64 overflow-hidden">
          <Image
            src={car.photoUrls?.[0] || "/placeholder.jpg"} 
            alt={`${car.make} ${car.model}`} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 35vw"
            className="object-cover ml-3 rounded-md"
          />
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-blue-500/90 backdrop-blur-sm text-white hover:bg-blue-600 text-sm px-3 py-1.5 shadow-lg">
              R{car.price.toLocaleString()} 
            </Badge>
          </div>
        </div>
        
        
        <CardContent className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <Link href={`/employees/inventory/${car.id}`} className="hover:text-blue-600 transition-colors"> 
                <h3 className="font-heading font-semibold text-lg line-clamp-1">{`${car.year} ${car.make} ${car.model}`}</h3> 
              </Link>
            </div>
            
            <div className="space-y-2 text-slate-500 dark:text-slate-400 text-sm mb-3">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">{car.dealership?.name || "N/A"}, {car.dealership?.city || "N/A"}</span> 
              </div>
              <div className="flex items-center pl-6">
                <span className="line-clamp-1">{car.dealership?.state || "N/A"}, {car.dealership?.country || "N/A"}</span> 
              </div>
              <div className="flex items-center pl-6">
                <span>VIN: {car.vin}</span> 
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center text-slate-500 dark:text-slate-400">
                <Users className="h-4 w-4 mr-1" /> 
                <span className="text-sm">{car.carType}</span> 
              </div>
              <div className="flex items-center text-slate-500 dark:text-slate-400">
                <Fuel className="h-4 w-4 mr-1" /> 
                <span className="text-sm">{car.fuelType}</span> 
              </div>
              <div className="flex items-center text-slate-500 dark:text-slate-400">
                <Gauge className="h-4 w-4 mr-1" /> 
                <span className="text-sm">{car.mileage.toLocaleString()} km</span> 
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(car.id)} 
              className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(car.id)} 
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default Inventory; 
