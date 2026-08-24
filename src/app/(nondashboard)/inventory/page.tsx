import { Metadata } from 'next';
import InventoryClient from './InventoryClient';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { siteConfig } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Used Cars For Sale Johannesburg South | Pre-Owned Vehicle Inventory - AutoFame',
  description: 'Browse quality verified pre-owned cars, bakkies, hatchbacks, and SUVs for sale in Johannesburg South. View roadworthy-certified vehicles with instant finance approval at AutoFame.',
  alternates: {
    canonical: '/inventory',
  },
  openGraph: {
    title: 'Used Cars For Sale Johannesburg South | AutoFame Inventory',
    description: 'Explore verified pre-owned cars in Johannesburg South. Schedule test drives and get instant vehicle finance.',
    url: `${siteConfig.brand.url}/inventory`,
  },
};

export default function InventoryPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Inventory', url: '/inventory' },
        ]}
      />
      <InventoryClient />
    </>
  );
}
