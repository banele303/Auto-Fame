"use client";

import { useGetSalesQuery, useGetAllEmployeesQuery, useGetAllCustomersQuery, useGetCarsQuery, useGetInquiriesQuery, useGetReviewsQuery } from "@/state/api";
import { useEffect, useState } from "react";
import { checkAdminAuth, logoutAdmin, configureAdminAuth } from "./adminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import {
  Car, 
  Users, 
  UserCheck, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  Settings, 
  Activity,
  ShoppingCart,
  Wrench,
  Eye,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Calculator,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import TestAdminAuth from "./test-admin-auth";
import { Button } from "@/components/ui/button";
import SalesChart from "@/components/SalesChart";
import AdminNavigation from "@/components/AdminNavigation";

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debug, setDebug] = useState(false); 
  const router = useRouter();
  
  
  useEffect(() => {
    async function verifyAdminAuth() {
      try {
        console.log('✅ Verifying admin authentication...');
        
        configureAdminAuth();
        
        
        const { isAuthenticated, adminData } = await checkAdminAuth();
        console.log('✅ Admin auth check result:', { isAuthenticated, adminData });
        
        if (isAuthenticated && adminData) {
          setAdminUser(adminData);
          setIsLoading(false);
        } else {
          console.log('❌ Not authenticated as admin, redirecting to login');
          router.replace('/admin-login?from=/admin');
        }
      } catch (error) {
        console.error('❌ Error verifying admin authentication:', error);
        setIsLoading(false);
        toast.error('Error verifying admin status');
        router.replace('/admin-login?from=/admin&error=auth_check_failed');
      }
    }
    
    verifyAdminAuth();
  }, [router]);
  
  
  const handleLogout = async () => {
    try {
      
      const result = await logoutAdmin();
      
      if (result.success) {
        toast.success("Logged out successfully");
        router.replace('/admin-login'); 
      } else {
        toast.error("Failed to logout");
      }
    } catch (error) {
      console.error('❌ Error during admin logout:', error);
      toast.error("An error occurred during logout");
    }
  };
  
  
  interface Car {
    id: number;
    status: 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'PENDING' | 'MAINTENANCE';
    make: string;
    model: string;
    year: number;
    price: number;
  }

  interface Employee {
    status: 'ACTIVE' | 'INACTIVE';
  }

  interface Sale {
    salePrice: number;
    car?: Car;
  }

  interface AdminUser {
    cognitoId: string;
    name?: string;
  }

  
  const { data: cars, isLoading: carsLoading } = useGetCarsQuery({ showAll: 'true' }, { skip: !adminUser?.cognitoId });
  const { data: employees, isLoading: employeesLoading } = useGetAllEmployeesQuery({}, { skip: !adminUser?.cognitoId });
  const { data: customers, isLoading: customersLoading } = useGetAllCustomersQuery(undefined, { skip: !adminUser?.cognitoId });
  const { data: sales, isLoading: salesLoading } = useGetSalesQuery(undefined, { skip: !adminUser?.cognitoId });
  const { data: inquiries, isLoading: inquiriesLoading } = useGetInquiriesQuery({}, { skip: !adminUser?.cognitoId });
  const { data: reviews, isLoading: reviewsLoading } = useGetReviewsQuery({}, { skip: !adminUser?.cognitoId });

  
  const totalCars = cars?.length || 0;
  const availableCars: number = cars?.filter((car) => car.status === 'AVAILABLE')?.length || 0;
  const soldCars: number = cars?.filter((car) => car.status === 'SOLD')?.length || 0;
  const totalEmployees = employees?.length || 0;
  const activeEmployees = employees?.filter(emp => emp.status === 'ACTIVE')?.length || 0;
  const totalCustomers = customers?.length || 0;
  const totalSales = sales?.length || 0;
  const totalRevenue = sales?.reduce((sum, sale) => sum + sale.salePrice, 0) || 0;
  
  
  const totalInquiries = inquiries?.length || 0;
  const newInquiries = inquiries?.filter(inquiry => inquiry.status === 'NEW')?.length || 0;
  const contactedInquiries = inquiries?.filter(inquiry => inquiry.status === 'CONTACTED')?.length || 0;
  const scheduledInquiries = inquiries?.filter(inquiry => inquiry.status === 'SCHEDULED')?.length || 0;
  const completedInquiries = inquiries?.filter(inquiry => inquiry.status === 'COMPLETED')?.length || 0;

  
  const totalReviews = reviews?.length || 0;
  const averageRating = reviews?.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const fiveStarReviews = reviews?.filter(review => review.rating === 5)?.length || 0;

  const isDataLoading = isLoading || carsLoading || employeesLoading || customersLoading || salesLoading || inquiriesLoading || reviewsLoading;

  
  const processedSales = sales?.map(sale => ({
    ...sale,
    car: cars?.find(c => c.id === sale.carId)
  }));

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-9 w-80 mb-2" />
                <Skeleton className="h-6 w-96" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-6 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-9 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Skeleton className="h-12 w-12 rounded mx-auto mb-4" />
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Car Dealership Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Welcome back, {adminUser?.email}! Here&apos;s what&apos;s happening at your dealership.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setDebug(!debug)}
                variant="outline"
                size="sm"
              >
                {debug ? 'Hide Debug' : 'Show Debug'}
              </Button>
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        
        {debug && (
          <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <TestAdminAuth />
          </div>
        )}

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total Cars
              </CardTitle>
              <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalCars}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {availableCars} available • {soldCars} sold
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                From {totalSales} sales
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Active Employees
              </CardTitle>
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeEmployees}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalEmployees} total employees
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total Customers
              </CardTitle>
              <UserCheck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalCustomers}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Registered customers
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Customer Reviews
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalReviews}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {averageRating.toFixed(1)}★ average • {fiveStarReviews} five-star
              </p>
            </CardContent>
          </Card>
        </div>

        
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Inquiry Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total Inquiries
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalInquiries}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  All customer inquiries
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push('/admin/inquiries?status=NEW')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  New Inquiries
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{newInquiries}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Awaiting response
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push('/admin/inquiries?status=CONTACTED')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Contacted
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{contactedInquiries}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Customer contacted
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push('/admin/inquiries?status=SCHEDULED')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Scheduled
                </CardTitle>
                <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{scheduledInquiries}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Appointments set
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push('/admin/inquiries?status=COMPLETED')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Completed
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{completedInquiries}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Successfully closed
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card 
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => router.push('/admin/cars')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Cars
              </CardTitle>
              <Car className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                View, add, and manage your car inventory
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); router.push('/admin/cars/add'); }}>
                  <Plus className="h-4 w-4" />
                  Add Car
                </Button>
                <Button size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); router.push('/admin/cars'); }}>
                  <Eye className="h-4 w-4" />
                  View Cars
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => router.push('/admin/sales')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Sales
              </CardTitle>
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                View and manage sales transactions
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); router.push('/admin/sales'); }}>
                  <Eye className="h-4 w-4" />
                  View Sales
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => router.push('/admin/financing')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Financing
              </CardTitle>
              <Calculator className="h-6 w-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Review and approve financing applications
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); router.push('/admin/financing'); }}>
                  <Eye className="h-4 w-4" />
                  View Applications
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => router.push('/admin/employees')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Employees
              </CardTitle>
              <Users className="h-6 w-6 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Manage your sales team and staff
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); router.push('/admin/employees'); }}>
                  <Eye className="h-4 w-4" />
                  View Employees
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => router.push('/admin/inquiries')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Inquiries
              </CardTitle>
              <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Handle customer inquiries and follow-ups
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); router.push('/admin/inquiries?status=NEW'); }}>
                  <AlertCircle className="h-4 w-4" />
                  New ({newInquiries})
                </Button>
                <Button size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); router.push('/admin/inquiries'); }}>
                  <Eye className="h-4 w-4" />
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => router.push('/admin/reviews')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Reviews
              </CardTitle>
              <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                View and moderate customer reviews
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); router.push('/admin/reviews'); }}>
                  <Star className="h-4 w-4" />
                  View All ({totalReviews})
                </Button>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Avg: {averageRating.toFixed(1)}★
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart />
          </CardContent>
        </Card>

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {processedSales && processedSales.length > 0 ? (
                  processedSales.slice(0, 5).map((sale, index) => (
                    <div key={index} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-center">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-4">
                          <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Car Sold</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {sale.car?.make} {sale.car?.model} - {sale.salePrice?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 px-6">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No recent activity</p>
                    <p className="text-sm">Activity logs and recent actions will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Quick Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-4 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 transition-colors"
                  onClick={() => router.push('/admin/cars/add')}
                >
                  <div className="flex items-center">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                      <Plus className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Add New Car</p>
                      <p className="text-xs text-muted-foreground">Add a new vehicle to inventory</p>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-4 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/30 dark:hover:text-green-400 transition-colors"
                  onClick={() => router.push('/admin/sales')}
                >
                  <div className="flex items-center">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-3">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">View Sales</p>
                      <p className="text-xs text-muted-foreground">Check sales transactions and revenue</p>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-4 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950/30 dark:hover:text-purple-400 transition-colors"
                  onClick={() => router.push('/admin/financing')}
                >
                  <div className="flex items-center">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full mr-3">
                      <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">View Financing</p>
                      <p className="text-xs text-muted-foreground">Review financing applications</p>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-4 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/30 dark:hover:text-orange-400 transition-colors"
                  onClick={() => router.push('/admin/employees')}
                >
                  <div className="flex items-center">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full mr-3">
                      <Users className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Manage Employees</p>
                      <p className="text-xs text-muted-foreground">View or update employee information</p>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-4 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/30 dark:hover:text-orange-400 transition-colors"
                  onClick={() => router.push('/admin/analytics')}
                >
                  <div className="flex items-center">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full mr-3">
                      <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">View Analytics</p>
                      <p className="text-xs text-muted-foreground">Check detailed sales reports</p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
