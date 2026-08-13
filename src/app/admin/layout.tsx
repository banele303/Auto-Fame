"use client";

import { useTheme } from "next-themes";
import { useGetAuthUserQuery } from "@/state/api";
import "./theme.css"; 
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import AdminNavbar from "@/components/AdminNavbar";
import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";



export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    
    if (pathname !== '/admin-login' && pathname !== '/admin-signup') {
      localStorage.setItem('adminIntendedPath', pathname);
    }
    
    
    const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';
    
    
    if (!authLoading && authUser) {
      console.log('Admin layout - User info:', { 
        role: authUser.userRole, 
        email: authUser.userInfo?.email,
        cognitoId: authUser.cognitoInfo?.userId,
        isAdminAuthenticated
      });
      
      
      const isAdmin = authUser.userRole === "admin";
      
      if (!isAdmin) {
        console.log('Not an admin user, redirecting to home');
        
        localStorage.removeItem('isAdminAuthenticated');
        router.replace("/");
      } else {
        
        localStorage.setItem('isAdminAuthenticated', 'true');
        console.log('Admin user confirmed, continuing to admin dashboard');
        setIsLoading(false);
      }
    } else if (!authLoading && !authUser) {
      console.log('No authenticated user, checking localStorage flag:', isAdminAuthenticated);
      
      
      
      if (!isAdminAuthenticated) {
        console.log('No admin authentication in localStorage, redirecting to login');
        
        if (pathname !== '/admin-login' && pathname !== '/admin-signup') {
          router.replace("/admin-login");
        }
      } else {
        
        
        console.log('Potential timing issue - localStorage says admin is authenticated but authUser is null');
        setIsLoading(false);
      }
    }
  }, [authUser, authLoading, router, pathname]);

  if (authLoading || isLoading) {
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
          Loading admin dashboard...
        </p>
      </div>
    );
  }

  
  if (!authUser) {
    return null;
  }
  
  
  const isAdmin = authUser.userRole === "admin";
    
  if (!isAdmin) {
    return null;
  }

  
  return (
    <SidebarProvider>
      <AdminDashboardContent>
        {children}
      </AdminDashboardContent>
    </SidebarProvider>
  );
}


const AdminDashboardContent = ({ children }: { children: React.ReactNode }) => {
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
      <AdminNavbar />
      <div style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
        <div className="flex">
          
          {isMobile && open && (
            <div 
              className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" 
              onClick={() => setOpen(false)}
            />
          )}
          
          
          <div className="top-0 h-[calc(100vh-var(--navbar-height))]">
            <AppSidebar userType="admin" />
          </div>
          
          
          <div 
            className={cn(
              "flex-grow p-3 sm:p-4 md:p-6",
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
