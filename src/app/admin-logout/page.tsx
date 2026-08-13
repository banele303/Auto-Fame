"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminLogout() {
  const router = useRouter();

  useEffect(() => {
    
    document.cookie = "admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    
    toast.success("Admin logged out successfully");
    
    
    router.push("/admin-login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Logging out...</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">You will be redirected shortly.</p>
      </div>
    </div>
  );
}
