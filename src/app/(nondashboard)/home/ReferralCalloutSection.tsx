"use client";

import React from "react";
import { motion } from "framer-motion";
import { Gift, Share2, Sparkles, Clock, ArrowRight, ShieldCheck, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReferralCalloutSection() {
  const handleWhatsAppReferral = () => {
    const message = encodeURIComponent(
      "Hi AutoFame! I have a referral for a financed vehicle purchase. Please assist me with submitting the referral details."
    );
    window.open(`https://wa.me/27612259884?text=${message}`, "_blank");
  };

  return (
    <section className="relative py-20 bg-[#070A08] text-white overflow-hidden" aria-labelledby="referral-heading">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Luxury Non-Green Dark Amber & Gold Container */}
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/20 bg-gradient-to-br from-[#0F141C] via-[#0A0D14] to-[#121824] p-8 sm:p-12 shadow-2xl">
          {/* Subtle Ambient Lighting */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            {/* Minimal Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider mb-6"
            >
              <Gift className="h-3.5 w-3.5" />
              Referral Program
            </motion.div>

            {/* Headline */}
            <motion.h2
              id="referral-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-tight mb-6"
            >
              Earn up to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200">R1 000</span> for Every Successful Referral
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-white/80 text-base sm:text-lg font-light leading-relaxed mb-6"
            >
              Love what we do? Turn your network into opportunity. Refer a buyer who completes a financed vehicle purchase and receive a generous reward. There&apos;s no cap—keep earning with every deal.
            </motion.p>

            {/* Payout Guarantee Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-amber-300 mb-8"
            >
              <Clock className="h-4 w-4 text-amber-400" />
              Paid out within 7 days after a qualifying purchase is finalized.
            </motion.div>

            {/* Call to Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <Button
                onClick={handleWhatsAppReferral}
                className="h-13 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 group"
              >
                Submit A Referral Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
