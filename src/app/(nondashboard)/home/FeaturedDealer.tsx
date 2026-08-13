"use client";
import React from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Mail, Car, ShieldCheck, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

// Completely re-imagined single-location section
const FeaturedDealer = () => {
  const address = "2A Amanda Ave, Gleneagles, Johannesburg South, 2091";
  const phone = "+27 68 072 0424"; // updated primary contact number
  const email = "info@advanceauto.co.za"; // placeholder business email
  const hours = [
    { label: "Mon - Fri", value: "08:00 - 17:00" },
    { label: "Saturday", value: "08:00 - 14:00" },
    { label: "Sunday", value: "Closed" },
  ];

  const highlights = [
    { icon: Car, title: "Curated Stock", desc: "Hand-selected vehicles inspected for quality." },
    { icon: ShieldCheck, title: "Trusted Service", desc: "Transparent history & reliable guidance." },
    { icon: ThumbsUp, title: "Flexible Deals", desc: "Financing options tailored to your needs." },
  ];

  return (
    <section className="relative overflow-hidden py-20 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-slate-900 dark:to-slate-800">
      {/* Subtle background accents */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(circle_at_center,white,transparent)]">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#00A211]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>
      <div className="relative container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl text-center mx-auto mb-14"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-[#00A211]/10 text-[#00780d] dark:text-[#38d752] px-4 py-1 text-xs font-semibold tracking-wide mb-5">
            <MapPin size={14} /> Our Showroom
          </span>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 dark:from-emerald-300 dark:via-green-300 dark:to-emerald-200 md:whitespace-nowrap">
            Visit Advance Auto Johannesburg South
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
            Your destination for quality vehicles and personal service. Book a test drive, explore financing, or just drop in for a consultation—everything starts at our single flagship location.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
          {/* Info + Highlights */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="xl:col-span-2 space-y-8"
          >
            <div className="rounded-2xl border border-gray-200/70 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Showroom Details</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#00A211] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-[#00A211] flex-shrink-0" />
                  <a href={`tel:${phone.replace(/\s|\+/g, '')}`} className="text-gray-700 dark:text-gray-300 hover:text-[#00A211] transition-colors">{phone}</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#00A211] flex-shrink-0" />
                  <a href={`mailto:${email}`} className="text-gray-700 dark:text-gray-300 hover:text-[#00A211] transition-colors">{email}</a>
                </li>
              </ul>
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Opening Hours</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                  {hours.map(h => (
                    <React.Fragment key={h.label}>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{h.label}</span>
                      <span>{h.value}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,'_blank')}
                  className="flex-1 bg-[#00A211] hover:brightness-110 text-white"
                >
                  Get Directions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = 'tel:' + phone.replace(/\s|\+/g, '')}
                  className="flex-1 border-[#00A211] text-[#00A211] hover:bg-[#00A211] hover:text-white"
                >
                  Call Us
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {highlights.map((h, i) => (
                <motion.div
                  key={h.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 * i }}
                  viewport={{ once: true }}
                  className="rounded-xl border border-gray-200/60 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm p-4 hover:shadow-md transition-shadow"
                >
                  <h.icon className="h-5 w-5 text-[#00A211] mb-2" />
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{h.title}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{h.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Map + Overlay */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="xl:col-span-3"
          >
            <div className="h-[520px] w-full rounded-2xl overflow-hidden ring-1 ring-gray-200/70 dark:ring-slate-700 shadow-md bg-gray-100 dark:bg-slate-800">
              {/* Simple embed without API key: uses public search-based maps embed */}
              <iframe
                title="Advance Auto Johannesburg Map"
                src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDealer;
