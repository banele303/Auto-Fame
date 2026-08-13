"use client"

import Navbar from "@/components/Navbar"
import { NAVBAR_HEIGHT } from "@/lib/constants"
import { useConvexAuth } from "@/components/ConvexAuthProvider"
import { usePathname } from "next/navigation"
import React from "react"
import { Toaster } from "@/components/ui/sonner"
import WelcomeToast from "@/components/WelcomeToast"

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { loading } = useConvexAuth()
  const pathname = usePathname()

  return (
    <div className="h-full w-full">
      <Navbar />
      <WelcomeToast />
      <Toaster position="top-center" />
      <main className="min-h-screen flex w-full flex-col" style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
        {children}
      </main>
    </div>
  )
}

export default Layout
