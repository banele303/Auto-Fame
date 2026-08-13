"use client";

import { Button } from "@/components/ui/button";

import DealershipHero from "./dealership-hero"; 
import FeaturesDealershipSection from "./Featured"; 
import HowItWorksDealership from "./how-it-works"; 
import BenefitsDealershipSection from "./benefits-section"; 

export default function DealershipsPage() { 
  return (
    <div className="min-h-screen">
      <DealershipHero />
      <FeaturesDealershipSection />

      <HowItWorksDealership />
      <BenefitsDealershipSection />


      
      <section className="py-16 bg-gradient-to-r from-blue-600 to-[#00acee]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Ready to partner with SaCar Dealership?
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              className="bg-white text-[#00acee] hover:bg-gray-100 font-medium px-8 py-6 rounded-full text-lg"
              onClick={() => window.location.href = "/signin"}
            >
              Login to your employee account
            </Button>
            <Button
              className="bg-[#00acee] border-2 border-white text-white hover:bg-blue-500 font-medium px-8 py-6 rounded-full text-lg"
              onClick={() => window.location.href = "/signup"}
            >
              Register your dealership
            </Button>
          </div>
        </div>
      </section>

  {/* Global footer from layout renders below */}
    </div>
  );
}