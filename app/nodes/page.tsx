"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/modules/footer"
import { ScanlineOverlay } from "@/components/atoms/scanline-overlay"
import { NodeCluster } from "@/components/modules/node-cluster"
import { SmartTerminal } from "@/components/modules/smart-terminal"
import { TreasuryViz } from "@/components/modules/treasury-viz"
import { useWallet } from "@/lib/wallet-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function NodesPage() {
  const { isConnected, openConnectModal } = useWallet()
  const [terminalMinimized, setTerminalMinimized] = useState(false)
  const [deployModalOpen, setDeployModalOpen] = useState(false)

  const handleDeployClick = () => {
    if (!isConnected) openConnectModal()
    else setDeployModalOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#050505" }}>
      <ScanlineOverlay />
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6">
        {/* Title - 算力超市 */}
        <div
          className="flex flex-col gap-1 border border-border p-4"
          style={{ backgroundColor: "rgba(0,255,65,0.02)" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-sm font-bold tracking-wider md:text-base" style={{ color: "#00FF41" }}>
              NODES
            </h1>
            <span className="text-xs" style={{ color: "rgba(0,255,65,0.3)" }}>|</span>
            <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
              算力超市 · Compute Marketplace
            </span>
          </div>
          <p className="text-xs" style={{ color: "rgba(0,255,65,0.5)" }}>
            Rent decentralized GPU compute — Physical hardware verified via Proof-of-Inference
          </p>
          {!isConnected && (
            <p className="mt-2 text-xs font-medium" style={{ color: "#00FF41" }}>
              Please Connect Wallet to Proceed
            </p>
          )}
        </div>

        {/* Grid: Nodes + Treasury */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <NodeCluster
            isConnected={isConnected}
            onDeployClick={handleDeployClick}
          />
          <TreasuryViz />
        </div>

        {/* Terminal */}
        <SmartTerminal
          isMinimized={terminalMinimized}
          onToggleMinimize={() => setTerminalMinimized((m) => !m)}
        />
      </main>

      <Footer />

      {/* Deploy Config Modal */}
      <Dialog open={deployModalOpen} onOpenChange={setDeployModalOpen}>
        <DialogContent
          className="border"
          style={{
            backgroundColor: "var(--terminal-bg)",
            borderColor: "rgba(0,255,65,0.3)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider" style={{ color: "#00FF41" }}>
              Deploy via NeuroGrid
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs" style={{ color: "rgba(0,255,65,0.6)" }}>
              100% of Protocol Fees support the $NRG Hard-Asset Floor.
            </p>
            <div
              className="border p-4"
              style={{
                borderColor: "rgba(0,255,65,0.2)",
                backgroundColor: "rgba(0,255,65,0.03)",
              }}
            >
              <p className="mb-2 text-xs font-bold uppercase" style={{ color: "#00FF41" }}>
                100% Protocol Buyback Engine
              </p>
              <p className="text-xs" style={{ color: "rgba(0,255,65,0.6)" }}>
                All deployment fees flow into the $NRG buyback engine to strengthen the hard-asset floor.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeployModalOpen(false)}
                className="flex-1 border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-90"
                style={{ borderColor: "#00FF41", color: "#00FF41" }}
              >
                Confirm Deploy
              </button>
              <button
                type="button"
                onClick={() => setDeployModalOpen(false)}
                className="px-4 py-2 text-xs uppercase tracking-wider"
                style={{ color: "rgba(0,255,65,0.5)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
