import { PrismaClient, CarCondition, CarType, FuelType, Transmission, CarStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

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

  // Optional employee (seller reference)
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
      condition: CarCondition.USED,
      carType: CarType.SEDAN,
      fuelType: FuelType.HYBRID,
      transmission: Transmission.AUTOMATIC,
      engine: '1.8L',
      exteriorColor: 'White',
      interiorColor: 'Black',
      description: 'Reliable and fuel-efficient sedan with full service history.',
      features: ['Bluetooth', 'Rear Camera', 'Cruise Control'],
      photoUrls: ['/h3.jpg', '/hero-2.jpg', '/placeholder.jpg'],
      status: CarStatus.AVAILABLE,
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
      condition: CarCondition.USED,
      carType: CarType.HATCHBACK,
      fuelType: FuelType.HYBRID,
      transmission: Transmission.AUTOMATIC,
      engine: '2.0L Turbo',
      exteriorColor: 'Red',
      interiorColor: 'Black',
      description: 'Sporty hot hatch in excellent condition.',
      features: ['Leather Seats', 'Navigation', 'Adaptive Cruise'],
      photoUrls: ['/singlelisting-2.jpg', '/singlelisting-3.jpg', '/placeholder.jpg'],
      status: CarStatus.AVAILABLE,
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
      condition: CarCondition.USED,
      carType: CarType.SEDAN,
      fuelType: FuelType.DIESEL,
      transmission: Transmission.AUTOMATIC,
      engine: '2.0L',
      exteriorColor: 'Silver',
      interiorColor: 'Beige',
      description: 'Luxury sedan with premium features.',
      features: ['Sunroof', 'Park Assist', 'LED Headlights'],
      photoUrls: ['/mesbenz.jpg', '/msbz2.jpg', '/placeholder.jpg'],
      status: CarStatus.AVAILABLE,
      featured: true,
      dealershipId: dealership.id,
      employeeId: employee.cognitoId,
    },
  ];

  for (const car of demoCars) {
    try {
      await prisma.car.upsert({
        where: { vin: car.vin },
        update: { ...car },
        create: car as any,
      });
      console.log(`Upserted car ${car.vin}`);
    } catch (e) {
      console.error('Failed to upsert car', car.vin, e);
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
