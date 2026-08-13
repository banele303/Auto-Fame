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
  title: "Advance Auto - Your Dream Car Awaits",
  description: "Find your next car at Advance Auto. Browse new and used cars, schedule test drives, and get financing options.",
  icons: {
    icon: '/favicon.ico',
  },
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