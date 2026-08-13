// Centralized site branding & contact configuration
export const siteConfig = {
  brand: {
    name: 'AutoFame',
    tagline: 'Cars You Can Trust',
  },
  contact: {
    phoneDisplay: '061 225 9884',
    phoneRaw: '+27612259884',
    whatsappNumberRaw: '27612259884',
    whatsappMessage: "Hi AutoFame! I'm interested in a vehicle",
    emailGeneral: 'autofame1@gmail.com',
    emailTradeIn: 'autofame1@gmail.com',
    addressLine: '1 Rifle Range Rd, Baragwanath, Johannesburg South, 2091',
    addressLink: 'https://www.google.com/maps/search/?api=1&query=1+Rifle+Range+Rd,+Baragwanath,+Johannesburg+South,+2091',
    hours: {
      weekday: '08:00–17:00',
      saturday: '08:00–14:00',
      sunday: 'Closed'
    }
  }
} as const;

export type SiteConfig = typeof siteConfig;
