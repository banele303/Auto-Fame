"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useConvexAuth } from "@/components/ConvexAuthProvider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Menu, X, Phone } from "lucide-react"
import { NAVBAR_HEIGHT } from "@/lib/constants"
import { siteConfig } from "@/lib/siteConfig"

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/gallery", label: "Gallery" },
  { href: "/inventory", label: "Showroom" },
  { href: "/financing", label: "Finance Application" },
  { href: "/blog", label: "Blog" },
  { href: "/contact-us", label: "Contact Us" },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useConvexAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const active = (href: string) => {
    const base = href.split("#")[0]
    return pathname === base && (href === "/" || !href.includes("#"))
  }

  const handleSignOut = async () => {
    await signOut()
    router.refresh()
  }

  return (
    <header className={cn(
      "fixed top-0 inset-x-0 z-40 transition-colors backdrop-blur-xl border-b",
      "bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800"
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6" style={{ height: NAVBAR_HEIGHT }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2" aria-label={`${siteConfig.brand.name} Home`}>
            <Image src="/auto-fame-logo.png" alt="Auto Fame Logo" width={220} height={80} priority className="h-16 w-auto object-contain drop-shadow-sm" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={cn(
                "px-3 py-2 rounded-md transition-colors",
                active(l.href)
                  ? "text-white shadow-sm bg-[var(--tw-nav-green,#00A211)]"
                  : "text-[var(--tw-nav-green,#00A211)] dark:text-[var(--tw-nav-green,#00A211)] hover:bg-[var(--tw-nav-green,#00A211)]/10 hover:text-[var(--tw-nav-green,#008d0f)] dark:hover:text-[var(--tw-nav-green,#35d04a)]"
              )}
            >{l.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mr-2">
            <a href="https://wa.me/27680720424?text=Hi%20I%27m%20interested%20in%20a%20vehicle" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white hover:bg-[var(--tw-nav-green,#00A211)]/10 shadow-sm transition">
              <svg viewBox="0 0 32 32" className="h-7 w-7"><path fill="#25D366" d="M16 0c8.8 0 16 7.18 16 16 0 2.84-.74 5.5-2.05 7.8L32 32l-8.63-2.24A15.93 15.93 0 0 1 16 32C7.18 32 0 24.82 0 16S7.18 0 16 0Z"/><path fill="#FFF" d="M25.04 22.47c-.37 1-1.82 1.86-2.55 1.97-.65.1-1.48.15-2.38-.15-.55-.18-1.25-.41-2.17-.82-3.82-1.65-6.32-5.47-6.52-5.75-.2-.28-1.56-2.07-1.56-3.94 0-1.87.99-2.8 1.34-3.18.35-.38.76-.47 1-.47.25 0 .51.003.73.014.23.01.56-.09.88.69.33.78 1.07 2.62 1.16 2.81.09.19.15.41.03.66-.12.25-.19.41-.38.62-.19.21-.4.47-.16.92.22.44 1 1.63 2.14 2.64 1.48 1.3 2.7 1.71 3.08 1.9.37.18.6.15.83-.09.22-.24.94-1.09 1.2-1.47.25-.38.5-.31.85-.19.35.12 2.21 1.04 2.58 1.22.38.19.64.28.74.44.1.17.09.91-.16 1.91Z"/></svg>
            </a>
            <a href="tel:+276****0424" aria-label="Call"
              className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-white hover:bg-[var(--tw-nav-green,#00A211)]/10 text-[var(--tw-nav-green,#00A211)] gap-2 text-sm font-medium transition-colors shadow-sm">
              <Phone className="h-4 w-4" />
              <span className="hidden xl:inline">Call</span>
            </a>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSignOut}>Sign out</Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/sign-in")}>Login</Button>
              <Button size="sm" onClick={() => router.push("/sign-up")}>Register</Button>
            </div>
          )}

          <button type="button" aria-label="Toggle menu"
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-200"
            onClick={() => setOpen(o => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className={cn("md:hidden overflow-hidden transition-[max-height] duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800", open ? "max-h-96" : "max-h-0")}>
        <div className="px-4 pt-2 pb-6 space-y-2">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active(l.href) ? "text-white shadow-sm bg-[var(--tw-nav-green,#00A211)]" : "text-[var(--tw-nav-green,#00A211)] dark:text-[var(--tw-nav-green,#00A211)] hover:bg-[var(--tw-nav-green,#00A211)]/10 hover:text-[var(--tw-nav-green,#008d0f)] dark:hover:text-[var(--tw-nav-green,#35d04a)]"
              )}>{l.label}</Link>
          ))}
          <div className="pt-2 flex flex-col gap-2 border-t border-slate-200 dark:border-slate-700 mt-2">
            <div className="flex items-center gap-3 pb-2">
              <a href="https://wa.me/27680720424?text=Hi%20I%27m%20interested%20in%20a%20vehicle" target="_blank" rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-md bg-[var(--tw-nav-green,#00A211)] hover:brightness-110 text-white text-sm font-medium transition-colors shadow-sm">
                <svg viewBox="0 0 32 32" className="h-5 w-5"><path fill="#25D366" d="M16 0c8.8 0 16 7.18 16 16 0 2.84-.74 5.5-2.05 7.8L32 32l-8.63-2.24A15.93 15.93 0 0 1 16 32C7.18 32 0 24.82 0 16S7.18 0 16 0Z"/><path fill="#FFF" d="M25.04 22.47c-.37 1-1.82 1.86-2.55 1.97-.65.1-1.48.15-2.38-.15-.55-.18-1.25-.41-2.17-.82-3.82-1.65-6.32-5.47-6.52-5.75-.2-.28-1.56-2.07-1.56-3.94 0-1.87.99-2.8 1.34-3.18.35-.38.76-.47 1-.47.25 0 .51.003.73.014.23.01.56-.09.88.69.33.78 1.07 2.62 1.16 2.81.09.19.15.41.03.66-.12.25-.19.41-.38.62-.19.21-.4.47-.16.92.22.44 1 1.63 2.14 2.64 1.48 1.3 2.7 1.71 3.08 1.9.37.18.6.15.83-.09.22-.24.94-1.09 1.2-1.47.25-.38.5-.31.85-.19.35.12 2.21 1.04 2.58 1.22.38.19.64.28.74.44.1.17.09.91-.16 1.91Z"/></svg>
                WhatsApp
              </a>
              <a href="tel:+276****0424" className="h-10 flex items-center justify-center gap-2 text-[var(--tw-nav-green,#00A211)] text-sm font-medium transition-colors hover:text-[var(--tw-nav-green,#008d0f)]">
                <Phone className="h-4 w-4" />
                Call
              </a>
            </div>
            {user ? (
              <Button className="justify-start" onClick={handleSignOut}>Sign out</Button>
            ) : (
              <>
                <Button variant="ghost" className="justify-start" onClick={() => router.push("/sign-in")}>Login</Button>
                <Button className="justify-start" onClick={() => router.push("/sign-up")}>Register</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
