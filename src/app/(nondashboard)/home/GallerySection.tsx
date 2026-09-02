"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ImageIcon, Loader2, ArrowRight, Maximize2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GalleryImage {
  src: string;
  alt: string;
  category: string;
  label?: string;
}

const deriveCategories = (imgs: GalleryImage[]) => {
  const counts: Record<string, number> = {};
  imgs.forEach(i => {
    const cat = i.category || 'showroom';
    counts[cat] = (counts[cat] || 0) + 1;
  });
  const cats = Object.keys(counts).map(k => ({
    key: k,
    label: k.charAt(0).toUpperCase() + k.slice(1),
    count: counts[k]
  }));
  cats.sort((a, b) => a.key.localeCompare(b.key));
  return [{ key: 'all', label: 'All Photos', count: imgs.length }, ...cats];
};

interface GallerySectionProps {
  compact?: boolean;
  initialCategory?: string;
}

export default function GallerySection({ compact = false, initialCategory = 'all' }: GallerySectionProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState<'grid' | 'masonry'>('masonry');
  const [autoPlay, setAutoPlay] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = compact ? 8 : 24;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await fetch('/api/gallery');
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((item: any) => ({
            src: item.url,
            alt: item.title || "Auto Fame Gallery Image",
            category: item.category || "showroom",
            label: item.title || "Auto Fame Vehicle"
          }));
          setImages(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch gallery:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  const categories = deriveCategories(images);

  const categoryFiltered = activeCategory === 'all'
    ? images
    : images.filter(i => (i.category || 'showroom').toLowerCase() === activeCategory.toLowerCase());

  const searched = categoryFiltered.filter(i =>
    i.alt.toLowerCase().includes(search.toLowerCase()) ||
    (i.label || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(searched.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const filtered = compact ? searched.slice(0, 8) : searched.slice(start, start + pageSize);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };
  const closeLightbox = () => setLightboxIndex(null);

  const showPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxIndex(prev => (prev === null ? null : (prev - 1 + filtered.length) % filtered.length));
  };
  const showNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLightboxIndex(prev => (prev === null ? null : (prev + 1) % filtered.length));
  };

  useEffect(() => {
    if (lightboxIndex === null || !autoPlay) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => { showNext(); }, 4500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [lightboxIndex, autoPlay, filtered.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') showNext();
      else if (e.key === 'ArrowLeft') showPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, filtered.length]);

  return (
    <section className={cn(
      "relative overflow-hidden",
      compact ? 'py-16 md:py-24' : 'py-16 md:py-24',
      'bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900'
    )} id="gallery">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A211]/10 text-[#00A211] dark:text-[#3cd64f] text-xs font-semibold uppercase tracking-wider mb-3">
              <ImageIcon className="h-3.5 w-3.5" />
              Showroom & Lot Gallery
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              {compact ? "Explore Our Dealership & Stock" : "Vehicle & Showroom Photo Gallery"}
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mt-2 text-base leading-relaxed">
              Take a visual tour of Auto Fame Johannesburg South — featuring our main display canopy, commercial bakkies, quality used inventory, and showroom floor.
            </p>
          </div>

          {/* Controls & Filter Pills */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 5).map(cat => (
                <Button
                  key={cat.key}
                  size="sm"
                  variant={activeCategory === cat.key ? 'default' : 'outline'}
                  onClick={() => { setActiveCategory(cat.key); setPage(1); }}
                  className={cn(
                    'rounded-full px-4 text-xs font-medium transition-all',
                    activeCategory === cat.key
                      ? 'bg-[#00A211] hover:bg-[#00860e] text-white shadow shadow-[#00A211]/30'
                      : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#00A211] hover:text-[#00A211]'
                  )}
                >
                  {cat.label}
                  <span className="ml-1 text-[10px] opacity-70">({cat.count})</span>
                </Button>
              ))}
            </div>

            {!compact && (
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search gallery..."
                    className="h-9 rounded-full border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 pl-8 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A211]"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLayout(l => l === 'grid' ? 'masonry' : 'grid')}
                  className="rounded-full text-xs"
                >
                  {layout === 'grid' ? 'Masonry' : 'Grid'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#00A211]" />
          </div>
        ) : (
          /* Gallery Grid */
          <motion.div
            layout
            className={cn(
              layout === 'masonry'
                ? 'columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:balance]'
                : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            )}
          >
            <AnimatePresence>
              {filtered.map((img, i) => (
                <motion.div
                  key={img.src + i}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.35, delay: (i % 4) * 0.05 }}
                  className={cn(
                    'group relative mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800 hover:shadow-2xl transition-all duration-300 bg-slate-900',
                    layout === 'grid' && 'mb-0 aspect-[4/3]'
                  )}
                  onClick={() => openLightbox(i)}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      priority={i < 4}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <span className="text-[10px] font-semibold tracking-wider text-[#3cd64f] uppercase mb-1">
                        {img.category}
                      </span>
                      <h3 className="text-white text-sm font-semibold truncate leading-snug">
                        {img.label || img.alt}
                      </h3>
                      <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <ImageIcon className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No gallery images found in this category.</p>
          </div>
        )}

        {/* Homepage Preview Footer CTA */}
        {compact && (
          <div className="mt-12 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/gallery">
              <Button size="lg" className="bg-[#00A211] hover:bg-[#00860e] text-white px-8 rounded-full shadow-lg shadow-[#00A211]/25">
                View Full Gallery ({images.length}+ Photos)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Full Gallery Page Pagination */}
        {!compact && searched.length > pageSize && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <Button
              size="sm"
              variant="outline"
              disabled={safePage === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="rounded-full px-5"
            >
              Previous
            </Button>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Page {safePage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={safePage === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="rounded-full px-5"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            {/* Top Toolbar */}
            <div className="w-full max-w-6xl flex items-center justify-between z-10 text-white">
              <div className="text-xs font-mono text-white/70">
                {lightboxIndex + 1} / {filtered.length}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setAutoPlay(a => !a); }}
                  className="text-white/80 hover:text-white text-xs px-3 py-1.5 rounded-full bg-white/10 backdrop-blur transition border border-white/10"
                >
                  {autoPlay ? 'Pause Slideshow' : 'Play Slideshow'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                  aria-label="Close Lightbox"
                  className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={showPrev}
              aria-label="Previous Image"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-black/40 hover:bg-white/20 backdrop-blur transition z-10"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              onClick={showNext}
              aria-label="Next Image"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-black/40 hover:bg-white/20 backdrop-blur transition z-10"
            >
              <ChevronRight className="h-8 w-8" />
            </button>

            {/* Main Lightbox Image */}
            <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center py-4" onClick={e => e.stopPropagation()}>
              <div className="relative w-full h-full max-h-[75vh]">
                <Image
                  src={filtered[lightboxIndex].src}
                  alt={filtered[lightboxIndex].alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Image Details Caption Footer */}
            <div className="w-full max-w-xl text-center z-10 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10" onClick={e => e.stopPropagation()}>
              <h4 className="text-white text-sm font-medium truncate">
                {filtered[lightboxIndex].label || filtered[lightboxIndex].alt}
              </h4>
              <p className="text-[11px] text-[#3cd64f] uppercase tracking-wider font-semibold">
                Auto Fame {filtered[lightboxIndex].category}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
