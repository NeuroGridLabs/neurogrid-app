"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/modules/footer"
import { ScanlineOverlay } from "@/components/atoms/scanline-overlay"
import { NodeCluster } from "@/components/modules/node-cluster"
import { SmartTerminal } from "@/components/modules/smart-terminal"
import { TreasuryViz } from "@/components/modules/treasury-viz"

export default function AdminDashboard() {
  const [terminalMinimized, setTerminalMinimized] = useState(false)

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#050505" }}>
      <ScanlineOverlay />
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6">
        {/* Title */}
        <div
          className="flex flex-col gap-1 border border-border p-4"
          style={{ backgroundColor: "rgba(0,255,65,0.02)" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-sm font-bold tracking-wider md:text-base" style={{ color: "#00FF41" }}>
              ADMIN DASHBOARD
            </h1>
            <span className="text-xs" style={{ color: "rgba(0,255,65,0.3)" }}>|</span>
            <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
              Node Command Center
            </span>
          </div>
          <p className="text-xs" style={{ color: "rgba(0,255,65,0.5)" }}>
            Real-time monitoring -- Physical hardware verified via Proof-of-Inference
          </p>
        </div>

        {/* Grid: Nodes + Treasury */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <NodeCluster />
          <TreasuryViz />
        </div>

        {/* Terminal */}
        <SmartTerminal
          isMinimized={terminalMinimized}
          onToggleMinimize={() => setTerminalMinimized((m) => !m)}
        />
      </main>

      <Footer />
    </div>
  )
}
