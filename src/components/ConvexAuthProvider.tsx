"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { convexClient } from "@/lib/convex"

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://reliable-sturgeon-574.convex.cloud"

const convexReactClient = new ConvexReactClient(convexUrl)

type AuthUser = { id: string; email: string; name: string; role: string } | null

type AuthContextType = {
  user: AuthUser
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
})

export function useConvexAuth() {
  return useContext(AuthContext)
}

export function ConvexAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null)
  const [loading, setLoading] = useState(true)

  // Check stored token on mount
  useEffect(() => {
    const token = localStorage.getItem("convex_token")
    if (token) {
      ;(convexClient as any)
        .query("auth:getCurrentUser", { token })
        .then((u: any) => { if (u) setUser(u as AuthUser) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const result: any = await (convexClient as any).mutation("auth:signIn", { email, password })
    localStorage.setItem("convex_token", result.token)
    setUser(result.user as AuthUser)
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    await (convexClient as any).mutation("auth:signUp", { email, password, name })
    const result: any = await (convexClient as any).mutation("auth:signIn", { email, password })
    localStorage.setItem("convex_token", result.token)
    setUser(result.user as AuthUser)
  }, [])

  const signOut = useCallback(() => {
    const token = localStorage.getItem("convex_token")
    if (token) (convexClient as any).mutation("auth:signOut", { token })
    localStorage.removeItem("convex_token")
    setUser(null)
  }, [])

  return (
    <ConvexProvider client={convexReactClient}>
      <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
        {children}
      </AuthContext.Provider>
    </ConvexProvider>
  )
}

export default ConvexAuthProvider
