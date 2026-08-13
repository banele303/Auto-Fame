"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  useGetInquiriesQuery, // Changed from useGetApplicationsQuery
  useGetAuthUserQuery,
  useUpdateInquiryMutation, // Correct import from API
  useGetCarsQuery // Changed from useGetPropertiesQuery
} from "@/state/api";
import { 
  CircleCheckBig, 
  Download, 
  Car, // Changed from Building
  Calendar, 
  Clock, 
  Filter, 
  User, 
  ChevronRight,
  X,
  Check,
  AlertCircle,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const InquirySkeleton = () => (
  <div className="w-full space-y-3">
    {[1, 2, 3].map((item) => (
      <Card key={item} className="p-4 border overflow-hidden dark:bg-gray-900/50 dark:border-gray-800 bg-white border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-3/4 dark:bg-gray-800 bg-gray-200" />
            <Skeleton className="h-6 w-16 dark:bg-gray-800 bg-gray-200 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-2/3 dark:bg-gray-800 bg-gray-200" />
            <Skeleton className="h-4 w-1/2 dark:bg-gray-800 bg-gray-200" />
          </div>
          <div className="flex justify-end gap-2">
            <Skeleton className="h-9 w-24 dark:bg-gray-800 bg-gray-200 rounded-md" />
            <Skeleton className="h-9 w-24 dark:bg-gray-800 bg-gray-200 rounded-md" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

interface InquiryStatusBadgeProps {
  status: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

const StatusBadge = ({ status }: InquiryStatusBadgeProps) => {
  const statusConfig = {
    NEW: {
      color: "bg-blue-500/20 text-blue-400 border-blue-500/50 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/50",
      icon: <Clock className="w-3 h-3 mr-1" />
    },
    CONTACTED: {
      color: "bg-amber-500/20 text-amber-400 border-amber-500/50 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/50",
      icon: <MessageSquare className="w-3 h-3 mr-1" />
    },
    SCHEDULED: {
      color: "bg-purple-500/20 text-purple-400 border-purple-500/50 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/50",
      icon: <Calendar className="w-3 h-3 mr-1" />
    },
    COMPLETED: {
      color: "bg-green-500/20 text-green-400 border-green-500/50 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/50",
      icon: <Check className="w-3 h-3 mr-1" />
    },
    CANCELLED: {
      color: "bg-red-500/20 text-red-400 border-red-500/50 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50",
      icon: <X className="w-3 h-3 mr-1" />
    }
  };

  const config = statusConfig[status] || statusConfig.NEW;

  return (
    <Badge className={`px-2 py-1 ${config.color} flex items-center font-medium`}>
      {config.icon}
      {status}
    </Badge>
  );
};

interface InquiryItemProps {
  inquiry: {
    id: number;
    status: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    inquiryDate: string;
    customer?: {
      name: string;
    };
    car: {
      id: number;
      make: string;
      model: string;
      price: number;
      dealership: {
        name: string;
        city: string;
      };
    };
  };
  handleStatusChange: (id: number, status: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED') => Promise<void>;
}

const InquiryItem = ({ inquiry, handleStatusChange }: InquiryItemProps) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => setExpanded(!expanded);

  const formattedDate = formatDistanceToNow(
    new Date(inquiry.inquiryDate),
    { addSuffix: true }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="overflow-hidden dark:bg-slate-950 dark:border-gray-800 bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-gray-700 dark:hover:border-gray-700">
        <div 
          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
          onClick={toggleExpand}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center">
                <User className="w-6 h-6 dark:text-gray-300 text-gray-600" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <h3 className="font-medium dark:text-white text-gray-900">
                {inquiry.customer?.name}
              </h3>
              <div className="text-sm dark:text-gray-400 text-gray-500 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formattedDate}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={inquiry.status} />
            <ChevronRight className={`w-5 h-5 dark:text-gray-500 text-gray-400 transition-transform duration-300 ${expanded ? "rotate-90" : ""}`} />
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t dark:bg-slate-950 border-gray-200 pt-4">
                <div className="mb-4 p-3 dark:bg-gray-800/50 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                    <h4 className="font-medium dark:text-white text-gray-900">Car Details</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="dark:text-gray-400 text-gray-500">Make: </span>
                      <span className="dark:text-white text-gray-900">{inquiry.car.make}</span>
                    </div>
                    <div>
                      <span className="dark:text-gray-400 text-gray-500">Model: </span>
                      <span className="dark:text-white text-gray-900">{inquiry.car.model}</span>
                    </div>
                    <div>
                      <span className="dark:text-gray-400 text-gray-500">Price: </span>
                      <span className="dark:text-white text-gray-900">R{inquiry.car.price.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="dark:text-gray-400 text-gray-500">Dealership: </span>
                      <span className="dark:text-white text-gray-900">{inquiry.car.dealership.name}, {inquiry.car.dealership.city}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4 p-3 dark:bg-gray-800/50 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CircleCheckBig className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                    <h4 className="font-medium dark:text-white text-gray-900">Inquiry Details</h4>
                  </div>
                  <div className="text-sm">
                    <div className="mb-1">
                      <span className="dark:text-gray-400 text-gray-500">Inquiry ID: </span>
                      <span className="dark:text-white text-gray-900">{inquiry.id}</span>
                    </div>
                    <div className="mb-1">
                      <span className="dark:text-gray-400 text-gray-500">Submitted: </span>
                      <span className="dark:text-white text-gray-900">{new Date(inquiry.inquiryDate).toLocaleDateString()}</span>
                    </div>
                    <div className="mb-1">
                      <span className="dark:text-gray-400 text-gray-500">Status: </span>
                      <StatusBadge status={inquiry.status} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 justify-end">
                  <Link
                    href={`/employees/inventory/${inquiry.car.id}`}
                    className="dark:bg-gray-800 bg-gray-100 dark:border-gray-700 border-gray-200 dark:text-gray-200 text-gray-700 py-2 px-4 
                      rounded-md flex items-center justify-center dark:hover:bg-gray-700 hover:bg-gray-200 transition-colors text-sm"
                    scroll={false}
                  >
                    <Car className="w-4 h-4 mr-2" />
                    View Car
                  </Link>
                  
                  {inquiry.status === "NEW" && (
                    <div className="flex gap-2">
                      <Button
                        className="px-4 py-2 text-sm text-white bg-blue-700 rounded hover:bg-blue-600 transition-colors"
                        onClick={() => handleStatusChange(inquiry.id, "CONTACTED")}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Mark as Contacted
                      </Button>
                      <Button
                        className="px-4 py-2 text-sm text-white bg-green-700 rounded hover:bg-green-600 transition-colors"
                        onClick={() => handleStatusChange(inquiry.id, "SCHEDULED")}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule Test Drive
                      </Button>
                    </div>
                  )}
                  
                  {(inquiry.status === "CONTACTED" || inquiry.status === "SCHEDULED") && (
                    <div className="flex gap-2">
                      <Button
                        className="px-4 py-2 text-sm text-white bg-green-700 rounded hover:bg-green-600 transition-colors"
                        onClick={() => handleStatusChange(inquiry.id, "COMPLETED")}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Mark as Completed
                      </Button>
                      <Button
                        className="px-4 py-2 text-sm text-white bg-red-700 rounded hover:bg-red-600 transition-colors"
                        onClick={() => handleStatusChange(inquiry.id, "CANCELLED")}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Mark as Cancelled
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

const Inquiries = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const {
    data: inquiries,
    isLoading,
    isError,
  } = useGetInquiriesQuery( 
    {
      customerId: authUser?.cognitoInfo?.userId,
      employeeId: authUser?.cognitoInfo?.userId,
    },
    {
      skip: !authUser?.cognitoInfo?.userId || authUser?.userRole === "customer",
    }
  );
  
  const [updateInquiry] = useUpdateInquiryMutation();

  const handleStatusChange = async (id: number, status: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED') => {
    try {
      const result = await updateInquiry({ 
        id, 
        updateData: { status: status as any }
      }).unwrap();
      
      toast.success(`Inquiry ${status.toLowerCase()}`);
    } catch (error) {
      console.error("Failed to update inquiry status:", error);
      toast.error("Could not update inquiry status. Please try again.");
    }
  };

  const { data: cars } = useGetCarsQuery(
    {}, 
    { skip: !authUser?.cognitoInfo?.userId || authUser?.userRole === "customer" }
  );

  const filteredInquiries = inquiries?.filter((inquiry) => {
    const matchesTab = activeTab === "all" || inquiry.status.toLowerCase() === activeTab.toLowerCase();
    
    if (!searchTerm) return matchesTab;
    
    const customerName = inquiry.customer ? inquiry.customer.name.toLowerCase() : '';
    const car = cars?.find(c => c.id === inquiry.carId);
    const carName = car ? `${car.make} ${car.model}`.toLowerCase() : '';
    
    const searchLower = searchTerm.toLowerCase();
    
    return matchesTab && (customerName.includes(searchLower) || carName.includes(searchLower));
  }) || [];
  
  const transformedInquiries = filteredInquiries.map(inquiry => {
    const matchingCar = cars?.find(c => c.id === inquiry.carId);
    
    return {
      ...inquiry,
      inquiryDate: inquiry.inquiryDate instanceof Date ? 
        inquiry.inquiryDate.toISOString() : inquiry.inquiryDate,
      customer: inquiry.customer ? {
        name: inquiry.customer.name || '',
      } : undefined,
      car: matchingCar ? {
        id: matchingCar.id,
        make: matchingCar.make || 'Unknown Make',
        model: matchingCar.model || 'Unknown Model',
        price: Number(matchingCar.price) || 0,
        dealership: { name: 'Unknown Dealership', city: 'Unknown City' }
      } : {
        id: inquiry.carId,
        make: 'Unknown Make',
        model: 'Unknown Model',
        price: 0,
        dealership: { name: 'Unknown Dealership', city: 'Unknown City' }
      }
    };
  });

  const statusCounts = inquiries?.reduce((acc: any, inc: any) => {
    const status = inc.status.toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:text-white bg-white text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-center sm:text-left dark:text-white text-gray-900">Inquiries</h1>
          <p className="dark:text-gray-400 text-gray-500 text-center sm:text-left">
            View and manage customer inquiries
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search by customer or car..."
              className="w-full dark:bg-gray-900 bg-gray-50 dark:border-gray-800 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600"
                onClick={() => setSearchTerm("")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="sm:flex-shrink-0">
            <Button 
              className="w-full sm:w-auto dark:bg-gray-800 bg-gray-100 dark:border-gray-700 border-gray-200 dark:text-gray-200 text-gray-700 py-2 px-4 
                rounded-md flex items-center justify-center dark:hover:bg-gray-700 hover:bg-gray-200 transition-colors"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="flex overflow-x-auto scrollbar-hide dark:bg-gray-900/50 bg-gray-100 rounded-lg p-1 mb-6">
              <TabsTrigger 
                value="all" 
                className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md py-2 px-4"
              >
                All
                {inquiries && inquiries.length > 0 && (
                  <span className="ml-2 dark:bg-gray-800 bg-gray-200 dark:text-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {inquiries.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="new" 
                className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md py-2 px-4"
              >
                New
                {statusCounts.new > 0 && (
                  <span className="ml-2 dark:bg-blue-900/50 bg-blue-100 dark:text-blue-300 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {statusCounts.new}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="contacted" 
                className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md py-2 px-4"
              >
                Contacted
                {statusCounts.contacted > 0 && (
                  <span className="ml-2 dark:bg-amber-900/50 bg-amber-100 dark:text-amber-300 text-amber-700 px-2 py-0.5 rounded-full text-xs">
                    {statusCounts.contacted}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="scheduled" 
                className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md py-2 px-4"
              >
                Scheduled
                {statusCounts.scheduled > 0 && (
                  <span className="ml-2 dark:bg-purple-900/50 bg-purple-100 dark:text-purple-300 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                    {statusCounts.scheduled}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md py-2 px-4"
              >
                Completed
                {statusCounts.completed > 0 && (
                  <span className="ml-2 dark:bg-green-900/50 bg-green-100 dark:text-green-300 text-green-700 px-2 py-0.5 rounded-full text-xs">
                    {statusCounts.completed}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="cancelled" 
                className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md py-2 px-4"
              >
                Cancelled
                {statusCounts.cancelled > 0 && (
                  <span className="ml-2 dark:bg-red-900/50 bg-red-100 dark:text-red-300 text-red-700 px-2 py-0.5 rounded-full text-xs">
                    {statusCounts.cancelled}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {isLoading ? (
              <InquirySkeleton />
            ) : isError ? (
              <div className="text-center p-8 dark:bg-red-900/20 bg-red-50 dark:border-red-800 border-red-200 rounded-lg">
                <AlertCircle className="w-10 h-10 dark:text-red-400 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium dark:text-red-300 text-red-700 mb-2">Error Loading Inquiries</h3>
                <p className="dark:text-gray-300 text-gray-700">There was an error fetching your inquiries. Please try again later.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transformedInquiries.length === 0 ? (
                  <div className="text-center p-8 dark:bg-gray-900/50 bg-gray-50 dark:border-gray-800 border-gray-200 rounded-lg">
                    <CircleCheckBig className="w-10 h-10 dark:text-gray-400 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium dark:text-gray-300 text-gray-700 mb-2">No Inquiries Found</h3>
                    <p className="dark:text-gray-400 text-gray-500">
                      {searchTerm 
                        ? "No inquiries match your search criteria." 
                        : activeTab !== "all" 
                          ? `You don&apos;t have any ${activeTab} inquiries.` 
                          : "You don&apos;t have any inquiries yet."}
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {transformedInquiries.map((inquiry) => (
                      <InquiryItem
                        key={inquiry.id}
                        inquiry={inquiry}
                        handleStatusChange={handleStatusChange}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Inquiries;