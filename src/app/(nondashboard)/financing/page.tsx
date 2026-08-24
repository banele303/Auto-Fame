import { Metadata } from 'next';
import FinancingClient from './FinancingClient';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { siteConfig } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Vehicle Finance Johannesburg South | Instant Car Loan Approval - AutoFame',
  description: 'Apply for fast, flexible vehicle financing at AutoFame Johannesburg South. We partner with major South African banks (WesBank, Absa, Standard Bank, Nedbank) for top approval rates.',
  alternates: {
    canonical: '/financing',
  },
  openGraph: {
    title: 'Vehicle Finance Johannesburg South | AutoFame',
    description: 'Get pre-approved for car financing in Johannesburg South. Quick application with major South African banks.',
    url: `${siteConfig.brand.url}/financing`,
  },
};

export default function FinancingPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Vehicle Financing', url: '/financing' },
        ]}
      />
      <FinancingClient />
    </>
  );
}
