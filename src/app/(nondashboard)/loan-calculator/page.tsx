import { Metadata } from 'next';
import LoanCalculatorClient from './LoanCalculatorClient';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { siteConfig } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Car Loan & Finance Calculator South Africa | AutoFame',
  description: 'Calculate monthly vehicle finance installments, interest rates, and loan terms for used cars at AutoFame Johannesburg South.',
  alternates: {
    canonical: '/loan-calculator',
  },
  openGraph: {
    title: 'Car Loan & Finance Calculator | AutoFame South Africa',
    description: 'Calculate your monthly vehicle repayments for pre-owned cars at AutoFame Johannesburg South.',
    url: `${siteConfig.brand.url}/loan-calculator`,
  },
};

export default function LoanCalculatorPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Loan Calculator', url: '/loan-calculator' },
        ]}
      />
      <LoanCalculatorClient />
    </>
  );
}
