"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetInquiriesQuery, useUpdateInquiryMutation } from "@/state/api";
import { checkAdminAuth, configureAdminAuth } from "../adminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  MessageSquare,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Car,
  Calendar,
  ArrowLeft,
  Reply,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const AdminInquiriesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || "all");
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState("");

  
  useEffect(() => {
    async function verifyAdminAuth() {
      try {
        configureAdminAuth();
        const { isAuthenticated, adminData } = await checkAdminAuth();
        
        if (isAuthenticated && adminData) {
          setAdminUser(adminData);
          setIsLoading(false);
        } else {
          router.replace('/admin-login?from=/admin/inquiries');
        }
      } catch (error) {
        console.error('Error verifying admin authentication:', error);
        setIsLoading(false);
        toast.error('Error verifying admin status');
        router.replace('/admin-login?from=/admin/inquiries&error=auth_check_failed');
      }
    }
    
    verifyAdminAuth();
  }, [router]);

  
  const { data: inquiries, isLoading: inquiriesLoading, refetch } = useGetInquiriesQuery(
    {}, 
    { skip: !adminUser?.cognitoId }
  );

  
  const [updateInquiry] = useUpdateInquiryMutation();

  
  const filteredInquiries = React.useMemo(() => {
    if (!inquiries) return [];
    
    let filtered = inquiries.filter((inquiry) => {
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          inquiry.message.toLowerCase().includes(query) ||
          inquiry.customer?.email?.toLowerCase().includes(query) ||
          `${inquiry.car?.make} ${inquiry.car?.model}`.toLowerCase().includes(query)
        );
      }
      return true;
    });

    
    if (statusFilter !== "all") {
      filtered = filtered.filter(inquiry => inquiry.status === statusFilter);
    }

    return filtered.sort((a, b) => 
      new Date(b.inquiryDate).getTime() - new Date(a.inquiryDate).getTime()
    );
  }, [inquiries, searchQuery, statusFilter]);

  const handleStatusUpdate = async (inquiryId: number, newStatus: "NEW" | "CONTACTED" | "SCHEDULED" | "COMPLETED" | "CANCELLED") => {
    try {
      await updateInquiry({
        id: inquiryId,
        updateData: { status: newStatus }
      }).unwrap();
      
      toast.success(`Inquiry status updated to ${newStatus.toLowerCase()}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update inquiry status");
    }
  };

  const handleResponse = async () => {
    if (!selectedInquiry || !responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    try {
      await updateInquiry({
        id: selectedInquiry.id,
        updateData: { 
          status: 'CONTACTED',
          employeeId: adminUser.cognitoId,
          
        }
      }).unwrap();
      
      toast.success("Response sent and inquiry marked as contacted");
      setShowResponseModal(false);
      setResponseText("");
      setSelectedInquiry(null);
      refetch();
    } catch (error) {
      toast.error("Failed to send response");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'CONTACTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW':
        return <AlertCircle className="h-4 w-4" />;
      case 'CONTACTED':
        return <Clock className="h-4 w-4" />;
      case 'SCHEDULED':
        return <Calendar className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <X className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (isLoading || inquiriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-9 w-80 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid gap-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="bg-white dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-16 w-full mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Inquiry Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage customer inquiries and provide timely responses
            </p>
          </div>
        </div>

        
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    placeholder="Search inquiries by message, customer email, or car..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredInquiries.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {statusFilter === 'all' ? 'Total' : statusFilter.replace('_', ' ')} Inquiries
              </div>
            </CardContent>
          </Card>
          {statusFilter === 'all' && (
            <>
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {inquiries?.filter(i => i.status === 'NEW').length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">New</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {inquiries?.filter(i => i.status === 'CONTACTED').length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Contacted</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {inquiries?.filter(i => i.status === 'SCHEDULED').length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Scheduled</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {inquiries?.filter(i => i.status === 'COMPLETED').length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        
        <div className="grid gap-6">
          {filteredInquiries.length === 0 ? (
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No inquiries found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {statusFilter !== 'all' 
                    ? `No inquiries with status "${statusFilter}" match your search.`
                    : "No inquiries match your search criteria."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredInquiries.map((inquiry) => (
              <motion.div
                key={inquiry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Inquiry #{inquiry.id}
                          </h3>
                          <Badge className={cn("text-xs font-medium", getStatusColor(inquiry.status))}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(inquiry.status)}
                              {inquiry.status.replace('_', ' ')}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {inquiry.customer?.email || 'Unknown Customer'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            {inquiry.car ? `${inquiry.car.year} ${inquiry.car.make} ${inquiry.car.model}` : 'No car specified'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(inquiry.inquiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-700 dark:text-gray-300">
                        {inquiry.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {inquiry.status === 'NEW' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInquiry(inquiry);
                              setShowResponseModal(true);
                            }}
                            className="gap-2"
                          >
                            <Reply className="h-4 w-4" />
                            Respond
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(inquiry.id, 'CONTACTED')}
                            className="gap-2"
                          >
                            <Clock className="h-4 w-4" />
                            Mark Contacted
                          </Button>
                        </>
                      )}
                      
                      {inquiry.status === 'CONTACTED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(inquiry.id, 'SCHEDULED')}
                          className="gap-2"
                        >
                          <Calendar className="h-4 w-4" />
                          Mark Scheduled
                        </Button>
                      )}

                      {inquiry.status === 'SCHEDULED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(inquiry.id, 'COMPLETED')}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Completed
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/cars/${inquiry.carId}`)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Car
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/inquiries/${inquiry.id}`)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        
        {showResponseModal && selectedInquiry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Respond to Inquiry #{selectedInquiry.id}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowResponseModal(false);
                      setResponseText("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Original Message:</p>
                  <p className="text-gray-900 dark:text-white">{selectedInquiry.message}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Response:
                  </label>
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response to the customer..."
                    rows={6}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResponseModal(false);
                      setResponseText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleResponse}>
                    Send Response
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInquiriesPage;
