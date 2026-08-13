"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ShieldCheck, User, Mail, Phone, CreditCard, Calendar, 
  MessageSquare, Car, X, DollarSign, FileText, AlertCircle 
} from "lucide-react";
import { toast } from "sonner";

interface ReserveCarFormProps {
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

const ReserveCarForm: React.FC<ReserveCarFormProps> = ({ isOpen, onClose, carId, carDetails }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    preferredPickupDate: "",
    tradeInVehicle: false,
    tradeInDetails: "",
    message: "",
    agreeToTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reservation fee removed from UI per request

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || 
          !formData.address || !formData.agreeToTerms) {
        toast.error("Please fill in all required fields and agree to terms");
        setIsSubmitting(false);
        return;
      }

      const requestData = {
        carId,
        customerId: `temp_customer_${Date.now()}`, // Temporary ID, API will create proper customer
        dealershipId: 1, // TODO: Get actual dealership ID from car data
        contactInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        tradeIn: {
          hasTradeIn: formData.tradeInVehicle,
          tradeInDetails: formData.tradeInDetails || undefined,
        },
        notes: formData.message || undefined,
      };

      
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success("Car reserved successfully! You will receive a confirmation email shortly.");
        
        
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          preferredPickupDate: "",
          tradeInVehicle: false,
          tradeInDetails: "",
          message: "",
          agreeToTerms: false,
        });
        
        onClose();
      } else {
        const errorMessage = result.error || result.message || "Failed to reserve car";
        const errorDetails = result.details ? JSON.stringify(result.details) : "";
        toast.error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ""}`);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Failed to reserve car:", error);
      toast.error("Failed to reserve car. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <ShieldCheck className="mr-2 text-[#00acee]" size={24} />
              Reserve Vehicle
            </DialogTitle>
            <DialogClose className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </DialogClose>
          </div>
          
          
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Vehicle Details</h3>
            <div>
              <p className="text-gray-600">
                {carDetails.year} {carDetails.make} {carDetails.model}
              </p>
              <p className="text-[#00acee] font-bold text-lg">
                R {carDetails.price.toLocaleString()}
              </p>
            </div>
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
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Street address"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">Province</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gauteng">Gauteng</SelectItem>
                    <SelectItem value="western-cape">Western Cape</SelectItem>
                    <SelectItem value="kwazulu-natal">KwaZulu-Natal</SelectItem>
                    <SelectItem value="eastern-cape">Eastern Cape</SelectItem>
                    <SelectItem value="free-state">Free State</SelectItem>
                    <SelectItem value="limpopo">Limpopo</SelectItem>
                    <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
                    <SelectItem value="north-west">North West</SelectItem>
                    <SelectItem value="northern-cape">Northern Cape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="zipCode">Postal Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  placeholder="Postal code"
                />
              </div>
            </div>
          </div>

          
          {/* Financial Information section removed per request */}

          
          {/* Pickup & trade-in section removed for inquiry focus */}

          
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
                placeholder="Any special requests, preferred contact method, or additional information..."
                rows={3}
              />
            </div>
          </div>

          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FileText className="mr-2" size={20} />
              Terms & Conditions
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="agreeToTerms" className="text-sm leading-5">
                  I agree to the terms and conditions. *
                </Label>
              </div>

              {/* Credit check removed with financial fields */}
            </div>
          </div>

          
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="text-blue-600 mr-2 mt-0.5" size={16} />
              <div className="text-sm text-blue-800">
        <strong>Note:</strong> This is an inquiry only. Submitting the form lets our team contact you with availability, viewing options, and next steps. No purchase or hold is created until you confirm in writing.
              </div>
            </div>
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
                <ShieldCheck className="mr-2" size={16} />
              )}
              {isSubmitting ? "Processing..." : "Send"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReserveCarForm;
