import React from "react";
import HeroSection from "./HeroSection";
// CallToActionSection removed per request
import FAQShared from "@/components/FAQShared";
import TestimonialsSection from "./TestimonialsSection";
import FeaturedCars from "./FeaturedCars";
import ReferralCalloutSection from "./ReferralCalloutSection";
import BlogSection from "./BlogSection";
import StatsSection from "./StatsSection";

function Home() { 
  return (
    <div>
  <HeroSection />
  <FeaturedCars />
  <ReferralCalloutSection />
  <StatsSection />
      <TestimonialsSection />
      <BlogSection />
  <FAQShared />
    </div>
  );
}

export default Home; 