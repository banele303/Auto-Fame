import React from "react";
import GallerySection from "../home/GallerySection";
import { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Vehicle & Showroom Gallery | AutoFame Johannesburg South",
  description: "Browse high-resolution vehicle photos, showroom walkthroughs, interior details, and customer handovers at AutoFame Johannesburg South.",
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "Vehicle & Showroom Gallery | AutoFame Johannesburg",
    description: "Explore our latest inventory gallery and showroom at 1 Rifle Range Rd, Baragwanath, Johannesburg South.",
    url: `${siteConfig.brand.url}/gallery`,
  },
};

export default function GalleryPage() {
  return (
    <div className="bg-white dark:bg-slate-950">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Gallery', url: '/gallery' },
        ]}
      />
      <section className="pt-28 pb-8 text-center bg-gradient-to-b from-[#00A211] to-[#00780d] text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Vehicle & Showroom Gallery</h1>
          <p className="text-[#c6f9ce] max-w-2xl mx-auto">Browse highlights from our Johannesburg South showroom, featured stock, interiors, and customer deliveries.</p>
        </div>
      </section>
      <GallerySection compact={false} />
    </div>
  );
}
