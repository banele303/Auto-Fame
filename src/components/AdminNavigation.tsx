"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  Car,
  Users,
  DollarSign,
  MessageSquare,
  BarChart3,
  Settings,
  Building,
  Calculator
} from "lucide-react";

const AdminNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: Home,
      exact: true
    },
    {
      label: "Cars",
      href: "/admin/cars",
      icon: Car
    },
    {
      label: "Sales",
      href: "/admin/sales",
      icon: DollarSign
    },
    {
      label: "Financing",
      href: "/admin/financing/dashboard",
      icon: Calculator
    },
    {
      label: "Employees",
      href: "/admin/employees",
      icon: Users
    },
    {
      label: "Customers",
      href: "/admin/customers",
      icon: Users
    },
    {
      label: "Inquiries",
      href: "/admin/inquiries",
      icon: MessageSquare
    },
    {
      label: "Dealerships",
      href: "/admin/dealerships",
      icon: Building
    },
    {
      label: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: Settings
    }
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Admin Panel
              </h2>
            </div>
            <div className="flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                
                return (
                  <Button
                    key={item.href}
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "gap-2 transition-colors",
                      active 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;
