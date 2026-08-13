"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Mail, User, Check } from "lucide-react";
import { registerAdmin, ALLOWED_ADMIN_EMAILS } from "../admin/adminAuth";

export default function AdminSignup() {
  const [email, setEmail] = useState("alexsouthflow@gmail.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword || !name) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerAdmin(name, email, password);

      if (result.success) {
        toast.success(result.message || "Admin account registered successfully");
        setTimeout(() => {
          window.location.href = "/admin";
        }, 300);
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Admin signup error:", error);
      toast.error(error.message || "Failed to create admin account");
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
            <CardTitle className="text-2xl font-bold text-center">Admin Registration</CardTitle>
          </div>
          <CardDescription className="text-center">
            Register an authorized admin account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

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
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Confirm Password
              </label>
              <div className="relative">
                <Check className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
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
                  Registering...
                </>
              ) : (
                "Create Admin Account"
              )}
            </Button>
          </CardFooter>
        </form>

        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <p>Already registered? <a href="/admin-login" className="text-blue-600 hover:underline font-medium">Log in here</a></p>
        </div>
      </Card>
    </div>
  );
}
