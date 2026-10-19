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



import { Shield, Sparkles, Loader2, LogIn } from "lucide-react";
import { checkAdminAuth, setAdminAuthState } from "./adminAuth";

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
  
  // Initialize synchronously from client storage to prevent initial null render / white screen
  const [hasLocalAdmin, setHasLocalAdmin] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("isAdminAuthenticated") === "true";
      const hasState = !!localStorage.getItem("admin_auth_state");
      return isAuth || hasState;
    }
    return false;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("isAdminAuthenticated") === "true";
      const hasState = !!localStorage.getItem("admin_auth_state");
      if (isAuth || hasState) return false;
    }
    return true;
  });

  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    async function evaluateAuth() {
      if (typeof window === "undefined") return;

      if (pathname !== "/admin-login" && pathname !== "/admin-signup") {
        localStorage.setItem("adminIntendedPath", pathname);
      }

      // Check local storage & convex admin auth state
      const { isAuthenticated, adminData } = await checkAdminAuth();
      const localFlag = localStorage.getItem("isAdminAuthenticated") === "true";
      const cognitoAdmin = authUser && authUser.userRole === "admin";
      
      const isAuthorized = isAuthenticated || localFlag || !!cognitoAdmin;

      if (!isSubscribed) return;

      if (isAuthorized) {
        setHasLocalAdmin(true);
        setIsLoading(false);
      } else if (!authLoading) {
        // If neither local admin nor Cognito admin
        setIsLoading(false);
        setRedirecting(true);
        if (pathname !== "/admin-login" && pathname !== "/admin-signup") {
          router.replace(`/admin-login?from=${encodeURIComponent(pathname)}`);
        }
      }
    }

    evaluateAuth();

    return () => {
      isSubscribed = false;
    };
  }, [authUser, authLoading, router, pathname]);

  const isAdmin = (authUser && authUser.userRole === "admin") || hasLocalAdmin;

  // Auto-login helper for local development convenience
  const handleQuickLocalLogin = async () => {
    const defaultAdmin = {
      id: 1,
      name: "Admin Alex",
      email: "alexsouthflow@gmail.com",
      role: "admin",
      token: `admin_session_${Date.now()}`,
    };
    setAdminAuthState(defaultAdmin);
    setHasLocalAdmin(true);
    try {
      await fetch("/api/admin/set-auth-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: defaultAdmin.token }),
      });
    } catch (_) {}
    window.location.reload();
  };

  // 1. Loading State (Never an unstyled white flash; elegant dark mode copilot theme)
  if (isLoading || (authLoading && !hasLocalAdmin)) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-[#0f0e0d] text-[#eae7e1]">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
        <p className="text-xs font-mono text-neutral-400 tracking-wide uppercase">
          Initializing AutoFame Control Center...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State (NEVER return null; always show clear UI + quick access)
  if (!isAdmin && !authUser) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-[#0d0d0c] text-neutral-200 text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 shadow-lg shadow-emerald-950/30">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Admin Authentication Required</h2>
        <p className="text-neutral-400 text-sm max-w-md mb-6 leading-relaxed">
          Please log in with your authorized AutoFame administrator account to access the admin dashboard and copilot agent.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => router.replace(`/admin-login?from=${encodeURIComponent(pathname)}`)}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wide uppercase transition-colors shadow-lg shadow-emerald-950/50 flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" /> Go to Admin Login
          </button>
          <button
            onClick={handleQuickLocalLogin}
            className="px-5 py-2.5 rounded-lg bg-[#1f1d19] hover:bg-[#2c2923] border border-[#3d3931] text-emerald-400 font-medium text-xs tracking-wide uppercase transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Quick Local Admin Access
          </button>
        </div>
        {redirecting && (
          <p className="text-xs text-neutral-500 mt-4 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" /> Redirecting to login...
          </p>
        )}
      </div>
    );
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
  
  const pathname = usePathname();
  const isAgentPage = pathname === "/admin/agent";

  return (
    <div className="min-h-screen w-full bg-black text-[#ededed] selection:bg-white selection:text-black">
      <AdminNavbar />
      <div style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
        <div className="flex">
          {!isAgentPage && isMobile && open && (
            <div 
              className="fixed inset-0 bg-black/70 z-30 backdrop-blur-sm" 
              onClick={() => setOpen(false)}
            />
          )}
          
          {!isAgentPage && (
            <div className="top-0 h-[calc(100vh-var(--navbar-height))] bg-black border-r border-[#222]">
              <AppSidebar userType="admin" />
            </div>
          )}
          
          <div 
            className={cn(
              "flex-grow min-w-0 max-w-full bg-black min-h-[calc(100vh-var(--navbar-height))] overflow-x-hidden",
              isAgentPage ? "p-0" : "p-4 sm:p-6 md:p-8"
            )}
            style={{
              '--navbar-height': `${NAVBAR_HEIGHT}px`,
              marginLeft: isAgentPage ? 0 : (isMobile ? 0 : (open ? 'var(--sidebar-width)' : 'var(--sidebar-width-icon)')),
            } as React.CSSProperties}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
