"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { NeonButton } from "@/components/atoms/neon-button"
import { StatusBadge } from "@/components/atoms/status-badge"

// Seeded pseudo-random for deterministic SSR
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function Gpu4090Render() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer hex glow */}
      <svg
        width="280"
        height="280"
        viewBox="0 0 280 280"
        className="absolute animate-hex-spin"
        style={{ opacity: 0.2 }}
      >
        <polygon
          points="140,10 260,75 260,205 140,270 20,205 20,75"
          fill="none"
          stroke="#00FFFF"
          strokeWidth="1"
        />
      </svg>
      <svg
        width="220"
        height="220"
        viewBox="0 0 220 220"
        className="absolute"
        style={{ opacity: 0.15, animation: "hexRotate 15s linear infinite reverse" }}
      >
        <polygon
          points="110,10 200,60 200,160 110,210 20,160 20,60"
          fill="none"
          stroke="#00FF41"
          strokeWidth="1"
        />
      </svg>

      {/* GPU Card */}
      <div
        className="relative z-10 flex flex-col items-center gap-3 border p-6"
        style={{
          borderColor: "rgba(0,255,255,0.3)",
          backgroundColor: "rgba(0,255,255,0.02)",
          boxShadow: "0 0 40px rgba(0,255,255,0.08), inset 0 0 30px rgba(0,255,255,0.02)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider" style={{ color: "#00FFFF" }}>
            RTX4090
          </span>
          <StatusBadge status="VERIFIED" />
        </div>
        <div
          className="flex flex-col items-center gap-1 border-t pt-3"
          style={{ borderColor: "rgba(0,255,255,0.15)" }}
        >
          <span className="text-2xl font-bold" style={{ color: "#00FFFF" }}>
            GENESIS_PROVED
          </span>
          <span className="text-xs" style={{ color: "rgba(0,255,255,0.5)" }}>
            Hardware Fingerprint Verified via PoI
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col">
            <span className="text-xs font-bold" style={{ color: "#00FFFF" }}>24GB</span>
            <span className="text-xs" style={{ color: "rgba(0,255,255,0.4)" }}>VRAM</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold" style={{ color: "#00FFFF" }}>21Gbps</span>
            <span className="text-xs" style={{ color: "rgba(0,255,255,0.4)" }}>BW</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold" style={{ color: "#00FFFF" }}>8</span>
            <span className="text-xs" style={{ color: "rgba(0,255,255,0.4)" }}>vCPUs</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function HexBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        x: Math.round(seededRandom(i * 3) * 100),
        y: Math.round(seededRandom(i * 7) * 100),
        size: Math.round(1 + seededRandom(i * 11) * 2),
        delay: Math.round(seededRandom(i * 13) * 5),
        duration: Math.round(3 + seededRandom(i * 17) * 4),
        isBlue: i % 3 === 0,
      })),
    []
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.isBlue ? "rgba(0,255,255,0.15)" : "rgba(0,255,65,0.1)",
            animationName: "pulse-glow",
            animationDuration: `${p.duration}s`,
            animationTimingFunction: "ease-in-out",
            animationDelay: `${p.delay}s`,
            animationIterationCount: "infinite",
          }}
        />
      ))}
    </div>
  )
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <section className="relative flex min-h-[65vh] flex-col items-center justify-center gap-10 px-4 py-16 md:py-24">
      <HexBackground />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <h1
          className="text-balance text-2xl font-bold uppercase tracking-wider md:text-4xl lg:text-5xl"
          style={{ color: "#00FF41" }}
        >
          The Liquidity Layer
          <br />
          <span style={{ color: "#00FFFF" }}>for AI Compute</span>
        </h1>
        <p
          className="max-w-xl text-pretty font-sans text-sm leading-relaxed md:text-base"
          style={{ color: "rgba(0,255,65,0.5)" }}
        >
          Decentralized GPU exchange powered by FRP tunneling and
          Proof-of-Inference. Community-driven. Anti-VC. Fair launch.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/nodes">
            <NeonButton variant="primary">Launch dApp</NeonButton>
          </Link>
          <Link href="/miner">
            <NeonButton variant="secondary">Become a Miner</NeonButton>
          </Link>
        </div>
      </div>

      <div
        className={`relative z-10 transition-all duration-700 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <Gpu4090Render />
      </div>
    </section>
  )
}
