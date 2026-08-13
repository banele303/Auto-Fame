"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FinancingApplicationForm from "@/components/forms/FinancingApplicationForm";
import { Button } from "@/components/ui/button";

export default function FinancingPage() {
  const handleApplyNow = () => {
    const el = document.getElementById("financing-form");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-white">
      <section className="py-16 md:py-24 bg-gray-50" id="financing-form">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Financing Application</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Provide all requested information to speed up review. Fields marked with <span className="text-red-500 font-semibold">*</span> are required.</p>
          </div>
          <div id="financing-form-root">
            <FinancingApplicationForm />
          </div>
        </div>
      </section>

  {/* FooterSection removed to avoid duplicate footers (global footer already in layout) */}
    </div>
  );
}
