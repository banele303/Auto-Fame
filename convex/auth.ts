import { v } from "convex/values"
import { mutation, query, internalMutation } from "./_generated/server"
import { Doc, Id } from "./_generated/dataModel"

// Simple email/password auth using Convex only — no AWS, no third-party auth

export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check existing
    const existing = await ctx.db
      .query("authUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()
    if (existing) throw new Error("Email already registered")

    // Hash password (simple for now — use bcrypt in production)
    const passwordHash = await hashPassword(args.password)

    const now = new Date().toISOString()
    const userId = await ctx.db.insert("authUsers", {
      email: args.email,
      passwordHash,
      name: args.name,
      role: args.role || "user",
      createdAt: now,
      updatedAt: now,
    })

    return { userId, email: args.email, name: args.name }
  },
})

export const signIn = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("authUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()
    if (!user) throw new Error("Invalid email or password")

    const valid = await verifyPassword(args.password, user.passwordHash)
    if (!valid) throw new Error("Invalid email or password")

    // Create session token
    const token = generateToken()
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await ctx.db.insert("authSessions", {
      userId: user._id,
      token,
      createdAt: now,
      expiresAt,
    })

    return { token, user: { id: user._id, email: user.email, name: user.name, role: user.role } }
  },
})

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("authSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first()
    if (session) await ctx.db.delete(session._id)
  },
})

export const getCurrentUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("authSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first()
    if (!session || new Date(session.expiresAt) < new Date()) return null
    const user = await ctx.db.get(session.userId)
    if (!user) return null
    return { id: user._id, email: user.email, name: user.name, role: user.role }
  },
})

// Helpers
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  for (let i = 0; i < 64; i++) token += chars[Math.floor(Math.random() * chars.length)]
  return token
}

async function hashPassword(password: string): Promise<string> {
  // Simple SHA-256 hash — use bcrypt in production
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return (await hashPassword(password)) === hash
}
