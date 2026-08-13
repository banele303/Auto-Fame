"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { X, Bell } from "lucide-react";
import { usePathname } from "next/navigation";

export default function WelcomeToast() {
  const pathname = usePathname();

  useEffect(() => {
    
    const isHomePage = pathname === "/";
    const isLandlordPage = pathname === "/landlords";
    
    
    if (isHomePage || isLandlordPage) {
      
      const hasShownWelcomeToast = localStorage.getItem("hasShownWelcomeToast");
      const lastToastTime = localStorage.getItem("lastWelcomeToastTime");
      const currentTime = new Date().getTime();
      
      
      const shouldShowToast = !hasShownWelcomeToast || 
        (lastToastTime && (currentTime - parseInt(lastToastTime)) > 24 * 60 * 60 * 1000);
      
      if (shouldShowToast) {
        const toastId = toast(
          <div className="flex items-center gap-3 py-1">
            <div className="flex items-center gap-3 flex-1">
              <Bell size={18} className="text-blue-100" />
              <p className="font-medium text-white">Welcome to our updated site</p>
            </div>
            <button 
              onClick={() => toast.dismiss(toastId)} 
              className="p-1.5 rounded-full hover:bg-blue-600/20 transition-colors ml-auto group"
              aria-label="Close notification"
            >
              <X 
                size={16} 
                className="text-blue-100 group-hover:text-white transition-colors" 
              />
            </button>
          </div>,
          {
            position: "top-center",
            duration: 60000, // 1 minute
            className: "bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400/30 shadow-lg",
            style: {
              color: "white",
              padding: "14px 18px",
              borderRadius: "12px",
              maxWidth: "440px",
              margin: "0 auto",
              backdropFilter: "blur(8px)",
            },
          }
        );
        
        
        localStorage.setItem("hasShownWelcomeToast", "true");
        localStorage.setItem("lastWelcomeToastTime", currentTime.toString());
        
        
        return () => {
          toast.dismiss(toastId);
        };
      }
    }
  }, [pathname]);

  return null; 
}
