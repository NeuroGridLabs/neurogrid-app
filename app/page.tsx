"use client"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/modules/footer"
import { ScanlineOverlay } from "@/components/atoms/scanline-overlay"
import { HeroSection } from "@/components/modules/hero-section"
import { GenesisLive } from "@/components/modules/genesis-live"
import { ProtocolStats } from "@/components/modules/protocol-stats"
import { TrustCenter } from "@/components/modules/trust-center"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#050505" }}>
      <ScanlineOverlay />
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <GenesisLive />
        <ProtocolStats />
        <TrustCenter />
      </main>
      <Footer />
    </div>
  )
}
