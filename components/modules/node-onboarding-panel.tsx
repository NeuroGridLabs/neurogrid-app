"use client"

import { NeonButton } from "@/components/atoms/neon-button"

/** Mock top-earning nodes for guest view (long-running, high revenue) */
const MOCK_TOP_EARNERS = [
  { name: "Alpha-01", runtime: "89d 12h", unitPrice: "$0.59/hr", totalRevenue: "$1,247" },
  { name: "Theta-08", runtime: "76d 8h", unitPrice: "$0.65/hr", totalRevenue: "$1,189" },
  { name: "Delta-03", runtime: "62d 4h", unitPrice: "$1.85/hr", totalRevenue: "$2,756" },
  { name: "Zeta-15", runtime: "54d 0h", unitPrice: "$1.20/hr", totalRevenue: "$1,555" },
  { name: "Epsilon-09", runtime: "41d 6h", unitPrice: "$0.55/hr", totalRevenue: "$544" },
]

interface NodeOnboardingPanelProps {
  isConnected: boolean
  onConnectWallet: () => void
  children: React.ReactNode
}

/** Fixed-size Node Onboarding panel: when not connected shows platform revenue + top earners + CTA; when connected shows the registration form (children). */
export function NodeOnboardingPanel({
  isConnected,
  onConnectWallet,
  children,
}: NodeOnboardingPanelProps) {
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
          {/* Platform overall revenue */}
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
              <span className="text-lg font-bold" style={{ color: "#00FFFF" }}>
                12 nodes
              </span>
              <span className="text-xs" style={{ color: "rgba(0,255,255,0.5)" }}>
                ·
              </span>
              <span className="text-sm font-medium" style={{ color: "#00FF41" }}>
                $7,291 total (30d)
              </span>
            </div>
          </div>

          {/* Top earners list */}
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
                  {MOCK_TOP_EARNERS.map((row) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
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
