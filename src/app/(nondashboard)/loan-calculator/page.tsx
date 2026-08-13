"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, DollarSign, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoanCalculatorPage() {
  const [loanAmount, setLoanAmount] = useState([250000]);
  const [downPayment, setDownPayment] = useState([50000]);
  const [loanTerm, setLoanTerm] = useState("60");
  const [interestRate, setInterestRate] = useState([9.5]);
  const [creditScore, setCreditScore] = useState("good");

  const calculateMonthlyPayment = () => {
    const principal = loanAmount[0] - downPayment[0];
    const monthlyRate = interestRate[0] / 100 / 12;
    const numberOfPayments = parseInt(loanTerm);

    if (monthlyRate === 0) {
      return principal / numberOfPayments;
    }

    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    return monthlyPayment;
  };

  const monthlyPayment = calculateMonthlyPayment();
  const totalPayment = monthlyPayment * parseInt(loanTerm);
  const totalInterest = totalPayment - (loanAmount[0] - downPayment[0]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative bg-gradient-to-r from-[#00acee] to-[#004d71] py-16 md:py-20">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Auto Loan Calculator</h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">Estimate your monthly payment and explore different financing scenarios. Use this tool to plan before you apply.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#00acee]" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Vehicle Price: {formatCurrency(loanAmount[0])}
                  </Label>
                  <Slider
                    value={loanAmount}
                    onValueChange={setLoanAmount}
                    max={1000000}
                    min={50000}
                    step={10000}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>R50,000</span>
                    <span>R1,000,000</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Down Payment: {formatCurrency(downPayment[0])}
                  </Label>
                  <Slider
                    value={downPayment}
                    onValueChange={setDownPayment}
                    max={loanAmount[0] * 0.5}
                    min={0}
                    step={5000}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>R0</span>
                    <span>{formatCurrency(loanAmount[0] * 0.5)}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Loan Term
                  </Label>
                  <Select value={loanTerm} onValueChange={setLoanTerm}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="36">36 months (3 years)</SelectItem>
                      <SelectItem value="48">48 months (4 years)</SelectItem>
                      <SelectItem value="60">60 months (5 years)</SelectItem>
                      <SelectItem value="72">72 months (6 years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Interest Rate: {interestRate[0]}%
                  </Label>
                  <Slider
                    value={interestRate}
                    onValueChange={setInterestRate}
                    max={20}
                    min={5}
                    step={0.5}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5%</span>
                    <span>20%</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Credit Score
                  </Label>
                  <Select value={creditScore} onValueChange={setCreditScore}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent (750+)</SelectItem>
                      <SelectItem value="good">Good (700-749)</SelectItem>
                      <SelectItem value="fair">Fair (650-699)</SelectItem>
                      <SelectItem value="poor">Poor (600-649)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#00acee]" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-[#00acee] text-white p-4 rounded-lg text-center">
                    <div className="text-sm opacity-90">Estimated Monthly Payment</div>
                    <div className="text-2xl font-bold">{formatCurrency(monthlyPayment)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Loan Amount</div>
                      <div className="text-lg font-semibold">{formatCurrency(loanAmount[0] - downPayment[0])}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Total Interest</div>
                      <div className="text-lg font-semibold">{formatCurrency(totalInterest)}</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Total Payment</div>
                    <div className="text-lg font-semibold">{formatCurrency(totalPayment)}</div>
                  </div>
                  <Button asChild className="w-full bg-[#00acee] hover:bg-[#004d71]">
                    <a href="/financing">Proceed to Application <ArrowRight className="ml-2 h-4 w-4" /></a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
