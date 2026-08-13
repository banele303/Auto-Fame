"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

interface CarItem {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  photoUrls: string[];
  featured?: boolean;
  postedDate?: string;
}

// Simple horizontal scroller that auto-slides and allows drag / wheel scroll
const NewArrivalsSlider: React.FC = () => {
  const [cars, setCars] = useState<CarItem[]>([]);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const res = await fetch('/api/cars?limit=12&order=desc');
        if (res.ok) {
          const data = await res.json();
          // Sort newest first by postedDate if present
          const sorted = [...data]
            .sort((a, b) => new Date(b.postedDate || 0).getTime() - new Date(a.postedDate || 0).getTime())
            .slice(0, 12);
          setCars(sorted);
        }
      } catch (e) {
        console.error('Failed to load new arrivals', e);
      }
    };
    fetchCars();
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (cars.length === 0) return;
    const container = document.getElementById('new-arrivals-track');
    if (!container) return;

    let frame: number;
    const speed = 0.5; // px per frame
    const step = () => {
      if (!isHovering) {
        container.scrollLeft += speed;
        // loop effect
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 1) {
          container.scrollLeft = 0;
        }
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [cars, isHovering]);

  if (cars.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">New Arrivals</h3>
  <Link href="/Showroom" className="text-sm text-[#00A211] hover:brightness-110">View all</Link>
      </div>
      <div
        id="new-arrivals-track"
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {cars.map(car => (
          <motion.div
            key={car.id}
            whileHover={{ y: -4 }}
            className="min-w-[160px] max-w-[160px] snap-start bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 flex-shrink-0"
          >
            <Link href={`/cars/${car.id}`} className="block">
              <div className="relative h-28 w-full overflow-hidden rounded-t-lg">
                <Image
                  src={car.photoUrls?.[0] || '/placeholder.jpg'}
                  alt={`${car.make} ${car.model}`}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              <div className="p-2 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-[#00A211] font-medium">{car.year}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-1">{car.make} {car.model}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">R {car.price.toLocaleString()}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NewArrivalsSlider;
