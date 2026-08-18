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

export const metadata: Metadata = {
  title: "AutoFame - Cars You Can Trust",
  description: "Find your next pre-owned luxury car, SUV, or bakkie at AutoFame. Browse verified inventory, schedule test drives, and get instant bank financing.",
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
};

// Footer visibility handled in client component to avoid hooks in server layout.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${montserrat.variable} ${outfit.variable} font-sans antialiased`} suppressHydrationWarning>
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