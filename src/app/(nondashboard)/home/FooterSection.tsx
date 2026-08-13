import Link from "next/link";
import React from "react";
import { siteConfig } from "@/lib/siteConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faInstagram,
  faTwitter,
  faLinkedin,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

const FooterSection = () => {
  return (
    <footer className="border-t border-gray-200 py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-[#00acee] mb-4 block" scroll={false}>
              {siteConfig.brand.name}
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              South Africa&apos;s premier car dealership network, providing quality vehicles and exceptional service since 2008.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Phone:</span>{' '}
                <a href="tel:+27680720424" className="hover:text-[#00acee] transition-colors" aria-label="Call SaCar Dealership">
                  068 072 0424
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">WhatsApp:</span>{' '}
                <a href="https://wa.me/27680720424?text=Hi%20I%27m%20interested%20in%20a%20vehicle" target="_blank" rel="noopener noreferrer" className="hover:text-[#00acee] transition-colors" aria-label="Chat on WhatsApp">
                  068 072 0424
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Email:</span>{' '}
                <a href={`mailto:${siteConfig.contact.emailGeneral}`} className="hover:text-[#00acee] transition-colors" aria-label={`Email ${siteConfig.brand.name}`}>
                  {siteConfig.contact.emailGeneral}
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-snug">
                <span className="font-medium">Address:</span><br />
                2A Amanda Ave, Gleneagles<br />Johannesburg South, 2091
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Mon–Fri 08:00–17:00 • Sat 09:00–13:00</p>
            </div>
          </div>

          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/inventory" className="text-gray-600 dark:text-gray-400 hover:text-[#00acee]">Browse Inventory</Link></li>
              <li><Link href="/financing" className="text-gray-600 dark:text-gray-400 hover:text-[#00acee]">Financing Options</Link></li>
              <li><Link href="/trade-in" className="text-gray-600 dark:text-gray-400 hover:text-[#00acee]">Trade-In Value</Link></li>
              <li><Link href="/service" className="text-gray-600 dark:text-gray-400 hover:text-[#00acee]">Service Center</Link></li>
            </ul>
          </div>

          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact-us" className="text-gray-600 dark:text-gray-400 hover:text-[#00acee]">Contact Us</Link></li>
              <li><Link href="/faq" className="text-gray-600 dark:text-gray-400 hover:text-[#00acee]">FAQ</Link></li>
              <li><Link href="/warranty" className="text-gray-600 dark:text-gray-400 hover:text-[#00acee]">Warranty Info</Link></li>
              <li><Link href="/careers" className="text-gray-600 dark:text-gray-400 hover:text-[#00acee]">Careers</Link></li>
            </ul>
          </div>

          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-[#00acee]">Terms of Service</Link></li>
              <li><Link href="/privacy-policy" className="text-gray-600 dark:text-gray-400 hover:text-[#00acee]">Privacy Policy</Link></li>
              <li><Link href="/returns" className="text-gray-600 dark:text-gray-400 hover:text-[#00acee]">Return Policy</Link></li>
              <li><Link href="/compliance" className="text-gray-600 dark:text-gray-400 hover:text-[#00acee]">Compliance</Link></li>
            </ul>
          </div>
        </div>

        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-[#00acee] transition-colors">
                <FontAwesomeIcon icon={faFacebook} className="h-6 w-6" />
              </a>
              <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-[#00acee] transition-colors">
                <FontAwesomeIcon icon={faInstagram} className="h-6 w-6" />
              </a>
              <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-[#00acee] transition-colors">
                <FontAwesomeIcon icon={faTwitter} className="h-6 w-6" />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-[#00acee] transition-colors">
                <FontAwesomeIcon icon={faLinkedin} className="h-6 w-6" />
              </a>
              <a href="#" aria-label="YouTube" className="text-gray-400 hover:text-[#00acee] transition-colors">
                <FontAwesomeIcon icon={faYoutube} className="h-6 w-6" />
              </a>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 {siteConfig.brand.name}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;