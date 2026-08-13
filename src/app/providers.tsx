"use client"

import StoreProvider from "@/state/redux"
import { ConvexAuthProvider } from "@/components/ConvexAuthProvider"
import { ThemeProvider } from "@/components/ThemeProvider"
import { CSPostHogProvider } from "@/components/PostHogProvider"

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <CSPostHogProvider>
      <StoreProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ConvexAuthProvider>{children}</ConvexAuthProvider>
        </ThemeProvider>
      </StoreProvider>
    </CSPostHogProvider>
  )
}

export default Providers
