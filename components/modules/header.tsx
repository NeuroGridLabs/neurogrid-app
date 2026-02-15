"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Nodes", href: "/nodes" },
  { label: "Miner", href: "/miner" },
  { label: "Docs", href: "https://docs.neurogridprotocol.io", external: true },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header
      className="sticky top-0 z-40 border-b border-border"
      style={{ backgroundColor: "rgba(5,5,5,0.95)", backdropFilter: "blur(8px)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/images/neurogrid-logo.png"
            alt="NeuroGrid Protocol logo"
            width={36}
            height={36}
            className="object-contain"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wider" style={{ color: "#00FF41" }}>
              NEUROGRID
            </span>
            <span className="text-xs tracking-widest" style={{ color: "rgba(0,255,65,0.4)" }}>
              PROTOCOL
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs uppercase tracking-wider transition-colors hover:opacity-80"
                style={{ color: "rgba(0,255,65,0.5)" }}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs uppercase tracking-wider transition-colors hover:opacity-80"
                style={{
                  color: pathname === link.href ? "#00FF41" : "rgba(0,255,65,0.5)",
                  textShadow: pathname === link.href ? "0 0 8px rgba(0,255,65,0.4)" : "none",
                }}
              >
                {link.label}
              </Link>
            )
          )}
          <div
            className="flex items-center gap-2 border px-3 py-1.5 text-xs"
            style={{ borderColor: "#00FF41", color: "#00FF41" }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#00FF41", boxShadow: "0 0 6px #00FF41" }}
            />
            GENESIS BOOTSTRAPPING
          </div>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" style={{ color: "#00FF41" }} />
          ) : (
            <Menu className="h-5 w-5" style={{ color: "#00FF41" }} />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          className="flex flex-col gap-3 border-t border-border px-4 py-4 md:hidden"
          style={{ backgroundColor: "rgba(5,5,5,0.98)" }}
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm uppercase tracking-wider"
                style={{ color: "rgba(0,255,65,0.6)" }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm uppercase tracking-wider"
                style={{
                  color: pathname === link.href ? "#00FF41" : "rgba(0,255,65,0.6)",
                }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      )}
    </header>
  )
}
