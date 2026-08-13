"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User2, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Car, // Changed from Home
  ClipboardList, 
  Users,
  Building,
  Eye,
  DollarSign, // Added for sales
  MessageSquare, // Added for inquiries
  Calendar, // Added for test drives
} from "lucide-react"; // Updated icons
import { useGetEmployeeDetailsQuery } from "@/state/api"; // Updated hook
import { DetailPageSkeleton } from "@/components/ui/skeletons";


export default function EmployeeDetails({ id }: { id: string }) { 
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  
  
  const { data: employee, isLoading, error: fetchError } = useGetEmployeeDetailsQuery(id); 
  
  
  const error = fetchError ? (fetchError as any)?.data?.error || "Failed to load employee information. Please try again." : null;

  if (isLoading) {
    return <DetailPageSkeleton />;
  }
  
  if (error) {
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
          <p className="text-red-500">{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push("/admin/employees")}
          >
            Go to Employees List
          </Button>
        </Card>
      </div>
    );
  }
  
  // If we have no data, show an empty state
  const employeeData = {
    cognitoId: employee?.cognitoId || id,
    name: employee?.name || "Unknown Employee",
    email: employee?.email || "No email provided",
    phoneNumber: employee?.phoneNumber || "",
    status: employee?.status || "Unknown",
    managedCars: (employee as any)?.managedCars || [], // Changed properties to managedCars
    customers: (employee as any)?.customers || [], // Changed tenants to customers
    stats: (employee as any)?.stats || {
      carsManaged: 0, // Changed propertyCount to carsManaged
      customersServed: 0, // Changed tenantCount to customersServed
      totalSales: 0, // Added totalSales
      totalRevenue: 0, // Added totalRevenue
    }
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
        <h1 className="text-2xl font-bold">Employee Details</h1> 
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
              {employeeData.name && employeeData.name.length > 0 ? employeeData.name.charAt(0).toUpperCase() : "E"}
            </div>
            <div>
              <h2 className="text-xl font-bold">{employeeData.name || "Unknown Employee"}</h2>
              <div className="flex items-center text-sm mt-1">
                <Mail className="h-4 w-4 mr-1 text-blue-500" />
                <span>{employeeData.email || "No email"}</span>
              </div>
              {employeeData.phoneNumber && (
                <div className="flex items-center text-sm mt-1">
                  <Phone className="h-4 w-4 mr-1 text-blue-500" />
                  <span>{employeeData.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className={cn(
              "px-3 py-1 rounded-full inline-block",
              employeeData.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : // Updated status
              employeeData.status === "INACTIVE" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" : // Updated status
              employeeData.status === "SUSPENDED" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" : // Updated status
              "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            )}>
              {employeeData.status}
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
              <Car className="h-5 w-5" /> 
            </div>
            <div>
              <p className="text-sm text-gray-500">Cars Managed</p> 
              <p className="text-xl font-bold">{employeeData.stats.carsManaged}</p> 
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
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Customers Served</p> 
              <p className="text-xl font-bold">{employeeData.stats.customersServed}</p> 
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
              isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"
            )}>
              <DollarSign className="h-5 w-5" /> 
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sales</p> 
              <p className="text-xl font-bold">{employeeData.stats.totalSales}</p> 
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
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p> 
              <p className="text-xl font-bold">R{employeeData.stats.totalRevenue.toLocaleString()}</p> 
            </div>
          </div>
        </Card>
      </div>
      
      
      <Tabs defaultValue="cars" className="w-full"> 
        <TabsList className="grid w-full grid-cols-2"> 
          <TabsTrigger value="cars">Cars</TabsTrigger> 
          <TabsTrigger value="customers">Customers</TabsTrigger> 
        </TabsList>
        
        
        <TabsContent value="cars" className="mt-4"> 
          <div className="space-y-4">
            {employeeData.managedCars.map((car: any) => (
              <Card key={car.id} className={cn(
                "p-4 hover:shadow-md transition-shadow",
                isDark ? "bg-slate-800" : "bg-white"
              )}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{`${car.year} ${car.make} ${car.model}`}</h3> 
                    <p className="text-sm text-gray-500">VIN: {car.vin}</p> 
                    <p className="text-xs mt-1">
                      <span className={cn(
                        "inline-flex items-center",
                        isDark ? "text-blue-400" : "text-blue-600"
                      )}>
                        <Users className="h-3 w-3 mr-1" />
                        {car.customerCount} customers 
                      </span>
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/admin/employees/${employeeData.cognitoId}/cars/${car.id}`)}> 
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                </div>
              </Card>
            ))}
            
            {employeeData.managedCars.length === 0 && (
              <Card className="p-4">
                <p className="text-center text-gray-500 py-4">No cars found.</p> 
              </Card>
            )}
          </div>
        </TabsContent>
        
        
        <TabsContent value="customers" className="mt-4"> 
          <div className="space-y-4">
            {employeeData.customers.map((customer: any) => (
              <Card key={customer.cognitoId} className={cn(
                "p-4 hover:shadow-md transition-shadow",
                isDark ? "bg-slate-800" : "bg-white"
              )}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{customer.name}</h3>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                    <p className="text-xs mt-1">
                      <span className={cn(
                        "inline-flex items-center",
                        isDark ? "text-blue-400" : "text-blue-600"
                      )}>
                        <Car className="h-3 w-3 mr-1" /> 
                        {customer.car} 
                      </span>
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/admin/employees/${employeeData.cognitoId}/customers/${customer.cognitoId}`)}> 
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                </div>
              </Card>
            ))}
            
            {employeeData.customers.length === 0 && (
              <Card className="p-4">
                <p className="text-center text-gray-500 py-4">No customers found.</p> 
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
