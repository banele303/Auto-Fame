import React from "react";
import GallerySection from "../home/GallerySection";

export const metadata = {
  title: "Gallery | Advance Auto",
  description: "Explore our vehicle and brand gallery at Advance Auto.",
};

export default function GalleryPage() {
  return (
    <div className="bg-white dark:bg-slate-950">
  <section className="pt-28 pb-8 text-center bg-gradient-to-b from-[#00A211] to-[#00780d] text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Gallery</h1>
          <p className="text-[#c6f9ce] max-w-2xl mx-auto">Browse highlights from our showroom, promotions, interiors, exteriors and branding assets.</p>
        </div>
      </section>
      <GallerySection compact={false} />
    </div>
  );
}
