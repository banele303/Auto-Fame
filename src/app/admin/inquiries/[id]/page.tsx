"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailPageSkeleton } from "@/components/ui/skeletons";
import { 
  MessageSquare, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Car, 
  Calendar, 
  Clock, 
  Building, 
  MapPin,
  Edit,
  CheckCircle,
  AlertCircle,
  Reply,
  FileText
} from "lucide-react";
import { useGetInquiryQuery, useUpdateInquiryMutation } from "@/state/api";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";


export default function AdminInquiryDetailsPage() {
  const params = useParams();
  const inquiryId = Number(params.id);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  
  const { data: inquiry, isLoading: inquiryLoading, error: inquiryError } = useGetInquiryQuery(inquiryId);
  const [updateInquiry, { isLoading: isUpdating }] = useUpdateInquiryMutation();
  
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  if (inquiryLoading) {
    return <DetailPageSkeleton />;
  }
  
  if (inquiryError) {
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
          <p className="text-red-500">Failed to load inquiry details. Please try again.</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push("/admin/inquiries")}
          >
            Go to Inquiries List
          </Button>
        </Card>
      </div>
    );
  }

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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW':
        return <AlertCircle className="h-4 w-4" />;
      case 'CONTACTED':
        return <Reply className="h-4 w-4" />;
      case 'SCHEDULED':
        return <Calendar className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <Clock className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateInquiry({
        id: inquiryId,
        updateData: { status: newStatus as any }
      }).unwrap();
      
      toast.success(`Inquiry status updated to ${newStatus.toLowerCase()}`);
      setSelectedStatus("");
    } catch (error) {
      toast.error("Failed to update inquiry status");
    }
  };

  const handleResponse = async () => {
    if (!responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    try {
      await updateInquiry({
        id: inquiryId,
        updateData: { 
          status: 'CONTACTED',
          
        }
      }).unwrap();
      
      toast.success("Response sent and inquiry marked as contacted");
      setShowResponseModal(false);
      setResponseText("");
    } catch (error) {
      toast.error("Failed to send response");
    }
  };

  if (!inquiry) {
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
          <h1 className="text-2xl font-bold">Inquiry Not Found</h1>
        </div>
        <Card className="p-6">
          <p className="text-gray-500">The inquiry you&apos;re looking for doesn&apos;t exist.</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push("/admin/inquiries")}
          >
            Go to Inquiries List
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Inquiry Details</h1>
            <p className="text-gray-500 mt-1">ID: {inquiry.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn("text-sm px-3 py-1.5", getStatusColor(inquiry.status))}>
            {getStatusIcon(inquiry.status)}
            <span className="ml-2">{inquiry.status}</span>
          </Badge>
          <Button
            onClick={() => setShowResponseModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Reply className="h-4 w-4 mr-2" />
            Respond
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Inquiry Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Message</label>
                  <p className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    {inquiry.message}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date</label>
                    <p className="text-sm">{new Date(inquiry.inquiryDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Time</label>
                    <p className="text-sm">{new Date(inquiry.inquiryDate).toLocaleTimeString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            
            {inquiry.car && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Car className="h-5 w-5 mr-2" />
                    Car Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vehicle</label>
                    <p className="text-sm font-medium">
                      {inquiry.car.year} {inquiry.car.make} {inquiry.car.model}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">VIN</label>
                    <p className="text-sm">{inquiry.car.vin}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Price</label>
                    <p className="text-sm">R{inquiry.car.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-sm">{inquiry.car.status}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/cars/${inquiry.car?.id}`)}
                    className="w-full"
                  >
                    View Car Details
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          
          {inquiry.dealership && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Dealership Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm">{inquiry.dealership.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm">{inquiry.dealership.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm">{inquiry.dealership.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-sm">{inquiry.dealership.city}, {inquiry.dealership.state}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="customer" className="space-y-6">
          {inquiry.customer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm">{inquiry.customer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm">{inquiry.customer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm">{inquiry.customer.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Since</label>
                    <p className="text-sm">{new Date(inquiry.customer.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/customers/${inquiry.customer?.cognitoId}`)}
                    className="w-full"
                  >
                    View Customer Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Update the inquiry status or take other actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Update Status
                </label>
                <div className="flex gap-2">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleStatusUpdate(selectedStatus)}
                    disabled={!selectedStatus || isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowResponseModal(true)}
                  className="w-full"
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Send Response
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Response</DialogTitle>
            <DialogDescription>
              Send a response to the customer regarding their inquiry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">
                Response Message
              </label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response here..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResponseModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResponse}
              disabled={!responseText.trim() || isUpdating}
            >
              {isUpdating ? "Sending..." : "Send Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
