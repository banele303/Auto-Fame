"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Calendar, Clock, User, Mail, Phone, MapPin, MessageSquare, Car, X } from "lucide-react";
import { toast } from "sonner";

interface TestDriveFormProps {
  isOpen: boolean;
  onClose: () => void;
  carId: number;
  carDetails: {
    make: string;
    model: string;
    year: number;
    price: number;
  };
}

const TestDriveForm: React.FC<TestDriveFormProps> = ({ isOpen, onClose, carId, carDetails }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    location: "dealership",
    message: "",
    licenseNumber: "",
    hasValidLicense: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || 
          !formData.preferredDate || !formData.preferredTime || !formData.licenseNumber) {
        toast.error("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      
      const scheduledDate = new Date(`${formData.preferredDate}T${formData.preferredTime}`);
      
      const requestData = {
        carId,
        customerId: `temp_customer_${Date.now()}`, // Temporary ID, API will create proper customer
        scheduledDate: scheduledDate.toISOString(),
        dealershipId: 1, // TODO: Get actual dealership ID from car data
        notes: formData.message || undefined,
        contactInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
      };

      
      const response = await fetch('/api/test-drives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success("Test drive scheduled successfully!");
        
        
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          preferredDate: "",
          preferredTime: "",
          location: "dealership",
          message: "",
          licenseNumber: "",
          hasValidLicense: true,
        });
        
        onClose();
      } else {
        const errorMessage = result.error || result.message || "Failed to schedule test drive";
        const errorDetails = result.details ? JSON.stringify(result.details) : "";
        toast.error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ""}`);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Failed to schedule test drive:", error);
      toast.error("Failed to schedule test drive. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <Car className="mr-2 text-[#00acee]" size={24} />
              Schedule Test Drive
            </DialogTitle>
            <DialogClose className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </DialogClose>
          </div>
          
          
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Vehicle Details</h3>
            <p className="text-gray-600">
              {carDetails.year} {carDetails.make} {carDetails.model}
            </p>
            <p className="text-[#00acee] font-bold">
              R {carDetails.price.toLocaleString()}
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <User className="mr-2" size={20} />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your.email@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+27 XX XXX XXXX"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="licenseNumber">Driver&apos;s License Number *</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                placeholder="Enter your license number"
                required
              />
            </div>
          </div>

          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Calendar className="mr-2" size={20} />
              Schedule Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferredDate">Preferred Date *</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => handleInputChange("preferredDate", e.target.value)}
                  min={minDate}
                  required
                />
              </div>
              <div>
                <Label htmlFor="preferredTime">Preferred Time *</Label>
                <Select value={formData.preferredTime} onValueChange={(value) => handleInputChange("preferredTime", value)}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Clock className="mr-2 text-gray-400" size={16} />
                      <SelectValue placeholder="Select time" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Test Drive Location</Label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <MapPin className="mr-2 text-gray-400" size={16} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dealership">At Dealership</SelectItem>
                  <SelectItem value="home">Home Delivery (Additional fee may apply)</SelectItem>
                  <SelectItem value="office">Office Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <MessageSquare className="mr-2" size={20} />
              Additional Information
            </h3>
            
            <div>
              <Label htmlFor="message">Special Requests or Comments</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                placeholder="Any specific requirements or questions about the vehicle..."
                rows={3}
              />
            </div>
          </div>

          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Please bring a valid driver&apos;s license and proof of insurance for the test drive. 
              Test drives are subject to availability and may require a security deposit.
            </p>
          </div>

          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#00acee] hover:bg-[#0099d4] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
              ) : (
                <Calendar className="mr-2" size={16} />
              )}
              {isSubmitting ? "Scheduling..." : "Schedule Test Drive"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TestDriveForm;
