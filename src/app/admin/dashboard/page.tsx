"use client";

import { useState, useEffect } from 'react';
import SalesChart from '@/components/analytics/SalesChart';
import EmployeePerformance from '@/components/analytics/EmployeePerformance';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight, Car, DollarSign, Users, Calendar, FileText, ClipboardCheck, Sparkles } from 'lucide-react';

export default function AdminDashboardPage() {
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/dashboard/summary');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        
        const data = await response.json();
        setSummaryStats(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64 bg-[#111] border border-[#222]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[#0a0a0a] border border-[#222] rounded-xl p-5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-[#0a0a0a] border border-[#222] rounded-xl" />
          <div className="h-80 bg-[#0a0a0a] border border-[#222] rounded-xl" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time telemetry, vehicle transactions, and operational metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Systems Active
          </span>
        </div>
      </div>
      
      {/* Primary Metric Cards (Geist / Vercel style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-[#0a0a0a] border border-[#222] hover:border-zinc-700 transition-all rounded-xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">
            <span>Total Sales</span>
            <Car className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div className="text-3xl font-semibold text-white tracking-tight font-mono mb-2">
            {summaryStats.salesCount}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {summaryStats.monthlyGrowth?.sales >= 0 ? (
              <span className="inline-flex items-center text-emerald-400 font-mono">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                +{summaryStats.monthlyGrowth?.sales || 0}%
              </span>
            ) : (
              <span className="inline-flex items-center text-rose-400 font-mono">
                <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                {summaryStats.monthlyGrowth?.sales}%
              </span>
            )}
            <span className="text-zinc-500">vs last month</span>
          </div>
        </div>
        
        {/* Total Revenue */}
        <div className="bg-[#0a0a0a] border border-[#222] hover:border-zinc-700 transition-all rounded-xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">
            <span>Total Revenue</span>
            <DollarSign className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div className="text-3xl font-semibold text-white tracking-tight font-mono mb-2 truncate">
            R {summaryStats.revenue.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {summaryStats.monthlyGrowth?.revenue >= 0 ? (
              <span className="inline-flex items-center text-emerald-400 font-mono">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                +{summaryStats.monthlyGrowth?.revenue || 0}%
              </span>
            ) : (
              <span className="inline-flex items-center text-rose-400 font-mono">
                <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                {summaryStats.monthlyGrowth?.revenue}%
              </span>
            )}
            <span className="text-zinc-500">vs last month</span>
          </div>
        </div>
        
        {/* Total Customers */}
        <div className="bg-[#0a0a0a] border border-[#222] hover:border-zinc-700 transition-all rounded-xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">
            <span>Total Customers</span>
            <Users className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div className="text-3xl font-semibold text-white tracking-tight font-mono mb-2">
            {summaryStats.customers}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {summaryStats.monthlyGrowth?.customers >= 0 ? (
              <span className="inline-flex items-center text-emerald-400 font-mono">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                +{summaryStats.monthlyGrowth?.customers || 0}%
              </span>
            ) : (
              <span className="inline-flex items-center text-rose-400 font-mono">
                <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                {summaryStats.monthlyGrowth?.customers}%
              </span>
            )}
            <span className="text-zinc-500">vs last month</span>
          </div>
        </div>
        
        {/* Vehicles in Inventory */}
        <div className="bg-[#0a0a0a] border border-[#222] hover:border-zinc-700 transition-all rounded-xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase tracking-wider mb-3">
            <span>Vehicles Listed</span>
            <Sparkles className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div className="text-3xl font-semibold text-white tracking-tight font-mono mb-2">
            {summaryStats.inventory}
          </div>
          <p className="text-xs text-zinc-500">
            Across active dealerships
          </p>
        </div>
      </div>
      
      {/* Secondary Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase tracking-wider mb-2">
            <span>Active Inquiries</span>
            <FileText className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-semibold text-white font-mono">{summaryStats.inquiries}</div>
          <p className="text-xs text-zinc-500 mt-1">Pending client follow-up</p>
        </div>
        
        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase tracking-wider mb-2">
            <span>Test Drives</span>
            <Calendar className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-semibold text-white font-mono">{summaryStats.testDrives}</div>
          <p className="text-xs text-zinc-500 mt-1">Scheduled next 7 days</p>
        </div>
        
        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase tracking-wider mb-2">
            <span>Finance Applications</span>
            <ClipboardCheck className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-semibold text-white font-mono">{summaryStats.financingApplications}</div>
          <p className="text-xs text-zinc-500 mt-1">Pending banking review</p>
        </div>
      </div>
      
      {/* Charts Section in Dark Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6 shadow-sm">
          <SalesChart />
        </div>
        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6 shadow-sm">
          <EmployeePerformance />
        </div>
      </div>
    </div>
  );
}
