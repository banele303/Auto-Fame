import React from 'react';
import { siteConfig } from '@/lib/siteConfig';

export interface CarJsonLdData {
  id: number | string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  condition?: string;
  carType?: string;
  fuelType?: string;
  transmission?: string;
  engine?: string;
  exteriorColor?: string;
  interiorColor?: string;
  description?: string;
  vin?: string;
  photoUrls?: string[];
  status?: string;
}

interface CarJsonLdProps {
  car: CarJsonLdData;
}

export default function CarJsonLd({ car }: CarJsonLdProps) {
  const images = (car.photoUrls && car.photoUrls.length > 0)
    ? car.photoUrls.map(url => url.startsWith('http') ? url : `${siteConfig.brand.url}${url}`)
    : [`${siteConfig.brand.url}/placeholder.svg`];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    '@id': `${siteConfig.brand.url}/cars/${car.id}`,
    name: `${car.year} ${car.make} ${car.model}`,
    vehicleModelDate: car.year.toString(),
    brand: {
      '@type': 'Brand',
      name: car.make,
    },
    model: car.model,
    vehicleIdentificationNumber: car.vin || undefined,
    itemCondition: car.condition?.toLowerCase() === 'new' 
      ? 'https://schema.org/NewCondition' 
      : 'https://schema.org/UsedCondition',
    mileageFromOdometer: car.mileage ? {
      '@type': 'QuantitativeValue',
      value: car.mileage,
      unitCode: 'KMT',
    } : undefined,
    fuelType: car.fuelType || undefined,
    vehicleTransmission: car.transmission || undefined,
    vehicleEngine: car.engine ? {
      '@type': 'EngineSpecification',
      name: car.engine,
    } : undefined,
    color: car.exteriorColor || undefined,
    bodyType: car.carType || undefined,
    description: car.description || `Buy this ${car.year} ${car.make} ${car.model} at AutoFame Johannesburg South. Quality pre-owned vehicle with verified roadworthy check.`,
    image: images,
    offers: {
      '@type': 'Offer',
      price: car.price,
      priceCurrency: 'ZAR',
      availability: car.status === 'AVAILABLE' 
        ? 'https://schema.org/InStock' 
        : (car.status === 'RESERVED' ? 'https://schema.org/PreOrder' : 'https://schema.org/OutOfStock'),
      url: `${siteConfig.brand.url}/cars/${car.id}`,
      priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString().split('T')[0],
      seller: {
        '@type': 'AutoDealer',
        name: siteConfig.brand.name,
        telephone: siteConfig.contact.phoneRaw,
        address: {
          '@type': 'PostalAddress',
          streetAddress: siteConfig.location.streetAddress,
          addressLocality: siteConfig.location.city,
          addressRegion: siteConfig.location.state,
          postalCode: siteConfig.location.postalCode,
          addressCountry: siteConfig.location.countryCode,
        },
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
