"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth } from "@/components/ConvexAuthProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, Phone, User, LogOut } from "lucide-react";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { siteConfig } from "@/lib/siteConfig";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/gallery", label: "Gallery" },
  { href: "/inventory", label: "Showroom" },
  { href: "/financing", label: "Finance Application" },
  { href: "/blog", label: "Blog" },
  { href: "/contact-us", label: "Contact Us" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useConvexAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const active = (href: string) => {
    const base = href.split("#")[0];
    return pathname === base && (href === "/" || !href.includes("#"));
  };

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 backdrop-blur-2xl border-b",
        scrolled
          ? "bg-[#070A08]/90 border-white/15 shadow-2xl"
          : "bg-[#070A08]/75 border-white/10"
      )}
    >
      <div
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4"
        style={{ height: NAVBAR_HEIGHT }}
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2" aria-label="AutoFame Home">
            <Image
              src="/auto-fame-logo.png"
              alt="AutoFame Logo"
              width={220}
              height={80}
              priority
              className="h-14 w-auto object-contain filter drop-shadow"
            />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 font-display text-xs font-semibold tracking-wider uppercase">
          {links.map((l) => {
            const isActive = active(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-3.5 py-2 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-[#00A211] text-white shadow-md shadow-[#00A211]/30 font-bold"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Contact Info */}
          <div className="hidden lg:flex items-center gap-2">
            <a
              href="https://wa.me/27612259884?text=Hi%20AutoFame!%20I%27m%20interested%20in%20a%20vehicle"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white/10 hover:bg-[#25D366]/20 text-[#25D366] transition-colors border border-white/10"
              aria-label="WhatsApp Us"
            >
              <svg viewBox="0 0 32 32" className="h-5 w-5 fill-current">
                <path d="M16 0c8.8 0 16 7.18 16 16 0 2.84-.74 5.5-2.05 7.8L32 32l-8.63-2.24A15.93 15.93 0 0 1 16 32C7.18 32 0 24.82 0 16S7.18 0 16 0Z" />
                <path fill="#FFF" d="M25.04 22.47c-.37 1-1.82 1.86-2.55 1.97-.65.1-1.48.15-2.38-.15-.55-.18-1.25-.41-2.17-.82-3.82-1.65-6.32-5.47-6.52-5.75-.2-.28-1.56-2.07-1.56-3.94 0-1.87.99-2.8 1.34-3.18.35-.38.76-.47 1-.47.25 0 .51.003.73.014.23.01.56-.09.88.69.33.78 1.07 2.62 1.16 2.81.09.19.15.41.03.66-.12.25-.19.41-.38.62-.19.21-.4.47-.16.92.22.44 1 1.63 2.14 2.64 1.48 1.3 2.7 1.71 3.08 1.9.37.18.6.15.83-.09.22-.24.94-1.09 1.2-1.47.25-.38.5-.31.85-.19.35.12 2.21 1.04 2.58 1.22.38.19.64.28.74.44.1.17.09.91-.16 1.91Z" />
              </svg>
            </a>

            <a
              href="tel:0612259884"
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-semibold transition-all border border-white/10"
            >
              <Phone className="h-3.5 w-3.5 text-[#35D04A]" />
              <span>061 225 9884</span>
            </a>
          </div>

          {/* User Auth Buttons */}
          {user ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSignOut}
                className="h-9 px-3 text-xs rounded-xl text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/sign-in")}
                className="h-9 text-xs rounded-xl text-white/80 hover:text-white hover:bg-white/10"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/sign-up")}
                className="h-9 text-xs rounded-xl bg-[#00A211] hover:bg-[#00870e] text-white font-semibold shadow-md"
              >
                Register
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/20 transition"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-[max-height] duration-300 bg-[#070A08]/95 backdrop-blur-2xl border-b border-white/10",
          open ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="px-4 pt-3 pb-6 space-y-2 font-display text-xs font-semibold uppercase tracking-wider">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-2.5 rounded-xl transition-all",
                active(l.href)
                  ? "bg-[#00A211] text-white font-bold"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              {l.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-white/10 flex items-center gap-3">
            <a
              href="tel:0612259884"
              className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-white/10 text-white text-xs font-mono font-semibold"
            >
              <Phone className="h-4 w-4 text-[#35D04A]" />
              061 225 9884
            </a>
            {!user && (
              <Button
                size="sm"
                onClick={() => {
                  setOpen(false);
                  router.push("/sign-up");
                }}
                className="flex-1 h-10 rounded-xl bg-[#00A211] hover:bg-[#00870e] text-white text-xs font-bold"
              >
                Register
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
