"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useConvexAuth } from "@/components/ConvexAuthProvider"
import Link from "next/link"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { signIn } = useConvexAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await signIn(email, password)
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Invalid email or password")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Sign In</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Sign in to Advance Auto</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#00A211] hover:bg-[#009210] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-[#00A211] hover:underline font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
