"use client"

import { useEffect, useState } from "react"
import { TerminalLog } from "@/components/atoms/terminal-log"

// v3.2: Multi-chain sync sequence — aligned with whitepaper
const CONNECT_LOGS_STATIC = [
  { type: "NETWORK" as const, content: "Dialing Cross-Chain Gateways..." },
  { type: "FINANCIAL" as const, content: "BTC Reserve (45%) indexed: mempool.space/address/..." },
  { type: "FINANCIAL" as const, content: "SOL Reserve (20%) indexed: solscan.io/account/..." },
  { type: "SYSTEM" as const, content: "Anti-Volatility Buffer ACTIVE: Eco-Pool verified." },
] as const

interface LogLine {
  type: "NETWORK" | "PHYSICAL" | "SYSTEM" | "FINANCIAL"
  content: string
  timestamp?: string
}

function getTimestamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false })
}

interface MinerConnectTerminalProps {
  connectTriggered: boolean
  isConnected?: boolean
  walletAddress?: string
}

export function MinerConnectTerminal({ connectTriggered, isConnected, walletAddress }: MinerConnectTerminalProps) {
  const [visibleLines, setVisibleLines] = useState<LogLine[]>([])

  // When connected, prepend [SYS] Wallet Verified
  const walletLine: LogLine | null =
    isConnected && walletAddress
      ? {
          type: "SYSTEM",
          content: `Wallet Verified: ${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}`,
          timestamp: getTimestamp(),
        }
      : null

  useEffect(() => {
    if (!connectTriggered) {
      setVisibleLines([])
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    CONNECT_LOGS_STATIC.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines((prev) => [...prev, { ...line, timestamp: getTimestamp() }])
        }, i * 900)
      )
    })
    return () => timers.forEach(clearTimeout)
  }, [connectTriggered])

  return (
    <div
      className="flex flex-col overflow-hidden border border-border"
      style={{ backgroundColor: "var(--terminal-bg)" }}
    >
      <div
        className="flex items-center justify-between border-b border-border px-3 py-1.5"
        style={{ backgroundColor: "rgba(0,255,65,0.03)" }}
      >
        <span className="text-xs tracking-wider" style={{ color: "#00cc33" }}>
          FRP Connect Terminal
        </span>
        <span
          className="px-1.5 py-0.5 text-xs"
          style={{ backgroundColor: "rgba(0,255,65,0.1)", color: "#00FF41" }}
        >
          {connectTriggered ? "CONNECTING" : "IDLE"}
        </span>
      </div>
      <div
        className="min-h-24 max-h-40 overflow-y-auto p-3"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.01) 2px, rgba(0,255,65,0.01) 4px)",
        }}
      >
        {visibleLines.length === 0 && !connectTriggered && !walletLine && (
          <div className="px-2 py-1 text-xs" style={{ color: "rgba(0,255,65,0.3)" }}>
            Click Connect Core via FRP to simulate sync...
          </div>
        )}
        {walletLine && (
          <TerminalLog type={walletLine.type} message={walletLine.content} timestamp={walletLine.timestamp} />
        )}
        {visibleLines.map((line, i) => (
          <TerminalLog
            key={i}
            type={line.type}
            message={line.content}
            timestamp={line.timestamp}
          />
        ))}
        {connectTriggered && visibleLines.length > 0 && visibleLines.length < CONNECT_LOGS_STATIC.length && (
          <span className="animate-blink px-2 text-xs" style={{ color: "#00FF41" }}>_</span>
        )}
      </div>
    </div>
  )
}
