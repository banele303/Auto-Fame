"use client";
import React from "react";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingWhatsAppProps {
  phone?: string; // in international format without + (e.g. 27721234567)
  message?: string;
}

const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  phone = "27680720424",
  message = "Hi! I'm interested in one of your vehicles.",
}) => {
  const encoded = encodeURIComponent(message);
  const href = `https://wa.me/${phone}?text=${encoded}`;

  return (
    <div className="fixed z-[120] bottom-5 right-5 flex flex-col gap-3 items-end">
      {/* Call button */}
      <a
        href={`tel:+${phone}`}
        aria-label="Call us"
  className="group flex items-center gap-3 rounded-full shadow-md shadow-[#00A211]/30 bg-white/90 dark:bg-[#00A211]/10 backdrop-blur px-4 h-12 border border-[#00A211]/30 dark:border-[#00A211]/40 hover:bg-white dark:hover:bg-[#00A211]/20 transition-colors text-[#00A211] dark:text-[#00A211]"
      >
  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00A211] text-white group-hover:scale-105 transition-transform">
          <Phone className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-wide pr-1">Call</span>
      </a>

      {/* WhatsApp button */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className={cn(
          "group flex items-center gap-3 rounded-full shadow-lg shadow-[#00A211]/40",
          "bg-[#00A211] hover:brightness-110 text-white pl-4 pr-5 h-14 transition-colors"
        )}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full group-hover:scale-105 transition-transform">
          <svg viewBox="0 0 32 32" className="h-10 w-10" aria-hidden="true" focusable="false">
            <path fill="#25D366" d="M16 0c8.8 0 16 7.18 16 16 0 2.84-.74 5.5-2.05 7.8L32 32l-8.63-2.24A15.93 15.93 0 0 1 16 32C7.18 32 0 24.82 0 16S7.18 0 16 0Z"/>
            <path fill="#FFF" d="M25.04 22.47c-.37 1-1.82 1.86-2.55 1.97-.65.1-1.48.15-2.38-.15-.55-.18-1.25-.41-2.17-.82-3.82-1.65-6.32-5.47-6.52-5.75-.2-.28-1.56-2.07-1.56-3.94 0-1.87.99-2.8 1.34-3.18.35-.38.76-.47 1-.47.25 0 .51.003.73.014.23.01.56-.09.88.69.33.78 1.07 2.62 1.16 2.81.09.19.15.41.03.66-.12.25-.19.41-.38.62-.19.21-.4.47-.16.92.22.44 1 1.63 2.14 2.64 1.48 1.3 2.7 1.71 3.08 1.9.37.18.6.15.83-.09.22-.24.94-1.09 1.2-1.47.25-.38.5-.31.85-.19.35.12 2.21 1.04 2.58 1.22.38.19.64.28.74.44.1.17.09.91-.16 1.91Z"/>
          </svg>
        </span>
        <span className="text-sm font-semibold tracking-wide pr-1">WhatsApp</span>
      </a>
    </div>
  );
};

export default FloatingWhatsApp;
