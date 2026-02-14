"use client"

import { useState, useCallback } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/modules/footer"
import { ScanlineOverlay } from "@/components/atoms/scanline-overlay"
import { NodeCluster, type RentedNodeSnapshot } from "@/components/modules/node-cluster"
import { RentedNodesPanel } from "@/components/modules/rented-nodes-panel"
import { SmartTerminal } from "@/components/modules/smart-terminal"
import { TreasuryViz } from "@/components/modules/treasury-viz"
import { useWallet } from "@/lib/wallet-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowRight, TrendingUp } from "lucide-react"

export default function NodesPage() {
  const { isConnected, address, openConnectModal } = useWallet()
  const [terminalMinimized, setTerminalMinimized] = useState(false)
  const [deployModalOpen, setDeployModalOpen] = useState(false)
  const [myRentedNodes, setMyRentedNodes] = useState<RentedNodeSnapshot[]>([])
  const [triggerUndeployNodeId, setTriggerUndeployNodeId] = useState<string | null>(null)

  const handleDeployComplete = useCallback((node: RentedNodeSnapshot) => {
    setMyRentedNodes((prev) => [...prev, node])
  }, [])
  const handleUndeployComplete = useCallback((nodeId: string) => {
    setMyRentedNodes((prev) => prev.filter((n) => n.id !== nodeId))
    setTriggerUndeployNodeId(null)
  }, [])
  const handleUndeployFromPanel = useCallback((nodeId: string) => {
    setTriggerUndeployNodeId(nodeId)
  }, [])
  const handleUndeployModalOpen = useCallback(() => {
    setTriggerUndeployNodeId(null)
  }, [])

  const handleDeployClick = () => {
    if (!isConnected) openConnectModal()
    else setDeployModalOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#050505" }}>
      <ScanlineOverlay />
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6">
        {/* Title - Compute Marketplace */}
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
              Compute Marketplace
            </span>
          </div>
          <p className="text-xs" style={{ color: "rgba(0,255,65,0.5)" }}>
            Rent decentralized GPU compute — Physical hardware verified via Proof-of-Inference
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {!isConnected && (
              <p className="text-xs font-medium" style={{ color: "#00FF41" }}>
                Please Connect Wallet to Proceed
              </p>
            )}
            <button
              type="button"
              onClick={handleDeployClick}
              className="border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-90"
              style={{ borderColor: "#00FF41", color: "#00FF41" }}
            >
              Deploy via NeuroGrid
            </button>
          </div>
        </div>

        {/* Grid: Nodes + Treasury */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <NodeCluster
            isConnected={isConnected}
            walletAddress={address}
            openConnectModal={openConnectModal}
            onDeployComplete={handleDeployComplete}
            onUndeployComplete={handleUndeployComplete}
            triggerUndeployNodeId={triggerUndeployNodeId}
            onUndeployModalOpen={handleUndeployModalOpen}
          />
          <TreasuryViz />
        </div>

        {/* My Rented Nodes: only nodes ordered by connected wallet; 2 per row, scroll for more */}
        {isConnected && (
          <RentedNodesPanel
            walletAddress={address}
            rentedNodes={myRentedNodes}
            onUndeploy={handleUndeployFromPanel}
          />
        )}
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
              100% of Protocol Fees (5%) → Buyback Engine → $NRG Floor Price Appreciation.
            </p>
            {/* v3.4 Flywheel diagram */}
            <div
              className="flex flex-col items-center gap-2 border p-4"
              style={{
                borderColor: "rgba(0,255,65,0.2)",
                backgroundColor: "rgba(0,255,65,0.03)",
              }}
            >
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs" style={{ color: "#00FF41" }}>
                <span className="flex items-center gap-1">
                  Usage <TrendingUp className="h-3.5 w-3.5" />
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "rgba(0,255,65,0.5)" }} />
                <span className="flex items-center gap-1">
                  Buyback <TrendingUp className="h-3.5 w-3.5" />
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "rgba(0,255,65,0.5)" }} />
                <span className="flex items-center gap-1">
                  Floor Price <TrendingUp className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[10px]" style={{ color: "rgba(0,255,65,0.5)" }}>
                100% of Protocol Fees (5%) → Buyback Engine → $NRG Floor Price Appreciation
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
