"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useGetInquiriesQuery, useGetAuthUserQuery } from "@/state/api"; 
import { CircleCheckBig, Clock, Download, FileText, Car, XCircle } from "lucide-react"; 
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

const Inquiries = () => { 
  const { data: authUser } = useGetAuthUserQuery();
  const userRole = authUser?.userRole || '';
  const userId = authUser?.cognitoInfo?.userId;
  
  // Skip the API call if the user is an employee trying to access customer routes
  const shouldSkipQuery = userRole === 'employee'; // Changed from manager
  
  const {
    data: inquiries, // Changed applications to inquiries
    isLoading,
    isError,
  } = useGetInquiriesQuery({ // Updated hook
    customerId: userId,
  }, { skip: shouldSkipQuery });
  
  
  if (userRole === 'employee') { 
    return (
      <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header
          title="Inquiries"
          subtitle="This page is only accessible to customers"
        />
        <div className="flex flex-col items-center justify-center p-12 mt-8  border border-[#333] rounded-xl text-center">
          <FileText className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Access Restricted</h3>
          <p className="text-gray-400">As an employee, you don&apos;t have access to the customer inquiries page. Please use the employee dashboard to view inquiries for your cars.</p> 
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": 
        return <Badge className="bg-green-600/20 text-green-400 border border-green-500/20 hover:bg-green-600/30">Completed</Badge>;
      case "NEW": 
        return <Badge className="bg-yellow-600/20 text-yellow-300 border border-yellow-500/20 hover:bg-yellow-600/30">New</Badge>;
      case "CANCELLED": 
        return <Badge className="bg-red-600/20 text-red-400 border border-red-500/20 hover:bg-red-600/30">Cancelled</Badge>;
      case "CONTACTED": 
        return <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:bg-blue-600/30">Contacted</Badge>;
      case "SCHEDULED": 
        return <Badge className="bg-purple-600/20 text-purple-400 border border-purple-500/20 hover:bg-purple-600/30">Scheduled</Badge>;
      default:
        return <Badge className="bg-gray-600/20 text-gray-400 border border-gray-500/20">Unknown</Badge>;
    }
  };

  if (isLoading) return <Loading />;
  if (isError || !inquiries) return <div>Error fetching inquiries</div>; // Updated text

  return (
    <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Header
        title="My Inquiries" // Updated text
        subtitle="Track and manage your car inquiries" // Updated text
      />
      
      <div className="space-y-6 mt-8">
        {inquiries?.length > 0 ? (
          inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="border border-[#333] shadow-md overflow-hidden">
            <div className="flex flex-col md:flex-row">
              
              <div className="relative md:w-1/4 h-28 md:h-auto p-2 overflow-hidden">
                <div className="relative w-full h-full rounded-md overflow-hidden">
                  {inquiry.car?.photoUrls?.[0] ? (
                    <Image
                      src={inquiry.car.photoUrls[0] || "/placeholder.svg"}
                      alt={`${inquiry.car.make} ${inquiry.car.model}`}
                      fill
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-md">
                      <Car className="h-10 w-10 text-gray-600" />
                    </div>
                  )}
                </div>
              </div>
      
              
              <div className="flex-1 p-4 flex flex-col">
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-semibold text-white">{`${inquiry.car?.year} ${inquiry.car?.make} ${inquiry.car?.model}` || "Unknown Car"}</h3> 
                    {getStatusBadge(inquiry.status)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Submitted: {new Date(inquiry.inquiryDate).toLocaleDateString()} 
                  </div>
                </div>
      
                
                <div className="mb-3">
                  <p className="text-gray-400 text-xs">
                    {inquiry.dealership?.name || 'Unknown Dealership'}, {inquiry.dealership?.city || 'Unknown City'} 
                  </p>
                </div>
      
                
                <div className="flex-1">
                  {inquiry.status === "COMPLETED" ? ( 
                    <div className="bg-green-900/20 p-3 rounded-md text-green-300 flex items-center border border-green-800/30 text-sm">
                      <CircleCheckBig className="w-4 h-4 mr-2 flex-shrink-0" />
                      <p>
                        Your inquiry has been completed! You can now proceed with the purchase or schedule a test drive.{" "} 
                      </p>
                    </div>
                  ) : inquiry.status === "NEW" ? ( 
                    <div className="bg-yellow-900/20 p-3 rounded-md text-yellow-300 flex items-center border border-yellow-800/30 text-sm">
                      <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                      <p>Your inquiry is new. We&apos;ll notify you once a sales associate contacts you.</p> 
                    </div>
                  ) : ( 
                    <div className="bg-red-900/20 p-3 rounded-md text-red-300 flex items-center border border-red-800/30 text-sm">
                      <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      <p>
                        Your inquiry status is {inquiry.status.toLowerCase()}. Please check back for updates or contact the dealership.
                      </p>
                    </div>
                  )}
                </div>
      
                
                <div className="mt-4 flex justify-end space-x-3">
                  <Link href={`/cars/${inquiry.car?.id}`}> 
                    <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                      View Car
                    </Button>
                  </Link>
      
                  {inquiry.status === "COMPLETED" && ( 
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Download className="w-3 h-3 mr-2" />
                      Download Inquiry Details
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-12 mt-8  border border-[#333] rounded-xl text-center">
            <FileText className="h-12 w-12 text-gray-500 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Inquiries Found</h3> 
            <p className="text-gray-400">You haven&apos;t submitted any car inquiries yet. Browse cars and inquire about ones you&apos;re interested in.</p> 
          </div>
        )}
      </div>
    </div>
  );
};

export default Inquiries; 
