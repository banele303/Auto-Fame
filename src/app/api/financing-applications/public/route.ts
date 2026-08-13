import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Numeric coercion using built-in helpers for reliable typing
const publicFinancingSchema = z.object({
  loanAmount: z.coerce.number().positive('Loan amount required'),
  termMonths: z.coerce.number().int().positive('Term required'),
  interestRate: z.coerce.number().min(0).max(60).optional().nullable(),
  monthlyPayment: z.coerce.number().min(0).optional().nullable(),
  // Applicant (minimum required subset)
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(5),
  dateOfBirth: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  housingStatus: z.string().optional().nullable(),
  monthlyHousingPayment: z.coerce.number().optional().nullable(),
  employmentStatus: z.string().min(1, 'Employment status is required'),
  employerName: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  employmentYears: z.coerce.number().optional().nullable(),
  monthlyIncomeGross: z.coerce.number().optional().nullable(),
  otherIncome: z.coerce.number().optional().nullable(),
  otherIncomeSource: z.string().optional().nullable(),
  annualIncome: z.coerce.number().optional().nullable(),
  creditScore: z.coerce.number().int().optional().nullable(),
  creditScoreRange: z.string().optional().nullable(),
  downPaymentAmount: z.coerce.number().optional().nullable(),
  preferredContactMethod: z.string().optional().nullable(),
  hasTradeIn: z.boolean().optional().nullable(),
  tradeInDetails: z.string().optional().nullable(),
  coApplicantName: z.string().optional().nullable(),
  coApplicantIncome: z.coerce.number().optional().nullable(),
  coApplicantRelationship: z.string().optional().nullable(),
  consentCreditCheck: z.preprocess(v => v === 'true' ? true : v === 'false' ? false : v, z.boolean()).refine(v => v === true, 'Consent required'),
  agreeTerms: z.preprocess(v => v === 'true' ? true : v === 'false' ? false : v, z.boolean()).refine(v => v === true, 'Terms acceptance required'),
});

// Simple GET to avoid confusing 404 when hitting the endpoint directly in a browser
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'POST financing application details to this endpoint.' });
}

