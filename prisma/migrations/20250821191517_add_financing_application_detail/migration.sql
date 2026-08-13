-- CreateTable
CREATE TABLE "FinancingApplicationDetail" (
    "id" SERIAL NOT NULL,
    "financingApplicationId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "idNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "housingStatus" TEXT,
    "monthlyHousingPayment" DOUBLE PRECISION,
    "employmentStatus" TEXT,
    "employerName" TEXT,
    "jobTitle" TEXT,
    "employmentYears" DOUBLE PRECISION,
    "monthlyIncomeGross" DOUBLE PRECISION,
    "otherIncome" DOUBLE PRECISION,
    "otherIncomeSource" TEXT,
    "creditScoreRange" TEXT,
    "downPaymentAmount" DOUBLE PRECISION,
    "preferredContactMethod" TEXT,
    "hasTradeIn" BOOLEAN NOT NULL DEFAULT false,
    "tradeInDetails" TEXT,
    "coApplicantName" TEXT,
    "coApplicantIncome" DOUBLE PRECISION,
    "coApplicantRelationship" TEXT,
    "consentCreditCheck" BOOLEAN NOT NULL DEFAULT false,
    "agreeTerms" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancingApplicationDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancingApplicationDetail_financingApplicationId_key" ON "FinancingApplicationDetail"("financingApplicationId");

-- AddForeignKey
ALTER TABLE "FinancingApplicationDetail" ADD CONSTRAINT "FinancingApplicationDetail_financingApplicationId_fkey" FOREIGN KEY ("financingApplicationId") REFERENCES "FinancingApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
