"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, ShieldCheck, Quote, CheckCircle2, ThumbsUp } from "lucide-react";

interface Review {
  id: string;
  name: string;
  location: string;
  vehicle: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

const REVIEWS: Review[] = [
  {
    id: "rev-1",
    name: "Sibusiso Dlamini",
    location: "Johannesburg",
    vehicle: "2021 Mercedes-Benz C200 AMG Line",
    rating: 5,
    date: "2 weeks ago",
    comment:
      "Bought my C200 AMG from AutoFame in Johannesburg South. The bank financing approval was processed in under 24 hours. The car was in pristine condition, fully inspected, and delivered with all certificates.",
    verified: true,
  },
  {
    id: "rev-2",
    name: "Chantelle van der Merwe",
    location: "Pretoria",
    vehicle: "2022 Volkswagen Polo Vivo Hatch",
    rating: 5,
    date: "1 month ago",
    comment:
      "Exceptional experience! The team at AutoFame made buying my Polo Vivo completely stress-free. Transparent pricing with zero hidden fees. Highly recommend them to anyone looking for quality pre-owned cars.",
    verified: true,
  },
  {
    id: "rev-3",
    name: "Teboho Mokoena",
    location: "Soweto",
    vehicle: "2020 Toyota Fortuner 2.8 GD-6 4x4",
    rating: 5,
    date: "1 month ago",
    comment:
      "Gave me a very fair trade-in valuation for my previous vehicle and guided me through the entire bank finance application. Professional, reliable, and trustworthy dealership!",
    verified: true,
  },
  {
    id: "rev-4",
    name: "David Botha",
    location: "Bloemfontein",
    vehicle: "2024 Toyota Rumion 1.5 SX",
    rating: 5,
    date: "2 months ago",
    comment:
      "Drove up from Bloemfontein to pick up the Rumion. Everything was prepared in advance as promised. Great vehicle condition and top-notch customer support!",
    verified: true,
  },
];

export default function TestimonialsSection() {
  return (
    <section
      className="relative py-24 bg-[#070A08] text-white overflow-hidden border-t border-white/10"
      aria-labelledby="reviews-heading"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55rem] h-[30rem] rounded-full bg-[#00A211]/10 blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00A211]/15 border border-[#00A211]/30 text-[#35D04A] text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Customer Reviews
          </div>

          <h2
            id="google-reviews-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white"
          >
            What Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A211] to-[#35D04A]">Buyers Say</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-white/70 font-light leading-relaxed">
            Real feedback from satisfied customers who bought their pre-owned vehicles with AutoFame.
          </p>

          {/* Overall Score Badge */}
          <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <div className="flex text-amber-400 gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-mono text-sm font-bold text-white">4.9 / 5.0</span>
            <span className="text-xs text-white/50 border-l border-white/15 pl-3">
              50+ Happy Buyers & Counting
            </span>
          </div>
        </motion.div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {REVIEWS.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative p-6 sm:p-8 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#35D04A]/50 backdrop-blur-xl transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Header Row: Stars & Verified Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex text-amber-400 gap-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {review.verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#35D04A] bg-[#00A211]/15 px-2.5 py-1 rounded-md border border-[#00A211]/30">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>

                {/* Review Text */}
                <p className="text-white/85 text-sm sm:text-base font-light leading-relaxed mb-6 italic">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              {/* Author & Vehicle Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-white group-hover:text-[#35D04A] transition-colors">
                    {review.name}
                  </h3>
                  <p className="text-xs text-white/50 font-mono mt-0.5">
                    {review.location} · {review.date}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-white/60 bg-white/5 px-2.5 py-1 rounded-md border border-white/10 inline-block max-w-[160px] truncate">
                    {review.vehicle}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
