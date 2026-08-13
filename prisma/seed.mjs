import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding featured demo cars...');

  // Ensure a dealership exists
  let dealership = await prisma.dealership.findFirst();
  if (!dealership) {
    dealership = await prisma.dealership.create({
      data: {
        name: 'Downtown Motors',
        address: '123 Main St',
        city: 'Johannesburg',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '2000',
        phoneNumber: '+27 11 123 4567',
        email: 'info@downtownmotors.co.za',
        website: 'https://downtownmotors.example',
        latitude: -26.2041,
        longitude: 28.0473,
      },
    });
  }

  // Ensure an employee exists
  let employee = await prisma.employee.findFirst();
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        cognitoId: 'emp-demo-1',
        name: 'Demo Seller',
        email: 'seller@example.com',
        phoneNumber: '+27 11 765 4321',
        role: 'SALES_ASSOCIATE',
        dealershipId: dealership.id,
      },
    });
  }

  const demoCars = [
    {
      vin: 'SAMPLEVIN00000001',
      make: 'Toyota',
      model: 'Corolla',
      year: 2021,
      price: 259999,
      mileage: 35000,
      condition: 'USED',
      carType: 'SEDAN',
  fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      engine: '1.8L',
      exteriorColor: 'White',
      interiorColor: 'Black',
      description: 'Reliable and fuel-efficient sedan with full service history.',
      features: ['Bluetooth', 'Rear Camera', 'Cruise Control'],
      photoUrls: ['/h3.jpg', '/hero-2.jpg', '/placeholder.jpg'],
      status: 'AVAILABLE',
      featured: true,
      dealershipId: dealership.id,
      employeeId: employee.cognitoId,
    },
    {
      vin: 'SAMPLEVIN00000002',
      make: 'Volkswagen',
      model: 'Golf GTI',
      year: 2020,
      price: 469999,
      mileage: 28000,
      condition: 'USED',
      carType: 'HATCHBACK',
  fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      engine: '2.0L Turbo',
      exteriorColor: 'Red',
      interiorColor: 'Black',
      description: 'Sporty hot hatch in excellent condition.',
      features: ['Leather Seats', 'Navigation', 'Adaptive Cruise'],
      photoUrls: ['/singlelisting-2.jpg', '/singlelisting-3.jpg', '/placeholder.jpg'],
      status: 'AVAILABLE',
      featured: true,
      dealershipId: dealership.id,
      employeeId: employee.cognitoId,
    },
    {
      vin: 'SAMPLEVIN00000003',
      make: 'Mercedes-Benz',
      model: 'C200',
      year: 2019,
      price: 529999,
      mileage: 42000,
      condition: 'USED',
      carType: 'SEDAN',
  fuelType: 'PETROL',
      transmission: 'AUTOMATIC',
      engine: '2.0L',
      exteriorColor: 'Silver',
      interiorColor: 'Beige',
      description: 'Luxury sedan with premium features.',
      features: ['Sunroof', 'Park Assist', 'LED Headlights'],
      photoUrls: ['/mesbenz.jpg', '/msbz2.jpg', '/placeholder.jpg'],
      status: 'AVAILABLE',
      featured: true,
      dealershipId: dealership.id,
      employeeId: employee.cognitoId,
    },
  ];

  for (const car of demoCars) {
    try {
      await prisma.car.upsert({
        where: { vin: car.vin },
        update: car,
        create: car,
      });
      console.log(`Upserted car ${car.vin}`);
    } catch (e) {
      console.error('Failed to upsert car', car.vin, e);
    }
  }

  console.log('Seeding gallery images...');
  const galleryImages = [
    "IMG-20250823-WA0000.jpg", "IMG-20250823-WA0002.jpg", "IMG-20250823-WA0003.jpg",
    "IMG-20250823-WA0004.jpg", "IMG-20250823-WA0005.jpg", "IMG-20250823-WA0006.jpg",
    "IMG-20250823-WA0007.jpg", "IMG-20250823-WA0008.jpg", "IMG-20250823-WA0009.jpg",
    "IMG-20250823-WA0010.jpg", "IMG-20250823-WA0011.jpg", "IMG-20250823-WA0012.jpg",
    "IMG-20250823-WA0013.jpg", "IMG-20250823-WA0014.jpg", "IMG-20250823-WA0015.jpg",
    "IMG-20250823-WA0016.jpg", "IMG-20250823-WA0017.jpg", "IMG-20250823-WA0018.jpg",
    "IMG-20250823-WA0019.jpg", "IMG-20250823-WA0020.jpg", "IMG-20250823-WA0021.jpg",
    "IMG-20250823-WA0022.jpg", "IMG-20250823-WA0023.jpg", "IMG-20250823-WA0024.jpg",
    "IMG-20250823-WA0025.jpg", "IMG-20250823-WA0026.jpg", "IMG-20250823-WA0027.jpg",
    "IMG-20250823-WA0028.jpg", "IMG-20250823-WA0029.jpg", "IMG-20250823-WA0030.jpg",
    "IMG-20250823-WA0031.jpg", "IMG-20250823-WA0032.jpg", "IMG-20250823-WA0033.jpg",
    "IMG-20250823-WA0034.jpg", "IMG-20250823-WA0035.jpg", "IMG-20250823-WA0036.jpg",
    "IMG-20250823-WA0037.jpg", "IMG-20250823-WA0038.jpg", "IMG-20250823-WA0039.jpg",
    "IMG-20250823-WA0040.jpg", "IMG-20250823-WA0041.jpg", "IMG-20250823-WA0042.jpg",
    "IMG-20250823-WA0043.jpg", "IMG-20250823-WA0044.jpg", "IMG-20250823-WA0045.jpg",
    "IMG-20250823-WA0046.jpg", "IMG-20250823-WA0047.jpg", "IMG-20250823-WA0048.jpg",
    "IMG-20250823-WA0049.jpg", "IMG-20250823-WA0050.jpg", "IMG-20250823-WA0051.jpg",
    "IMG-20250823-WA0052.jpg", "IMG-20250823-WA0053.jpg", "IMG-20250823-WA0054.jpg",
    "IMG-20250823-WA0055.jpg", "IMG-20250823-WA0056.jpg", "IMG-20250823-WA0057.jpg",
    "IMG-20250823-WA0058.jpg", "IMG-20250823-WA0059.jpg", "IMG-20250823-WA0060.jpg",
    "IMG-20250823-WA0061.jpg", "IMG-20250823-WA0062.jpg", "IMG-20250823-WA0063.jpg",
    "IMG-20250823-WA0064.jpg", "hero-1.jpg"
  ];

  for (const name of galleryImages) {
    const url = name.startsWith('http') ? name : `/${name}`;
    try {
      await prisma.gallery.upsert({
        where: { url },
        create: {
          url,
          title: name,
          category: name.includes('IMG-2025') ? '2025' : 'showroom'
        },
        update: {}
      });
    } catch (e) {
      console.error(`Failed to upsert gallery image ${name}:`, e.message);
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
