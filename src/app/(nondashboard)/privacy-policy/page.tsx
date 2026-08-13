"use client";

import React from "react";
import { siteConfig } from "@/lib/siteConfig";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-indigo-100">
            Last updated: July 1, 2025
          </p>
        </div>
      </div>

      
      <div className="max-w-4xl mx-auto py-12 px-4 bg-white shadow-sm my-8 rounded-lg">
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">1. Information We Collect</h2>
          <p className="mb-4">We collect personal information necessary to provide our services and ensure a smooth connection between car buyers and dealerships. The types of information we collect include:</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">1.1. Information from Customers:</h3>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>Personal Information:</strong> Name, contact details (email, phone number), financing preferences, driving license details.</li>
            <li><strong>Inquiry Data:</strong> Any additional information provided when inquiring about a vehicle or scheduling a test drive.</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">1.2. Information from Dealerships:</h3>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>Business Information:</strong> Dealership name, registration, contact details.</li>
            <li><strong>Vehicle Listing Information:</strong> Car details, prices, location, and terms.</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">1.3 Automatic Data Collection:</h3>
          <p className="mb-6">We may collect certain information automatically when you visit our website, including your IP address, browser type, and browsing behavior.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">2. How We Use Your Information</h2>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">2.1. For Customers:</h3>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>To facilitate the connection between customers and dealerships.</li>
            <li>To process and manage vehicle inquiries and test drive requests.</li>
            <li>To improve our services and enhance user experience.</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">2.2. For Dealerships:</h3>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>To verify the legitimacy of vehicle listings and prevent fraudulent activities.</li>
            <li>To provide resources for car listing and customer management.</li>
            <li>To communicate with you regarding customer inquiries, sales, or updates related to the platform.</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">2.3. General Purposes:</h3>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>To maintain the security and integrity of the website.</li>
            <li>To comply with legal requirements.</li>
            <li>To respond to user inquiries, provide customer support, and resolve disputes.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">3. Sharing and Disclosure of Information</h2>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.1. With Dealerships (for Customers):</h3>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>If you inquire about a vehicle, your details, such as name and contact information, will be shared with the relevant dealership.</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.2. With Customers (for Dealerships):</h3>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>Customers will see the vehicle information you provide when listing cars on the platform.</li>
            <li>Your contact information will only be shared with customers who submit inquiries or schedule test drives.</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.3. Legal Requirements:</h3>
          <p className="mb-6">We may disclose your information to authorities if required by law, in response to legal processes, or to protect our legal rights and safety, and that of others.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">4. Data Security</h2>
          <p className="mb-2">We are committed to protecting your personal information. We use reasonable security measures, including encryption, access controls, and secure data storage, to protect against unauthorized access, alteration, disclosure, or destruction of your information.</p>
          <p className="mb-6">However, please note that no method of online data transmission is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">5. Your Rights</h2>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>Access the personal information we hold about you.</li>
            <li>Correct or update any inaccurate or incomplete information.</li>
            <li>Request the deletion of your personal information (subject to certain legal obligations).</li>
            <li>Withdraw your consent to the processing of your information, where applicable.</li>
          </ul>
          <p className="mb-6">To exercise any of these rights, please contact us using the details provided below.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">6. Cookies and Tracking Technologies</h2>
          <p className="mb-2">{siteConfig.brand.name} uses cookies and other tracking technologies to enhance your browsing experience.</p>
          <p className="mb-2">Cookies are small files stored on your device that help us remember your preferences, analyze site usage, and improve our services.</p>
          <p className="mb-6">You can control cookie settings through your browser, but disabling cookies may affect your ability to use certain features of our website.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">7. Retention of Personal Information</h2>
          <p className="mb-2">We retain your personal information for as long as it is necessary to fulfill the purposes for which it was collected, or as required by law.</p>
          <p className="mb-6">Once your information is no longer needed, we will securely delete or anonymize it.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">8. Third-Party Links</h2>
          <p className="mb-2">Our website may contain links to third-party websites.</p>
          <p className="mb-2">We are not responsible for the privacy practices or content of these external sites.</p>
          <p className="mb-6">We encourage you to review the privacy policies of any third-party sites you visit.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">9. Changes to This Privacy Policy</h2>
          <p className="mb-2">We reserve the right to update or modify this Privacy Policy at any time.</p>
          <p className="mb-2">Any changes will be posted on this page, and the date of the latest revision will be indicated at the top.</p>
          <p className="mb-6">We encourage you to review this Privacy Policy periodically to stay informed of any updates.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">10. Contact Us</h2>
          <p className="mb-4">If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal information, please contact us at:</p>
          <div className="mb-6">
            <p>{siteConfig.brand.name}</p>
            <p>Email: {siteConfig.contact.emailGeneral}</p>
            <p>Office: {siteConfig.contact.addressLine}</p>
          </div>
        </div>
      </div>

  {/* Global footer from layout renders below */}
    </div>
  );
}