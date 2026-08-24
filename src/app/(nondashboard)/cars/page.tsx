import { Metadata } from 'next';
import CarsClient from './CarsClient';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { siteConfig } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Cars For Sale in Johannesburg South | AutoFame Dealership',
  description: 'Find quality pre-owned cars, hatchbacks, sedans, and bakkies in Johannesburg South. Verified roadworthy inspections, fair pricing, and bank financing at 1 Rifle Range Rd, Baragwanath.',
  alternates: {
    canonical: '/cars',
  },
  openGraph: {
    title: 'Cars For Sale in Johannesburg South | AutoFame',
    description: 'Browse verified pre-owned vehicles in Johannesburg South. Test drives & fast finance approvals.',
    url: `${siteConfig.brand.url}/cars`,
  },
};

export default function CarsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Cars', url: '/cars' },
        ]}
      />
      <CarsClient />
    </>
  );
}
