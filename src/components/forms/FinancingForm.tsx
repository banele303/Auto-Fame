"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';

interface FinancingFormProps {
  isOpen: boolean;
  onClose: () => void;
  carId?: number;
  carBrand?: string;
  carModel?: string;
  carYear?: number;
  carPrice?: number;
  carDetails?: {
    make: string;
    model: string;
    year: number;
    price: number;
  };
}

const FinancingForm: React.FC<FinancingFormProps> = ({ 
  isOpen, 
  onClose, 
  carId, 
  carBrand, 
  carModel, 
  carYear, 
  carPrice, 
  carDetails 
}) => {
  const router = useRouter();
  
  // Use direct props or carDetails object if available
  const make = carBrand || carDetails?.make || '';
  const model = carModel || carDetails?.model || '';
  const year = carYear || carDetails?.year || 0;
  const price = carPrice || carDetails?.price || 0;
  
  const [formData, setFormData] = useState({
    loanAmount: price ? price.toString() : '',
    termMonths: "60",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employmentStatus: "",
    monthlyIncome: "",
    creditScore: "",
    downPayment: "",
    consentCreditCheck: false,
    agreeTerms: false,
    vehicleMake: make,
    vehicleModel: model,
    vehicleYear: year ? year.toString() : '',
    vehiclePrice: price ? price.toString() : ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when car details change
  useEffect(() => {
    // Update if we have either direct props or carDetails object
    if (carDetails || carBrand || carModel || carYear || carPrice) {
      setFormData(prev => ({
        ...prev,
        loanAmount: price ? price.toString() : prev.loanAmount,
        vehicleMake: make || prev.vehicleMake,
        vehicleModel: model || prev.vehicleModel,
        vehicleYear: year ? year.toString() : prev.vehicleYear,
        vehiclePrice: price ? price.toString() : prev.vehiclePrice
      }));
    }
  }, [carDetails, carBrand, carModel, carYear, carPrice, make, model, year, price]);
  
  // Debug log to check if component is rendering and the isOpen state
  useEffect(() => {
    console.log("FinancingForm rendered with isOpen:", isOpen);
    console.log("Car details:", { carId, make, model, year, price });
  }, [isOpen, carId, make, model, year, price]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required personal information fields");
      return;
    }

    if (!formData.consentCreditCheck) {
      toast.error("Credit check authorization is required");
      return;
    }

    if (!formData.agreeTerms) {
      toast.error("You must agree to the terms and conditions");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        loanAmount: parseFloat(formData.loanAmount),
        termMonths: parseInt(formData.termMonths),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        employmentStatus: formData.employmentStatus,
        monthlyIncomeGross: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
        creditScore: formData.creditScore ? parseInt(formData.creditScore) : undefined,
        downPaymentAmount: formData.downPayment ? parseFloat(formData.downPayment) : undefined,
        consentCreditCheck: formData.consentCreditCheck,
        agreeTerms: formData.agreeTerms,
        // If we have a car ID, include it
        carId: carId,
        vehicleMake: formData.vehicleMake,
        vehicleModel: formData.vehicleModel,
        cashPrice: formData.vehiclePrice
      };
      
      const response = await fetch('/api/financing-applications/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit financing application');
      }
      
      toast.success("Financing application submitted successfully! Our team will contact you shortly.");
      
      // Reset form
      setFormData({
        loanAmount: carDetails ? carDetails.price.toString() : '',
        termMonths: "60",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        employmentStatus: "",
        monthlyIncome: "",
        creditScore: "",
        downPayment: "",
        consentCreditCheck: false,
        agreeTerms: false,
        vehicleMake: carDetails?.make || '',
        vehicleModel: carDetails?.model || '',
        vehicleYear: carDetails?.year.toString() || '',
        vehiclePrice: carDetails ? carDetails.price.toString() : ''
      });
      
      onClose();
    } catch (error) {
      console.error("Error submitting financing application:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit financing application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNoCarSelected = () => {
    onClose();
    router.push('/cars');
  };

  console.log("Rendering FinancingForm with open state:", isOpen);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log("Dialog onOpenChange called with:", open);
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {(make && model && year) ? `Finance Your ${year} ${make} ${model}` : "Vehicle Financing Application"}
          </DialogTitle>
          <DialogClose />
        </DialogHeader>
        
        {!carId ? (
          <div className="text-center py-8">
            <p className="mb-4">Please select a vehicle first to apply for financing.</p>
            <Button onClick={handleNoCarSelected}>Browse Available Vehicles</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Vehicle Information */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md mb-4">
              <h3 className="font-medium mb-2">Vehicle Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleMake">Make</Label>
                  <Input 
                    id="vehicleMake" 
                    value={formData.vehicleMake} 
                    readOnly
                    className="bg-slate-100 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleModel">Model</Label>
                  <Input 
                    id="vehicleModel" 
                    value={formData.vehicleModel} 
                    readOnly
                    className="bg-slate-100 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleYear">Year</Label>
                  <Input 
                    id="vehicleYear" 
                    value={formData.vehicleYear} 
                    readOnly
                    className="bg-slate-100 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <Label htmlFor="vehiclePrice">Price (R)</Label>
                  <Input 
                    id="vehiclePrice" 
                    value={formData.vehiclePrice} 
                    readOnly
                    className="bg-slate-100 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
            
            {/* Loan Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Loan Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="loanAmount">Loan Amount (R)</Label>
                  <Input 
                    id="loanAmount" 
                    type="number"
                    value={formData.loanAmount} 
                    onChange={(e) => handleInputChange("loanAmount", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="termMonths">Loan Term</Label>
                  <Select 
                    value={formData.termMonths} 
                    onValueChange={(value) => handleInputChange("termMonths", value)}
                  >
                    <SelectTrigger id="termMonths">
                      <SelectValue placeholder="Select loan term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                      <SelectItem value="48">48 months</SelectItem>
                      <SelectItem value="60">60 months</SelectItem>
                      <SelectItem value="72">72 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="downPayment">Down Payment (R) (optional)</Label>
                  <Input 
                    id="downPayment" 
                    type="number"
                    value={formData.downPayment} 
                    onChange={(e) => handleInputChange("downPayment", e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={formData.firstName} 
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={formData.lastName} 
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Financial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employmentStatus">Employment Status (optional)</Label>
                  <Select 
                    value={formData.employmentStatus} 
                    onValueChange={(value) => handleInputChange("employmentStatus", value)}
                  >
                    <SelectTrigger id="employmentStatus">
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-Time</SelectItem>
                      <SelectItem value="part_time">Part-Time</SelectItem>
                      <SelectItem value="self_employed">Self-Employed</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="monthlyIncome">Monthly Income (R) (optional)</Label>
                  <Input 
                    id="monthlyIncome" 
                    type="number"
                    value={formData.monthlyIncome} 
                    onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="creditScore">Credit Score (optional)</Label>
                  <Input 
                    id="creditScore" 
                    type="number"
                    value={formData.creditScore} 
                    onChange={(e) => handleInputChange("creditScore", e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Terms and Consent */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="consentCreditCheck" 
                  checked={formData.consentCreditCheck}
                  onCheckedChange={(checked) => handleInputChange("consentCreditCheck", !!checked)}
                />
                <Label htmlFor="consentCreditCheck" className="text-sm">
                  I authorize a credit check to be performed for the purpose of evaluating my financing application.
                </Label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="agreeTerms" 
                  checked={formData.agreeTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeTerms", !!checked)}
                />
                <Label htmlFor="agreeTerms" className="text-sm">
                  I agree to the terms and conditions and confirm that the information provided is accurate.
                </Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : "Submit Application"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinancingForm;
