// Centralized site branding, contact, and Local SEO configuration
export const siteConfig = {
  brand: {
    name: 'AutoFame',
    legalName: 'AutoFame Dealership (Pty) Ltd',
    alternateName: 'Auto Fame',
    tagline: 'Cars You Can Trust',
    description: 'Premier pre-owned car dealership in Johannesburg South. Browse quality verified used cars, SUVs, and bakkies with fast bank financing and trade-ins.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://autofame.co.za',
    logoUrl: '/auto-fame-logo.png',
  },
  contact: {
    phoneDisplay: '061 225 9884',
    phoneRaw: '+27612259884',
    whatsappNumberRaw: '27612259884',
    whatsappMessage: "Hi AutoFame! I'm interested in a vehicle",
    emailGeneral: 'autofame1@gmail.com',
    emailTradeIn: 'autofame1@gmail.com',
    emailSupport: 'autofame1@gmail.com',
    addressLine: '1 Rifle Range Rd, Baragwanath, Johannesburg South, 2091',
    addressLink: 'https://www.google.com/maps/search/?api=1&query=1+Rifle+Range+Rd,+Baragwanath,+Johannesburg+South,+2091',
    hours: {
      weekday: '08:00–17:00',
      saturday: '08:00–14:00',
      sunday: 'Closed'
    }
  },
  location: {
    streetAddress: '1 Rifle Range Rd',
    suburb: 'Baragwanath',
    city: 'Johannesburg South',
    state: 'Gauteng',
    postalCode: '2091',
    country: 'South Africa',
    countryCode: 'ZA',
    addressLine: '1 Rifle Range Rd, Baragwanath, Johannesburg South, 2091',
    addressLink: 'https://www.google.com/maps/search/?api=1&query=1+Rifle+Range+Rd,+Baragwanath,+Johannesburg+South,+2091',
    directionsHint: 'Located on Rifle Range Rd in Baragwanath, near Chris Hani Baragwanath Hospital and Southgate Shopping Mall.',
    geo: {
      latitude: -26.2575,
      longitude: 27.9945,
    },
  },
  hours: {
    weekday: '08:00–17:00',
    saturday: '08:00–14:00',
    sunday: 'Closed',
    schemaHours: [
      'Mo-Fr 08:00-17:00',
      'Sa 08:00-14:00',
    ],
  },
  serviceAreas: [
    'Johannesburg South',
    'Baragwanath',
    'Soweto',
    'Glenvista',
    'Mondeor',
    'Alberton',
    'Johannesburg',
    'Gauteng',
    'South Africa',
  ],
  pricing: {
    priceRange: 'R50,000 - R1,500,000',
    priceCurrency: 'ZAR',
    currenciesAccepted: 'ZAR',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer, Vehicle Finance',
  },
  social: {
    facebook: 'https://www.facebook.com/share/1Dzk6oHqXE/',
    tiktok: 'https://www.tiktok.com/@adv1auto?_t=ZS-8zEF81vzNFC&_r=1',
    instagram: 'https://instagram.com/autofame',
  },
} as const;

export type SiteConfig = typeof siteConfig;
