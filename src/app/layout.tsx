import { Toaster } from "@/components/ui/sonner"
import type { Metadata } from "next";
import { Poppins, Montserrat, Outfit } from 'next/font/google';
import "./globals.css";


const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
});
import "./globals.css";
import Providers from "./providers";
import ConditionalFloatingWhatsApp from "@/components/ConditionalFloatingWhatsApp";
import ConditionalFooter from "@/components/ConditionalFooter";
import React, { Suspense } from 'react';
import PostHogPageView from './PostHogPageView';

import { siteConfig } from "@/lib/siteConfig";
import AutoDealerJsonLd from "@/components/seo/AutoDealerJsonLd";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.brand.url),
  title: {
    default: "AutoFame - Quality Pre-Owned Cars in Johannesburg South",
    template: "%s | AutoFame Dealership",
  },
  description: "Find your next pre-owned car, SUV, or bakkie at AutoFame Johannesburg South. Browse verified inventory at 1 Rifle Range Rd, Baragwanath. Instant bank financing & top trade-in appraisals.",
  keywords: [
    "used cars Johannesburg South",
    "pre-owned cars Baragwanath",
    "cars for sale Soweto",
    "AutoFame dealership",
    "car finance Johannesburg",
    "bakkies for sale Gauteng",
    "auto dealers Rifle Range Rd",
    "second hand cars Johannesburg",
    "Auto Fame South Africa",
  ],
  authors: [{ name: "AutoFame Dealership", url: siteConfig.brand.url }],
  creator: "AutoFame",
  publisher: "AutoFame",
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AutoFame - Quality Pre-Owned Cars in Johannesburg South",
    description: "Browse verified inventory, schedule test drives, and get instant bank financing at 1 Rifle Range Rd, Baragwanath, Johannesburg South.",
    url: siteConfig.brand.url,
    siteName: siteConfig.brand.name,
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "/about-image.jpeg",
        width: 1200,
        height: 630,
        alt: "AutoFame Dealership Showroom in Johannesburg South",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoFame - Quality Pre-Owned Cars in Johannesburg South",
    description: "Verified pre-owned vehicles, transparent service, and fast vehicle finance in Johannesburg South.",
    images: ["/about-image.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  other: {
    'geo.region': 'ZA-GT',
    'geo.placename': 'Johannesburg South, Baragwanath',
    'geo.position': `${siteConfig.location.geo.latitude};${siteConfig.location.geo.longitude}`,
    'ICBM': `${siteConfig.location.geo.latitude}, ${siteConfig.location.geo.longitude}`,
  },
};

// Footer visibility handled in client component to avoid hooks in server layout.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${montserrat.variable} ${outfit.variable} font-sans antialiased`} suppressHydrationWarning>
        <AutoDealerJsonLd />
        <Providers>
          <Suspense>
            <PostHogPageView />
          </Suspense>
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
            <ConditionalFooter />
            <ConditionalFloatingWhatsApp />
          </div>
        </Providers>
        <Toaster 
          position="bottom-right"
          closeButton
          richColors
          duration={4000}
        />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme');
                  if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {
                  console.error('Failed to set initial theme:', e);
                }
              })();
            `
          }}
        />
      </body>
    </html>
  );
}