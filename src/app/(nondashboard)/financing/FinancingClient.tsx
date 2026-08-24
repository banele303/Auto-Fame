"use client";

import React from "react";
import FinancingApplicationForm from "@/components/forms/FinancingApplicationForm";

export default function FinancingClient() {
  return (
    <div className="bg-white dark:bg-gray-950">
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900" id="financing-form">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Vehicle Financing Application
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Get pre-approved with South Africa&apos;s leading banks at AutoFame Johannesburg South. Provide all requested information to speed up review. Fields marked with <span className="text-red-500 font-semibold">*</span> are required.
            </p>
          </div>
          <div id="financing-form-root">
            <FinancingApplicationForm />
          </div>
        </div>
      </section>
    </div>
  );
}
