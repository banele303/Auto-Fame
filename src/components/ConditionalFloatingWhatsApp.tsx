"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import FloatingWhatsApp from './FloatingWhatsApp';

// Paths (prefixes) where the floating contact buttons should be hidden
const HIDE_PATH_PREFIXES = [
  '/admin',          // admin area
  '/dashboard',      // any generic dashboard route if present
];

// Exact paths (if any) to suppress (add as needed)
const HIDE_EXACT: string[] = [];

export default function ConditionalFloatingWhatsApp() {
  const pathname = usePathname();
  if (!pathname) return null;

  // Admin group segments like (dashboard) don't appear in the URL, so just rely on actual prefixes.
  const shouldHide =
    HIDE_EXACT.includes(pathname) ||
    HIDE_PATH_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (shouldHide) return null;
  return <FloatingWhatsApp />;
}
