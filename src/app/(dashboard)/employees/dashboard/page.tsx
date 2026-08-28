"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGetInquiriesQuery, useGetAuthUserQuery, useGetEmployeeCarsQuery, useGetSalesQuery } from "@/state/api"; 
import { Car, Users, MessageSquare, DollarSign, Calendar, TrendingUp } from "lucide-react"; 
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Inquiry {
  status: string;
  car?: {
    make: string;
    model: string;
  };
  customer?: {
    name: string;
  };
}

function EmployeeDashboard() { 
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const router = useRouter();
  
  const { data: cars, isLoading: carsLoading } = useGetEmployeeCarsQuery(
    authUser?.cognitoInfo?.userId || "", 
    { skip: !authUser?.cognitoInfo?.userId || authUser?.userRole === "customer" }
  );
  
  const { data: inquiryData, isLoading: inquiriesLoading } = useGetInquiriesQuery(
    { employeeId: authUser?.cognitoInfo?.userId || "" },
    { skip: !authUser?.cognitoInfo?.userId || authUser?.userRole !== "employee" }
  );

  const { data: salesData, isLoading: salesLoading } = useGetSalesQuery(
    { employeeId: authUser?.cognitoInfo?.userId || "" },
    { skip: !authUser?.cognitoInfo?.userId || authUser?.userRole !== "employee" }
  );
  
  const inquiries = (inquiryData || []).filter(inc => inc.status === 'NEW');
  
  const isLoading = authLoading || carsLoading || inquiriesLoading || salesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  const totalCars = cars?.length || 0;
  const availableCars = cars?.filter(car => car.status === 'AVAILABLE').length || 0;
  const newInquiries = inquiries?.length || 0;
  const totalSales = salesData?.length || 0;
  const totalRevenue = salesData?.reduce((sum, sale) => sum + sale.salePrice, 0) || 0;

  const statsCards = [
    {
      title: "Assigned Cars",
      value: totalCars,
      icon: Car,
      description: "Cars in inventory",
    },
    {
      title: "Available Stock",
      value: availableCars,
      icon: Car,
      description: "Ready for showroom",
    },
    {
      title: "New Inquiries",
      value: newInquiries,
      icon: MessageSquare,
      description: `${newInquiries} pending review`,
    },
    {
      title: "Total Sales",
      value: totalSales,
      icon: DollarSign,
      description: `R ${totalRevenue.toLocaleString()} revenue`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Employee Workspace
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Logged in as <span className="font-mono text-zinc-200">{authUser?.userInfo?.name || authUser?.userInfo?.email}</span>
          </p>
        </div>
      </div>

      {/* Vercel Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-[#0a0a0a] border border-[#222] hover:border-zinc-700 transition-all rounded-xl p-5 group">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">
                <span>{card.title}</span>
                <Icon className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <p className="text-3xl font-semibold text-white font-mono tracking-tight mb-1">{card.value}</p>
              <p className="text-[11px] text-zinc-500 font-mono">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Add New Car",
              description: "Create vehicle listing",
              icon: Car,
              action: () => router.push("/admin/cars/add"),
            },
            {
              title: "Review Inquiries",
              description: "View customer messages",
              icon: MessageSquare,
              action: () => router.push("/employees/inquiries"),
            },
            {
              title: "Manage Sales",
              description: "Track deals & transactions",
              icon: DollarSign,
              action: () => router.push("/employees/sales"),
            },
            {
              title: "Test Drives",
              description: "Customer test drive slots",
              icon: Calendar,
              action: () => router.push("/employees/testdrives"),
            },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={action.action}
                className="bg-[#0a0a0a] border border-[#222] hover:border-zinc-700 rounded-xl p-5 transition-all text-left group"
              >
                <div className="p-2.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-300 group-hover:text-white w-fit mb-3">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-medium text-white">{action.title}</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Inquiries */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Inquiries</h2>
            <p className="text-xs text-zinc-500 font-mono">Latest leads and customer inquiries</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-5">
          {inquiryData && inquiryData.length > 0 ? (
            <div className="space-y-3">
              {inquiryData.slice(0, 5).map((inquiry: Inquiry, i: number) => (
                <div key={i} className="flex items-center justify-between gap-4 rounded-lg p-3 bg-black border border-[#222] hover:border-zinc-700 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-white/[0.06] border border-white/[0.08] text-zinc-300">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">
                        Inquiry for {inquiry.car?.make} {inquiry.car?.model}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        From {inquiry.customer?.name || "Customer"} • {inquiry.status}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/employees/inquiries`)}
                    className="px-3 py-1 rounded-md text-xs font-medium bg-[#111] hover:bg-[#1c1c1c] text-zinc-200 border border-[#333] transition-all"
                  >
                    View →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
              <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
              <h3 className="text-sm font-medium text-white">No recent inquiries</h3>
              <p className="text-xs text-zinc-500 mt-0.5">No pending customer leads at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;