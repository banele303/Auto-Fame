"use client";

import Image from "next/image";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Car, ArrowRight, ArrowUpRight, Phone, Calendar } from "lucide-react";

interface AnimatedButtonProps {
  as?: React.ElementType;
  icon: React.ReactNode;
  text: string;
  iconPosition?: "left" | "right";
  [key: string]: any;
}

interface StatsCardProps {
  number: string;
  label: string;
}

const CallToActionSection = () => {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      
      <motion.div 
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1.1 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <Image
          src="/landing-splash.jpg" 
          alt="Premium Car Dealership"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/50"></div>
        
        
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-blue-500 blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-purple-500 blur-3xl"></div>
        </div>
      </motion.div>

      
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-white"
          >
            <div className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium text-blue-200 mb-6">
              Your Next Adventure Starts Here
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                Find Your Perfect Ride
              </span> <br />
              Today at SaCar Dealership
            </h2>
            
            <p className="text-lg text-gray-300 mb-8 max-w-lg">
              Explore a wide selection of quality new and pre-owned vehicles. 
              Exceptional service, competitive financing, and a seamless buying experience.
            </p>

            <div className="flex flex-wrap gap-4">
              <AnimatedButton
                as={Link} 
                href="/inventory" 
                className="inline-flex items-center justify-center bg-white text-gray-900 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
                icon={<Car size={18} className="mr-2" />}
                text="Browse Inventory"
              />
              
              <AnimatedButton
                as={Link} 
                href="/contact-us" 
                className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
                icon={<Calendar size={18} className="ml-2" />}
                text="Schedule Test Drive"
                iconPosition="right"
              />
            </div>
          </motion.div>

          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-col space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <StatsCard number="500+" label="Vehicles Available" />
              <StatsCard number="4.9★" label="Customer Satisfaction" />
            </div>
            
            <FeaturedTestimonial />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};


const StatsCard = ({ number, label }: StatsCardProps) => (
  <motion.div
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
  >
    <p className="text-3xl font-bold text-white mb-1">{number}</p>
    <p className="text-gray-300 text-sm">{label}</p>
  </motion.div>
);


const FeaturedTestimonial = () => (
  <motion.div
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
  >
    <div className="flex items-center mb-4">
      <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-blue-400">
        <Image
          src="/placeholder.jpg"
          alt="User"
          fill
          className="object-cover"
        />
      </div>
      <div>
        <p className="text-white font-medium">Michael Chen</p>
        <p className="text-gray-300 text-sm">Johannesburg, SA</p>
      </div>
    </div>
    <p className="text-gray-200 italic text-sm">
    &quot;SaCar helped me find the perfect BMW X5 for my family. Exceptional service and competitive pricing throughout the process!&quot;
    </p>
  </motion.div>
);


const AnimatedButton = ({ as: Component = 'button', icon, text, iconPosition = "left", ...props }: AnimatedButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Component
      {...props}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {iconPosition === "left" && icon}
      <span className={`${iconPosition === "right" ? "mr-2" : "ml-2"}`}>{text}</span>
      {iconPosition === "right" && (
        <motion.div
          animate={{ x: isHovered ? 3 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
      )}
    </Component>
  );
};

export default CallToActionSection;
