import * as z from "zod";
import {
  CarCondition,
  CarType,
  FuelType,
  Transmission,
  CarStatus,
  InquiryStatus,
  FinancingStatus,
  EmployeeRole,
  EmployeeStatus,
} from "@/lib/constants";

export const carSchema = z.object({
  vin: z.string().min(1, "VIN is required").max(17, "VIN must be 17 characters"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900, "Year must be 1900 or later").max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  price: z.number().min(0, "Price must be positive"),
  mileage: z.number().min(0, "Mileage must be positive"),
  condition: z.nativeEnum(CarCondition),
  carType: z.nativeEnum(CarType),
  fuelType: z.nativeEnum(FuelType),
  transmission: z.nativeEnum(Transmission),
  engine: z.string().optional(),
  exteriorColor: z.string().optional(),
  interiorColor: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  features: z.array(z.string()).optional(),
  photoUrls: z.any(), // This will be handled by the file input
  status: z.nativeEnum(CarStatus).default(CarStatus.AVAILABLE),
  dealershipId: z.number().int().positive("Dealership ID must be a positive integer"),
  employeeId: z.string().optional().nullable(),
});

export type CarFormData = z.infer<typeof carSchema>;

export const inquirySchema = z.object({
  carId: z.number().int().positive(),
  customerId: z.string().min(1, "Customer ID is required"),
  message: z.string().min(1, "Message is required"),
  status: z.nativeEnum(InquiryStatus).default(InquiryStatus.NEW),
  inquiryDate: z.string().optional(),
  followUpDate: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
  dealershipId: z.number().int().positive(),
});

export type InquiryFormData = z.infer<typeof inquirySchema>;

export const saleSchema = z.object({
  carId: z.number().int().positive(),
  customerId: z.string().min(1, "Customer ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  dealershipId: z.number().int().positive(),
  salePrice: z.number().min(0, "Sale price must be positive"),
  downPayment: z.number().min(0, "Down payment must be positive").optional().default(0),
  tradeInValue: z.number().min(0, "Trade-in value must be positive").optional().default(0),
  saleDate: z.string().optional(),
  deliveryDate: z.string().optional().nullable(),
  financingId: z.number().int().positive().optional().nullable(),
});

export type SaleFormData = z.infer<typeof saleSchema>;

export const financingApplicationSchema = z.object({
  loanAmount: z.number().min(0, "Loan amount must be positive"),
  interestRate: z.number().min(0, "Interest rate must be positive"),
  termMonths: z.number().int().positive("Term months must be a positive integer"),
  monthlyPayment: z.number().min(0, "Monthly payment must be positive"),
  status: z.nativeEnum(FinancingStatus).default(FinancingStatus.PENDING),
  applicationDate: z.string().optional(),
  approvalDate: z.string().optional().nullable(),
  customerId: z.string().min(1, "Customer ID is required"),
  creditScore: z.number().int().optional().nullable(),
  annualIncome: z.number().min(0).optional().nullable(),
});

export type FinancingApplicationFormData = z.infer<typeof financingApplicationSchema>;

export const reviewSchema = z.object({
  carId: z.number().int().positive(),
  customerId: z.string().min(1, "Customer ID is required"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  title: z.string().min(1, "Title is required"),
  comment: z.string().min(1, "Comment is required"),
  reviewDate: z.string().optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

export const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

// API Interfaces

export interface ApiCar {
  id: number;
  vin: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  condition: CarCondition;
  carType: CarType;
  fuelType: FuelType;
  transmission: Transmission;
  engine?: string | null;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  description: string;
  features: string[];
  photoUrls: string[];
  status: CarStatus;
  postedDate: string;
  updatedAt: string;
  averageRating?: number | null;
  numberOfReviews?: number | null;
  dealershipId: number;
  employeeId?: string | null;
  dealership?: ApiDealership;
  employee?: ApiEmployee;
}

export interface ApiDealership {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  website?: string | null;
  coordinates?: any; // Adjust as per your actual coordinate type
  createdAt: string;
  updatedAt: string;
}

export interface ApiEmployee {
  id: number;
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  hireDate: string;
  commission: number;
  dealershipId: number;
  createdAt: string;
  updatedAt: string;
  dealership?: ApiDealership;
}

export interface ApiCustomer {
  id: number;
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  dateOfBirth?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiInquiry {
  id: number;
  message: string;
  status: InquiryStatus;
  inquiryDate: string;
  followUpDate?: string | null;
  carId: number;
  customerId: string;
  employeeId?: string | null;
  dealershipId: number;
  car?: ApiCar;
  customer?: ApiCustomer;
  employee?: ApiEmployee;
  dealership?: ApiDealership;
}

export interface ApiSale {
  id: number;
  salePrice: number;
  downPayment: number;
  tradeInValue: number;
  saleDate: string;
  deliveryDate?: string | null;
  carId: number;
  customerId: string;
  employeeId: string;
  dealershipId: number;
  financingId?: number | null;
  car?: ApiCar;
  customer?: ApiCustomer;
  employee?: ApiEmployee;
  dealership?: ApiDealership;
  financing?: ApiFinancingApplication;
}

export interface ApiFinancingApplication {
  id: number;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  status: FinancingStatus;
  applicationDate: string;
  approvalDate?: string | null;
  customerId: string;
  creditScore?: number | null;
  annualIncome?: number | null;
  customer?: ApiCustomer;
  sale?: ApiSale;
}

export interface ApiReview {
  id: number;
  rating: number;
  title: string;
  comment: string;
  reviewDate: string;
  carId: number;
  customerId: string;
  car?: ApiCar;
  customer?: ApiCustomer;
}