"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GalleryImage { src: string; alt: string; category: string; label?: string; }

// Dynamically build gallery from public images that start with IMG-2025
// (Build-time evaluation; Next.js serves /public as root path)
// Derive categories dynamically (excluding duplicates) + counts
const deriveCategories = (imgs: GalleryImage[]) => {
  const counts: Record<string, number> = {};
  imgs.forEach(i => { counts[i.category] = (counts[i.category]||0)+1; });
  const cats = Object.keys(counts).map(k => ({ key: k, label: k.charAt(0).toUpperCase()+k.slice(1), count: counts[k] }));
  cats.sort((a,b)=>a.key.localeCompare(b.key));
  return [{ key: 'all', label: 'All', count: imgs.length }, ...cats];
};

interface GallerySectionProps { compact?: boolean; initialCategory?: string; }

export default function GallerySection({ compact=false, initialCategory='all' }: GallerySectionProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState<'grid'|'masonry'>('masonry');
  const [autoPlay, setAutoPlay] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await fetch('/api/gallery');
        if (res.ok) {
          const data = await res.json();
          // Map DB schema to component's GalleryImage interface
          const mapped = data.map((item: any) => ({
            src: item.url,
            alt: item.title || "Gallery Image",
            category: item.category || "showroom",
            label: item.title
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

  const categoryFiltered = activeCategory === 'all' ? images : images.filter(i => i.category === activeCategory);
  const searched = categoryFiltered.filter(i => i.alt.toLowerCase().includes(search.toLowerCase()) || (i.label||'').toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(searched.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const filtered = searched.slice(start, start + pageSize);

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

  // Lightbox autoplay & keyboard
  useEffect(()=>{
    if (lightboxIndex === null || !autoPlay) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(()=>{ showNext(); }, 4000);
    return ()=>{ if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [lightboxIndex, autoPlay, filtered.length]);

  useEffect(()=>{
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') showNext();
      else if (e.key === 'ArrowLeft') showPrev();
    };
    window.addEventListener('keydown', handler);
    return ()=>window.removeEventListener('keydown', handler);
  }, [lightboxIndex, filtered.length]);

  return (
    <section className={cn("relative", compact ? 'py-10' : 'py-20 md:py-28', 'bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900')} id="gallery">
      <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]" />
      <div className="container mx-auto px-4 relative">
        <div className={cn("flex flex-col gap-6 mb-10", compact ? 'md:flex-col md:items-start' : 'md:flex-row md:items-end md:justify-between')}>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3 flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary))]/30 ring-4 ring-[hsl(var(--primary))]/30">
                <ImageIcon className="h-6 w-6" />
              </span>
              Gallery
            </h2>
            {!compact && <p className="text-gray-600 dark:text-slate-400 max-w-2xl"></p>}
          </div>
          {!compact && (
            <div className="flex w-full flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex flex-wrap gap-2 flex-1">
                {categories.map(cat => (
                  <Button
                    key={cat.key}
                    size="sm"
                    variant={activeCategory === cat.key ? 'default' : 'outline'}
                    onClick={() => setActiveCategory(cat.key)}
                    className={cn(
                      'rounded-full px-4 text-xs font-medium transition-all',
                      activeCategory === cat.key
                        ? 'bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white shadow shadow-[hsl(var(--primary))]/40'
                        : 'bg-white/70 dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-700 hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] dark:hover:text-[hsl(var(--primary))]'
                    )}
                  >{cat.label}<span className="ml-1 text-[10px] opacity-70">{cat.count}</span></Button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search" className="h-9 rounded-full border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
                <Button variant="outline" size="sm" onClick={()=>setLayout(l=>l==='grid'?'masonry':'grid')} className="rounded-full">{layout==='grid'?'Masonry':'Grid'}</Button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
          </div>
        ) : (
          <motion.div layout className={cn(layout==='masonry' ? 'columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:balance]' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4') }>
          <AnimatePresence>
            {filtered.map((img, i) => (
              <motion.div
                key={img.src}
                layout
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4 }}
                className={cn('group relative mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-200/60 dark:ring-slate-700/60 hover:shadow-xl bg-white dark:bg-slate-800/70 backdrop-blur', layout==='grid' && 'mb-0')}
                onClick={() => openLightbox(i)}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width:768px) 50vw, (max-width:1200px) 25vw, 300px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    priority={i < 4}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Year label removed per request */}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 mt-12">No images match your filter.</p>
        )}
        {searched.length > pageSize && (
          <div className="flex justify-center items-center gap-4 mt-10">
            <Button size="sm" variant="outline" disabled={safePage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
            <span className="text-xs text-slate-600 dark:text-slate-400">Page {safePage} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={safePage===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[120] bg-black/95 flex flex-col items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <div className="absolute top-3 left-4 text-xs text-white/60 tracking-wide">{lightboxIndex+1} / {filtered.length}</div>
            <div className="absolute top-3 right-4 flex items-center gap-2">
              <button onClick={(e)=>{e.stopPropagation(); setAutoPlay(a=>!a);}} className="text-white/80 hover:text-white text-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur transition">{autoPlay? 'Pause' : 'Play'}</button>
              <button onClick={(e)=>{e.stopPropagation(); closeLightbox();}} className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition"><X className="h-5 w-5" /></button>
            </div>
            <button onClick={showPrev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition"><ChevronLeft className="h-7 w-7" /></button>
            <button onClick={showNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition"><ChevronRight className="h-7 w-7" /></button>
            <div className="relative w-full max-w-5xl aspect-video" onClick={e=>e.stopPropagation()}>
              <Image src={filtered[lightboxIndex].src} alt={filtered[lightboxIndex].alt} fill sizes="100vw" className="object-contain" priority />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