export async function POST(req: NextRequest) {
  try {
    // Early environment / client sanity checks
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Server misconfiguration: DATABASE_URL not set.' }, { status: 500 });
    }

  const json = await req.json();
    type PublicFinancingData = z.infer<typeof publicFinancingSchema>;
    let data: PublicFinancingData;
    try {
      data = publicFinancingSchema.parse(json);
    } catch (zerr: any) {
      return NextResponse.json({ error: 'Validation failed', issues: zerr.issues || [] }, { status: 400 });
    }
  // Preserve full raw body for extraData (excluding large documents array to limit size)
    const { documents, ...restRaw } = json || {};

    const safeDate = (val: any): Date | null => {
      if (!val || typeof val !== 'string') return null;
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      return d;
    };

    // Create or find pseudo customer by email (public submission not logged in)
  let customer = await prisma.customer.findFirst({ where: { email: data.email } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          cognitoId: `public_${Date.now()}_${data.email.replace(/[@.]/g,'_')}`.slice(0,60),
          name: `${data.firstName} ${data.lastName}`.trim().slice(0,120),
          email: data.email,
          phoneNumber: String(data.phone).slice(0,40),
          address: data.address ? String(data.address).slice(0,200) : undefined,
          city: data.city ? String(data.city).slice(0,80) : undefined,
          state: data.state ? String(data.state).slice(0,80) : undefined,
          postalCode: data.postalCode ? String(data.postalCode).slice(0,20) : undefined,
          dateOfBirth: safeDate(data.dateOfBirth) || undefined,
        }
      });
    }

    let financingApplication;
    try {
  financingApplication = await prisma.financingApplication.create({
      data: {
        loanAmount: data.loanAmount,
        interestRate: data.interestRate || 0,
        termMonths: data.termMonths,
        monthlyPayment: data.monthlyPayment || 0,
        customerId: customer.cognitoId,
        status: 'PENDING',
  creditScore: data.creditScore || null,
  annualIncome: data.annualIncome || null,
      }
    });
    } catch (dbCreateErr: any) {
      console.error('Failed creating financingApplication:', dbCreateErr);
  return NextResponse.json({ error: 'Failed to create application base record', detail: process.env.NODE_ENV !== 'production' ? dbCreateErr.message : undefined }, { status: 500 });
    }

    // Persist extended detail record (model name FinancingApplicationDetail -> prisma.financingApplicationDetail)
    if (!(prisma as any).financingApplicationDetail) {
      console.error('Prisma client missing financingApplicationDetail model accessor. Ensure prisma generate succeeded.');
      return NextResponse.json({ error: 'Server model not ready. Try again shortly.' }, { status: 503 });
    }

    // Attempt to persist full detail with extraData JSON (non-fatal if it fails)
    try {
      try {
    await (prisma as any).financingApplicationDetail.create({
          data: {
            financingApplicationId: financingApplication.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
      dateOfBirth: safeDate(data.dateOfBirth),
            idNumber: data.idNumber || null,
            address: data.address || null,
            city: data.city || null,
            state: data.state || null,
            postalCode: data.postalCode || null,
            housingStatus: data.housingStatus || null,
            monthlyHousingPayment: data.monthlyHousingPayment || null,
            employmentStatus: data.employmentStatus,
            employerName: data.employerName || null,
            jobTitle: data.jobTitle || null,
            employmentYears: data.employmentYears || null,
            monthlyIncomeGross: data.monthlyIncomeGross || null,
            otherIncome: data.otherIncome || null,
            otherIncomeSource: data.otherIncomeSource || null,
            creditScoreRange: data.creditScoreRange || null,
            downPaymentAmount: data.downPaymentAmount || null,
            preferredContactMethod: data.preferredContactMethod || null,
            hasTradeIn: data.hasTradeIn ?? false,
            tradeInDetails: data.tradeInDetails || null,
            coApplicantName: data.coApplicantName || null,
            coApplicantIncome: data.coApplicantIncome || null,
            coApplicantRelationship: data.coApplicantRelationship || null,
            consentCreditCheck: data.consentCreditCheck,
            agreeTerms: data.agreeTerms,
            extraData: restRaw && Object.keys(restRaw).length ? restRaw : null,
          }
        });
      } catch (detailErr: any) {
        const msg: string = detailErr?.message || '';
        if (/extraData|column\s+\"?extradata\"?\s+does not exist/i.test(msg)) {
          // Retry without extraData for backward compatibility
      await (prisma as any).financingApplicationDetail.create({
            data: {
              financingApplicationId: financingApplication.id,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
        dateOfBirth: safeDate(data.dateOfBirth),
              idNumber: data.idNumber || null,
              address: data.address || null,
              city: data.city || null,
              state: data.state || null,
              postalCode: data.postalCode || null,
              housingStatus: data.housingStatus || null,
              monthlyHousingPayment: data.monthlyHousingPayment || null,
              employmentStatus: data.employmentStatus,
              employerName: data.employerName || null,
              jobTitle: data.jobTitle || null,
              employmentYears: data.employmentYears || null,
              monthlyIncomeGross: data.monthlyIncomeGross || null,
              otherIncome: data.otherIncome || null,
              otherIncomeSource: data.otherIncomeSource || null,
              creditScoreRange: data.creditScoreRange || null,
              downPaymentAmount: data.downPaymentAmount || null,
              preferredContactMethod: data.preferredContactMethod || null,
              hasTradeIn: data.hasTradeIn ?? false,
              tradeInDetails: data.tradeInDetails || null,
              coApplicantName: data.coApplicantName || null,
              coApplicantIncome: data.coApplicantIncome || null,
              coApplicantRelationship: data.coApplicantRelationship || null,
              consentCreditCheck: data.consentCreditCheck,
              agreeTerms: data.agreeTerms,
            }
          });
        } else {
          console.warn('Non-fatal financingApplicationDetail create error:', detailErr);
        }
      }
    } catch (outerDetailErr) {
      console.warn('Skipped detail persistence due to unexpected error wrapper:', outerDetailErr);
    }

    // Optional: persist document metadata if client sent it and model exists
    if ((prisma as any).financingApplicationDocument) {
      try {
        const bodyAny: any = json;
        if (Array.isArray(bodyAny.documents) && bodyAny.documents.length) {
          const docsToCreate = bodyAny.documents.slice(0, 50).map((d: any) => ({
            financingApplicationId: financingApplication.id,
            docType: String(d.docType || d.type || 'unknown').slice(0,50),
            originalName: String(d.originalName || d.name || 'file').slice(0,120),
            storedName: String(d.storedName || d.serverId || d.originalName || 'file').slice(0,160),
            mime: String(d.mime || d.type || 'application/octet-stream').slice(0,100),
            size: Number(d.size || 0),
            url: String(d.url || '').slice(0,500),
          }));
          if (docsToCreate.length) {
            await (prisma as any).financingApplicationDocument.createMany({ data: docsToCreate });
          }
        }
      } catch (docErr) {
        console.warn('Document metadata persistence skipped:', docErr);
      }
    }

    return NextResponse.json({ id: financingApplication.id, status: 'PENDING' }, { status: 201 });
  } catch (e: any) {
    const message = e?.message || '';
    if (e.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', issues: e.issues }, { status: 400 });
    }
    if (e.code === 'P1001') {
      return NextResponse.json({ error: 'Cannot reach database. Check network / DATABASE_URL.' }, { status: 500 });
    }
    if (e instanceof Prisma.PrismaClientInitializationError || /invalid port number|Error parsing connection string/i.test(message)) {
      return NextResponse.json({ error: 'Invalid DATABASE_URL.' }, { status: 500 });
    }
    console.error('Public financing submission error (unhandled):', e);
    return NextResponse.json({ error: 'Server error processing application', detail: process.env.NODE_ENV !== 'production' ? message : undefined }, { status: 500 });
  }
}
