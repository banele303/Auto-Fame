"use client";

import { NAVBAR_HEIGHT } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";
import { logoutAdmin } from "@/app/admin/adminAuth";
import {
  Settings,
  LogOut,
  User,
  Shield,
  ChevronDown,
  LayoutDashboard,
  Users,
  BarChart4,
  Home,
  Car,
  Building2,
  Menu,
  X,
  Bell,
  Search
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const AdminNavbar = () => {
  const { data: authUser } = useGetAuthUserQuery(undefined);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getUserInitial = () => {
    if (authUser?.userInfo?.email) {
      return authUser.userInfo.email[0].toUpperCase();
    }
    return "A";
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await logoutAdmin();
    window.location.href = "/admin-login";
  };

  const navigationItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/admin"
    },
    {
      href: "/admin/cars",
      label: "Cars",
      icon: Car,
      isActive: pathname.includes("/admin/cars")
    },
    {
      href: "/admin/employees",
      label: "Employees",
      icon: Users,
      isActive: pathname.includes("/admin/employees")
    },
    {
      href: "/admin/dealerships",
      label: "Dealerships",
      icon: Building2,
      isActive: pathname.includes("/admin/dealerships")
    },
    {
      href: "/admin/analytics",
      label: "Analytics",
      icon: BarChart4,
      isActive: pathname.includes("/admin/analytics")
    }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50">
        <div 
          className="flex justify-between items-center w-full px-4 lg:px-8 transition-all duration-300
                    bg-black/95 backdrop-blur-xl border-b border-[#222] shadow-sm"
          style={{ height: `${NAVBAR_HEIGHT}px` }}
        >
          <div className="flex items-center gap-3">
            <Link href="/admin" className="group flex items-center gap-3">
              <div className="relative">
                <Image
                  src="/auto-fame-logo.png"
                  alt="Auto Fame Dealership Logo"
                  width={150}
                  height={50}
                  className="object-contain h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                  priority
                  draggable={false}
                />
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.12] text-zinc-300 font-semibold tracking-wider">
                  ADMIN
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1 bg-[#0a0a0a] rounded-lg p-1 border border-[#222]">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                    item.isActive 
                      ? "bg-white/[0.1] text-white border border-white/[0.12] shadow-sm" 
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="w-px h-5 bg-[#222] mx-1.5" />
            <button
              className="flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4" />
              <span>Main Site</span>
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a0a0a] hover:bg-[#151515] border border-[#222] text-zinc-400 hover:text-white transition-all duration-200"
              onClick={() => router.push("/admin/cars")}
              title="Search Cars"
            >
              <Search className="h-4 w-4" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2.5 cursor-pointer pl-1 pr-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.08]">
                  <Avatar className="h-7 w-7 ring-1 ring-white/20">
                    <AvatarFallback className="bg-zinc-800 text-white font-semibold text-xs font-mono">
                      {getUserInitial()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start text-left">
                    <span className="text-xs font-medium text-zinc-200">
                      {authUser?.userInfo?.email || "admin@autofame.co.za"}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Administrator
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-500 transition-transform duration-200" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-[#0a0a0a] shadow-2xl rounded-xl border border-[#222] mt-2 p-1.5 min-w-[220px] text-zinc-200"
                align="end"
                sideOffset={8}
              >
                <div className="px-3 py-2 border-b border-[#222] mb-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {authUser?.userInfo?.email || "admin@autofame.co.za"}
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    System Administrator
                  </p>
                </div>

                <DropdownMenuItem
                  className="cursor-pointer py-2 px-2.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-2.5 text-xs font-medium focus:bg-white/[0.06] focus:text-white"
                  onClick={() => router.push("/admin/settings")}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[#222] my-1" />

                <DropdownMenuItem
                  className="cursor-pointer py-2 px-2.5 rounded-lg text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all flex items-center gap-2.5 text-xs font-medium focus:bg-red-950/40 focus:text-red-300"
                  onClick={handleSignOut}
                  disabled={isLoading}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-8 w-8 rounded-lg bg-[#0a0a0a] hover:bg-[#151515] border border-[#222] p-0 text-zinc-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4 text-zinc-300" />
              ) : (
                <Menu className="h-4 w-4 text-zinc-300" />
              )}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0a0a0a] border-b border-[#222] shadow-xl p-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                    item.isActive 
                      ? "bg-white/[0.1] text-white border border-white/[0.12]" 
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="h-px bg-[#222] my-2" />
            <button
              className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              onClick={() => {
                router.push("/");
                setIsMobileMenuOpen(false);
              }}
            >
              <Home className="h-4 w-4" />
              <span>Main Site</span>
            </button>
          </div>
        )}
      </header>
    </>
  );
};

export default AdminNavbar;
