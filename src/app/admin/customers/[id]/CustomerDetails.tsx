"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailPageSkeleton } from "@/components/ui/skeletons";
import { 
  User2, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Car, 
  MessageSquare, 
  DollarSign,
  Calendar,
  CreditCard,
  Eye
} from "lucide-react";
import { useGetCustomerDetailsQuery } from "@/state/api"; 

interface CustomerDetailsProps {
  id: string;
}


export default function CustomerDetailsClient({ id }: CustomerDetailsProps) { 
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  
  
  const { data: customer, isLoading, error: fetchError } = useGetCustomerDetailsQuery(id); 
  
  
  const error = fetchError ? (fetchError as any)?.data?.error || "Failed to load customer information. Please try again." : null;

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
            onClick={() => router.push("/admin/customers")}
          >
            Go to Customers List
          </Button>
        </Card>
      </div>
    );
  }
  
  // If we have no data, show an empty state
  const customerData = {
    cognitoId: customer?.cognitoId || id,
    name: customer?.name || "Unknown Customer",
    email: customer?.email || "No email provided",
    phoneNumber: customer?.phoneNumber || "",
    favorites: (customer as any)?.favorites || [], // Changed properties to favorites
    inquiries: (customer as any)?.inquiries || [], // Changed tenants to inquiries
    sales: (customer as any)?.sales || [], // Added sales
    financingApps: (customer as any)?.financingApps || [], // Added financingApps
    stats: (customer as any)?.stats || {
      favoriteCarsCount: 0, // Changed propertyCount to favoriteCarsCount
      inquiryCount: 0, // Changed tenantCount to inquiryCount
      salesCount: 0, // Added salesCount
      totalSpent: 0, // Added totalSpent
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
        <h1 className="text-2xl font-bold">Customer Details</h1> 
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
              {customerData.name && customerData.name.length > 0 ? customerData.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-xl font-bold">{customerData.name || "Unknown Customer"}</h2>
              <div className="flex items-center text-sm mt-1">
                <Mail className="h-4 w-4 mr-1 text-blue-500" />
                <span>{customerData.email || "No email"}</span>
              </div>
              {customerData.phoneNumber && (
                <div className="flex items-center text-sm mt-1">
                  <Phone className="h-4 w-4 mr-1 text-blue-500" />
                  <span>{customerData.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            
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
              <p className="text-sm text-gray-500">Favorite Cars</p> 
              <p className="text-xl font-bold">{customerData.stats.favoriteCarsCount}</p> 
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
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Inquiries</p> 
              <p className="text-xl font-bold">{customerData.stats.inquiryCount}</p> 
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
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sales</p> 
              <p className="text-xl font-bold">{customerData.stats.salesCount}</p> 
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
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p> 
              <p className="text-xl font-bold">R{customerData.stats.totalSpent.toLocaleString()}</p> 
            </div>
          </div>
        </Card>
      </div>
      
      
      <Tabs defaultValue="favorites" className="w-full"> 
        <TabsList className="grid w-full grid-cols-3"> 
          <TabsTrigger value="favorites">Favorites</TabsTrigger> 
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger> 
          <TabsTrigger value="sales">Sales</TabsTrigger> 
        </TabsList>
        
        
        <TabsContent value="favorites" className="mt-4"> 
          <div className="space-y-4">
            {customerData.favorites.map((car: any) => (
              <Card key={car.id} className={cn(
                "p-4 hover:shadow-md transition-shadow",
                isDark ? "bg-slate-800" : "bg-white"
              )}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{`${car.year} ${car.make} ${car.model}`}</h3> 
                    <p className="text-sm text-gray-500">Dealership: {car.dealership?.name || "N/A"}</p> 
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/admin/cars/${car.id}`)}> 
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                </div>
              </Card>
            ))}
            
            {customerData.favorites.length === 0 && (
              <Card className="p-4">
                <p className="text-center text-gray-500 py-4">No favorite cars found.</p> 
              </Card>
            )}
          </div>
        </TabsContent>
        
        
        <TabsContent value="inquiries" className="mt-4"> 
          <div className="space-y-4">
            {customerData.inquiries.map((inquiry: any) => (
              <Card key={inquiry.id} className={cn(
                "p-4 hover:shadow-md transition-shadow",
                isDark ? "bg-slate-800" : "bg-white"
              )}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Inquiry for {`${inquiry.car?.make} ${inquiry.car?.model}`}</h3> 
                    <p className="text-sm text-gray-500">Status: {inquiry.status}</p>
                    <p className="text-xs mt-1">
                      <span className={cn(
                        "inline-flex items-center",
                        isDark ? "text-blue-400" : "text-blue-600"
                      )}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(inquiry.inquiryDate).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/admin/inquiries/${inquiry.id}`)}> 
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                </div>
              </Card>
            ))}
            
            {customerData.inquiries.length === 0 && (
              <Card className="p-4">
                <p className="text-center text-gray-500 py-4">No inquiries found.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        
        <TabsContent value="sales" className="mt-4">
          <div className="space-y-4">
            {customerData.sales.map((sale: any) => (
              <Card key={sale.id} className={cn(
                "p-4 hover:shadow-md transition-shadow",
                isDark ? "bg-slate-800" : "bg-white"
              )}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Sale of {`${sale.car?.make} ${sale.car?.model}`}</h3>
                    <p className="text-sm text-gray-500">Price: R{sale.salePrice.toLocaleString()}</p>
                    <p className="text-xs mt-1">
                      <span className={cn(
                        "inline-flex items-center",
                        isDark ? "text-blue-400" : "text-blue-600"
                      )}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/admin/sales/${sale.id}`)}>
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                </div>
              </Card>
            ))}
            
            {customerData.sales.length === 0 && (
              <Card className="p-4">
                <p className="text-center text-gray-500 py-4">No sales found.</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
