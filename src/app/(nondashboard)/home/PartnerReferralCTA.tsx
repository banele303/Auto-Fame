"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Handshake, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';

// CTA aimed at mechanics / spotters / independent dealers who funnel leads.
export default function PartnerReferralCTA() {
  const perks = [
    { icon: Wrench, title: 'Mechanics', desc: 'Earn when your service customers buy through us.' },
    { icon: Users, title: 'Car Spotters', desc: 'Get rewarded for verified buyer or vehicle leads.' },
    { icon: Handshake, title: 'Small Dealers', desc: 'Move excess stock faster via our buyer pipeline.' },
    { icon: DollarSign, title: 'Tier Bonuses', desc: 'Scale payouts as your monthly conversions grow.' }
  ];
  return (
    <section className="py-20 bg-white dark:bg-gray-950" aria-labelledby="partner-referral-heading">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--primary))]/25 bg-[hsl(var(--primary))]/5 dark:bg-[hsl(var(--primary))]/10 p-10 md:p-14">
          <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)),transparent_60%)]" />
          <div className="relative flex flex-col lg:flex-row gap-14">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex-1 space-y-6"
            >
              <span className="inline-block text-xs font-semibold tracking-wide uppercase bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] px-4 py-1.5 rounded-full">Partner Referrals</span>
              <h2 id="partner-referral-heading" className="text-3xl md:text-4xl font-bold leading-tight text-gray-900 dark:text-white">
                Power our inventory growth & earn recurring payouts
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
                Are you a mechanic, detailer, spotter, or small trader constantly around quality vehicles or serious buyers? Become an Advance Auto Partner. Refer qualified buyers or available vehicles—when a financed purchase completes, you get paid. No caps. Higher volume unlocks boosted brackets.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-[hsl(var(--primary))]" /> Payouts within 7 days of cleared financed deals.</li>
                <li className="flex gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-[hsl(var(--primary))]" /> Track referrals & status transparently (portal coming soon).</li>
                <li className="flex gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-[hsl(var(--primary))]" /> Supply cars or just leads—both models welcome.</li>
              </ul>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/contact-us" className="inline-flex items-center gap-2 bg-[hsl(var(--primary))] text-white font-semibold px-6 py-3 rounded-full shadow hover:bg-[hsl(var(--primary))]/90 transition-colors">
                  Join As Partner
                </Link>
                <Link href="/financing" className="inline-flex items-center gap-2 border border-[hsl(var(--primary))]/40 px-6 py-3 rounded-full font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 transition-colors">
                  View Financing
                </Link>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">* Commission amounts vary by vehicle category & finance structure. Terms apply.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-2 gap-5 flex-1"
            >
              {perks.map((p,i)=>(
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.05 * i }}
                  className="rounded-2xl bg-white dark:bg-gray-900 border border-[hsl(var(--primary))]/20 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] mb-4">
                    <p.icon size={22} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 text-gray-900 dark:text-white">{p.title}</h3>
                  <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">{p.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}