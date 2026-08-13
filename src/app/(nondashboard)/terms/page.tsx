"use client";

import React from "react";
import { siteConfig } from "@/lib/siteConfig";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Terms and Conditions</h1>
          <p className="text-blue-100">
            Last updated: July 1, 2025
          </p>
        </div>
      </div>

      
      <div className="max-w-4xl mx-auto py-12 px-4 bg-white shadow-sm my-8 rounded-lg">
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">1. Definitions</h2>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li><strong>&quot;Customer&quot;</strong> refers to any person using the platform to seek a car.</li>
            <li><strong>&quot;Dealership&quot;</strong> refers to any individual or entity listing cars on the platform.</li>
            <li><strong>&quot;Buyer&quot;</strong> refers to a customer whose inquiry is accepted by a dealership.</li>
            <li><strong>&quot;Platform&quot;</strong> refers to the {siteConfig.brand.name} website.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">2. User Registration and Inquiry Process</h2>
          
          <h3 className="text-xl font-semibold text-slate-700 mb-4">2.1. Customer Information</h3>
          <p className="mb-4">When submitting an inquiry, customers are required to provide the following details:</p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Full Name</li>
            <li>Contact details including mobile number and email</li>
            <li>Preferred car type and features</li>
            <li>Financing preferences</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">2.2. Dealership Selection</h3>
          <p className="mb-4">Dealerships are granted the discretion to accept or decline customer inquiries based on the provided details.</p>
          <p className="mb-6">Once a customer&apos;s inquiry is accepted, the customer&apos;s contact details, including their mobile number and email address, will be shared with the dealership.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">3. Dealership Responsibilities</h2>
          
          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.1. Accurate Listings</h3>
          <p className="mb-2">Dealerships must provide accurate and up-to-date information about their cars.</p>
          <p className="mb-2">This includes truthful details about make, model, year, price, condition, and any relevant terms or conditions.</p>
          <p className="mb-4">Misleading or false information may result in suspension from the platform.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.2. Proof of Identity or Registration</h3>
          <p className="mb-2">Dealerships are required to provide proof of company registration or valid identification.</p>
          <p className="mb-4">This will be linked to their profile to prevent fraudulent activities or identity theft.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.3. Listing Resources</h3>
          <p className="mb-2">Dealerships are provided with resources to list cars.</p>
          <p className="mb-2">This includes tools to manage listings, review customer inquiries, and accept or decline inquiries based on the provided information.</p>
          <p className="mb-4">It is the dealership&apos;s responsibility to maintain accurate and up-to-date information on their listings.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.4. Compliance with Legal Requirements</h3>
          <p className="mb-2">Dealerships must ensure compliance with South African consumer protection laws and automotive industry regulations.</p>
          <p className="mb-4">Any sales agreements must adhere to applicable laws.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.5. Respectful Communication</h3>
          <p className="mb-2">Dealerships must treat all potential customers with respect and fairness, regardless of race, gender, or background.</p>
          <p className="mb-4">Any form of discrimination or harassment will not be tolerated and may lead to account suspension.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.6. Timely Response to Inquiries</h3>
          <p className="mb-2">Dealerships must review customer inquiries and respond in a timely and professional manner.</p>
          <p className="mb-2">Unanswered inquiries may expire after a certain period.</p>
          <p className="mb-4">Once a customer is engaged, dealerships are responsible for ensuring communication is clear and consistent regarding car details, test drives, and sales arrangements.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">3.7. Resolution of Disputes</h3>
          <p className="mb-2">While {siteConfig.brand.name} facilitates connections, dealerships are responsible for resolving any disputes that arise with customers regarding the sale or the car itself.</p>
          <p className="mb-6">Legal agreements and procedures should be followed.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">4. Responsibilities of the Customer</h2>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">4.1. Accurate Information</h3>
          <p className="mb-2">Customers must provide truthful and accurate information when submitting inquiries or applications.</p>
          <p className="mb-2">This includes their name, contact details, and other required information.</p>
          <p className="mb-4">Any falsified information may result in removal from the platform.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">4.2. Respectful Communication</h3>
          <p className="mb-2">Customers are expected to engage with dealerships and other platform users in a respectful and professional manner.</p>
          <p className="mb-4">Any form of harassment, abusive behavior, or disrespectful conduct is strictly prohibited.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">4.3. Purchase and Payment Obligations</h3>
          <p className="mb-4">Once a sales agreement is signed with the dealership, customers are responsible for adhering to its terms, including payment schedules and car collection arrangements.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">4.4. Timely Communication</h3>
          <p className="mb-2">Customers must promptly respond to dealership communications, especially after their inquiry has been accepted or a test drive is scheduled.</p>
          <p className="mb-4">Clear communication regarding car details, financing, and delivery arrangements is essential.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">4.5. Resolution of Disputes</h3>
          <p className="mb-4">In the event of a dispute with the dealership, customers are encouraged to resolve matters amicably and legally. {siteConfig.brand.name} is not responsible for intervening in such disputes.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">5. {siteConfig.brand.name}'s Role as a Platform Provider</h2>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">5.1. Platform for Advertising and Connection</h3>
          <p className="mb-2">{siteConfig.brand.name} solely provides a platform for dealerships to advertise their cars and for customers to connect with dealerships.</p>
          <p className="mb-4">We do not own, manage, or control the vehicles listed on our site.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">5.2. Limitation of Liability</h3>
          <p className="mb-2">{siteConfig.brand.name} is not liable for any disputes, issues, or content posted by users (dealerships or customers) on the platform.</p>
          <p className="mb-4">However, we reserve the right to remove any content that violates the law or the platform&apos;s terms of service.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">5.3. Legal Compliance and Brand Protection</h3>
          <p className="mb-2">While we are not responsible for the actions of users, we are committed to acting legally and protecting our brand.</p>
          <p className="mb-4">Any intentional act of posting harmful or misleading content, or misuse of the platform that harms the reputation of {siteConfig.brand.name}, will result in legal action or removal from the platform.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">5.4. Respect and Professional Conduct</h3>
          <p className="mb-2">All users of the platform, including both customers and dealerships, are required to conduct themselves with respect and professionalism.</p>
          <p className="mb-4">Any violation of this expectation may result in account suspension or removal from {siteConfig.brand.name}.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">5.5. Use of Contact Information for Verification</h3>
          <p className="mb-2">To ensure the integrity of our service, {siteConfig.brand.name} may contact customers to verify inquiries or sales.</p>
          <p className="mb-2">This may be done through phone calls, emails, or WhatsApp.</p>
          <p className="mb-6">The information collected will help us ensure the accuracy of our service.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">6. Fees and Payment</h2>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">6.1. Service Fees</h3>
          <p className="mb-2">{siteConfig.brand.name} charges a service fee of 1.0% of the final sale price per successful car sale.</p>
          <p className="mb-4">This fee is applicable upon successful completion of the sale.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">6.2. Penalty for Missed Payments</h3>
          <p className="mb-6">In the event that the dealership misses a payment 7 days after an invoice has been issued without a valid, supporting reason, a fixed penalty of R500 (Five-hundred Rands) will be added on each missed invoice.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">7. Data Protection and Privacy</h2>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">7.1. Compliance with POPIA</h3>
          <p className="mb-2">{siteConfig.brand.name} is committed to safeguarding personal information in compliance with the Protection of Personal Information Act (POPIA).</p>
          <p className="mb-4">Any personal information collected through the platform will only be used for the purposes of connecting customers and dealerships and will not be shared with any third parties without prior consent.</p>

          <h3 className="text-xl font-semibold text-slate-700 mb-4">7.2. Data Sharing</h3>
          <p className="mb-6">Only after a dealership accepts a customer&apos;s inquiry will the customer&apos;s contact details, including mobile number and email address, be shared with the dealership.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">8. Termination of Service</h2>
          <p className="mb-6">{siteConfig.brand.name} reserves the right to terminate or suspend any account or listing at its discretion if it deems the actions of a user to be in violation of these terms and conditions, unlawful, or harmful to the platform&apos;s integrity or other users.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">9. Dispute Resolution</h2>
          <p className="mb-2">In the event of any disputes between dealerships and customers, {siteConfig.brand.name} encourages both parties to resolve matters amicably.</p>
          <p className="mb-2">{siteConfig.brand.name} is not responsible for any disputes that arise after contact details have been exchanged and a sales agreement has been entered into.</p>
          <p className="mb-6">Should formal legal proceedings be necessary, disputes must be resolved under South African law.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">10. Amendments to the Terms</h2>
          <p className="mb-6">{siteConfig.brand.name} reserves the right to update or modify these terms and conditions at any time without prior notice. Users are encouraged to regularly review the terms to ensure awareness of any changes.</p>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">11. Governing Law</h2>
          <p className="mb-6">These terms and conditions are governed by and construed in accordance with the laws of South Africa. Any disputes arising from or relating to these terms shall be subject to the exclusive jurisdiction of the South African courts.</p>
        </div>
      </div>

  {/* Global footer from layout renders below */}
    </div>
  );
}