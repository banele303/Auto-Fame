import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request, ['admin', 'manager']);
    
    // Check if user is authenticated and has required role
    if (!authResult.isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: authResult.message || 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    const { id } = params;
    const applicationId = Number(id);
    if (Number.isNaN(applicationId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid application id' }),
        { status: 400 }
      );
    }
    
    // Get the financing application details with related data
    let application;
    try {
      application = await prisma.financingApplication.findUnique({
        where: { id: applicationId },
        include: {
          customer: true,
          documents: true,
          details: true,
          sale: { include: { car: true } }
        }
      });
    } catch (err: any) {
      if (err?.code === 'P2021' || err?.code === 'P2022') {
        console.warn('[Admin Financing Detail] Documents relation unavailable, retrying without it. Code:', err.code);
        application = await prisma.financingApplication.findUnique({
          where: { id: applicationId },
          include: {
            customer: true,
            details: true,
            sale: { include: { car: true } }
          }
        });
      } else {
        throw err;
      }
    }
    
    if (!application) {
      return new NextResponse(
        JSON.stringify({ error: 'Financing application not found' }),
        { status: 404 }
      );
    }

    // Shape response for admin detail view
    if (!application) {
      return new NextResponse(
        JSON.stringify({ error: 'Financing application not found' }),
        { status: 404 }
      );
    }
  const detail = (application as any).details || null;
  const car = application.sale?.car;
  const carImage = Array.isArray(car?.photoUrls) && car.photoUrls.length ? car.photoUrls[0] : null;
  // Derive a pseudo vehicle from captured extraData if no linked sale/car record exists
  let derivedCar: any = null;
  try {
    const extra: any = detail?.extraData || null;
    if (!car && extra && (extra.vehicleMake || extra.vehicleModel)) {
      const rawPrice = extra.cashPrice || extra.vehiclePrice || extra.price || application.loanAmount;
      const parsedPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g,''));
      derivedCar = {
        id: String(extra.vehicleId || 'virtual'),
        make: String(extra.vehicleMake || '').slice(0,60) || 'Unknown',
        model: String(extra.vehicleModel || '').slice(0,60) || 'Vehicle',
        year: extra.vehicleYear ? parseInt(String(extra.vehicleYear),10) : (extra.year ? parseInt(String(extra.year),10) : new Date().getFullYear()),
        price: !isNaN(parsedPrice) ? parsedPrice : application.loanAmount,
        imageUrl: extra.vehicleImageUrl || extra.imageUrl || null,
      };
    }
  } catch (e) {
    console.warn('Failed deriving vehicle from extraData', e);
  }
    const shaped: any = {
      id: application.id,
      applicationDate: application.applicationDate?.toISOString?.() || new Date().toISOString(),
      approvalDate: application.approvalDate?.toISOString?.() || null,
      status: application.status,
      creditScore: application.creditScore || detail?.creditScoreRange || 0,
      loanAmount: application.loanAmount,
      loanTermMonths: application.termMonths,
      interestRate: application.interestRate,
      monthlyPayment: application.monthlyPayment,
      annualIncome: application.annualIncome || null,
      isNSFASAccredited: false, // placeholder until accreditation logic added
      customer: {
        id: application.customer?.cognitoId || application.customer?.id,
        name: application.customer?.name || `${detail?.firstName || ''} ${detail?.lastName || ''}`.trim(),
        firstName: detail?.firstName || application.customer?.name?.split(' ')[0] || '',
        lastName: detail?.lastName || application.customer?.name?.split(' ').slice(1).join(' ') || '',
        email: application.customer?.email || detail?.email || '',
        phone: application.customer?.phoneNumber || detail?.phone || '',
        dateOfBirth: (detail?.dateOfBirth || application.customer?.dateOfBirth) ? (detail?.dateOfBirth || application.customer?.dateOfBirth)?.toISOString?.() : null,
      },
      car: car ? {
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        imageUrl: carImage
      } : (derivedCar || null),
      documents: ((application as any).documents || []).map((d: any) => ({
        id: d.id,
        docType: d.docType,
        originalName: d.originalName,
        url: d.url || `/api/uploads/financing/file/${encodeURIComponent(d.storedName || d.originalName)}`,
        mime: d.mime,
        size: d.size,
        uploadedAt: d.uploadedAt?.toISOString?.() || ''
      })),
      // Provide full detail record for richer UI & PDF export
      details: detail ? {
        firstName: detail.firstName,
        lastName: detail.lastName,
        email: detail.email,
        phone: detail.phone,
        dateOfBirth: detail.dateOfBirth?.toISOString?.() || null,
        idNumber: detail.idNumber,
        address: detail.address,
        city: detail.city,
        state: detail.state,
        postalCode: detail.postalCode,
        housingStatus: detail.housingStatus,
        monthlyHousingPayment: detail.monthlyHousingPayment,
        employmentStatus: detail.employmentStatus,
        employerName: detail.employerName,
        jobTitle: detail.jobTitle,
        employmentYears: detail.employmentYears,
        monthlyIncomeGross: detail.monthlyIncomeGross,
        otherIncome: detail.otherIncome,
        otherIncomeSource: detail.otherIncomeSource,
        creditScoreRange: detail.creditScoreRange,
        downPaymentAmount: detail.downPaymentAmount,
        preferredContactMethod: detail.preferredContactMethod,
        hasTradeIn: detail.hasTradeIn,
        tradeInDetails: detail.tradeInDetails,
        coApplicantName: detail.coApplicantName,
        coApplicantIncome: detail.coApplicantIncome,
        coApplicantRelationship: detail.coApplicantRelationship,
        consentCreditCheck: detail.consentCreditCheck,
        agreeTerms: detail.agreeTerms,
        extraData: detail.extraData || null,
        createdAt: detail.createdAt?.toISOString?.() || null,
      } : null,
      _meta: {
        hasDetail: !!detail,
        fieldCompleteness: detail ? (Object.values({
          firstName: detail.firstName,
          lastName: detail.lastName,
          email: detail.email,
          phone: detail.phone,
          dateOfBirth: detail.dateOfBirth,
          address: detail.address,
          city: detail.city,
          state: detail.state,
          postalCode: detail.postalCode,
          housingStatus: detail.housingStatus,
          employmentStatus: detail.employmentStatus,
          employerName: detail.employerName,
          jobTitle: detail.jobTitle,
          monthlyIncomeGross: detail.monthlyIncomeGross,
          otherIncome: detail.otherIncome,
          coApplicantName: detail.coApplicantName,
          coApplicantIncome: detail.coApplicantIncome,
        }).filter(v => v !== null && v !== undefined && v !== '').length) : 0
      }
    };
    return NextResponse.json(shaped);
    
  } catch (error) {
    console.error('Error fetching financing application:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request, ['admin', 'manager']);
    if (!authResult.isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: authResult.message || 'Unauthorized' }),
        { status: 401 }
      );
    }
    const applicationId = Number(params.id);
    if (Number.isNaN(applicationId)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid application id' }),
        { status: 400 }
      );
    }

    // Cascade delete detail & documents first (if models exist)
    try {
      if ((prisma as any).financingApplicationDocument) {
        await (prisma as any).financingApplicationDocument.deleteMany({ where: { financingApplicationId: applicationId } });
      }
      if ((prisma as any).financingApplicationDetail) {
        await (prisma as any).financingApplicationDetail.deleteMany({ where: { financingApplicationId: applicationId } });
      }
    } catch (relErr) {
      console.warn('Non-fatal related records delete issue:', relErr);
    }

    const deleted = await prisma.financingApplication.delete({ where: { id: applicationId } });
    return NextResponse.json({ id: deleted.id, deleted: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return new NextResponse(
        JSON.stringify({ error: 'Financing application not found' }),
        { status: 404 }
      );
    }
    console.error('Error deleting financing application:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
