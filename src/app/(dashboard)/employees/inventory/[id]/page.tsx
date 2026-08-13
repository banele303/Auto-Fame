"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetSalesQuery,
  useGetCarQuery,
  useGetInquiriesQuery,
  useGetTestDrivesQuery,
} from "@/state/api"; 
import { 
  ArrowDownToLine, 
  ArrowLeft, 
  Check, 
  Download, 
  Car,
  MapPin,
  Gauge,
  Key,
  Edit3,
  Calendar,
  MessageSquare,
  DollarSign
} from "lucide-react"; 

// Define Car interface directly or import from the correct location
interface CarType {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  description?: string;
  photoUrls?: string[];
  features?: string[];
  condition?: string;
  transmission?: string;
  mileage?: number;
  vin?: string;
  carType?: string;
  dealership?: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
}
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CarDetails = () => { 
  const { id } = useParams();
  const router = useRouter();
  const carId = Number(id);
  const [activeTab, setActiveTab] = useState<'overview' | 'inquiries' | 'sales' | 'testdrives'>('overview'); 

  const { data: car, isLoading: carLoading, error: carError } = useGetCarQuery(carId) as { data: CarType | undefined, isLoading: boolean, error: any }; 
  const { data: sales, isLoading: salesLoading } = useGetSalesQuery(undefined, { skip: !!carError }); 
  const { data: inquiries, isLoading: inquiriesLoading } = useGetInquiriesQuery({ carId: carId.toString() }, { skip: !!carError }); 
  const { data: testDrives, isLoading: testDrivesLoading } = useGetTestDrivesQuery(undefined, { skip: !!carError }); 
    
  
  if (carLoading || salesLoading || inquiriesLoading || testDrivesLoading) return <Loading />;
  
  
  if (carError) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:ml-0">
        <Link
          href="/employees/inventory"
          className="flex items-center mb-4 hover:text-primary-500"
          scroll={false}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Inventory</span>
        </Link>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Car Not Found</h2>
          <p className="text-gray-600 mb-4">The car you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button
            onClick={() => router.push('/employees/inventory')}
            className="bg-primary hover:bg-primary/90"
          >
            View All Cars
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      
      <Link
        href="/employees/inventory"
        className="flex items-center mb-4 hover:text-primary-500"
        scroll={false}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        <span>Back to Inventory</span>
      </Link>

      
      <div className="relative w-full overflow-hidden mb-8 bg-white/5 dark:bg-white/5 bg-gray-50 rounded-xl">
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 p-6 md:p-8">
          
          <div className="relative w-full md:w-2/5 aspect-[4/3] rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
            <Image
              src={car?.photoUrls?.[0] || "/placeholder.jpg"}
              alt={`${car?.make} ${car?.model}`}
              fill
              unoptimized={true}
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
          
          
          <div className="flex-1 flex flex-col justify-between py-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold dark:text-white text-slate-800 mb-3 tracking-tight">{`${car?.year} ${car?.make} ${car?.model}`}</h1>
              <div className="flex items-center text-white/80 mb-4">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="dark:text-gray-800 text-white">{car?.dealership?.name}, {car?.dealership?.city}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col items-center justify-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                  <Car className="h-5 w-5 text-blue-400 mb-1" />
                  <span className="font-medium text-gray-800 dark:text-white">{car?.carType || "N/A"}</span>
                  <span className="text-xs text-gray-400">Type</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                  <Gauge className="h-5 w-5 text-blue-400 mb-1" />
                  <span className="font-medium text-gray-800 dark:text-white">{car?.mileage || 0}</span>
                  <span className="text-xs text-gray-400">Mileage</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                  <Key className="h-5 w-5 text-blue-400 mb-1" />
                  <span className="font-medium text-gray-800 dark:text-white">{car?.vin || "N/A"}</span>
                  <span className="text-xs text-gray-400">VIN</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-white">R{car?.price?.toFixed(2)}</div>
              <Button 
                onClick={() => router.push(`/employees/inventory/${carId}/edit`)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                size="sm"
              >
                <Edit3 className="h-4 w-4 mr-2" /> Edit Car Details
              </Button>
            </div>
          </div>
        </div>
      </div>

      
      <div className="flex mb-8 overflow-x-auto no-scrollbar bg-gray-50 dark:bg-white/5 rounded-xl p-1 border border-gray-200 dark:border-white/5 shadow-lg">
        <button
          className={`px-6 py-3 font-medium text-sm rounded-lg transition-all duration-200 ${activeTab === 'overview' ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm rounded-lg transition-all duration-200 ${activeTab === 'inquiries' ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
          onClick={() => setActiveTab('inquiries')}
        >
          Inquiries
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm rounded-lg transition-all duration-200 ${activeTab === 'sales' ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
          onClick={() => setActiveTab('sales')}
        >
          Sales
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm rounded-lg transition-all duration-200 ${activeTab === 'testdrives' ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
          onClick={() => setActiveTab('testdrives')}
        >
          Test Drives
        </button>
      </div>

      
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white/5 rounded-xl shadow-xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                <div className="h-5 w-1 bg-blue-500 rounded-full mr-3 shadow-glow-blue"></div>
                Car Details
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{car?.description || "No description available."}</p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {car?.features?.map((feature: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors">
                    {feature}
                  </Badge>
                ))}
                {car?.condition && (
                  <Badge variant="outline" className="bg-gray-800/50 text-gray-200 border-gray-600 hover:bg-gray-700/50 transition-colors">{car.condition.replace(/_/g, ' ')}</Badge>
                )}
                {car?.transmission && (
                  <Badge variant="outline" className="bg-gray-800/50 text-gray-200 border-gray-600 hover:bg-gray-700/50 transition-colors">{car.transmission.replace(/_/g, ' ')}</Badge>
                )}
              </div>
            </div>
            
            
            <div className="bg-white/5 rounded-xl shadow-xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                <div className="h-5 w-1 bg-purple-500 rounded-full mr-3"></div>
                Dealership Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                  <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Dealership Address</h3>
                    <p className="text-gray-500 dark:text-gray-400">{car?.dealership?.address}, {car?.dealership?.city}, {car?.dealership?.state} {car?.dealership?.postalCode}</p>
                  </div>
                </div>
                
                <div className="h-40 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Map view would appear here</p>
                </div>
              </div>
            </div>
          </div>

          
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl shadow-xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                <div className="h-5 w-1 bg-green-500 rounded-full mr-3"></div>
                Pricing
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <span className="text-gray-600 dark:text-gray-300">Sale Price</span>
                  <span className="font-medium text-gray-800 dark:text-white">R{car?.price?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-4 bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg border border-blue-700/30 mt-4">
                  <span className="font-semibold text-white">Total Price</span>
                  <span className="font-bold text-white">R{car?.price?.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            
            <div className="bg-white/5 rounded-xl shadow-xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                <div className="h-5 w-1 bg-blue-500 rounded-full mr-3 shadow-glow-blue"></div>
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push(`/employees/inventory/${carId}/edit`)} 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <Edit3 className="h-4 w-4 mr-2" /> Edit Car Details
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <Download className="h-4 w-4 mr-2" /> Download Car Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {activeTab === 'inquiries' && (
        <div className="relative w-full overflow-hidden bg-gray-50 dark:bg-white/5 rounded-xl p-6 md:p-8 space-y-6">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">Customer Inquiries</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">View all inquiries for this car.</p>
              </div>
            </div>

            <div className="border border-[#333] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#333] hover:bg-[#111]">
                      <TableHead className="text-gray-300">Customer</TableHead>
                      <TableHead className="text-gray-300">Message</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(inquiries ?? []).length > 0 ? (
                      (inquiries ?? []).map((inquiry) => (
                        <TableRow key={inquiry.id} className="border-b border-[#222] hover:bg-[#111]">
                          <TableCell>
                            <div className="font-semibold text-white">
                              {inquiry.customer?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {inquiry.customer?.email || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{inquiry.message}</TableCell>
                          <TableCell className="text-gray-300">
                            <Badge>{inquiry.status}</Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">{new Date(inquiry.inquiryDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center bg-[#111] border-[#333] hover:bg-[#222] text-white"
                              onClick={() => router.push(`/employees/inquiries/${inquiry.id}`)}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              View Inquiry
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                          <p>No inquiries found for this car.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {activeTab === 'sales' && (
        <div className="relative w-full overflow-hidden bg-gray-50 dark:bg-white/5 rounded-xl p-6 md:p-8 space-y-6">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">Sales History</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">View all sales records for this car.</p>
              </div>
            </div>

            <div className="border border-[#333] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#333] hover:bg-[#111]">
                      <TableHead className="text-gray-300">Customer</TableHead>
                      <TableHead className="text-gray-300">Sale Price</TableHead>
                      <TableHead className="text-gray-300">Sale Date</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sales ?? []).length > 0 ? (
                      (sales ?? []).map((sale) => (
                        <TableRow key={sale.id} className="border-b border-[#222] hover:bg-[#111]">
                          <TableCell>
                            <div className="font-semibold text-white">
                              Customer ID: {sale.customerId || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">
                              
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">R{sale.salePrice.toLocaleString()}</TableCell>
                          <TableCell className="text-gray-300">{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center bg-[#111] border-[#333] hover:bg-[#222] text-white"
                              onClick={() => router.push(`/employees/sales/${sale.id}`)}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              View Sale
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                          <p>No sales found for this car.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {activeTab === 'testdrives' && (
        <div className="relative w-full overflow-hidden bg-gray-50 dark:bg-white/5 rounded-xl p-6 md:p-8 space-y-6">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">Test Drive History</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">View all test drives scheduled for this car.</p>
              </div>
            </div>

            <div className="border border-[#333] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#333] hover:bg-[#111]">
                      <TableHead className="text-gray-300">Customer</TableHead>
                      <TableHead className="text-gray-300">Scheduled Date</TableHead>
                      <TableHead className="text-gray-300">Actual Date</TableHead>
                      <TableHead className="text-gray-300">Completed</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(testDrives ?? []).length > 0 ? (
                      (testDrives ?? []).map((td) => (
                        <TableRow key={td.id} className="border-b border-[#222] hover:bg-[#111]">
                          <TableCell>
                            <div className="font-semibold text-white">
                              Customer ID: {td.customerId || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-400">
                              
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{new Date(td.scheduledDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-gray-300">{td.actualDate ? new Date(td.actualDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="text-gray-300">
                            <Badge>{td.completed ? 'Yes' : 'No'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center bg-[#111] border-[#333] hover:bg-[#222] text-white"
                              onClick={() => router.push(`/employees/testdrives/${td.id}`)}
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                          <p>No test drives found for this car.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarDetails;
