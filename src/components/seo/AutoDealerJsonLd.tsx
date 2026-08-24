import React from 'react';
import { siteConfig } from '@/lib/siteConfig';

interface AutoDealerJsonLdProps {
  customDescription?: string;
}

export default function AutoDealerJsonLd({ customDescription }: AutoDealerJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    '@id': `${siteConfig.brand.url}/#dealership`,
    name: siteConfig.brand.name,
    legalName: siteConfig.brand.legalName,
    alternateName: siteConfig.brand.alternateName,
    description: customDescription || siteConfig.brand.description,
    url: siteConfig.brand.url,
    logo: `${siteConfig.brand.url}${siteConfig.brand.logoUrl}`,
    image: [
      `${siteConfig.brand.url}/about-image.jpeg`,
      `${siteConfig.brand.url}/hero-2.jpg`,
    ],
    telephone: siteConfig.contact.phoneRaw,
    email: siteConfig.contact.emailGeneral,
    priceRange: siteConfig.pricing.priceRange,
    currenciesAccepted: siteConfig.pricing.currenciesAccepted,
    paymentAccepted: siteConfig.pricing.paymentAccepted,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.location.streetAddress,
      addressLocality: siteConfig.location.city,
      addressRegion: siteConfig.location.state,
      postalCode: siteConfig.location.postalCode,
      addressCountry: siteConfig.location.countryCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: siteConfig.location.geo.latitude,
      longitude: siteConfig.location.geo.longitude,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '17:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '08:00',
        closes: '14:00',
      },
    ],
    areaServed: siteConfig.serviceAreas.map((area) => ({
      '@type': 'AdministrativeArea',
      name: area,
    })),
    hasMap: siteConfig.location.addressLink,
    sameAs: [
      siteConfig.social.facebook,
      siteConfig.social.tiktok,
      siteConfig.social.instagram,
    ].filter(Boolean),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: siteConfig.contact.phoneRaw,
        contactType: 'sales',
        areaServed: 'ZA',
        availableLanguage: ['English', 'Afrikaans', 'Zulu', 'Xhosa', 'Sotho'],
      },
      {
        '@type': 'ContactPoint',
        telephone: siteConfig.contact.phoneRaw,
        contactType: 'customer service',
        email: siteConfig.contact.emailSupport,
        areaServed: 'ZA',
        availableLanguage: ['English', 'Afrikaans', 'Zulu', 'Xhosa', 'Sotho'],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
