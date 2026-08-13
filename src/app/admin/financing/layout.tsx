"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FinancingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  return (
    <div className="container mx-auto px-4 py-4">
      <Tabs value={getTabValue(pathname)} className="mb-8">
        <TabsList className="w-full justify-start mb-2 bg-transparent space-x-4">
          <TabsTrigger
            value="dashboard"
            className={cn(
              "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-100"
            )}
            asChild
          >
            <Link href="/admin/financing/dashboard">Dashboard</Link>
          </TabsTrigger>
          <TabsTrigger 
            value="applications" 
            className={cn(
              "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-100"
            )}
            asChild
          >
            <Link href="/admin/financing/applications">Applications</Link>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className={cn(
              "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-100"
            )}
            asChild
          >
            <Link href="/admin/financing/analytics">Analytics</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {children}
    </div>
  );
}

function getTabValue(pathname: string): string {
  if (pathname.includes('/admin/financing/dashboard')) return 'dashboard';
  if (pathname.includes('/admin/financing/applications')) return 'applications';
  if (pathname.includes('/admin/financing/analytics')) return 'analytics';
  return 'dashboard'; // Default
}
