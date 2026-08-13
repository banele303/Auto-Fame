"use client";
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Replaced bespoke testimonials with live Google Reviews via Elfsight
// Widget ID: 16506b08-12f0-468e-8e8f-03fd64dbab30

const ELFSIGHT_SRC = "https://elfsightcdn.com/platform.js";
const WIDGET_CLASS = "elfsight-app-16506b08-12f0-468e-8e8f-03fd64dbab30";

const TestimonialsSection: React.FC = () => {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return; // guard
    mountedRef.current = true;

    // Inject Elfsight script once (idempotent)
    if (!document.querySelector(`script[src="${ELFSIGHT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = ELFSIGHT_SRC;
      script.async = true;
      document.body.appendChild(script);
    } else {
      // If script already present, try to force reinit after a tick
      setTimeout(() => {
        // @ts-ignore - Elfsight may define global object
        if (window.ELFSIGHT_APP) {
          // @ts-ignore
          window.ELFSIGHT_APP.initialized = false;
          // @ts-ignore
          window.ElfsightApp && window.ElfsightApp.init();
        }
      }, 500);
    }
  }, []);

  return (
    <section className="py-16 bg-white dark:bg-gray-900" aria-labelledby="google-reviews-heading">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          {/* Heading removed per request; keep an accessible label off-screen */}
          <h2 id="google-reviews-heading" className="sr-only">Customer Reviews</h2>
        </motion.div>

        {/* Elfsight Google Reviews Widget */}
        <div className="relative">
          <div
            className={`${WIDGET_CLASS}`}
            data-elfsight-app-lazy
            aria-label="Google Reviews Widget"
          />
          {/* Lightweight skeleton while widget loads */}
          <div className="animate-pulse absolute inset-0 flex flex-col gap-4 p-4 pointer-events-none" id="reviews-skeleton">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <script
          // Small script to remove skeleton once widget container populated by Elfsight
          dangerouslySetInnerHTML={{
            __html: `setInterval(()=>{var w=document.querySelector('.${WIDGET_CLASS}');if(w&&w.children.length>0){var sk=document.getElementById('reviews-skeleton');if(sk) sk.remove();}},600);`
          }}
        />
      </div>
    </section>
  );
};

export default TestimonialsSection;
