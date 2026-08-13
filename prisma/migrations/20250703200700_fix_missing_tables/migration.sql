/*
  Warnings:

  - You are about to drop the `Application` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lease` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Manager` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Property` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tenant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TenantFavorites` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TenantProperties` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CarCondition" AS ENUM ('NEW', 'USED', 'CERTIFIED_PRE_OWNED', 'DEALER_DEMO');

-- CreateEnum
CREATE TYPE "CarType" AS ENUM ('SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'WAGON', 'PICKUP_TRUCK', 'VAN', 'MINIVAN', 'CROSSOVER', 'SPORTS_CAR', 'LUXURY', 'HYBRID', 'ELECTRIC');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUG_IN_HYBRID', 'HYDROGEN');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT', 'DUAL_CLUTCH');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('AVAILABLE', 'SOLD', 'RESERVED', 'PENDING', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FinancingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('SALES_MANAGER', 'SALES_ASSOCIATE', 'FINANCE_MANAGER', 'SERVICE_ADVISOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_leaseId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_tenantCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "Lease" DROP CONSTRAINT "Lease_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Lease" DROP CONSTRAINT "Lease_tenantCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_leaseId_fkey";

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_managerCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "_TenantFavorites" DROP CONSTRAINT "_TenantFavorites_A_fkey";

-- DropForeignKey
ALTER TABLE "_TenantFavorites" DROP CONSTRAINT "_TenantFavorites_B_fkey";

-- DropForeignKey
ALTER TABLE "_TenantProperties" DROP CONSTRAINT "_TenantProperties_A_fkey";

-- DropForeignKey
ALTER TABLE "_TenantProperties" DROP CONSTRAINT "_TenantProperties_B_fkey";

-- DropTable
DROP TABLE "Application";

-- DropTable
DROP TABLE "Lease";

-- DropTable
DROP TABLE "Location";

-- DropTable
DROP TABLE "Manager";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "Property";

-- DropTable
DROP TABLE "Room";

-- DropTable
DROP TABLE "Tenant";

-- DropTable
DROP TABLE "_TenantFavorites";

-- DropTable
DROP TABLE "_TenantProperties";

-- DropEnum
DROP TYPE "Amenity";

-- DropEnum
DROP TYPE "ApplicationStatus";

-- DropEnum
DROP TYPE "Highlight";

-- DropEnum
DROP TYPE "ManagerStatus";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "PropertyType";

-- DropEnum
DROP TYPE "RoomType";

-- CreateTable
CREATE TABLE "Car" (
    "id" SERIAL NOT NULL,
    "vin" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "mileage" INTEGER NOT NULL,
    "condition" "CarCondition" NOT NULL,
    "carType" "CarType" NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "engine" TEXT NOT NULL,
    "exteriorColor" TEXT NOT NULL,
    "interiorColor" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "CarStatus" NOT NULL DEFAULT 'AVAILABLE',
    "postedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "averageRating" DOUBLE PRECISION DEFAULT 0,
    "numberOfReviews" INTEGER DEFAULT 0,
    "dealershipId" INTEGER NOT NULL,
    "employeeId" TEXT,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dealership" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "coordinates" geography(Point, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "role" "EmployeeRole" NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "hireDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dealershipId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "inquiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followUpDate" TIMESTAMP(3),
    "carId" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "employeeId" TEXT,
    "dealershipId" INTEGER NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDrive" (
    "id" SERIAL NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "duration" INTEGER,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "carId" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "employeeId" TEXT,
    "dealershipId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestDrive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" SERIAL NOT NULL,
    "salePrice" DOUBLE PRECISION NOT NULL,
    "downPayment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tradeInValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3),
    "carId" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dealershipId" INTEGER NOT NULL,
    "financingId" INTEGER,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancingApplication" (
    "id" SERIAL NOT NULL,
    "loanAmount" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "monthlyPayment" DOUBLE PRECISION NOT NULL,
    "status" "FinancingStatus" NOT NULL DEFAULT 'PENDING',
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalDate" TIMESTAMP(3),
    "customerId" TEXT NOT NULL,
    "creditScore" INTEGER,
    "annualIncome" DOUBLE PRECISION,

    CONSTRAINT "FinancingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "carId" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CustomerFavorites" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CustomerFavorites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Car_vin_key" ON "Car"("vin");

-- CreateIndex
CREATE INDEX "Car_make_model_year_idx" ON "Car"("make", "model", "year");

-- CreateIndex
CREATE INDEX "Car_price_idx" ON "Car"("price");

-- CreateIndex
CREATE INDEX "Car_status_idx" ON "Car"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_cognitoId_key" ON "Employee"("cognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_cognitoId_key" ON "Customer"("cognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_carId_key" ON "Sale"("carId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_financingId_key" ON "Sale"("financingId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_carId_customerId_key" ON "Review"("carId", "customerId");

-- CreateIndex
CREATE INDEX "_CustomerFavorites_B_index" ON "_CustomerFavorites"("B");

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDrive" ADD CONSTRAINT "TestDrive_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDrive" ADD CONSTRAINT "TestDrive_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDrive" ADD CONSTRAINT "TestDrive_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDrive" ADD CONSTRAINT "TestDrive_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_dealershipId_fkey" FOREIGN KEY ("dealershipId") REFERENCES "Dealership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_financingId_fkey" FOREIGN KEY ("financingId") REFERENCES "FinancingApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingApplication" ADD CONSTRAINT "FinancingApplication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerFavorites" ADD CONSTRAINT "_CustomerFavorites_A_fkey" FOREIGN KEY ("A") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerFavorites" ADD CONSTRAINT "_CustomerFavorites_B_fkey" FOREIGN KEY ("B") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
