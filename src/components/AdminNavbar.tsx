"use client"

import { NAVBAR_HEIGHT } from "@/lib/constants"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useGetAuthUserQuery } from "@/state/api"
import { usePathname, useRouter } from "next/navigation"
import { logoutAdmin } from "@/app/admin/adminAuth"
import { ThemeToggle } from "@/components/ThemeToggle"
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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const AdminNavbar = () => {
  const { data: authUser } = useGetAuthUserQuery(undefined)
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  
  const getUserInitial = () => {
    if (authUser?.userInfo?.email) {
      return authUser.userInfo.email[0].toUpperCase();
    }
    return "A"; 
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    await logoutAdmin()
    window.location.href = "/admin-login"
  }

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
  ]

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50">
        <div 
          className="flex justify-between items-center w-full px-4 lg:px-8 transition-all duration-300
                    bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50
                    shadow-sm shadow-slate-200/20 dark:shadow-slate-900/20"
          style={{ height: `${NAVBAR_HEIGHT}px` }}
        >
          
          <div className="flex items-center gap-3">
            <Link href="/admin" className="group flex items-center gap-3">
              <div className="relative">
                <Image
                  src="/auto-fame-logo.png"
                  alt="Auto Fame Dealership Logo"
                  width={160}
                  height={54}
                  className="object-contain h-12 w-auto transition-transform duration-300 group-hover:scale-105"
                  priority
                  draggable={false}
                />
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/25">
                  <Shield className="h-4 w-4 text-white" />
                  <span className="font-semibold text-white text-sm tracking-wide">ADMIN</span>
                </div>
              </div>
            </Link>
          </div>

          
          <nav className="hidden lg:flex items-center gap-1 bg-slate-50/80 dark:bg-slate-900/80 rounded-full px-2 py-1 border border-slate-200/50 dark:border-slate-800/50">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  className={`gap-2 rounded-full px-4 py-2 transition-all duration-300 ${
                    item.isActive 
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10 border border-blue-200/50 dark:border-blue-800/50" 
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60"
                  }`}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              )
            })}
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2" />
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-full px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300"
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4" />
              <span className="font-medium">Main Site</span>
            </Button>
          </nav>

          
          <div className="flex items-center gap-2">
            
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 transition-all duration-300"
            >
              <Search className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </Button>

            
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-0 transition-all duration-300 relative"
            >
              <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500 border-2 border-white dark:border-slate-950">
                3
              </Badge>
            </Button>

            <ThemeToggle />
            
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer">
                  <Avatar className="h-8 w-8 ring-2 ring-blue-200 dark:ring-blue-800 ring-offset-2 ring-offset-white dark:ring-offset-slate-950">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                      {getUserInitial()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start text-left">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {authUser?.userInfo?.email || "admin@student24.co.za"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Administrator
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-300" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 mt-2 p-2 min-w-[220px] animate-in fade-in-0 zoom-in-95 duration-300"
                align="end"
                sideOffset={8}
              >
                <div className="px-3 py-2 border-b border-slate-200/50 dark:border-slate-800/50 mb-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {authUser?.userInfo?.email || "admin@student24.co.za"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    System Administrator
                  </p>
                </div>

                <DropdownMenuItem
                  className="cursor-pointer py-2.5 px-3 my-1 rounded-xl text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-200 flex items-center gap-3 text-sm font-medium"
                  onClick={() => router.push("/admin/profile")}
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer py-2.5 px-3 my-1 rounded-xl text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-200 flex items-center gap-3 text-sm font-medium"
                  onClick={() => router.push("/admin/settings")}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-800/50 my-2" />

                <DropdownMenuItem
                  className="cursor-pointer py-2.5 px-3 my-1 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 flex items-center gap-3 text-sm font-medium"
                  onClick={handleSignOut}
                  disabled={isLoading}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isLoading ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              ) : (
                <Menu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              )}
            </Button>
          </div>
        </div>

        
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-xl animate-in slide-in-from-top-2 duration-300">
            <nav className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start gap-3 py-3 px-4 rounded-xl transition-all duration-300 ${
                      item.isActive 
                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50" 
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    }`}
                    onClick={() => {
                      router.push(item.href)
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                )
              })}
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-3" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 py-3 px-4 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-300"
                onClick={() => {
                  router.push("/")
                  setIsMobileMenuOpen(false)
                }}
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Main Site</span>
              </Button>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}

export default AdminNavbar
