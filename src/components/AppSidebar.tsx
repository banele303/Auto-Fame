"use client";

import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import {
  Car,
  LayoutDashboard,
  FileText,
  Heart,
  Users,
  CreditCard,
  ChevronRight,
  Calendar,
  MessageSquare,
  Calculator,
  MapPin,
  BarChart3,
  Phone,
  UserCheck,
  DollarSign,
  Key,
  Gauge,
  Building,
  Activity,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTheme } from "next-themes";

type AppSidebarProps = {
  userType: "employee" | "customer" | "admin";
};

const AppSidebar = ({ userType }: AppSidebarProps) => {
  const pathname = usePathname();
  const { toggleSidebar, open, setOpen } = useSidebar();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && open) {
        setOpen(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open, setOpen]);

  
  const employeeLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/employees/dashboard" },
    // Inventory removed per request
    { icon: MessageSquare, label: "Inquiries", href: "/employees/inquiries" },
    { icon: Calendar, label: "Test Drives", href: "/employees/testdrives" },
    { icon: DollarSign, label: "Sales", href: "/employees/sales" },
    { icon: Users, label: "Customers", href: "/employees/customers" },
    { icon: CreditCard, label: "Financing", href: "/employees/financing" },
  ];

  const customerLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/customers/dashboard" },
    { icon: Car, label: "Browse Cars", href: "/customers/inventory" },
    { icon: Heart, label: "Favorites", href: "/customers/favorites" },
    { icon: Calendar, label: "Test Drives", href: "/customers/testdrives" },
    { icon: MessageSquare, label: "My Inquiries", href: "/customers/inquiries" }, // Changed label
    { icon: DollarSign, label: "My Purchases", href: "/customers/purchases" }, // Changed icon and label
  ];

  
  const adminLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { icon: Activity, label: "Web Traffic", href: "/admin/analytics/traffic" },
    { icon: Car, label: "Cars", href: "/admin/cars" },
    // Inventory removed per request
    { icon: Users, label: "Employees", href: "/admin/employees" },
    { icon: UserCheck, label: "Customers", href: "/admin/customers" },
    { icon: MessageSquare, label: "Inquiries", href: "/admin/inquiries" },
    { icon: DollarSign, label: "Sales", href: "/admin/sales" },
    { icon: CreditCard, label: "Financing", href: "/admin/financing" },
    { icon: Building, label: "Dealerships", href: "/admin/dealerships" },
    { icon: FileText, label: "Blog", href: "/admin/blog" },
    { icon: LayoutDashboard, label: "Gallery", href: "/admin/gallery" },
  ];
  
  // Bottom links (Settings & Notifications) removed per request
  const bottomLinks: any[] = [];

  const navLinks = 
    userType === "employee" ? employeeLinks : 
    userType === "customer" ? customerLinks : 
    adminLinks;

  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "fixed left-0 backdrop-blur-sm z-50 border-r transition-all duration-300 ease-in-out transform-gpu",
        isDark ? 
          "bg-slate-900/95 border-slate-800/40 shadow-xl" : 
          "bg-white/95 border-slate-200 shadow-md"
      )}
      style={{
        top: `${NAVBAR_HEIGHT}px`,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        width: open ? 'var(--sidebar-width)' : 'var(--sidebar-width-icon)',
        // On mobile, slide in from the left when open, otherwise hide off-screen
        transform: isMobile ? (open ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      }}
    >
      <SidebarHeader className="relative z-10 pt-3 pb-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <div
              className={cn(
                "flex w-full items-center",
                open ? "justify-between px-4" : "justify-center"
              )}
            >
              {open ? (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-semibold text-base tracking-tight",
                    isDark ? "text-white" : "text-slate-900"
                  )}>
                    {userType.charAt(0).toUpperCase() + userType.slice(1)} Portal
                  </span>
                </div>
              ) : (
                <div className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-md font-semibold text-sm",
                  isDark ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
                )}>
                  {userType === "employee" ? "E" : userType === "customer" ? "C" : "A"}
                </div>
              )}
              <button
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  isDark ? 
                    "hover:bg-slate-800 text-slate-400 hover:text-white" : 
                    "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                )}
                onClick={toggleSidebar}
                aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
              >
                <ChevronRight size={18} className={open ? "rotate-180" : "rotate-0"} />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="relative z-10 px-3 pt-2 pb-4">
        <SidebarMenu>
          
          <div className="mb-1 pb-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const IconComponent = link.icon;
              return (
                <SidebarMenuItem key={link.href}>
                  <Link href={link.href} passHref scroll={false}>
                    <SidebarMenuButton
                      isActive={isActive}
                      variant={isActive ? "default" : "ghost"}
                      size="default"
                      className={cn(
                        "mb-1 transition-colors group relative",
                        isDark ? 
                          "text-slate-400 hover:text-white" : 
                          "text-slate-600 hover:text-slate-900",
                        isActive && isDark && "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white hover:text-white",
                        isActive && !isDark && "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:text-blue-800"
                      )}
                    >
                      <IconComponent size={18} />
                      <span className="text-[14px] font-medium">{link.label}</span>
                      {isActive && (
                        <span className={cn(
                          "absolute inset-y-0 left-0 w-[3px] rounded-r-full",
                          isDark ? "bg-blue-500" : "bg-blue-600"
                        )}></span>
                      )}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
            {/* Financing quick action removed per request (navbar retains financing access) */}
          </div>
          
          
          <div className={cn(
            "w-full h-px my-3", 
            isDark ? "bg-slate-800" : "bg-slate-200"
          )} />
          
          
          {/* Sign Out button removed per request */}
        </SidebarMenu>
      </SidebarContent>
      
      
      {open && (
        <div className="absolute bottom-0 left-0 w-full px-4 pb-4">
          <div className={cn(
            "border-t pt-4 relative",
            isDark ? "border-slate-800" : "border-slate-200"
          )}>
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-lg", 
              isDark ? "bg-slate-800/50" : "bg-slate-100"
            )}>
              <div className="relative flex-shrink-0">
                <div className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center",
                  isDark ? 
                    "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white" : 
                    "bg-gradient-to-tr from-blue-500 to-indigo-500 text-white"
                )}>
                  <span className="font-medium text-sm">
                    {userType === "employee" ? "E" : userType === "customer" ? "C" : "A"}
                  </span>
                </div>
                <span className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border",
                  isDark ? "bg-green-500 border-slate-900" : "bg-green-500 border-white"
                )}></span>
              </div>
              
              <div className="flex flex-col">
                <span className={cn(
                  "text-sm font-medium",
                  isDark ? "text-white" : "text-slate-900"
                )}>
                  {userType === "employee" ? "Sales Employee" : userType === "customer" ? "Customer" : "Administrator"}
                </span>
                <span className={cn(
                  "text-xs",
                  isDark ? "text-slate-400" : "text-slate-600"
                )}>
                  Active Now
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
};

export default AppSidebar;