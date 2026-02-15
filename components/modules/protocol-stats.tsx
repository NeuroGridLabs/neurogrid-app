"use client"

import { useEffect, useRef } from "react"
import { StatCard } from "@/components/atoms/stat-card"
import { NeonButton } from "@/components/atoms/neon-button"
import { useTreasuryData } from "@/components/modules/treasury-api"
import { Flame, Shield, Cpu, Zap, PieChart, Droplets } from "lucide-react"

// v3.2 Multi-Asset Anchor Era — Strict allocation: BTC 45%, SOL 20%, NRG 15%, Sui/ETH 20%
const ASSET_WEIGHTS = { btc: 0.45, sol: 0.2, nrg: 0.15, suiEth: 0.2 } as const
const COLORS = ["#F7931A", "#00FFA3", "#00FF41", "#6FBDF0"] // BTC, SOL, NRG, Sui/ETH
const LABELS = ["BTC", "SOL", "NRG", "Sui/ETH"]

function AssetDonutChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const values = [ASSET_WEIGHTS.btc, ASSET_WEIGHTS.sol, ASSET_WEIGHTS.nrg, ASSET_WEIGHTS.suiEth]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (!rect) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      const w = rect.width
      const h = rect.height
      const cx = w / 2
      const cy = h / 2
      const r = Math.min(w, h) / 2 - 8
      const ir = r * 0.55

      ctx.clearRect(0, 0, w, h)

      let start = -Math.PI / 2
      values.forEach((v, i) => {
        const sweep = v * Math.PI * 2
        ctx.beginPath()
        ctx.arc(cx, cy, r, start, start + sweep)
        ctx.arc(cx, cy, ir, start + sweep, start, true)
        ctx.closePath()
        ctx.fillStyle = COLORS[i]
        ctx.fill()
        ctx.strokeStyle = "rgba(5,5,5,0.9)"
        ctx.lineWidth = 2
        ctx.stroke()
        start += sweep
      })

      ctx.fillStyle = "rgba(0,255,65,0.5)"
      ctx.font = "9px monospace"
      ctx.textAlign = "center"
      ctx.fillText("Hard Asset", cx, cy - 6)
      ctx.fillText("Backing", cx, cy + 4)
    }

    draw()
    const observer = new ResizeObserver(draw)
    if (canvas.parentElement) observer.observe(canvas.parentElement)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative h-32 w-32 flex-shrink-0 md:h-40 md:w-40">
      <canvas ref={canvasRef} className="h-full w-full" aria-label="Multi-asset backing ratio" role="img" />
    </div>
  )
}

export function ProtocolStats() {
  const { data: treasury, loading } = useTreasuryData()
  // Epoch 0 (Genesis): real or placeholder values, no mock jitter
  const pFloorDisplay = treasury?.pFloor ?? 0
  const epochProgressUsd = treasury?.totalReserveUsd ?? 0
  const totalRepurchased = 0 // $NRG locked from 5% fee
  const activeGpus = 2
  const genesisNodes = 1

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#00FF41" }}>
            Protocol Stats (v3.4 Genesis)
          </h2>
          <a href="https://pump.fun" target="_blank" rel="noopener noreferrer">
            <NeonButton variant="primary" accentColor="#00FF41">
              Buy $NRG (Pump.fun)
            </NeonButton>
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            label="NRG Floor Price"
            value={loading ? "—" : pFloorDisplay > 0 ? `$${pFloorDisplay.toFixed(4)}` : "$0.0000"}
            sub="P_floor = TotalValue_Treasury / TotalSupply_NRG"
            icon={<PieChart className="h-4 w-4" />}
            accentColor="#00FF41"
            pulse={pFloorDisplay > 0}
          />
          <StatCard
            label="Epoch 1 Progress"
            value={loading ? "—" : `$${Math.round(epochProgressUsd).toLocaleString()} / $10,000`}
            sub="Target threshold for first hard-asset rebalance."
            icon={<Droplets className="h-4 w-4" />}
            accentColor="#00FF41"
          />
          <StatCard
            label="Total Repurchased"
            value={totalRepurchased.toLocaleString()}
            sub="$NRG locked from 5% protocol fee."
            icon={<Flame className="h-4 w-4" />}
            accentColor="#00FF41"
            pulse={totalRepurchased > 0}
          />
          <StatCard
            label="Active GPUs"
            value={`${activeGpus}`}
            sub={`Across ${genesisNodes} Genesis Node${genesisNodes !== 1 ? "s" : ""}`}
            icon={<Cpu className="h-4 w-4" />}
            accentColor="#00FFFF"
          />
          <StatCard
            label="Network Rate"
            value="$0.59/hr"
            sub="RTX4090 base price"
            icon={<Zap className="h-4 w-4" />}
            accentColor="#00FFFF"
          />
        </div>

        {/* Target Asset Allocation: 45/20/15/20 — Epoch 0 narrative */}
        <div
          className="mt-4 flex flex-col items-center gap-4 border border-border p-4 md:flex-row md:items-center md:justify-between"
          style={{ backgroundColor: "var(--terminal-bg)" }}
        >
          <div className="flex items-center gap-4">
            <AssetDonutChart />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#00FF41" }}>
                Target Asset Allocation (v3.4)
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs" style={{ color: "rgba(0,255,65,0.6)" }}>
                <span>BTC 45%</span>
                <span>SOL 20%</span>
                <span>NRG 15%</span>
                <span>Sui/ETH 20%</span>
              </div>
              <p className="mt-1.5 max-w-md text-xs leading-snug" style={{ color: "rgba(0,255,65,0.5)" }}>
                Current State: Epoch 0 (100% NRG Buyback). Chart reflects Target Ratio upon reaching $10k TVL.
              </p>
              {treasury && treasury.totalReserveUsd > 0 && (
                <div className="mt-1 text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
                  Reserve: ${(treasury.totalReserveUsd / 1000).toFixed(1)}k USD
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2" style={{ color: "rgba(0,255,65,0.5)" }}>
            <Shield className="h-4 w-4" />
            <span className="text-xs">Multi-chain anchor · Anti-flash-crash buffer</span>
          </div>
        </div>
      </div>
    </section>
  )
}
