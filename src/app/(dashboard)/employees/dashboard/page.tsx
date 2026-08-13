"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGetInquiriesQuery, useGetAuthUserQuery, useGetEmployeeCarsQuery, useGetSalesQuery } from "@/state/api"; 
import { Car, Users, MessageSquare, CreditCard, AlertCircle, LogOut, BarChart, TrendingUp, DollarSign, Calendar } from "lucide-react"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface CarType {
  status: string;
}

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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  
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
  const customers: { name: string; car: string; status: string }[] = []; 
  
  const isLoading = authLoading || carsLoading || inquiriesLoading || salesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  
  const totalCars = cars?.length || 0;
  const availableCars = cars?.filter(car => car.status === 'AVAILABLE').length || 0;
  const totalInquiries = inquiryData?.length || 0;
  const newInquiries = inquiries?.length || 0;
  const totalSales = salesData?.length || 0;
  const totalRevenue = salesData?.reduce((sum, sale) => sum + sale.salePrice, 0) || 0;

  
  const statsCards = [
    {
      title: "Total Cars",
      value: totalCars,
      icon: Car,
      description: "Cars in inventory",
      color: "blue"
    },
    {
      title: "Available Cars",
      value: availableCars,
      icon: Car,
      description: "Ready for sale",
      color: "green"
    },
    {
      title: "New Inquiries",
      value: newInquiries,
      icon: MessageSquare,
      description: `${newInquiries} pending review`,
      color: "amber"
    },
    {
      title: "Total Sales",
      value: totalSales,
      icon: DollarSign,
      description: `R${totalRevenue.toLocaleString()} revenue`,
      color: "purple"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      <div className="flex justify-between items-center">
        <h1 className={cn(
          "text-3xl font-bold tracking-tight",
          isDark ? "text-white" : "text-slate-900"
        )}>
          Employee Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <span className={cn(
            "text-sm",
            isDark ? "text-slate-400" : "text-slate-600"
          )}>
            Welcome, <span className={cn(
              "font-medium",
              isDark ? "text-white" : "text-slate-900"
            )}>{authUser?.userInfo?.name || authUser?.userInfo?.email}</span>
          </span>
          <button 
            onClick={() => router.push('/logout')}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
              isDark 
                ? "bg-red-900/30 hover:bg-red-900/50 text-red-400" 
                : "bg-red-100 hover:bg-red-200 text-red-600"
            )}
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {statsCards.map((card, index) => (
          <Card key={index} className={cn(
            "p-4 shadow-sm hover:shadow-md transition-shadow",
            isDark ? "bg-gray-800" : "bg-white"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  isDark ? "text-slate-400" : "text-slate-600"
                )}>{card.title}</p>
                <h3 className={cn(
                  "text-2xl font-bold",
                  isDark ? "text-white" : "text-slate-900"
                )}>{card.value}</h3>
              </div>
              <div className={cn(
                "p-2 rounded-full",
                card.color === "blue" && (isDark ? "bg-blue-900/30" : "bg-blue-100"),
                card.color === "green" && (isDark ? "bg-green-900/30" : "bg-green-100"),
                card.color === "amber" && (isDark ? "bg-amber-900/30" : "bg-amber-100"),
                card.color === "purple" && (isDark ? "bg-purple-900/30" : "bg-purple-100")
              )}>
                {React.createElement(card.icon, { className: "w-6 h-6", color: card.color === "blue" ? (isDark ? "#81B2F7" : "#2563EB") : card.color === "green" ? (isDark ? "#86EFAC" : "#16A34A") : card.color === "amber" ? (isDark ? "#FCD34D" : "#D97706") : (isDark ? "#C084FC" : "#9333EA")})}
              </div>
            </div>
            <p className={cn(
              "mt-2 text-sm",
              isDark ? "text-slate-400" : "text-slate-600"
            )}>
              {card.description}
            </p>
          </Card>
        ))}
      </div>

      
      <Card className={cn(
        isDark 
          ? "bg-slate-900 border-slate-800" 
          : "bg-white border-slate-200"
      )}>
        <CardHeader>
          <CardTitle className={cn(
            isDark ? "text-white" : "text-slate-900"
          )}>
            Quick Actions
          </CardTitle>
          <CardDescription className={cn(
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            Manage your inventory, inquiries, and sales
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Add New Car",
              description: "Add a new vehicle to your inventory",
              icon: Car,
              action: () => router.push("/employees/inventory/new"),
              color: "blue",
            },
            {
              title: "Review Inquiries",
              description: "View and manage customer inquiries",
              icon: MessageSquare,
              action: () => router.push("/employees/inquiries"),
              color: "amber",
            },
            {
              title: "Manage Sales",
              description: "Track and manage car sales",
              icon: DollarSign,
              action: () => router.push("/employees/sales"),
              color: "green",
            },
            {
              title: "Schedule Test Drives",
              description: "Organize test drives for customers",
              icon: Calendar,
              action: () => router.push("/employees/testdrives"),
              color: "purple",
            },
          ].map((action, i) => (
            <button
              key={i}
              onClick={action.action}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-4 transition-all hover:shadow-md",
                isDark 
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700" 
                  : "bg-white border-slate-200 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "rounded-full p-2",
                action.color === "blue" && (isDark ? "bg-blue-900/20 text-blue-400" : "bg-blue-100 text-blue-600"),
                action.color === "amber" && (isDark ? "bg-amber-900/20 text-amber-400" : "bg-amber-100 text-amber-600"),
                action.color === "green" && (isDark ? "bg-green-900/20 text-green-400" : "bg-green-100 text-green-600"),
                action.color === "purple" && (isDark ? "bg-purple-900/20 text-purple-400" : "bg-purple-100 text-purple-600")
              )}>
                {React.createElement(action.icon, { className: "h-4 w-4" })}
              </div>
              <div className="space-y-1">
                <h3 className={cn(
                  "font-medium",
                  isDark ? "text-white" : "text-slate-900"
                )}>
                  {action.title}
                </h3>
                <p className={cn(
                  "text-xs",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}>
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      
      <Card className={cn(
        isDark 
          ? "bg-slate-900 border-slate-800" 
          : "bg-white border-slate-200"
      )}>
        <CardHeader>
          <CardTitle className={cn(
            isDark ? "text-white" : "text-slate-900"
          )}>
            Recent Inquiries
          </CardTitle>
          <CardDescription className={cn(
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            Latest customer inquiries for your cars
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inquiryData && inquiryData.length > 0 ? (
            <div className="space-y-4">
              {inquiryData.slice(0, 5).map((inquiry: Inquiry, i: number) => (
                <div key={i} className={cn(
                  "flex items-center gap-4 rounded-lg p-3",
                  isDark ? "bg-slate-800" : "bg-slate-50"
                )}>
                  <div className={cn(
                    "rounded-full p-2",
                    inquiry.status === "NEW" 
                      ? (isDark ? "bg-blue-900/20 text-blue-400" : "bg-blue-100 text-blue-600")
                      : inquiry.status === "CONTACTED"
                        ? (isDark ? "bg-amber-900/20 text-amber-400" : "bg-amber-100 text-amber-600")
                        : (isDark ? "bg-green-900/20 text-green-400" : "bg-green-100 text-green-600")
                  )}>
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn(
                      "font-medium",
                      isDark ? "text-white" : "text-slate-900"
                    )}>
                      New inquiry for {inquiry.car?.make} {inquiry.car?.model}
                    </p>
                    <p className={cn(
                      "text-xs",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                      From {inquiry.customer?.name || "Customer"} • Status: {inquiry.status}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/employees/inquiries`)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium",
                      isDark 
                        ? "bg-slate-700 text-white hover:bg-slate-600" 
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    )}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={cn(
              "flex flex-col items-center justify-center py-8 text-center",
              isDark ? "text-slate-400" : "text-slate-500"
            )}>
              <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
              <h3 className="font-medium mb-1">No recent inquiries</h3>
              <p className="text-sm">
                You don&apos;t have any recent inquiries or activity
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className={cn(
            isDark 
              ? "bg-slate-900 border-slate-800" 
              : "bg-white border-slate-200"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                isDark ? "text-white" : "text-slate-900"
              )}>
                Sales Analytics
              </CardTitle>
              <CardDescription className={cn(
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                Overview of your sales performance
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className={cn(
                "flex flex-col items-center justify-center text-center",
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                <TrendingUp className="h-12 w-12 mb-2 opacity-20" />
                <h3 className="font-medium mb-1">Analytics Coming Soon</h3>
                <p className="text-sm max-w-md">
                  We&apos;re working on comprehensive analytics for your sales. Check back soon for detailed insights and performance metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeDashboard;