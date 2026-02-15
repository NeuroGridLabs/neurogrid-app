"use client"

import { useRef, useEffect } from "react"
import { useTreasuryData } from "@/components/modules/treasury-api"
import type { TreasuryAsset } from "@/lib/treasury-api"

const ASSET_COLORS: Record<string, string> = {
  BTC: "#F7931A",
  SOL: "#00FFA3",
  NRG: "#00FF41",
  "Sui/ETH": "#6FBDF0",
}

function AllocationChart({ assets }: { assets: TreasuryAsset[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || assets.length === 0) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.parentElement?.getBoundingClientRect()
    if (!rect) return
    const dpr = 2
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    const w = rect.width
    const h = rect.height

    const total = assets.reduce((s, a) => s + a.usdValue, 0)
    if (total <= 0) return

    let start = -0.5 * Math.PI
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(w, h) / 2 - 4

    assets.forEach((asset) => {
      const ratio = asset.usdValue / total
      const end = start + ratio * 2 * Math.PI
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, end)
      ctx.closePath()
      ctx.fillStyle = ASSET_COLORS[asset.symbol] ?? "rgba(0,255,65,0.5)"
      ctx.fill()
      ctx.strokeStyle = "var(--terminal-bg)"
      ctx.lineWidth = 2
      ctx.stroke()
      start = end
    })
  }, [assets])

  return (
    <div className="relative h-40 w-full md:h-52 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="max-h-full w-full"
        aria-label="Treasury asset allocation"
        role="img"
      />
    </div>
  )
}

export function TreasuryViz() {
  const { data, loading, error, refetch } = useTreasuryData()

  return (
    <div
      className="border border-border"
      style={{ backgroundColor: "var(--terminal-bg)" }}
    >
      <div
        className="flex items-center justify-between border-b border-border px-4 py-2"
        style={{ backgroundColor: "rgba(0,255,65,0.03)" }}
      >
        <span className="text-xs uppercase tracking-wider" style={{ color: "#00cc33" }}>
          Treasury Monitor
        </span>
        <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
          Live on-chain · 45/20/15/20
        </span>
      </div>

      {loading && (
        <div className="flex flex-col gap-3 p-4" style={{ color: "rgba(0,255,65,0.6)" }}>
          <div className="text-xs font-medium" style={{ color: "#00FF41" }}>
            Status: Epoch 0 (Genesis Bootstrapping)
          </div>
          <div className="font-mono text-[10px] break-all" style={{ color: "rgba(0,255,65,0.5)" }}>
            Active Vault: AmKdMDFTYRXUHPxcXjvJxMM1xZeAmR6rmeNj2t2cWH3h
          </div>
          <div className="text-xs" style={{ color: "rgba(255,200,0,0.9)" }}>
            [Listening] Awaiting first node deployment to route 5% protocol fees.
          </div>
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-3 p-4" style={{ color: "rgba(0,255,65,0.6)" }}>
          <div className="text-xs font-medium" style={{ color: "#00FF41" }}>
            Status: Epoch 0 (Genesis Bootstrapping)
          </div>
          <div className="font-mono text-[10px] break-all" style={{ color: "rgba(0,255,65,0.5)" }}>
            Active Vault: AmKdMDFTYRXUHPxcXjvJxMM1xZeAmR6rmeNj2t2cWH3h
          </div>
          <div className="text-xs" style={{ color: "rgba(255,200,0,0.9)" }}>
            [Listening] Awaiting first node deployment to route 5% protocol fees.
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-3 gap-px" style={{ backgroundColor: "rgba(0,255,65,0.05)" }}>
            <div className="flex flex-col gap-1 p-3" style={{ backgroundColor: "var(--terminal-bg)" }}>
              <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>Total Reserve</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: "#00FF41" }}>
                ${data.totalReserveUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-3" style={{ backgroundColor: "var(--terminal-bg)" }}>
              <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>P_floor</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: "#00FF41" }}>
                ${data.pFloor.toFixed(4)}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-3" style={{ backgroundColor: "var(--terminal-bg)" }}>
              <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>Eco Pool</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: "#00FF41" }}>
                ${data.ecoPoolBalanceUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <AllocationChart assets={data.assets} />

          <div
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border px-4 py-2"
            style={{ borderColor: "rgba(0,255,65,0.08)" }}
          >
            {data.assets.map((a) => (
              <span key={a.symbol} className="flex items-center gap-1.5 text-xs">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: ASSET_COLORS[a.symbol] ?? "#00FF41" }}
                />
                <span style={{ color: "rgba(0,255,65,0.7)" }}>{a.symbol}</span>
                <span style={{ color: "#00FF41" }}>
                  ${a.usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
