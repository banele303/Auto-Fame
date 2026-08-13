"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Mail } from "lucide-react";
import { loginAsAdmin, checkAdminAuth, ALLOWED_ADMIN_EMAILS } from "../admin/adminAuth";

export default function AdminLogin() {
  const [email, setEmail] = useState("autofame1@gmail.com");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const fromPath = searchParams.get('from') || '/admin';
    const errorParam = searchParams.get('error');

    if (errorParam) {
      if (errorParam === 'auth') {
        toast.error("Authentication required for admin area");
      } else if (errorParam === 'no_session') {
        toast.error("Your session has expired. Please log in again");
      } else if (errorParam === 'not_admin') {
        toast.error("You don't have admin privileges");
      }
    }

    const checkAuth = async () => {
      try {
        const { isAuthenticated } = await checkAdminAuth();
        if (isAuthenticated) {
          console.log("✅ Already authenticated as admin, redirecting to:", fromPath);
          router.replace(fromPath);
        }
      } catch (error) {
        console.log("Not authenticated as admin", error);
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginAsAdmin(email, password);

      if (result.success) {
        const searchParams = new URLSearchParams(window.location.search);
        const fromPath = searchParams.get('from') || '/admin';

        toast.success(result.message || "Admin login successful");

        setTimeout(() => {
          window.location.href = fromPath;
        }, 300);
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="mb-4">
            <Image 
              src="/auto-fame-logo.png" 
              alt="Auto Fame Logo" 
              width={140} 
              height={48} 
              className="object-contain" 
            />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-2xl font-bold text-center">Admin Access</CardTitle>
          </div>
          <CardDescription className="text-center">
            Secure login for authorized administrators only
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="alexsouthflow@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-3 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-semibold">Authorized Admin Emails:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {ALLOWED_ADMIN_EMAILS.map((addr) => (
                  <li key={addr} className="font-mono">{addr}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          
          <CardFooter className="mt-2 flex flex-col space-y-3">
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 shadow-md font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Authenticating...
                </>
              ) : (
                "Access Admin Dashboard"
              )}
            </Button>
          </CardFooter>
        </form>

        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <p>Need access? Register your authorized admin email <a href="/admin-signup" className="text-blue-600 hover:underline font-medium">here</a>.</p>
        </div>
      </Card>
    </div>
  );
}
