"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/modules/footer"
import { ScanlineOverlay } from "@/components/atoms/scanline-overlay"
import { MinerForm, type MinerFormSubmitPayload } from "@/components/modules/miner-form"
import { NodeOnboardingPanel } from "@/components/modules/node-onboarding-panel"
import { PricingSlider } from "@/components/modules/pricing-slider"
import { HandshakeOverlay } from "@/components/modules/handshake-overlay"
import { MinerConnectTerminal } from "@/components/modules/miner-connect-terminal"
import { useWallet } from "@/lib/wallet-context"
import { useMinerRegistry, NODE_DISPLAY_NAMES } from "@/lib/miner-registry-context"
import { NeonButton } from "@/components/atoms/neon-button"

export default function MinerPortal() {
  const { isConnected, address, openConnectModal } = useWallet()
  const {
    registerMiner,
    registerMinerWithNodeId,
    getPriceRangeForGpu,
    getAvailableNodeId,
  } = useMinerRegistry()
  const [handshakeActive, setHandshakeActive] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [connectTriggered, setConnectTriggered] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [lastRegisteredNodeId, setLastRegisteredNodeId] = useState<string | null>(null)
  const [pendingVerification, setPendingVerification] = useState(false)

  const priceRange = getPriceRangeForGpu("1x RTX4090")
  const canRegister = getAvailableNodeId() !== null

  const handleFormSubmit = useCallback(
    async (payload: MinerFormSubmitPayload) => {
      setRegisterError(null)
      setPendingVerification(false)
      if (!isConnected || !address) {
        setRegisterError("Wallet not connected.")
        return
      }
      if (!canRegister) {
        setRegisterError("No available node slot. All miners are currently registered.")
        return
      }

      try {
        const res = await fetch("/api/miner/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            pricePerHour: payload.pricePerHour,
            bandwidth: payload.bandwidth,
            gpuModel: payload.gpuModel,
            vram: payload.vram,
            gateway: payload.gateway,
          }),
        })
        const data = res.ok ? await res.json() : null
        const nodeIdFromApi = data?.nodeId
        const isPendingVerification = data?.status === "PENDING_VERIFICATION"

        let nodeId: string | null = null
        if (nodeIdFromApi) {
          nodeId = registerMinerWithNodeId(nodeIdFromApi, address, {
            pricePerHour: payload.pricePerHour,
            bandwidth: payload.bandwidth,
          })
        }
        if (nodeId == null) {
          nodeId = registerMiner(address, {
            pricePerHour: payload.pricePerHour,
            bandwidth: payload.bandwidth,
          })
        }
        if (nodeId == null) {
          setRegisterError("No available node slot. All miners are currently registered.")
          return
        }
        setLastRegisteredNodeId(nodeId)
        setPendingVerification(!!isPendingVerification)
        setConnectTriggered(true)
        setHandshakeActive(true)
      } catch {
        const nodeId = registerMiner(address, {
          pricePerHour: payload.pricePerHour,
          bandwidth: payload.bandwidth,
        })
        if (nodeId == null) {
          setRegisterError("No available node slot. All miners are currently registered.")
          return
        }
        setLastRegisteredNodeId(nodeId)
        setConnectTriggered(true)
        setHandshakeActive(true)
      }
    },
    [isConnected, address, canRegister, registerMiner, registerMinerWithNodeId]
  )

  const handleHandshakeComplete = useCallback(() => {
    setHandshakeActive(false)
    setSubmitted(true)
  }, [])

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#050505" }}>
      <ScanlineOverlay />
      <HandshakeOverlay active={handshakeActive} onComplete={handleHandshakeComplete} />
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6">
        {/* Title */}
        <div
          className="flex flex-col gap-1 border border-border p-4"
          style={{ backgroundColor: "rgba(0,255,255,0.02)" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-sm font-bold tracking-wider md:text-base" style={{ color: "#00FFFF" }}>
              MINER PORTAL
            </h1>
            <span className="text-xs" style={{ color: "rgba(0,255,255,0.3)" }}>|</span>
            <span className="text-xs" style={{ color: "rgba(0,255,255,0.4)" }}>
              GPU Onboarding & Pricing
            </span>
          </div>
          <p className="text-xs" style={{ color: "rgba(0,255,255,0.5)" }}>
            Register your GPU hardware, set pricing, and connect via FRP tunnel
          </p>
          {!isConnected && (
            <p className="mt-2 text-xs font-medium" style={{ color: "#00FF41" }}>
              Please Connect Wallet to Proceed
            </p>
          )}
        </div>

        {registerError && (
          <div
            className="flex items-center gap-3 border p-4"
            style={{
              borderColor: "rgba(255,100,80,0.4)",
              backgroundColor: "rgba(255,80,60,0.06)",
            }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: "#ff6655", boxShadow: "0 0 6px #ff6655" }}
            />
            <span className="text-sm" style={{ color: "#ff8866" }}>
              {registerError}
            </span>
          </div>
        )}

        {submitted && lastRegisteredNodeId && (
          <div
            className="flex flex-col gap-2 border p-4"
            style={{
              borderColor: pendingVerification ? "rgba(255,200,0,0.4)" : "rgba(0,255,65,0.3)",
              backgroundColor: pendingVerification ? "rgba(255,200,0,0.05)" : "rgba(0,255,65,0.05)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{
                  backgroundColor: pendingVerification ? "#ffc800" : "#00FF41",
                  boxShadow: pendingVerification ? "0 0 6px #ffc800" : "0 0 6px #00FF41",
                }}
              />
              <span className="text-sm font-medium" style={{ color: pendingVerification ? "#ffc800" : "#00FF41" }}>
                {NODE_DISPLAY_NAMES[lastRegisteredNodeId] ?? lastRegisteredNodeId}{" "}
                {pendingVerification ? "— Pending FRP verification" : "registered."}
              </span>
            </div>
            {pendingVerification ? (
              <div className="space-y-1 pl-5 text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
                <p>
                  The backend will verify <strong>physical connectivity</strong> and <strong>FRP handshake</strong>.
                  Only after FRP is established will this node appear as <strong>ACTIVE</strong> in{" "}
                  <Link href="/nodes" className="underline hover:no-underline" style={{ color: "#00FFFF" }}>
                    Node Command Center
                  </Link>{" "}
                  and be rentable.
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>
                  Connect your FRP client using the config from the backend. Without a real backend, the node stays in PENDING and is not rentable.
                </p>
              </div>
            ) : (
              <p className="text-xs pl-5" style={{ color: "rgba(0,255,65,0.7)" }}>
                It is listed in{" "}
                <Link href="/nodes" className="underline hover:no-underline" style={{ color: "#00FFFF" }}>
                  Node Command Center
                </Link>{" "}
                (Nodes page). You can see it in My Registered Miners (Pricing Configuration panel). Connect backend + FRP for verification.
              </p>
            )}
          </div>
        )}

        {/* Grid: Node Onboarding (guest view or form) + Slider */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <NodeOnboardingPanel
            isConnected={!!isConnected}
            onConnectWallet={openConnectModal}
          >
            <MinerForm
              priceRange={priceRange}
              gpuTypeLabel="Same type (1x RTX4090)"
              canRegister={canRegister}
              onSubmit={handleFormSubmit}
            />
          </NodeOnboardingPanel>
          <PricingSlider />
        </div>

        {/* Terminal with auth overlay */}
        <div className="relative">
          {!isConnected && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
              style={{
                backgroundColor: "rgba(5,5,5,0.85)",
                backdropFilter: "blur(4px)",
              }}
            >
              <p className="text-center text-sm font-bold uppercase tracking-wider" style={{ color: "#00FF41" }}>
                Authentication Required: Connect Wallet to Sync Miner Identity
              </p>
              <NeonButton
                variant="primary"
                accentColor="#00FF41"
                onClick={openConnectModal}
              >
                Connect Wallet
              </NeonButton>
            </div>
          )}
          <MinerConnectTerminal
            connectTriggered={connectTriggered}
            isConnected={isConnected}
            walletAddress={address ?? undefined}
          />
          {isConnected && (
            <div className="mt-2 flex items-center gap-2">
              <NeonButton
                variant="primary"
                accentColor="#00FF41"
                className="text-xs px-4 py-2"
              >
                Download Miner Config (FRP)
              </NeonButton>
              <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
                Wallet verified · Config unlocked
              </span>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
