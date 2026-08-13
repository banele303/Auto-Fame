"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  Car, 
  Gauge, 
  MapPin,
  Building,
  User,
  Filter,
  ArrowUpDown,
  Fuel, 
  Key, 
  Home,
  DollarSign,
  Plus, 
  Edit,
  Trash2,
  MoreHorizontal,
  Power,
  PowerOff,
  ShoppingCart,
  CheckCircle
} from 'lucide-react'; 
interface Car {
  id: number;
  make: string;
  model: string;
  price: number;
  year: number;
  vin: string;
  photoUrls?: string[];
  status?: string;
  carType: string;
  fuelType: string;
  dealership?: {
    id: number;
    name: string;
    city: string;
    state?: string;
  };
  employee?: {
    id: number;
    name: string;
  };
}

import { useGetCarsQuery, useGetAuthUserQuery } from '@/state/api';
import { configureAdminAuth, fetchAuthSession } from '../../admin/adminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminCarsPage() { 
  const router = useRouter();
  const [authInitialized, setAuthInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('make');
  const [sortOrder, setSortOrder] = useState('asc');
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  const [carsPerPage, setCarsPerPage] = useState<number>(() => {
    try {
      const ps = searchParams?.get('pageSize');
      const parsed = ps ? parseInt(ps, 10) : 10;
      return [10,20,50].includes(parsed) ? parsed : 10;
    } catch { return 10; }
  });
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        
        configureAdminAuth();
        
        
        const session = await fetchAuthSession();
        if (!session.tokens) {
          console.error("No valid auth session found");
          router.push("/admin-login");
          return;
        }
        
        setAuthInitialized(true);
      } catch (error) {
        console.error("Error initializing admin auth:", error);
        router.push("/admin-login");
      }
    };
    
    initAuth();
  }, [router]);
  
  
  const { data: authUser, isLoading: authLoading, error: authError } = useGetAuthUserQuery(undefined, {
    skip: !authInitialized
  });
  
  const { data: cars, isLoading: carsLoading, error, refetch: refetchCars } = useGetCarsQuery({ showAll: 'true' }, {
    skip: !authInitialized || !authUser
  });
  
  
  interface EnhancedCar {
    id: number;
    make: string;
    model: string;
    price: number;
    year: number;
    vin: string;
    photoUrls?: string[];
    status?: string;
    carType: string;
    fuelType: string;
    dealership?: {
      id: number;
      name: string;
      city: string;
      state?: string;
    };
    employee?: {
      id: number;
      name: string;
    };
  }

  
  const cities = cars ? [...new Set(cars.map((car: EnhancedCar) =>
    car.dealership?.city || 'Unknown'))] : []; 

  
  const filteredCars = cars?.filter((car) => {
    const enhancedCar = car as EnhancedCar;
    const employeeId = (car as any).employeeId || '';
    const matchesSearch = 
      enhancedCar.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enhancedCar.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enhancedCar.dealership?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enhancedCar.dealership?.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enhancedCar.employee?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = !filterCity || enhancedCar.dealership?.city === filterCity;
    const matchesStatus = !filterStatus || enhancedCar.status === filterStatus;
    
    return matchesSearch && matchesCity && matchesStatus;
  }) || []; 

  // Filter and sort cars
  const sortedCars = filteredCars.sort((a: EnhancedCar, b: EnhancedCar) => {
    let comparison = 0;
    
    if (sortBy === "make") {
      comparison = a.make.localeCompare(b.make);
    } else if (sortBy === "price") {
      comparison = a.price - b.price;
    } else if (sortBy === "year") {
      comparison = a.year - b.year;
    } else if (sortBy === "dealership") {
      comparison = (a.dealership?.name || '').localeCompare(b.dealership?.name || '');
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Pagination logic
  const totalCars = sortedCars.length;
  const totalPages = Math.max(1, Math.ceil(totalCars / carsPerPage));
  const startIndex = (currentPage - 1) * carsPerPage;
  const endIndex = startIndex + carsPerPage;
  const paginatedCars = sortedCars.slice(startIndex, endIndex);

  // Clamp current page if page size change reduces total pages
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [carsPerPage, totalPages, currentPage]);

  // Persist page size & page in URL (client-side only)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('pageSize', String(carsPerPage));
      url.searchParams.set('page', String(currentPage));
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [carsPerPage, currentPage]);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCity, filterStatus]);
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  
  const handleDeleteCar = async () => {
    if (!selectedCar) return;

    setIsDeleting(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString() || (typeof window !== 'undefined' ? localStorage.getItem('admin_id_token') : null) || 'admin';

      const response = await fetch(`/api/cars/${selectedCar.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete car');
      }

      toast.success('Car deleted successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedCar(null);
      refetchCars();
    } catch (error: any) {
      console.error('Error deleting car:', error);
      toast.error(error.message || 'Failed to delete car');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (carId: number, newStatus: string, carLabel: string) => {
    setUpdatingStatusId(carId);
    try {
      const res = await fetch(`/api/cars/${carId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update status');
      }
      const statusLabels: Record<string, string> = {
        AVAILABLE: 'activated',
        INACTIVE: 'deactivated',
        SOLD: 'marked as sold',
      };
      toast.success(`${carLabel} ${statusLabels[newStatus] || 'updated'}`);
      refetchCars();
    } catch (error: any) {
      console.error('Error updating car status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
      setOpenDropdownId(null);
    }
  };

  
  const openDeleteDialog = (car: Car) => {
    setSelectedCar(car);
    setIsDeleteDialogOpen(true);
  };
  
  
  if (!authInitialized) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-6 rounded-xl shadow-sm">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        
        <Skeleton className="h-12 w-full rounded-lg" />
        
        <Card className="border-slate-200 dark:border-slate-700 shadow-md overflow-visible">
          <div className="overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-18" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-14" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(Math.min(10, carsPerPage))].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <Skeleton className="h-4 w-4 mt-0.5" />
                        <div>
                          <Skeleton className="h-4 w-28 mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  
  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg max-w-md text-center">
          <h3 className="font-semibold mb-2">Authentication Error</h3>
          <p className="text-sm">Your admin session could not be verified. Please sign in again.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/admin-login')} variant="default">
            Sign In
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  
  if (authLoading || carsLoading) { 
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-6 rounded-xl shadow-sm">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        
        <Skeleton className="h-12 w-full rounded-lg" />
        
  <Card className="border-slate-200 dark:border-slate-700 shadow-md overflow-visible">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-18" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-14" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(Math.min(10, carsPerPage))].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <Skeleton className="h-4 w-4 mt-0.5" />
                        <div>
                          <Skeleton className="h-4 w-28 mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg max-w-md text-center">
          <h3 className="font-semibold mb-2">Error Loading Cars</h3> 
          <p className="text-sm">{(error as any)?.data?.message || "Failed to load cars. Please try again later."}</p> 
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }
  
  
  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg max-w-md text-center">
          <h3 className="font-semibold mb-2">Admin Session Required</h3>
          <p className="text-sm">Please sign in with your admin credentials to view this page.</p>
        </div>
        <Button onClick={() => router.push('/admin-login')} variant="default">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 p-6 lg:p-10">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <Car className="h-10 w-10 text-[#00A211]" />
              Cars Showcase
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Manage your inventory with precision and style.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin')}
              className="rounded-2xl border-gray-200 dark:border-gray-800 font-semibold"
            >
              Dashboard
            </Button>
            <Button
              onClick={() => router.push('/admin/cars/add')} 
              className="bg-[#00A211] hover:bg-[#009210] text-white rounded-2xl px-6 font-bold shadow-lg shadow-[#00A211]/20 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              New Entry
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Filter Shelf */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl p-4 shadow-sm flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search make, model, or VIN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-transparent border-none focus-visible:ring-0 text-lg font-medium"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <Select value={filterStatus || 'ALL'} onValueChange={(v) => setFilterStatus(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="h-12 w-[160px] rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800">
                <span className="font-semibold">{filterStatus || 'All Status'}</span>
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="h-12 w-[160px] rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800">
                <span className="font-semibold">Sort: {sortBy}</span>
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="make">Make</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="year">Year</SelectItem> 
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortOrder}
              className="h-12 w-12 rounded-2xl border-gray-100 dark:border-gray-800"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto">
        {carsLoading ? (
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm rounded-3xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                  <TableRow>
                     <TableHead className="w-[80px]">Image</TableHead>
                     <TableHead>Make & Model</TableHead>
                     <TableHead>Price</TableHead>
                     <TableHead>Year</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Location</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                       <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                       <TableCell>
                         <Skeleton className="h-4 w-32 mb-1" />
                         <Skeleton className="h-3 w-20" />
                       </TableCell>
                       <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                       <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                       <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                       <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                       <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : paginatedCars.length > 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm rounded-3xl">
            <div className="overflow-x-auto min-h-[400px]">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                  <TableRow>
                    <TableHead className="py-5 pl-6 font-semibold text-gray-900 dark:text-white">Car Details</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Price</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Year</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-white">Location / Employee</TableHead>
                    <TableHead className="text-right pr-6 font-semibold text-gray-900 dark:text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCars.map((car: EnhancedCar) => (
                    <TableRow key={car.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200 dark:border-gray-700">
                             {car.photoUrls?.[0] ? (
                                <Image src={car.photoUrls[0]} alt="" fill className="object-cover" />
                             ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-300">
                                   <Car size={24} />
                                </div>
                             )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-base">{car.make} {car.model}</div>
                            <div className="text-xs text-gray-500 font-mono mt-1">VIN: {car.vin}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(car.price)}
                      </TableCell>
                      <TableCell className="font-medium text-gray-600 dark:text-gray-400">
                        {car.year}
                      </TableCell>
                      <TableCell>
                         <Badge 
                            variant="outline"
                            className={`rounded-full px-3 py-1 border-none font-medium ${
                              car.status === "AVAILABLE" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : 
                              car.status === "SOLD" ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" : 
                              "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {car.status || "AVAILABLE"}
                          </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <MapPin size={14} className="text-[#00A211]" />
                            {car.dealership?.city || "Local"}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User size={12} />
                            {car.employee?.name || "Unassigned"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={() => router.push(`/admin/cars/edit/${car.id}`)}
                            >
                                <Edit size={16} />
                            </Button>
                            
                            <div className="relative dropdown-container">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === car.id ? null : car.id);
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                              
                              {openDropdownId === car.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl p-1"
                                     style={{ zIndex: 9999 }}
                                >
                                  {car.status !== 'AVAILABLE' && (
                                    <button
                                      className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                      onClick={() => handleStatusChange(car.id, 'AVAILABLE', car.make)}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" /> Activate
                                    </button>
                                  )}
                                  {car.status !== 'INACTIVE' && (
                                    <button
                                      className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                      onClick={() => handleStatusChange(car.id, 'INACTIVE', car.make)}
                                    >
                                      <PowerOff className="mr-2 h-4 w-4" /> Deactivate
                                    </button>
                                  )}
                                  {car.status !== 'SOLD' && (
                                    <button
                                      className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                      onClick={() => handleStatusChange(car.id, 'SOLD', car.make)}
                                    >
                                      <ShoppingCart className="mr-2 h-4 w-4" /> Mark Sold
                                    </button>
                                  )}
                                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                                  <button
                                    className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    onClick={() => { openDeleteDialog(car); setOpenDropdownId(null); }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 mb-6">
              <Search size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No matches found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Pagination Shelf */}
        {totalCars > 0 && (
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-gray-900 p-4 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-2 pl-4">
              <span className="text-sm font-medium text-gray-500">Display:</span>
              <Select value={String(carsPerPage)} onValueChange={(v) => { setCarsPerPage(parseInt(v,10)); setCurrentPage(1); }}>
                <SelectTrigger className="h-10 w-20 rounded-xl border-none bg-gray-50 dark:bg-gray-800">
                  {carsPerPage}
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCars}
              itemsPerPage={carsPerPage}
              onPageChange={(p) => {
                setCurrentPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>
      
      
  {/* Stats cards removed per request */}

      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Car</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this car? This action cannot be undone.
              {selectedCar && (
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="font-medium">{selectedCar.make} {selectedCar.model} ({selectedCar.year})</div>
                  <div className="text-sm text-slate-500">VIN: {selectedCar.vin}</div>
                </div>
              )}
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
              onClick={handleDeleteCar}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Car
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}