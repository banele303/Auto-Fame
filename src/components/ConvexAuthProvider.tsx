"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { convexClient } from "@/lib/convex"

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
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export default ConvexAuthProvider
