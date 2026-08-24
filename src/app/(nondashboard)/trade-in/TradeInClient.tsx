"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Car, 
  Calculator, 
  DollarSign, 
  CheckCircle, 
  FileText, 
  ArrowRight, 
  Calendar, 
  Award, 
  Phone, 
  Mail 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { siteConfig } from "@/lib/siteConfig";

export default function TradeInClient() {
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    mileage: "",
    condition: "",
    description: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [estimatedValue, setEstimatedValue] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateEstimate = () => {
    const baseValue = 200000;
    const yearFactor = Math.max(0.5, (parseInt(formData.year) - 2000) / 25);
    const mileageFactor = Math.max(0.3, 1 - (parseInt(formData.mileage) / 300000));
    const conditionMultiplier = {
      "excellent": 1.2,
      "very-good": 1.0,
      "good": 0.8,
      "fair": 0.6,
      "poor": 0.4
    }[formData.condition] || 1.0;

    const estimate = baseValue * yearFactor * mileageFactor * conditionMultiplier;
    setEstimatedValue(estimate);
    setCurrentStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 2) {
      calculateEstimate();
    } else {
      toast.success("Trade-in request submitted! We'll contact you soon to schedule an appraisal at our Johannesburg South showroom.");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#00acee] to-[#004d71] py-20 md:py-32">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-blue-200 text-sm font-medium mb-4">
                  Get Top Value for Your Vehicle in Johannesburg South
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  Trade-In Your Car
                </h1>
                <p className="text-lg text-blue-100 max-w-lg mb-8">
                  Get an instant estimate for your vehicle and trade it in toward your next car purchase at AutoFame. 
                  Fair pricing, quick appraisal process, hassle-free experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-white text-[#00acee] hover:bg-gray-100"
                    onClick={() => setCurrentStep(1)}
                  >
                    Get Instant Quote
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white hover:text-[#00acee]"
                    asChild
                  >
                    <a href={`tel:${siteConfig.contact.phoneRaw}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call {siteConfig.contact.phoneDisplay}
                    </a>
                  </Button>
                </div>
              </motion.div>
            </div>
            <div className="md:w-1/2 flex justify-end">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <Image
                  src="/hero-2.jpg"
                  alt="AutoFame trade-in vehicle appraisal Johannesburg"
                  width={600}
                  height={400}
                  className="object-cover rounded-xl shadow-2xl"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Trade-In Process Steps */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple 3-Step Process
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get your trade-in value in minutes with our streamlined appraisal process.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00acee] to-[#004d71] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Vehicle Information</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Tell us about your car - make, model, year, mileage, and condition.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00acee] to-[#004d71] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Instant Estimate</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get an immediate estimate based on current South African market values and vehicle condition.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00acee] to-[#004d71] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Schedule Appraisal</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Book an appointment at 1 Rifle Range Rd, Baragwanath for a professional appraisal to finalize your trade-in value.
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= step 
                      ? 'bg-[#00acee] text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-0.5 ${
                      currentStep > step ? 'bg-[#00acee]' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Steps */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStep === 1 && <Car className="h-5 w-5 text-[#00acee]" />}
                {currentStep === 2 && <FileText className="h-5 w-5 text-[#00acee]" />}
                {currentStep === 3 && <Calculator className="h-5 w-5 text-[#00acee]" />}
                {currentStep === 1 && "Vehicle Information"}
                {currentStep === 2 && "Contact Information"}
                {currentStep === 3 && "Your Trade-In Estimate"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                {/* Step 1: Vehicle Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Make</Label>
                        <Select value={formData.make} onValueChange={(value) => handleInputChange('make', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select make" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Toyota">Toyota</SelectItem>
                            <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                            <SelectItem value="Ford">Ford</SelectItem>
                            <SelectItem value="BMW">BMW</SelectItem>
                            <SelectItem value="Mercedes">Mercedes-Benz</SelectItem>
                            <SelectItem value="Audi">Audi</SelectItem>
                            <SelectItem value="Hyundai">Hyundai</SelectItem>
                            <SelectItem value="Nissan">Nissan</SelectItem>
                            <SelectItem value="Kia">Kia</SelectItem>
                            <SelectItem value="Renault">Renault</SelectItem>
                            <SelectItem value="Honda">Honda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Model</Label>
                        <Input
                          value={formData.model}
                          onChange={(e) => handleInputChange('model', e.target.value)}
                          placeholder="e.g. Polo, Hilux, C-Class, Ranger"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Year</Label>
                        <Select value={formData.year} onValueChange={(value) => handleInputChange('year', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 25 }, (_, i) => 2026 - i).map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Mileage (km)</Label>
                        <Input
                          type="number"
                          value={formData.mileage}
                          onChange={(e) => handleInputChange('mileage', e.target.value)}
                          placeholder="e.g. 75000"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Condition</Label>
                      <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent - Like new, fully serviced</SelectItem>
                          <SelectItem value="very-good">Very Good - Minor cosmetic wear</SelectItem>
                          <SelectItem value="good">Good - Normal wear for age/mileage</SelectItem>
                          <SelectItem value="fair">Fair - Requires minor repairs</SelectItem>
                          <SelectItem value="poor">Poor - Needs significant work</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Additional Details (Optional)</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Service history, extras, modifications, or recent tyre changes..."
                        rows={3}
                      />
                    </div>

                    <Button 
                      type="button" 
                      className="w-full bg-[#00acee] hover:bg-[#004d71]"
                      onClick={() => setCurrentStep(2)}
                      disabled={!formData.make || !formData.model || !formData.year || !formData.mileage || !formData.condition}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Step 2: Contact Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        <Input
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          placeholder="Enter first name"
                          required
                        />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          placeholder="Enter last name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter email address"
                        required
                      />
                    </div>

                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="e.g. 082 123 4567"
                        required
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-[#00acee] hover:bg-[#004d71]"
                        disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone}
                      >
                        Get Estimate
                        <Calculator className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Estimate Results */}
                {currentStep === 3 && (
                  <div className="text-center space-y-6">
                    <div className="bg-gradient-to-br from-[#00acee] to-[#004d71] text-white p-8 rounded-xl">
                      <h3 className="text-2xl font-bold mb-2">Estimated Trade-In Value</h3>
                      <div className="text-4xl font-bold mb-2">{formatCurrency(estimatedValue)}</div>
                      <p className="text-blue-100">
                        {formData.year} {formData.make} {formData.model} ({parseInt(formData.mileage).toLocaleString()} km)
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl text-left">
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Next Steps:</h4>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          Our appraisal manager will contact you to verify details
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          Bring your car to 1 Rifle Range Rd, Baragwanath for inspection
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          Use your trade-in amount directly as a deposit toward any vehicle in our showroom
                        </li>
                      </ul>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        Start Over
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-[#00acee] hover:bg-[#004d71]"
                      >
                        Book Showroom Inspection
                        <Calendar className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Trade-In With AutoFame?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get top value for your vehicle with our transparent and hassle-free trade-in process in Johannesburg South.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00acee] rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Top Market Value</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Competitive valuation based on current South African automotive market trends.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00acee] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No Hidden Fees</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Transparent appraisals with no unexpected deductions or administrative costs.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00acee] rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Quick 30-Min Process</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Complete your on-site physical evaluation in as little as 30 minutes.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#00acee] rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Certified Appraisers</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Experienced team ensuring fair, accurate vehicle evaluations every time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#00acee] to-[#004d71]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Trade-In Your Vehicle?
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
            Get started today and discover how much your vehicle is worth at AutoFame Johannesburg South.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-[#00acee] hover:bg-gray-100"
              onClick={() => setCurrentStep(1)}
            >
              Start Trade-In Process
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-[#00acee]"
              asChild
            >
              <a href={`tel:${siteConfig.contact.phoneRaw}`}>
                <Phone className="mr-2 h-4 w-4" />
                Call {siteConfig.contact.phoneDisplay}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Questions About Trade-Ins?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Our trade-in specialists in Baragwanath are here to help you get the most out of your vehicle.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <div className="flex items-center gap-2 justify-center">
                <Phone className="h-5 w-5 text-[#00acee]" />
                <a href={`tel:${siteConfig.contact.phoneRaw}`} className="font-semibold text-gray-800 dark:text-gray-200 hover:text-[#00acee]">
                  {siteConfig.contact.phoneDisplay}
                </a>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Mail className="h-5 w-5 text-[#00acee]" />
                <a href={`mailto:${siteConfig.contact.emailTradeIn}`} className="font-semibold text-gray-800 dark:text-gray-200 hover:text-[#00acee]">
                  {siteConfig.contact.emailTradeIn}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
