"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Award, HeartHandshake, CheckCircle2 } from "lucide-react";

export default function AboutUsSection() {
  return (
    <section
      className="relative py-24 bg-[#090D0A] text-white overflow-hidden border-t border-b border-white/10"
      aria-labelledby="about-heading"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[28rem] rounded-full bg-[#00A211]/10 blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-10 relative z-10 max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00A211]/15 border border-[#00A211]/30 text-[#35D04A] text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" />
            Our Mission & Legacy
          </div>

          <h2
            id="about-heading"
            className="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-white"
          >
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A211] to-[#35D04A]">AutoFame</span>
          </h2>

          <p className="text-white/80 leading-relaxed text-base sm:text-lg max-w-3xl mx-auto font-light">
            AutoFame is a trusted pre-owned vehicle dealership serving customers from across South Africa. Located at <strong className="text-white font-medium">1 Rifle Range Road in Baragwanath, Johannesburg South</strong>, we take pride in offering hand-picked, roadworthy-certified quality cars at fair, transparent prices.
          </p>

          <p className="text-white/70 leading-relaxed text-base sm:text-lg max-w-3xl mx-auto font-light">
            We understand that mobility is a necessity and buying a car is one of life&apos;s important commitments. Purchasing your next vehicle with AutoFame opens doors to new opportunities, pride, and peace of mind.
          </p>

          {/* Core Values Badges */}
          <div className="pt-6 flex flex-wrap justify-center gap-3">
            {[
              { label: 'Transparent Pricing', icon: Award },
              { label: 'Flexible Financing', icon: HeartHandshake },
              { label: 'Quality Certified', icon: CheckCircle2 },
              { label: 'After-Sale Support', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono font-medium text-white/80"
                >
                  <Icon className="h-4 w-4 text-[#35D04A]" />
                  {item.label}
                </span>
              );
            })}
          </div>

          <div className="pt-6 border-t border-white/10 max-w-xs mx-auto">
            <p className="font-display font-bold text-lg text-white">
              AutoFame
            </p>
            <p className="text-xs font-mono text-[#35D04A] tracking-wider uppercase">
              Cars You Can Trust
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
