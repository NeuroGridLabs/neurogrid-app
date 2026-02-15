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

export default function NodesPage() {
  const { isConnected, address, openConnectModal } = useWallet()
  const [terminalMinimized, setTerminalMinimized] = useState(false)
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
            <p className="text-xs font-medium" style={{ color: "rgba(255,200,0,0.95)" }}>
              Epoch 0: Network Ignition Pending.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_GENESIS_WAITLIST_URL || "https://discord.gg"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-90"
              style={{ borderColor: "#00FF41", color: "#00FF41" }}
            >
              <span aria-hidden>🔒</span>
              Apply for Genesis Whitelist
            </a>
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
    </div>
  )
}
