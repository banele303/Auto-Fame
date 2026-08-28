"use client";

import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
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
  BarChart3,
  UserCheck,
  DollarSign,
  Building,
  Activity,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

type AppSidebarProps = {
  userType: "employee" | "customer" | "admin";
};

const AppSidebar = ({ userType }: AppSidebarProps) => {
  const pathname = usePathname();
  const { toggleSidebar, open, setOpen } = useSidebar();

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
    { icon: MessageSquare, label: "My Inquiries", href: "/customers/inquiries" },
    { icon: DollarSign, label: "My Purchases", href: "/customers/purchases" },
  ];

  const adminLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { icon: Activity, label: "Web Traffic", href: "/admin/analytics/traffic" },
    { icon: Car, label: "Cars", href: "/admin/cars" },
    { icon: Users, label: "Employees", href: "/admin/employees" },
    { icon: UserCheck, label: "Customers", href: "/admin/customers" },
    { icon: MessageSquare, label: "Inquiries", href: "/admin/inquiries" },
    { icon: DollarSign, label: "Sales", href: "/admin/sales" },
    { icon: CreditCard, label: "Financing", href: "/admin/financing" },
    { icon: Building, label: "Dealerships", href: "/admin/dealerships" },
    { icon: FileText, label: "Blog", href: "/admin/blog" },
    { icon: LayoutDashboard, label: "Gallery", href: "/admin/gallery" },
  ];

  const navLinks = 
    userType === "employee" ? employeeLinks : 
    userType === "customer" ? customerLinks : 
    adminLinks;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <Sidebar
      collapsible="icon"
      className="fixed left-0 z-50 border-r border-[#222] bg-black text-[#ededed] transition-all duration-300 ease-in-out transform-gpu"
      style={{
        top: `${NAVBAR_HEIGHT}px`,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        width: open ? 'var(--sidebar-width)' : 'var(--sidebar-width-icon)',
        transform: isMobile ? (open ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      }}
    >
      <SidebarHeader className="relative z-10 pt-3.5 pb-2 px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div
              className={cn(
                "flex w-full items-center",
                open ? "justify-between px-2" : "justify-center"
              )}
            >
              {open ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                    {userType} portal
                  </span>
                </div>
              ) : (
                <div className="h-8 w-8 flex items-center justify-center rounded-lg font-mono font-semibold text-xs bg-white/[0.08] text-white border border-white/[0.1]">
                  {userType === "employee" ? "E" : userType === "customer" ? "C" : "A"}
                </div>
              )}
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                onClick={toggleSidebar}
                aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
              >
                <ChevronRight size={16} className={open ? "rotate-180" : "rotate-0"} />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="relative z-10 px-2.5 pt-1 pb-4">
        <SidebarMenu className="space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const IconComponent = link.icon;
            return (
              <SidebarMenuItem key={link.href}>
                <Link href={link.href} passHref scroll={false}>
                  <SidebarMenuButton
                    isActive={isActive}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                      isActive
                        ? "bg-white/[0.1] text-white border border-white/[0.12] shadow-sm"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                    )}
                  >
                    <IconComponent size={16} className={isActive ? "text-white" : "text-zinc-400"} />
                    <span className="truncate">{link.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      
      {open && (
        <div className="absolute bottom-0 left-0 w-full px-3 pb-4">
          <div className="border-t border-[#222] pt-3">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0a0a0a] border border-[#222]">
              <div className="relative flex-shrink-0">
                <div className="h-7 w-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-mono text-xs font-bold">
                  {userType === "employee" ? "E" : userType === "customer" ? "C" : "A"}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-black"></span>
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-zinc-200 truncate">
                  {userType === "employee" ? "Sales Employee" : userType === "customer" ? "Customer" : "Administrator"}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Online
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