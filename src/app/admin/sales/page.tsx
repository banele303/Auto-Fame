"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGetSalesQuery, useGetCarsQuery } from "@/state/api";
import { checkAdminAuth, configureAdminAuth } from "../adminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowLeft,
  Eye,
  Search,
  Filter,
  Car,
  User,
  Building,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import AdminNavigation from "@/components/AdminNavigation";

const AdminSalesPage = () => {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  
  useEffect(() => {
    async function verifyAdminAuth() {
      try {
        configureAdminAuth();
        const { isAuthenticated, adminData } = await checkAdminAuth();
        
        if (isAuthenticated && adminData) {
          setAdminUser(adminData);
          setIsLoading(false);
        } else {
          router.replace('/admin-login?from=/admin/sales');
        }
      } catch (error) {
        console.error('Error verifying admin authentication:', error);
        setIsLoading(false);
        toast.error('Error verifying admin status');
        router.replace('/admin-login?from=/admin/sales&error=auth_check_failed');
      }
    }
    
    verifyAdminAuth();
  }, [router]);

  
  const { data: sales, isLoading: salesLoading, refetch } = useGetSalesQuery(
    undefined, 
    { skip: !adminUser?.cognitoId }
  );
  
  const { data: cars, isLoading: carsLoading } = useGetCarsQuery(
    { showAll: 'true' }, 
    { skip: !adminUser?.cognitoId }
  );

  
  const processedSales = React.useMemo(() => {
    if (!sales || !cars) return [];
    
    return sales.map(sale => ({
      ...sale,
      car: cars.find(car => car.id === sale.carId)
    }));
  }, [sales, cars]);

  
  const filteredSales = React.useMemo(() => {
    if (!processedSales) return [];
    
    let filtered = processedSales;

    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sale => 
        sale.car?.make?.toLowerCase().includes(query) ||
        sale.car?.model?.toLowerCase().includes(query) ||
        sale.customerId?.toLowerCase().includes(query) ||
        sale.employeeId?.toLowerCase().includes(query)
      );
    }

    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
        case "price":
          return b.salePrice - a.salePrice;
        case "car":
          return `${a.car?.make} ${a.car?.model}`.localeCompare(`${b.car?.make} ${b.car?.model}`);
        default:
          return 0;
      }
    });

    return filtered;
  }, [processedSales, searchQuery, sortBy]);

  
  const totalSales = sales?.length || 0;
  const totalRevenue = sales?.reduce((sum, sale) => sum + sale.salePrice, 0) || 0;
  const averageSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;
  const currentMonthSales = sales?.filter(sale => {
    const saleDate = new Date(sale.saleDate);
    const now = new Date();
    return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
  }).length || 0;

  if (isLoading || salesLoading || carsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-9 w-80 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          
          <div className="grid gap-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sales Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              View and manage all car sales transactions
            </p>
          </div>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSales}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Sale</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {averageSalePrice.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentMonthSales}</p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Search sales by car, customer, or employee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date (Newest)</SelectItem>
                  <SelectItem value="price">Price (Highest)</SelectItem>
                  <SelectItem value="car">Car (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        
        <div className="grid gap-6">
          {filteredSales.length === 0 ? (
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-12 text-center">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No sales found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No sales records match your search criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSales.map((sale) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Sale #{sale.id}
                          </h3>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            {sale.salePrice.toLocaleString()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            {sale.car ? `${sale.car.year} ${sale.car.make} ${sale.car.model}` : 'Unknown Car'}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {sale.customerId || 'Unknown Customer'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(sale.saleDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">Employee</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {sale.employeeId || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">Dealership</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {sale.dealershipId || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">Financing</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {sale.financingId ? 'Financed' : 'Cash'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowDetailsModal(true);
                        }}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                      
                      {sale.carId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/admin/cars/${sale.carId}`)}
                          className="gap-2"
                        >
                          <Car className="h-4 w-4" />
                          View Car
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        
        {showDetailsModal && selectedSale && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Sale Details - #{selectedSale.id}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedSale(null);
                    }}
                  >
                    ×
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Car Information</h3>
                    <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                      <p><strong>Make:</strong> {selectedSale.car?.make || 'N/A'}</p>
                      <p><strong>Model:</strong> {selectedSale.car?.model || 'N/A'}</p>
                      <p><strong>Year:</strong> {selectedSale.car?.year || 'N/A'}</p>
                      <p><strong>VIN:</strong> {selectedSale.car?.vin || 'N/A'}</p>
                      <p><strong>Color:</strong> {selectedSale.car?.color || 'N/A'}</p>
                    </div>
                  </div>

                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sale Information</h3>
                    <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                      <p><strong>Sale Price:</strong> {selectedSale.salePrice.toLocaleString()}</p>
                      <p><strong>Sale Date:</strong> {new Date(selectedSale.saleDate).toLocaleDateString()}</p>
                      <p><strong>Financing Type:</strong> {selectedSale.financingType || 'N/A'}</p>
                      <p><strong>Down Payment:</strong> {selectedSale.downPayment?.toLocaleString() || 'N/A'}</p>
                      <p><strong>Trade-in Value:</strong> {selectedSale.tradeInValue?.toLocaleString() || 'N/A'}</p>
                    </div>
                  </div>

                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Information</h3>
                    <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                      <p><strong>Customer ID:</strong> {selectedSale.customerId || 'N/A'}</p>
                    </div>
                  </div>

                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employee Information</h3>
                    <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                      <p><strong>Employee ID:</strong> {selectedSale.employeeId || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedSale(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSalesPage;
