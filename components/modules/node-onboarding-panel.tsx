"use client"

import { useEffect, useState } from "react"
import { NeonButton } from "@/components/atoms/neon-button"

interface TopEarnerRow {
  name: string
  runtime: string
  unitPrice: string
  totalRevenue: string
}

interface NodeOnboardingPanelProps {
  isConnected: boolean
  onConnectWallet: () => void
  children: React.ReactNode
}

/** Fixed-size Node Onboarding panel: when not connected shows platform revenue + top earners from API + CTA; when connected shows the registration form (children). */
export function NodeOnboardingPanel({
  isConnected,
  onConnectWallet,
  children,
}: NodeOnboardingPanelProps) {
  const [topEarners, setTopEarners] = useState<TopEarnerRow[]>([])
  const [platformStats, setPlatformStats] = useState<{ nodeCount: number; total30d: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isConnected) return
    let cancelled = false
    setLoading(true)
    fetch("/api/nodes/top-earners", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { topEarners?: TopEarnerRow[] }) => {
        if (!cancelled && Array.isArray(data.topEarners)) setTopEarners(data.topEarners)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isConnected])

  return (
    <div
      className="border border-border flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--terminal-bg)", minHeight: "380px" }}
    >
      <div
        className="flex items-center justify-between border-b border-border px-4 py-2 shrink-0"
        style={{ backgroundColor: "rgba(0,255,65,0.03)" }}
      >
        <span className="text-xs uppercase tracking-wider" style={{ color: "#00cc33" }}>
          Node Onboarding
        </span>
        <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
          {isConnected ? "GPU Registration" : "Platform Overview"}
        </span>
      </div>

      {!isConnected ? (
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Platform overall revenue — from backend when available */}
          <div
            className="rounded border px-3 py-2"
            style={{
              borderColor: "rgba(0,255,255,0.2)",
              backgroundColor: "rgba(0,255,255,0.04)",
            }}
          >
            <div className="text-xs uppercase tracking-wider" style={{ color: "rgba(0,255,255,0.6)" }}>
              Platform node revenue
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0">
              {platformStats ? (
                <>
                  <span className="text-lg font-bold" style={{ color: "#00FFFF" }}>
                    {platformStats.nodeCount} nodes
                  </span>
                  <span className="text-xs" style={{ color: "rgba(0,255,255,0.5)" }}>·</span>
                  <span className="text-sm font-medium" style={{ color: "#00FF41" }}>
                    {platformStats.total30d} total (30d)
                  </span>
                </>
              ) : (
                <span className="text-sm" style={{ color: "rgba(0,255,255,0.5)" }}>
                  —
                </span>
              )}
            </div>
          </div>

          {/* Top earners list — real data from API */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-1 text-xs uppercase tracking-wider" style={{ color: "rgba(0,255,65,0.5)" }}>
              Top earning nodes
            </div>
            <div
              className="flex-1 overflow-y-auto rounded border"
              style={{ borderColor: "rgba(0,255,65,0.12)" }}
            >
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,255,65,0.06)" }}>
                    <th className="px-2 py-1.5 text-left font-medium" style={{ color: "rgba(0,255,65,0.7)" }}>
                      Node
                    </th>
                    <th className="px-2 py-1.5 text-left font-medium" style={{ color: "rgba(0,255,65,0.7)" }}>
                      Runtime
                    </th>
                    <th className="px-2 py-1.5 text-left font-medium" style={{ color: "rgba(0,255,65,0.7)" }}>
                      Unit price
                    </th>
                    <th className="px-2 py-1.5 text-right font-medium" style={{ color: "rgba(0,255,65,0.7)" }}>
                      Total revenue
                    </th>
                  </tr>
                </thead>
                <tbody style={{ color: "rgba(0,255,65,0.85)" }}>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-2 py-4 text-center" style={{ color: "rgba(0,255,65,0.5)" }}>
                        Loading…
                      </td>
                    </tr>
                  ) : topEarners.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 py-4 text-center" style={{ color: "rgba(0,255,65,0.5)" }}>
                        No data yet
                      </td>
                    </tr>
                  ) : (
                    topEarners.map((row) => (
                      <tr key={row.name} className="border-t" style={{ borderColor: "rgba(0,255,65,0.08)" }}>
                        <td className="px-2 py-1.5 font-medium" style={{ color: "#00FF41" }}>
                          {row.name}
                        </td>
                        <td className="px-2 py-1.5">{row.runtime}</td>
                        <td className="px-2 py-1.5">{row.unitPrice}</td>
                        <td className="px-2 py-1.5 text-right font-medium" style={{ color: "#00FFFF" }}>
                          {row.totalRevenue}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="shrink-0 text-center text-xs" style={{ color: "rgba(0,255,255,0.5)" }}>
            Connect wallet to register your GPU and start earning.
          </p>
          <NeonButton
            type="button"
            variant="primary"
            accentColor="#00FFFF"
            className="w-full shrink-0"
            onClick={onConnectWallet}
          >
            Connect Wallet to Register Miner
          </NeonButton>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
