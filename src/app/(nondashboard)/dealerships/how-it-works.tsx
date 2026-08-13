"use client"

import { useState } from "react"
// Updated icons
import { ChevronLeft, ChevronRight, Car, DollarSign, FileText, Key, Handshake } from "lucide-react";
import { cn } from "@/lib/utils"

// Define the step data structure
interface Step {
  id: number
  icon: React.ReactNode // Changed icon type to React.ReactNode
  title: string
  description: string
}

// All steps for the car buying process
const allSteps: Step[] = [
  {
    id: 1,
    icon: <Car size={32} />, // Updated icon
    title: "List Your Inventory",
    description:
      "Easily add your vehicles to our platform with detailed descriptions, high-quality photos, and specifications. Reach a wide audience of potential buyers.",
  },
  {
    id: 2,
    icon: <FileText size={32} />, // Updated icon
    title: "Receive Inquiries",
    description:
      "Potential buyers can submit inquiries directly through our platform. You'll receive instant notifications and can manage all communications in one place.",
  },
  {
    id: 3,
    icon: <DollarSign size={32} />, // Updated icon
    title: "Process Sales",
    description:
      "Our integrated tools help you manage the sales process from negotiation to final paperwork. Track sales, manage financing, and update vehicle status.",
  },
  {
    id: 4,
    icon: <Key size={32} />, // Updated icon
    title: "Handover & Delivery",
    description:
      "Coordinate vehicle handover and delivery with ease. Ensure a smooth and satisfying experience for your customers from start to finish.",
  },
  {
    id: 5,
    icon: <Handshake size={32} />, // Updated icon
    title: "Customer Satisfaction",
    description:
      "Build lasting relationships with your customers through excellent post-sale support and follow-up. Encourage reviews to boost your dealership's reputation.",
  },
]

// Group steps into slides (3 steps per slide)
const slides = [
  [allSteps[0], allSteps[1], allSteps[2]], // Slide 1
  [allSteps[1], allSteps[2], allSteps[3]], // Slide 2
  [allSteps[2], allSteps[3], allSteps[4]], // Slide 3
]

// Renamed component
export default function HowItWorksDealership() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <section className="py-16 px-4 md:px-8 lg:px-12 max-w-9xl mx-auto">
      
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-800">How It Works for Dealerships</h2> 
        <div className="w-16 h-1 bg-cyan-500 mx-auto mt-2"></div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {slides[currentSlide].map((step, index) => (
          <div key={index} className="bg-sky-50 rounded-3xl p-8 relative">
            
            <div className="absolute left-0 top-8 bottom-8 w-1.5 bg-cyan-500 rounded-r-full"></div>

            
            <div className="border border-cyan-500 text-cyan-500 w-10 h-10 flex items-center justify-center rounded mb-6 ml-4">
              {step.icon} 
            </div>

            
            <h3 className="font-bold text-slate-800 text-lg mb-3">{step.title}</h3>

            
            <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      
      <div className="flex justify-center items-center mt-8 gap-2">
        
        <div className="flex gap-2 mx-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                currentSlide === index ? "bg-cyan-500 w-6" : "bg-gray-300",
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        
        <div className="flex gap-2 ml-4">
          <button
            onClick={goToPrevSlide}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-cyan-500 hover:text-cyan-500 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextSlide}
            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-cyan-500 hover:text-cyan-500 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}