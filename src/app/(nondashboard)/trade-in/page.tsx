import { Metadata } from 'next';
import TradeInClient from './TradeInClient';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { siteConfig } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Car Trade-In & Vehicle Appraisal Johannesburg South | AutoFame',
  description: 'Trade in your used car for top market value at AutoFame Johannesburg South. Instant online estimate, quick 30-minute appraisal, and trade toward your next pre-owned vehicle.',
  alternates: {
    canonical: '/trade-in',
  },
  openGraph: {
    title: 'Car Trade-In & Appraisal Johannesburg South | AutoFame',
    description: 'Get top value for your trade-in in Johannesburg South. Fast 3-step appraisal process at 1 Rifle Range Rd, Baragwanath.',
    url: `${siteConfig.brand.url}/trade-in`,
  },
};

export default function TradeInPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Trade-In', url: '/trade-in' },
        ]}
      />
      <TradeInClient />
    </>
  );
}
