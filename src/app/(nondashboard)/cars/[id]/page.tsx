import { Metadata } from 'next';
import CarDetailClient from './CarDetailClient';
import CarJsonLd from '@/components/seo/CarJsonLd';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { siteConfig } from '@/lib/siteConfig';
import { convexClient } from '@/lib/convex';
import { api } from '../../../../../convex/_generated/api';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const carId = parseInt(params.id);
  if (isNaN(carId)) {
    return { title: 'Vehicle Not Found' };
  }

  try {
    const car = await convexClient.query(api.cars.get, { id: carId });
    if (!car) {
      return { title: 'Vehicle Not Found | AutoFame Dealership' };
    }

    const title = `${car.year} ${car.make} ${car.model} For Sale Johannesburg South | AutoFame`;
    const description = `Buy this ${car.year} ${car.make} ${car.model} in Johannesburg South for R ${car.price.toLocaleString()}. Quality pre-owned vehicle with ${car.mileage ? car.mileage.toLocaleString() + ' km' : 'low mileage'}, ${car.fuelType}, ${car.transmission}. Instant bank financing available at 1 Rifle Range Rd, Baragwanath.`;
    const photo = (car.photoUrls && car.photoUrls.length > 0) ? car.photoUrls[0] : '/about-image.jpeg';

    return {
      title,
      description,
      alternates: {
        canonical: `/cars/${carId}`,
      },
      openGraph: {
        title,
        description,
        url: `${siteConfig.brand.url}/cars/${carId}`,
        type: 'website',
        images: [
          {
            url: photo.startsWith('http') ? photo : `${siteConfig.brand.url}${photo}`,
            alt: `${car.year} ${car.make} ${car.model} AutoFame Dealership`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [photo.startsWith('http') ? photo : `${siteConfig.brand.url}${photo}`],
      },
    };
  } catch (error) {
    return {
      title: 'Vehicle Details | AutoFame Dealership Johannesburg South',
      description: 'Find verified pre-owned cars in Johannesburg South at AutoFame.',
    };
  }
}

export default async function CarDetailPage({ params }: PageProps) {
  const carId = parseInt(params.id);
  let car: any = null;

  try {
    if (!isNaN(carId)) {
      car = await convexClient.query(api.cars.get, { id: carId });
    }
  } catch (error) {
    console.warn('Failed to pre-fetch car for structured data on server:', error);
  }

  return (
    <>
      {car && (
        <>
          <CarJsonLd car={car} />
          <BreadcrumbJsonLd
            items={[
              { name: 'Home', url: '/' },
              { name: 'Cars', url: '/cars' },
              { name: `${car.year} ${car.make} ${car.model}`, url: `/cars/${car.id}` },
            ]}
          />
        </>
      )}
      <CarDetailClient />
    </>
  );
}
