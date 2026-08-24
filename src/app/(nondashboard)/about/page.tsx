import { Metadata } from "next";
import React from "react";
import AboutUsSection from "@/app/(nondashboard)/home/AboutUsSection";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "About AutoFame | Trusted Pre-Owned Dealership in Johannesburg South",
  description: "Learn about AutoFame, our mission, verified roadworthy inspections, and customer-first car buying experience at 1 Rifle Range Rd, Baragwanath, Johannesburg South.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About AutoFame | Trusted Car Dealership in Johannesburg South",
    description: "Hand-picked, roadworthy-certified quality cars at fair prices. Located at 1 Rifle Range Rd, Baragwanath, Johannesburg South.",
    url: `${siteConfig.brand.url}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-white dark:bg-gray-950">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'About Us', url: '/about' },
        ]}
      />
      <AboutUsSection />
    </div>
  );
}