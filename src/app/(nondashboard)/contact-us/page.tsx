"use client";

import React, { useState } from "react";
import FAQShared from "@/components/FAQShared";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import InquiryForm from '@/components/inquiry/InquiryForm';
import { motion } from "framer-motion";
// FooterSection import removed (using global/site footer only)

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    
    
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      
      <section className="relative h-[52vh] md:h-[58vh] lg:h-[60vh] overflow-hidden" aria-labelledby="contact-hero-heading">
        {/* Background image reused from About Us for brand consistency */}
        <Image
          src="/about-image.jpeg"
          alt="Advance Auto showroom background"
          fill
          className="object-cover object-center scale-105" 
          priority
          sizes="100vw"
        />
        {/* Layered gradients & subtle radial glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/60" />
        <div className="absolute inset-0 opacity-[0.18] bg-[radial-gradient(circle_at_30%_35%,hsl(var(--primary))_0%,transparent_60%)]" />
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20 bg-[linear-gradient(115deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0)_40%)]" />
        {/* Animated foreground content */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative max-w-3xl w-full"
          >
            <div className="relative rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl px-6 py-10 md:px-10 md:py-14 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.45)] overflow-hidden">
              {/* Accent ring / glow */}
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
                Contact <span className="text-[hsl(var(--primary))]">Advance Auto</span>
              </motion.h1>
              <motion.p
                className="relative mt-5 text-center text-base md:text-lg text-white/85 leading-relaxed max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                Questions about vehicles, financing, trade-ins or documentation? Our team is ready to help you move forward with confidence.
              </motion.p>
              <motion.div
                className="relative mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-medium"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
              >
                {['Fast Response','Transparent Advice','Nationwide Clients'].map(tag => (
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
          
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8">Contact Information</h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 text-lg">Phone</h3>
                  <p className="text-slate-600 mt-1">+27 68 072 0424</p> 
                  <p className="text-slate-600">Mon - Fri 08:00–17:00 | Sat 08:00–14:00</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 text-lg">Email</h3>
                  <p className="text-slate-600 mt-1">info@advanceauto.co.za</p> 
                  <p className="text-slate-600">We&apos;ll respond as soon as possible</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800 text-lg">Our Location</h3>
                  <p className="text-slate-600 mt-1">2A Amanda Ave, Gleneagles</p>
                  <p className="text-slate-600">Johannesburg South, 2091, South Africa</p>
                  <a
                    href="https://www.google.com/maps/dir//2A+Amanda+Ave,+Gleneagles,+Johannesburg+South,+2091" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    aria-label="Get directions to our only dealership location"
                  >
                    Get Directions
                  </a>
                </div>
              </div>
            </div>
            
            
            <div className="h-[300px] rounded-xl overflow-hidden shadow-md mt-8 relative group">
              <iframe
                title="Advance Auto Dealership Location Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3579.502550063525!2d28.00395!3d-26.29845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1ef6f7f5c9c2b5b1%3A0x0000000000000000!2s2A%20Amanda%20Ave%2C%20Gleneagles%2C%20Johannesburg%20South%2C%202091%2C%20South%20Africa!5e0!3m2!1sen!2sza!4v1724544000000!5m2!1sen!2sza"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-tr from-blue-600/10 to-transparent" />
            </div>
          </div>
          
          
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8">Send Us a Message</h2>
            
            <InquiryForm className="mt-2" />
          </div>
        </div>
      </section>

      
      <div className="bg-slate-50">
  <FAQShared />
      </div>
      
  {/* Global footer rendered elsewhere; removed duplicate footer */}
    </div>
  );
}