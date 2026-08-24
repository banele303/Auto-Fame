"use client";

import React from "react";
import FAQShared from "@/components/FAQShared";
import Image from "next/image";
import { Phone, Mail, MapPin, Clock, Navigation } from "lucide-react";
import InquiryForm from '@/components/inquiry/InquiryForm';
import { motion } from "framer-motion";
import { siteConfig } from "@/lib/siteConfig";

export default function ContactUsClient() {
  return (
    <div className="min-h-screen">
      <section className="relative h-[52vh] md:h-[58vh] lg:h-[60vh] overflow-hidden" aria-labelledby="contact-hero-heading">
        <Image
          src="/about-image.jpeg"
          alt="AutoFame Car Dealership Showroom Johannesburg South"
          fill
          className="object-cover object-center scale-105" 
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/60" />
        <div className="absolute inset-0 opacity-[0.18] bg-[radial-gradient(circle_at_30%_35%,hsl(var(--primary))_0%,transparent_60%)]" />
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20 bg-[linear-gradient(115deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0)_40%)]" />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative max-w-3xl w-full"
          >
            <div className="relative rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl px-6 py-10 md:px-10 md:py-14 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.45)] overflow-hidden">
              <div className="absolute -inset-px rounded-3xl ring-1 ring-white/15" />
              <div className="absolute -top-16 -right-10 w-72 h-72 bg-[hsl(var(--primary))]/30 blur-3xl rounded-full opacity-30" />
              <div className="absolute -bottom-24 -left-16 w-96 h-96 bg-blue-500/25 blur-3xl rounded-full opacity-25" />
              <motion.h1
                id="contact-hero-heading"
                className="relative text-center text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-[linear-gradient(90deg,#fff,rgba(255,255,255,0.7))] drop-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7 }}
              >
                Contact <span className="text-[hsl(var(--primary))]">AutoFame</span>
              </motion.h1>
              <motion.p
                className="relative mt-5 text-center text-base md:text-lg text-white/85 leading-relaxed max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                Looking for pre-owned cars, vehicle financing, or trade-in appraisals in Johannesburg South? Visit our showroom or get in touch today.
              </motion.p>
              <motion.div
                className="relative mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-medium"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
              >
                {['Johannesburg South', 'Baragwanath & Soweto', 'Same-Day Financing', 'Free Trade-In Appraisal'].map(tag => (
                  <motion.span
                    key={tag}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                    className="px-3 py-1 rounded-full bg-white/10 text-white/90 backdrop-blur-sm border border-white/15"
                  >
                    {tag}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 md:p-10 border border-gray-100 dark:border-gray-800">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2">Dealership Location & Info</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-8">Serving Johannesburg South, Baragwanath, Soweto, Glenvista, and the greater Gauteng region.</p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 dark:bg-emerald-950 p-3 rounded-full shrink-0">
                  <MapPin className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">Physical Showroom Address</h3>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 font-medium">{siteConfig.location.streetAddress}, {siteConfig.location.suburb}</p>
                  <p className="text-slate-600 dark:text-slate-300">{siteConfig.location.city}, {siteConfig.location.state} {siteConfig.location.postalCode}, {siteConfig.location.country}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <strong className="text-slate-700 dark:text-slate-200">Landmarks: </strong>
                    {siteConfig.location.directionsHint}
                  </p>
                  <a
                    href={siteConfig.location.addressLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
                    aria-label="Get directions to AutoFame dealership on Google Maps"
                  >
                    <Navigation className="w-4 h-4" /> Get Google Maps Directions
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-950 p-3 rounded-full shrink-0">
                  <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">Phone & WhatsApp</h3>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">
                    <a href={`tel:${siteConfig.contact.phoneRaw}`} className="hover:text-blue-600 font-medium">
                      {siteConfig.contact.phoneDisplay}
                    </a>
                  </p> 
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    WhatsApp: <a href={`https://wa.me/${siteConfig.contact.whatsappNumberRaw}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">{siteConfig.contact.phoneDisplay}</a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 dark:bg-purple-950 p-3 rounded-full shrink-0">
                  <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">Email Inquiries</h3>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">
                    <a href={`mailto:${siteConfig.contact.emailGeneral}`} className="hover:text-purple-600 font-medium">
                      {siteConfig.contact.emailGeneral}
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-amber-100 dark:bg-amber-950 p-3 rounded-full shrink-0">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">Operating Hours</h3>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm">
                    Monday – Friday: {siteConfig.hours.weekday}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Saturday: {siteConfig.hours.saturday}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Sunday & Public Holidays: {siteConfig.hours.sunday}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="h-[280px] rounded-xl overflow-hidden shadow-md mt-8 relative group border border-slate-200 dark:border-slate-800">
              <iframe
                title="AutoFame Dealership 1 Rifle Range Rd Baragwanath Location Map"
                src="https://maps.google.com/maps?q=1+Rifle+Range+Rd,+Baragwanath,+Johannesburg+South,+2091&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 md:p-10 border border-gray-100 dark:border-gray-800">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2">Send Us an Inquiry</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">Our sales and finance specialists will get back to you promptly.</p>
            
            <InquiryForm className="mt-2" />
          </div>
        </div>
      </section>

      <div className="bg-slate-50 dark:bg-slate-900">
        <FAQShared />
      </div>
    </div>
  );
}
