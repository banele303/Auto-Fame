"use client";

import Navbar from "@/components/Navbar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import Sidebar from "@/components/AppSidebar";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import React, { useEffect, useState } from "react";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      const userRole = authUser.userRole?.toLowerCase();
      
      
      if (userRole === "admin") {
        
        
        if (pathname.startsWith("/admin")) {
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
        return;
      }
      
      
      if (userRole === "employee" || userRole === "customer") {
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [authUser, router, pathname]);

  
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (authLoading || isLoading)
    return (
      <div className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3", 
        isDark ? "bg-slate-950" : "bg-slate-50"
      )}>
        <div className={cn(
          "w-12 h-12 rounded-full border-4 animate-spin",
          isDark ? "border-slate-800 border-t-blue-500" : "border-slate-200 border-t-blue-600"
        )}></div>
        <p className={cn(
          "text-sm font-medium",
          isDark ? "text-slate-400" : "text-slate-500"
        )}>
          Loading dashboard...
        </p>
      </div>
    );
  if (!authUser?.userRole) return null;
  
  
  return (
    <SidebarProvider>
      <DashboardContent userRole={authUser.userRole.toLowerCase() as "customer" | "employee" | "admin"}>
        {children}
      </DashboardContent>
    </SidebarProvider>
  );
};


const DashboardContent = ({ userRole, children }: { userRole: "customer" | "employee" | "admin", children: React.ReactNode }) => {
  const { open, setOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      
      if (window.innerWidth < 768 && open) {
        setOpen(false);
      }
    };
    
    
    checkIsMobile();
    
    
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [open, setOpen]);
  
  return (
      <div className={cn(
        "min-h-screen w-full",
        isDark ? "bg-slate-950" : "bg-slate-50"
      )}>
        <Navbar />
        <div style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
          <div className="flex relative">
            
            {isMobile && open && (
              <div 
                className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" 
                onClick={() => setOpen(false)}
              />
            )}
            
            
            <div className="sticky top-0 h-[calc(100vh-var(--navbar-height))] z-40">
              <Sidebar userType={userRole} />
            </div>
            
            
            <div 
              className={cn(
                "flex-grow transition-all duration-300 ease-in-out p-3 sm:p-4 md:p-6 overflow-x-hidden",
                isDark ? "text-slate-50" : "text-slate-900"
              )}
              style={{
                '--navbar-height': `${NAVBAR_HEIGHT}px`,
                marginLeft: isMobile ? 0 : (open ? 'var(--sidebar-width)' : 'var(--sidebar-width-icon)'),
              } as React.CSSProperties}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
  );
};

export default DashboardLayout;
