"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Calculator, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Define the form schema
const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  carId: z.string().min(1, "Vehicle is required"),
  loanAmount: z.coerce.number().positive("Loan amount must be positive"),
  downPayment: z.coerce.number().nonnegative("Down payment must be non-negative"),
  loanTermMonths: z.coerce.number().int().positive("Loan term must be positive"),
  interestRate: z.coerce.number().positive("Interest rate must be positive"),
  creditScore: z.coerce.number().int().min(300, "Credit score must be at least 300").max(850, "Credit score must be at most 850"),
  isNSFASAccredited: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewFinancingApplicationPage() {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [cars, setCars] = useState<{ id: string; name: string; price: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      carId: "",
      loanAmount: 0,
      downPayment: 0,
      loanTermMonths: 48,
      interestRate: 7.5,
      creditScore: 650,
      isNSFASAccredited: false,
    },
  });

  const selectedCarId = form.watch('carId');
  const loanAmount = form.watch('loanAmount');
  const loanTermMonths = form.watch('loanTermMonths');
  const interestRate = form.watch('interestRate');

  useEffect(() => {
    const fetchFormData = async () => {
      setIsLoading(true);
      try {
        // Fetch customers
        const customersRes = await fetch('/api/admin/customers');
        if (!customersRes.ok) throw new Error('Failed to fetch customers');
        const customersData = await customersRes.json();
        setCustomers(customersData.map((c: any) => ({ 
          id: c.id, 
          name: `${c.firstName} ${c.lastName}` 
        })));
        
        // Fetch available cars
        const carsRes = await fetch('/api/admin/cars?status=AVAILABLE');
        if (!carsRes.ok) throw new Error('Failed to fetch cars');
        const carsData = await carsRes.json();
        setCars(carsData.map((car: any) => ({ 
          id: car.id, 
          name: `${car.year} ${car.make} ${car.model}`,
          price: car.price
        })));
        
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error("Failed to load customers or vehicles");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFormData();
  }, []);

  // When car selection changes, update the loan amount to match car price
  useEffect(() => {
    if (selectedCarId) {
      const selectedCar = cars.find(car => car.id === selectedCarId);
      if (selectedCar) {
        form.setValue('loanAmount', selectedCar.price);
      }
    }
  }, [selectedCarId, cars, form]);

  // Calculate monthly payment when loan details change
  const calculateMonthlyPayment = () => {
    if (loanAmount <= 0 || loanTermMonths <= 0) return 0;
    
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
                         (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
    
    return Math.round(monthlyPayment * 100) / 100;
  };

  const monthlyPayment = calculateMonthlyPayment();

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Calculate monthly payment
      const monthlyPayment = calculateMonthlyPayment();
      
      // Submit the application
      const res = await fetch('/api/admin/financing/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          monthlyPayment,
          applicationDate: new Date().toISOString(),
          status: 'PENDING',
        }),
      });
      
      if (!res.ok) throw new Error('Failed to create application');
      
      const newApplication = await res.json();
      
      toast.success("Financing application created successfully");
      router.push(`/admin/financing/applications/${newApplication.id}`);
      
    } catch (error) {
      console.error('Error creating application:', error);
      toast.error("Failed to create financing application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/admin/financing/applications">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Link>
      </Button>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        New Financing Application
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
              <CardDescription>Enter the financing application information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <Select 
                            disabled={isLoading || isSubmitting} 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a customer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map(customer => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="carId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle</FormLabel>
                          <Select 
                            disabled={isLoading || isSubmitting} 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a vehicle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cars.map(car => (
                                <SelectItem key={car.id} value={car.id}>
                                  {car.name} - R{car.price.toLocaleString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="loanAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Amount (R)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-10"
                                disabled={isLoading || isSubmitting}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="downPayment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Down Payment (R)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-10"
                                disabled={isLoading || isSubmitting}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="loanTermMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Term (Months)</FormLabel>
                          <Select 
                            disabled={isLoading || isSubmitting} 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select term" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="24">24 months</SelectItem>
                              <SelectItem value="36">36 months</SelectItem>
                              <SelectItem value="48">48 months</SelectItem>
                              <SelectItem value="60">60 months</SelectItem>
                              <SelectItem value="72">72 months</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="interestRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0.0"
                              disabled={isLoading || isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="creditScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Score</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="650"
                              disabled={isLoading || isSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="isNSFASAccredited"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading || isSubmitting}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>NSFAS Accredited</FormLabel>
                          <p className="text-sm text-gray-500">
                            Check this if the customer is NSFAS accredited and eligible for special financing options.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isLoading || isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      {isSubmitting ? "Creating..." : "Create Application"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Loan Amount</span>
                  <span className="font-medium">R{loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Loan Term</span>
                  <span className="font-medium">{loanTermMonths} months</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Interest Rate</span>
                  <span className="font-medium">{interestRate}%</span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Monthly Payment</span>
                    <span className="text-lg font-bold">R{monthlyPayment.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Interest</span>
                    <span className="font-medium">R{((monthlyPayment * loanTermMonths) - loanAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">Total Cost</span>
                    <span className="font-medium">R{(monthlyPayment * loanTermMonths).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
