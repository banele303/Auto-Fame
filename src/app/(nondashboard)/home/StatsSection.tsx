"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Car, Users, Award, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

export default function StatsSection() {
  const stats = [
    {
      key: 'vehicles',
      icon: Car,
      value: '20+',
      label: 'Vehicles',
      description: 'Quality cars in our inventory',
      badge: 'Stock Available'
    },
    {
      key: 'customers',
      icon: Users,
      value: '50+',
      label: 'Happy Customers',
      description: 'Satisfied with our service',
      badge: 'Verified Reviews'
    },
    {
      key: 'inspected',
      icon: ShieldCheck,
      value: '100%',
      label: 'Inspected',
      description: 'Roadworthy & safety certified',
      badge: 'Quality Assurance'
    },
    {
      key: 'approval',
      icon: Sparkles,
      value: 'Fast',
      label: 'Bank Approval',
      description: 'Instant financing assistance',
      badge: 'Financing Ready'
    },
  ];

  return (
    <section className="relative py-20 md:py-28 bg-[#090C0A] text-white overflow-hidden border-t border-white/10">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[25rem] rounded-full bg-[#00A211]/10 blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00A211]/15 border border-[#00A211]/30 text-[#35D04A] text-xs font-semibold uppercase tracking-wider mb-4">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Trust & Excellence
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
            Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A211] to-[#35D04A]">Advance Auto Dealership?</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/70 font-light leading-relaxed">
            Leaders in affordable and quality vehicles you can trust and rely on
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative p-6 sm:p-7 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#35D04A]/50 backdrop-blur-xl transition-all duration-300 shadow-xl hover:-translate-y-1.5"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="h-12 w-12 rounded-xl bg-[#00A211]/15 border border-[#00A211]/30 flex items-center justify-center text-[#35D04A] group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 bg-white/5 px-2.5 py-1 rounded-md">
                    {stat.badge}
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white group-hover:text-[#35D04A] transition-colors mb-1">
                  {stat.value}
                </div>
                <div className="text-base font-bold text-white/90 mb-1">
                  {stat.label}
                </div>
                <p className="text-xs text-white/60 font-light leading-normal">
                  {stat.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
