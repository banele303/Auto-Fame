"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Users, Share2, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const perks = [
  {
    icon: Users,
    title: 'Invite Friends & Family',
    desc: 'Share your unique referral link or send a quick introduction. No limit on how many people you can refer.'
  },
  {
    icon: Gift,
    title: 'Earn up to R1 000 Per Deal',
    desc: 'Get a cash reward or service credit for every successful financed vehicle purchased through your referral.'
  },
  {
    icon: Share2,
    title: 'Share Easily',
    desc: 'Use WhatsApp, Email, or social media. We track everything for you—simple and transparent.'
  },
  {
    icon: Trophy,
    title: 'Tier Bonuses',
    desc: 'Hit 5, 10, or 20 referrals and unlock boosted payouts & loyalty perks.'
  },
];

export default function ReferralCalloutSection() {
  return (
    <section className="relative py-20 bg-transparent" aria-labelledby="referral-heading">
      <div className="mx-auto px-6 lg:px-10 max-w-6xl">
        <div className="relative rounded-3xl overflow-hidden border border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))] text-white px-8 md:px-12 py-14">
          <div className="absolute inset-0 pointer-events-none opacity-[0.25] mix-blend-overlay">
            <div className="absolute -top-24 -left-12 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="relative grid gap-14 place-items-center">
            {/* Left copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="space-y-6 text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-xs tracking-wide font-semibold uppercase">
              <Share2 size={14} /> Referral Program
            </span>
      <h2 id="referral-heading" className="text-3xl md:text-4xl font-bold leading-tight">
        Earn up to R1 000 for Every Successful Referral
      </h2>
            <p className="text-white/90 text-lg max-w-2xl leading-relaxed mx-auto">
              Love what we do? Turn your network into opportunity. Refer a buyer who completes a financed vehicle purchase and receive a generous reward. There&apos;s no cap—keep earning with every deal.
            </p>
            <p className="text-sm text-white/85 max-w-xl mx-auto">Paid out within 7 days after a qualifying purchase is finalized.</p>
            {/* Action buttons removed per request */}
          </motion.div>
            {/* Right perks grid removed as requested */}
          </div>
        </div>
      </div>
    </section>
  );
}
