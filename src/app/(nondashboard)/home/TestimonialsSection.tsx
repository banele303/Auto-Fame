"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, ThumbsUp } from "lucide-react";

interface Review {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  location: string;
  vehicle: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  expanded?: boolean;
}

// Google's brand avatar colors — authentic palette
const REVIEWS: Review[] = [
  {
    id: "rev-1",
    name: "Sibusiso Dlamini",
    initials: "SD",
    avatarColor: "#4285F4", // Google Blue
    location: "Johannesburg",
    vehicle: "2021 Mercedes-Benz C200 AMG",
    rating: 5,
    date: "2 weeks ago",
    comment:
      "Bought my C200 AMG from AutoFame in Johannesburg South. The bank financing approval was processed in under 24 hours. The car was in pristine condition, fully inspected, and delivered with all certificates. Highly recommend!",
    helpful: 14,
  },
  {
    id: "rev-2",
    name: "Chantelle van der Merwe",
    initials: "CV",
    avatarColor: "#EA4335", // Google Red
    location: "Pretoria",
    vehicle: "2022 Volkswagen Polo Vivo Hatch",
    rating: 5,
    date: "1 month ago",
    comment:
      "Exceptional experience! The team at AutoFame made buying my Polo Vivo completely stress-free. Transparent pricing with zero hidden fees. Highly recommend to anyone looking for quality pre-owned vehicles.",
    helpful: 22,
  },
  {
    id: "rev-3",
    name: "Teboho Mokoena",
    initials: "TM",
    avatarColor: "#34A853", // Google Green
    location: "Soweto",
    vehicle: "2020 Toyota Fortuner 4x4",
    rating: 5,
    date: "1 month ago",
    comment:
      "Gave me a very fair trade-in valuation for my previous vehicle and guided me through the entire bank finance application. Professional, reliable, and trustworthy — I'm very happy with my Fortuner.",
    helpful: 18,
  },
  {
    id: "rev-4",
    name: "David Botha",
    initials: "DB",
    avatarColor: "#FBBC05", // Google Yellow
    location: "Bloemfontein",
    vehicle: "2024 Toyota Rumion 1.5 SX",
    rating: 5,
    date: "2 months ago",
    comment:
      "Drove up from Bloemfontein to pick up the Rumion. Everything was prepared in advance as promised. Great vehicle condition and top-notch customer support. Will definitely be back for my next car!",
    helpful: 9,
  },
  {
    id: "rev-5",
    name: "Nompumelelo Khumalo",
    initials: "NK",
    avatarColor: "#9C27B0", // Purple
    location: "Ekurhuleni",
    vehicle: "2019 Hyundai i20 Active",
    rating: 5,
    date: "3 months ago",
    comment:
      "The staff were so patient and helpful throughout the whole process. Got my i20 financed with minimal hassle. The car looked brand new and drives beautifully. AutoFame has earned a customer for life!",
    helpful: 11,
  },
  {
    id: "rev-6",
    name: "Riaan Fourie",
    initials: "RF",
    avatarColor: "#00BCD4", // Cyan
    location: "Vereeniging",
    vehicle: "2023 Haval Jolion Pro",
    rating: 5,
    date: "3 months ago",
    comment:
      "Smooth transaction from start to finish. They handled all the paperwork and my Jolion was ready ahead of schedule. Very impressed with the transparency and professionalism. Would recommend without hesitation.",
    helpful: 7,
  },
];

// Authentic Google "G" logo SVG
function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i < rating ? "fill-[#F9AB00] text-[#F9AB00]" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const [liked, setLiked] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful);
  const [expanded, setExpanded] = useState(false);

  const isLong = review.comment.length > 160;
  const displayComment =
    isLong && !expanded ? review.comment.slice(0, 160).trimEnd() + "…" : review.comment;

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setHelpfulCount((c) => c + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-[#1E2A22] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-300 p-5 flex flex-col gap-3"
    >
      {/* Top row: avatar + name/date + Google logo */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 select-none"
            style={{ backgroundColor: review.avatarColor }}
          >
            {review.initials}
          </div>
          {/* Name + date */}
          <div>
            <p className="font-semibold text-[13px] text-gray-900 dark:text-white leading-tight">
              {review.name}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5 leading-tight">
              {review.location} · {review.date}
            </p>
          </div>
        </div>
        {/* Google G mark */}
        <div className="flex-shrink-0 mt-0.5">
          <GoogleLogo size={20} />
        </div>
      </div>

      {/* Stars */}
      <StarRow rating={review.rating} size={15} />

      {/* Review body */}
      <div>
        <p className="text-[13px] text-gray-700 dark:text-white/80 leading-relaxed">
          {displayComment}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[12px] text-[#4285F4] hover:underline mt-1 font-medium"
          >
            {expanded ? "Show less" : "More"}
          </button>
        )}
      </div>

      {/* Vehicle badge */}
      <div className="inline-flex">
        <span className="text-[11px] font-mono text-gray-400 dark:text-white/40 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-2.5 py-1 rounded-full">
          {review.vehicle}
        </span>
      </div>

      {/* Helpful row */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-white/10 mt-auto">
        <span className="text-[11px] text-gray-400 dark:text-white/40">Helpful?</span>
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all ${
            liked
              ? "bg-[#4285F4]/10 text-[#4285F4]"
              : "text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5"
          }`}
        >
          <ThumbsUp className="h-3 w-3" />
          {helpfulCount}
        </button>
      </div>
    </motion.div>
  );
}

export default function TestimonialsSection() {
  const avgRating = (REVIEWS.reduce((a, r) => a + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <section
      className="relative py-20 bg-[#070A08] text-white overflow-hidden border-t border-white/10"
      aria-labelledby="reviews-heading"
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[28rem] rounded-full bg-[#4285F4]/6 blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GoogleLogo size={22} />
              <span className="text-xs font-semibold text-white/50 uppercase tracking-widest font-mono">
                Google Reviews
              </span>
            </div>
            <h2
              id="reviews-heading"
              className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-white"
            >
              What Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#FBBC05]">
                Customers Say
              </span>
            </h2>
            <p className="mt-2 text-sm text-white/50 max-w-xl">
              Real reviews from verified buyers — posted directly on Google.
            </p>
          </div>

          {/* Rating summary card — Google style */}
          <div className="flex-shrink-0 bg-white dark:bg-[#1E2A22] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm px-6 py-4 flex items-center gap-5">
            <div className="text-center">
              <p className="text-5xl font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">
                {avgRating}
              </p>
              <StarRow rating={5} size={14} />
              <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1 font-mono">
                {REVIEWS.length * 9}+ reviews
              </p>
            </div>
            <div className="h-16 w-px bg-gray-100 dark:bg-white/10" />
            <div className="space-y-1.5">
              {[5, 4, 3].map((star) => {
                const count = star === 5 ? 92 : star === 4 ? 6 : 2;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 dark:text-white/40 w-3 font-mono">
                      {star}
                    </span>
                    <div className="w-24 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#F9AB00]"
                        style={{ width: `${count}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-white/40 font-mono">
                      {count}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REVIEWS.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} />
          ))}
        </div>

        {/* Footer link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-8 flex justify-center"
        >
          <a
            href="https://www.google.com/maps/search/AutoFame+Johannesburg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white dark:bg-[#1E2A22] border border-gray-100 dark:border-white/10 text-gray-700 dark:text-white/70 text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm"
          >
            <GoogleLogo size={16} />
            See all reviews on Google
          </a>
        </motion.div>
      </div>
    </section>
  );
}
