"use client";

import { useState, useEffect } from 'react';
import SalesChart from '@/components/analytics/SalesChart';
import EmployeePerformance from '@/components/analytics/EmployeePerformance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight, Car, DollarSign, Users, Calendar, PieChart, TrendingUp, FileText, ClipboardCheck } from 'lucide-react';

export default function AdminDashboardPage() {
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch real dashboard summary data
        const response = await fetch('/api/admin/dashboard/summary');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        
        const data = await response.json();
        setSummaryStats(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Provide fallback data structure if API fails
        setSummaryStats({
          salesCount: 0,
          revenue: 0,
          customers: 0,
          inventory: 0,
          monthlyGrowth: {
            sales: 0,
            revenue: 0,
            customers: 0,
          },
          inquiries: 0,
          testDrives: 0,
          financingApplications: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Sales
            </CardTitle>
            <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.salesCount}</div>
            <p className="text-xs flex items-center text-gray-600 dark:text-gray-400">
              {summaryStats.monthlyGrowth?.sales > 0 ? (
                <>
                  <ArrowUpRight className="text-green-500 mr-1 h-3 w-3" />
                  <span className="text-green-500">{summaryStats.monthlyGrowth.sales}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="text-red-500 mr-1 h-3 w-3" />
                  <span className="text-red-500">{Math.abs(summaryStats.monthlyGrowth?.sales || 0)}%</span>
                </>
              )}
              <span className="ml-1">vs. last month</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              R{summaryStats.revenue.toLocaleString()}
            </div>
            <p className="text-xs flex items-center text-gray-600 dark:text-gray-400">
              {summaryStats.monthlyGrowth?.revenue > 0 ? (
                <>
                  <ArrowUpRight className="text-green-500 mr-1 h-3 w-3" />
                  <span className="text-green-500">{summaryStats.monthlyGrowth.revenue}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="text-red-500 mr-1 h-3 w-3" />
                  <span className="text-red-500">{Math.abs(summaryStats.monthlyGrowth?.revenue || 0)}%</span>
                </>
              )}
              <span className="ml-1">vs. last month</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.customers}</div>
            <p className="text-xs flex items-center text-gray-600 dark:text-gray-400">
              {summaryStats.monthlyGrowth?.customers > 0 ? (
                <>
                  <ArrowUpRight className="text-green-500 mr-1 h-3 w-3" />
                  <span className="text-green-500">{summaryStats.monthlyGrowth.customers}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="text-red-500 mr-1 h-3 w-3" />
                  <span className="text-red-500">{Math.abs(summaryStats.monthlyGrowth?.customers || 0)}%</span>
                </>
              )}
              <span className="ml-1">vs. last month</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Vehicles in Inventory
            </CardTitle>
            <Car className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.inventory}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Across all dealerships
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Inquiries
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.inquiries}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Customer inquiries pending follow-up
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Test Drives
            </CardTitle>
            <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.testDrives}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Scheduled in the next 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Financing Applications
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.financingApplications}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Pending approval
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart />
        <EmployeePerformance />
      </div>
    </div>
  );
}
