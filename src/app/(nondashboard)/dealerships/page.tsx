import { Metadata } from 'next';
import DealershipsClient from './DealershipsClient';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { siteConfig } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Dealership Network & Dealer Partners | AutoFame South Africa',
  description: 'Join the AutoFame automotive network. We partner with verified motor dealerships across Gauteng and South Africa for shared inventory, trade-ins, and financing.',
  alternates: {
    canonical: '/dealerships',
  },
  openGraph: {
    title: 'Dealership Network & Partners | AutoFame',
    description: 'AutoFame dealership network in Johannesburg South and Gauteng.',
    url: `${siteConfig.brand.url}/dealerships`,
  },
};

export default function DealershipsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Dealerships', url: '/dealerships' },
        ]}
      />
      <DealershipsClient />
    </>
  );
}