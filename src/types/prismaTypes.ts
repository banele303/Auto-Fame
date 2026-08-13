// Custom type definitions for Prisma models
// These match the structure of your Prisma schema

// Car enums
export enum CarCondition {
  NEW = 'NEW',
  USED = 'USED',
  CERTIFIED_PRE_OWNED = 'CERTIFIED_PRE_OWNED',
  DEALER_DEMO = 'DEALER_DEMO'
}

export enum CarType {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  TRUCK = 'TRUCK',
  COUPE = 'COUPE',
  CONVERTIBLE = 'CONVERTIBLE',
  HATCHBACK = 'HATCHBACK',
  WAGON = 'WAGON'
}

export enum CarStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE'
}

export enum FuelType {
  PETROL = 'PETROL', // renamed from GASOLINE / FUEL
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID'
}

export enum Transmission {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  CVT = 'CVT',
  DUAL_CLUTCH = 'DUAL_CLUTCH'
}

export enum InquiryStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Car model
export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  condition: CarCondition;
  carType: CarType;
  fuelType: FuelType;
  transmission: Transmission;
  engine: string;
  exteriorColor: string;
  interiorColor: string;
  status: CarStatus;
  vin: string;
  description?: string;
  features: string[];
  photoUrls: string[];
  dealershipId: number;
  employeeId: string;
  createdAt: Date;
  updatedAt: Date;
  averageRating?: number;
  numberOfReviews?: number;
  // Relations
  dealership?: any;
  employee?: any;
  reviews?: any[];
  testDrives?: any[];
  inquiries?: any[];
  sale?: any;
}

// Inquiry model
export interface Inquiry {
  id: number;
  customerId: string;
  carId: number;
  dealershipId: number;
  employeeId?: string;
  inquiryDate: Date;
  status: InquiryStatus;
  notes?: string;
  // Relations
  customer?: any;
  car?: Car;
  dealership?: any;
  employee?: any;
}

// Manager model
export interface Manager {
  id: number;
  cognitoId: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Add name field to match usage in the code
  phoneNumber?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tenant model
export interface Tenant {
  id: number;
  cognitoId: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Add name field to match usage in the code
  phoneNumber?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  favorites?: any[];
}

// Application Status enum
export enum ApplicationStatus {
  Pending = 'Pending',
  Denied = 'Denied',
  Approved = 'Approved'
}

// Application model
export interface Application {
  id: number;
  tenantCognitoId: string;
  propertyId: number;
  applicationDate: string | Date;
  status: ApplicationStatus;
  moveInDate?: string | Date;
  createdAt: Date;
  updatedAt: Date;
  // Related models
  property?: any;
  tenant?: Tenant;
}

// Property model
export interface Property {
  id: number;
  name: string;
  description?: string;
  propertyType?: string;
  price: number;
  securityDeposit?: number;
  beds: number;
  baths: number;
  squareFeet?: number;
  locationId?: number;
  isAvailable: boolean;
  images?: string[];
  photoUrls?: string[];
  // Ratings and reviews
  averageRating?: number;
  numberOfReviews?: number;
  // Property features
  isPetsAllowed?: boolean;
  isParkingIncluded?: boolean;
  isNsfassAccredited?: boolean;
  amenities?: string[];
  highlights?: string[];
  // Related models
  location?: any;
  leases?: any[];
}

// Lease model
export interface Lease {
  id: number;
  tenantCognitoId: string;
  propertyId: number;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  monthlyRent: number;
  securityDeposit?: number;
  createdAt: Date;
  updatedAt: Date;
  tenant: {
    phoneNumber: string;
    name?: string;
    email?: string;
  };
  rent: number; // Adding this property as it's used in the component
}

// Payment model
export interface Payment {
  id: number;
  leaseId: number;
  amount: number;
  date: string | Date;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Related models
  lease?: Lease;
}

// Room model
export interface Room {
  id: number;
  propertyId: number;
  name: string;
  description?: string;
  roomType: string;
  pricePerMonth: number;
  securityDeposit?: number;
  squareFeet?: number;
  isAvailable: boolean;
  availableFrom?: Date | string | null;
  capacity: number;
  amenities?: string[];
  features?: string[];
  photoUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
  // Related models
  property?: Property;
}

// Other types can be added as needed
