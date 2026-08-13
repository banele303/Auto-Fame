"use client";

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

/**
 * Renders the global footer except on admin and dashboard routes.
 */
export default function ConditionalFooter() {
  const pathname = usePathname();
  if (!pathname) return null;
  const hide = pathname.startsWith('/admin') || pathname.startsWith('/dashboard');
  if (hide) return null;
  return <Footer />;
}
