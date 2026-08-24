import { Metadata } from 'next';
import ContactUsClient from './ContactUsClient';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { siteConfig } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Contact AutoFame Dealership | 1 Rifle Range Rd, Johannesburg South',
  description: 'Visit AutoFame at 1 Rifle Range Rd, Baragwanath, Johannesburg South or call 061 225 9884. Get directions, contact sales, apply for vehicle financing, or book a test drive.',
  alternates: {
    canonical: '/contact-us',
  },
  openGraph: {
    title: 'Contact AutoFame Dealership | Johannesburg South',
    description: 'Get directions to AutoFame at 1 Rifle Range Rd, Baragwanath, Johannesburg South. Contact our sales and finance team today.',
    url: `${siteConfig.brand.url}/contact-us`,
  },
};

export default function ContactUsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Contact Us', url: '/contact-us' },
        ]}
      />
      <ContactUsClient />
    </>
  );
}