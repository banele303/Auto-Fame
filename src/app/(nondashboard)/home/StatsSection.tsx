"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
import { motion } from "framer-motion";
import { Car, Users, Award, MapPin } from "lucide-react";

const StatsSection = () => {
  // Static stats per request (vehicles fixed at 20+, customers at 50+)

  const parseValue = (val: string) => {
    const match = val.match(/(\d+[\.]?\d*)/);
    return match ? Number(match[1]) : 0;
  };

  const stats = [
    { key: 'vehicles', icon: Car, raw: '20+', label: 'Vehicles', description: 'Quality cars in our inventory' },
    { key: 'customers', icon: Users, raw: '50+', label: 'Happy Customers', description: 'Satisfied with our service' },
  ].map(s => ({
    ...s,
    target: parseValue(s.raw.toString()),
    suffix: s.raw.toString().replace(/\d+[\.]?\d*/, '')
  }));

  const useCountUp = (target: number, duration = 1200) => {
    const [value, setValue] = useState(0);
    const startTs = useRef<number | null>(null);
    useEffect(() => {
      if (!target) return;
      let frame: number;
      const step = (ts: number) => {
        if (startTs.current == null) startTs.current = ts;
        const progress = Math.min(1, (ts - startTs.current) / duration);
        setValue(Math.floor(progress * target));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
      return () => cancelAnimationFrame(frame);
    }, [target, duration]);
    return value;
  };

  const NewArrivalsSlider = dynamic(() => import('./NewArrivalsSlider'), { ssr: false });

  return (
    <section className="relative py-20 bg-gradient-to-br from-white via-[#f5fff6] to-white dark:from-gray-900 dark:via-gray-900/70 dark:to-gray-900 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(circle_at_center,black,transparent)]">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[#00A211]/10 blur-3xl" />
        <div className="absolute bottom-0 -left-10 w-80 h-80 rounded-full bg-[#00A211]/10 blur-3xl" />
      </div>
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="inline-block text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white relative">
            <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-[#00A211] via-[#00b516] to-[#008d0f]">Why Choose Advance Auto Dealership?</span>
            <span className="absolute -inset-1 rounded-lg bg-[#00A211]/5 blur-sm" aria-hidden />
          </h2>
          <p className="mt-4 text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Leaders in affordable and quality vehicles you can trust and rely on 
          </p>
        </motion.div>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const count = useCountUp(stat.target);
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -6, rotate: 0.2 }}
                transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 0.68, 0.36, 1] }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all p-4 md:p-5"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[#00A211]/10 via-transparent to-transparent" />
                <div className="relative flex flex-col items-start text-left">
                  <div className="mb-3 inline-flex items-center justify-center rounded-xl h-11 w-11 bg-[#00A211]/10 text-[#00A211] ring-1 ring-[#00A211]/20 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <Icon className="h-5 w-5 group-hover:animate-pulse" />
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white tabular-nums">
                    {count}<span className="text-[#00A211] ml-0.5">{stat.suffix}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{stat.label}</div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-snug">{stat.description}</div>
                </div>
                <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-gradient-to-r from-[#00A211] via-[#00b516] to-[#008d0f] group-hover:w-full transition-all duration-500" />
              </motion.div>
            );
          })}
        </div>
        <NewArrivalsSlider />
      </div>
    </section>
  );
};

export default StatsSection;
