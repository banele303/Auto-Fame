import { PrismaClient } from '@prisma/client';
import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.error('Error: NEXT_PUBLIC_CONVEX_URL is not set in your .env file.');
  process.exit(1);
}

const convex = new ConvexHttpClient(convexUrl);

// Dynamically resolve Convex API
// We require the generated api object. Since it is generated in node_modules, we can import it.
// In Convex, code references function paths by string for HTTP client if compiled types aren't available, e.g. "import:bulkInsert"
const IMPORT_MUTATION = "import:bulkInsert";

async function main() {
  console.log('--- Starting Data Migration to Convex ---');
  console.log(`Convex URL: ${convexUrl}\n`);

  try {
    // 1. Dealerships
    const dealerships = await prisma.dealership.findMany();
    const dealerDocs = dealerships.map(d => ({
      id: d.id,
      name: d.name,
      address: d.address,
      city: d.city,
      state: d.state,
      country: d.country,
      postalCode: d.postalCode,
      phoneNumber: d.phoneNumber,
      email: d.email,
      website: d.website || null,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      latitude: d.latitude || null,
      longitude: d.longitude || null,
    }));
    console.log(`Migrating ${dealerDocs.length} Dealerships...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'dealerships', documents: dealerDocs });

    // 2. Employees
    const employees = await prisma.employee.findMany();
    const empDocs = employees.map(e => ({
      id: e.id,
      cognitoId: e.cognitoId,
      name: e.name,
      email: e.email,
      phoneNumber: e.phoneNumber,
      role: e.role,
      status: e.status,
      hireDate: e.hireDate.toISOString(),
      commission: e.commission,
      dealershipId: e.dealershipId,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));
    console.log(`Migrating ${empDocs.length} Employees...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'employees', documents: empDocs });

    // 3. Customers
    const customers = await prisma.customer.findMany({ include: { favorites: true } });
    const custDocs = customers.map(c => ({
      id: c.id,
      cognitoId: c.cognitoId,
      name: c.name,
      email: c.email,
      phoneNumber: c.phoneNumber,
      address: c.address || null,
      city: c.city || null,
      state: c.state || null,
      postalCode: c.postalCode || null,
      dateOfBirth: c.dateOfBirth ? c.dateOfBirth.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      favorites: c.favorites.map(f => f.id),
    }));
    console.log(`Migrating ${custDocs.length} Customers...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'customers', documents: custDocs });

    // 4. Admins
    const admins = await prisma.admin.findMany();
    const adminDocs = admins.map(a => ({
      id: a.id,
      cognitoId: a.cognitoId,
      name: a.name,
      email: a.email,
      phoneNumber: a.phoneNumber || null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
    console.log(`Migrating ${adminDocs.length} Admins...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'admins', documents: adminDocs });

    // 5. Cars
    const cars = await prisma.car.findMany();
    const carDocs = cars.map(c => ({
      id: c.id,
      vin: c.vin,
      make: c.make,
      model: c.model,
      year: c.year,
      price: c.price,
      mileage: c.mileage,
      condition: c.condition,
      carType: c.carType,
      fuelType: c.fuelType,
      transmission: c.transmission,
      engine: c.engine,
      exteriorColor: c.exteriorColor,
      interiorColor: c.interiorColor,
      description: c.description,
      features: c.features,
      photoUrls: c.photoUrls,
      status: c.status,
      postedDate: c.postedDate.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      averageRating: c.averageRating || 0,
      numberOfReviews: c.numberOfReviews || 0,
      dealershipId: c.dealershipId,
      employeeId: c.employeeId || null,
      featured: c.featured,
    }));
    console.log(`Migrating ${carDocs.length} Cars...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'cars', documents: carDocs });

    // 6. Inquiries
    const inquiries = await prisma.inquiry.findMany();
    const inqDocs = inquiries.map(i => ({
      id: i.id,
      message: i.message,
      status: i.status,
      inquiryDate: i.inquiryDate.toISOString(),
      followUpDate: i.followUpDate ? i.followUpDate.toISOString() : null,
      carId: i.carId,
      customerId: i.customerId,
      employeeId: i.employeeId || null,
      dealershipId: i.dealershipId,
    }));
    console.log(`Migrating ${inqDocs.length} Inquiries...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'inquiries', documents: inqDocs });

    // 7. Test Drives
    const testDrives = await prisma.testDrive.findMany();
    const tdDocs = testDrives.map(t => ({
      id: t.id,
      scheduledDate: t.scheduledDate.toISOString(),
      actualDate: t.actualDate ? t.actualDate.toISOString() : null,
      duration: t.duration || null,
      notes: t.notes || null,
      completed: t.completed,
      carId: t.carId,
      customerId: t.customerId,
      employeeId: t.employeeId || null,
      dealershipId: t.dealershipId,
      createdAt: t.createdAt.toISOString(),
    }));
    console.log(`Migrating ${tdDocs.length} Test Drives...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'testDrives', documents: tdDocs });

    // 8. Sales
    const sales = await prisma.sale.findMany();
    const saleDocs = sales.map(s => ({
      id: s.id,
      salePrice: s.salePrice,
      downPayment: s.downPayment,
      tradeInValue: s.tradeInValue,
      saleDate: s.saleDate.toISOString(),
      deliveryDate: s.deliveryDate ? s.deliveryDate.toISOString() : null,
      carId: s.carId,
      customerId: s.customerId,
      employeeId: s.employeeId,
      dealershipId: s.dealershipId,
      financingId: s.financingId || null,
    }));
    console.log(`Migrating ${saleDocs.length} Sales...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'sales', documents: saleDocs });

    // 9. Reviews
    const reviews = await prisma.review.findMany();
    const revDocs = reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      reviewDate: r.reviewDate.toISOString(),
      carId: r.carId,
      customerId: r.customerId,
    }));
    console.log(`Migrating ${revDocs.length} Reviews...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'reviews', documents: revDocs });

    // 10. Posts (Blog)
    const posts = await prisma.post.findMany();
    const postDocs = posts.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      content: p.content,
      excerpt: p.excerpt || null,
      coverImage: p.coverImage || null,
      tags: p.tags,
      published: p.published,
      metaTitle: p.metaTitle || null,
      metaDescription: p.metaDescription || null,
      metaKeywords: p.metaKeywords,
      authorId: p.authorId || null,
      authorName: p.authorName || null,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
    console.log(`Migrating ${postDocs.length} Blog Posts...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'posts', documents: postDocs });

    // 11. Gallery
    const galleries = await prisma.gallery.findMany();
    const galDocs = galleries.map(g => ({
      id: g.id,
      url: g.url,
      title: g.title || null,
      category: g.category || "2025",
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    }));
    console.log(`Migrating ${galDocs.length} Gallery items...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'gallery', documents: galDocs });

    // 12. Financing Applications
    const apps = await prisma.financingApplication.findMany();
    const appDocs = apps.map(a => ({
      id: a.id,
      loanAmount: a.loanAmount,
      interestRate: a.interestRate,
      termMonths: a.termMonths,
      monthlyPayment: a.monthlyPayment,
      status: a.status,
      applicationDate: a.applicationDate.toISOString(),
      approvalDate: a.approvalDate ? a.approvalDate.toISOString() : null,
      customerId: a.customerId,
      creditScore: a.creditScore || null,
      annualIncome: a.annualIncome || null,
    }));
    console.log(`Migrating ${appDocs.length} Financing Applications...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'financingApplications', documents: appDocs });

    // 13. Financing Application Details
    const details = await prisma.financingApplicationDetail.findMany();
    const detailDocs = details.map(d => ({
      id: d.id,
      financingApplicationId: d.financingApplicationId,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      dateOfBirth: d.dateOfBirth ? d.dateOfBirth.toISOString() : null,
      idNumber: d.idNumber || null,
      address: d.address || null,
      city: d.city || null,
      state: d.state || null,
      postalCode: d.postalCode || null,
      housingStatus: d.housingStatus || null,
      monthlyHousingPayment: d.monthlyHousingPayment || null,
      employmentStatus: d.employmentStatus || null,
      employerName: d.employerName || null,
      jobTitle: d.jobTitle || null,
      employmentYears: d.employmentYears || null,
      monthlyIncomeGross: d.monthlyIncomeGross || null,
      otherIncome: d.otherIncome || null,
      otherIncomeSource: d.otherIncomeSource || null,
      creditScoreRange: d.creditScoreRange || null,
      downPaymentAmount: d.downPaymentAmount || null,
      preferredContactMethod: d.preferredContactMethod || null,
      hasTradeIn: d.hasTradeIn,
      tradeInDetails: d.tradeInDetails || null,
      coApplicantName: d.coApplicantName || null,
      coApplicantIncome: d.coApplicantIncome || null,
      coApplicantRelationship: d.coApplicantRelationship || null,
      consentCreditCheck: d.consentCreditCheck,
      agreeTerms: d.agreeTerms,
      extraData: d.extraData || null,
      createdAt: d.createdAt.toISOString(),
    }));
    console.log(`Migrating ${detailDocs.length} Financing Application Details...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'financingApplicationDetails', documents: detailDocs });

    // 14. Financing Application Documents
    const docs = await prisma.financingApplicationDocument.findMany();
    const docDocs = docs.map(d => ({
      id: d.id,
      financingApplicationId: d.financingApplicationId,
      docType: d.docType,
      originalName: d.originalName,
      storedName: d.storedName,
      mime: d.mime,
      size: d.size,
      url: d.url,
      uploadedAt: d.uploadedAt.toISOString(),
    }));
    console.log(`Migrating ${docDocs.length} Financing Application Documents...`);
    await convex.mutation(IMPORT_MUTATION, { table: 'financingApplicationDocuments', documents: docDocs });

    console.log('\n--- Data Migration to Convex Completed Successfully! ---');
  } catch (error) {
    console.error('Error migrating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
