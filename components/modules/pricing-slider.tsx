"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle, Zap, TrendingUp } from "lucide-react"
import { useWallet } from "@/lib/wallet-context"
import { useMinerRegistry, NODE_DISPLAY_NAMES } from "@/lib/miner-registry-context"
import { useTreasuryData } from "@/components/modules/treasury-api"
import { motion } from "framer-motion"
import { ASSET_WEIGHTS } from "@/lib/treasury-api"

function parsePriceToNumber(priceStr: string): number {
  const m = priceStr.match(/\$?([\d.]+)/)
  if (!m) return 0
  const n = parseFloat(m[1])
  return Number.isFinite(n) ? n : 0
}

/** Platform mock when treasury not loaded */
const MOCK_PLATFORM_HOURLY = 12.48
const MOCK_PLATFORM_ACCUMULATED = "124,580"

/** Donut segment colors — match Protocol Stats (BTC, SOL, NRG, Sui/ETH) */
const DONUT_COLORS = ["#F7931A", "#00FFA3", "#00FF41", "#6FBDF0"] as const

/** Donut chart: Hard Asset Backing — 45/20/15/20 from Protocol Stats */
function HardAssetDonut() {
  const size = 120
  const stroke = 14
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const segments = [
    { pct: ASSET_WEIGHTS.btc * 100, color: DONUT_COLORS[0] },
    { pct: ASSET_WEIGHTS.sol * 100, color: DONUT_COLORS[1] },
    { pct: ASSET_WEIGHTS.nrg * 100, color: DONUT_COLORS[2] },
    { pct: ASSET_WEIGHTS.suiEth * 100, color: DONUT_COLORS[3] },
  ]
  let offset = 0
  const paths = segments.map(({ pct, color }) => {
    const dashArray = (pct / 100) * 2 * Math.PI * r
    const dashOffset = -offset * 2 * Math.PI * r
    offset += pct / 100
    return { dashArray, dashOffset, color }
  })

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#0a0a0a"
          strokeWidth={stroke + 2}
        />
        {paths.map((p, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={p.color}
            strokeWidth={stroke}
            strokeDasharray={`${p.dashArray} ${2 * Math.PI * r}`}
            strokeDashoffset={p.dashOffset}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-center"
        style={{ fontFamily: "var(--font-mono), monospace" }}
      >
        <span
          className="text-[10px] font-bold leading-tight uppercase tracking-wider"
          style={{ color: "#00FF41", textShadow: "0 0 8px rgba(0,255,65,0.5)" }}
        >
          Hard Asset
          <br />
          Backing
        </span>
      </div>
    </div>
  )
}

function FeeBreakdownBlock({ baseHourly }: { baseHourly: number }) {
  const minerRevenue = +(baseHourly * 0.95).toFixed(4)
  const hardAssetAnchor = +(baseHourly * 0.025).toFixed(4)
  const ecoPoolBuffer = +(baseHourly * 0.025).toFixed(4)

  return (
    <div
      className="flex flex-col gap-2 border border-border p-4 shrink-0"
      style={{ backgroundColor: "rgba(0,255,65,0.02)" }}
    >
      <span className="mb-1 text-xs uppercase tracking-wider" style={{ color: "rgba(0,255,65,0.5)" }}>
        5% Fee Breakdown
      </span>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2" style={{ backgroundColor: "#00FF41" }} />
          <span className="text-xs" style={{ color: "rgba(0,255,65,0.6)" }}>
            Miner Revenue (95%)
          </span>
        </div>
        <span className="text-sm font-bold" style={{ color: "#00FF41" }}>
          ${minerRevenue}/hr
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2" style={{ backgroundColor: "#F7931A" }} />
          <span className="text-xs" style={{ color: "rgba(247,147,26,0.9)" }}>
            Hard Asset Anchor (2.5%)
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle
                className="h-3 w-3 cursor-help opacity-60 hover:opacity-100"
                style={{ color: "#00FF41" }}
              />
            </TooltipTrigger>
            <TooltipContent
              className="max-w-[240px] border"
              style={{ backgroundColor: "var(--terminal-bg)", borderColor: "rgba(0,255,65,0.3)" }}
            >
              <p className="text-xs" style={{ color: "#00FF41" }}>
                2.5% for BTC/SOL floor backing.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="text-sm font-bold" style={{ color: "#F7931A" }}>
          ${hardAssetAnchor}/hr
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2" style={{ backgroundColor: "#00FFFF" }} />
          <span className="text-xs" style={{ color: "rgba(0,255,255,0.6)" }}>
            Eco-Pool Buffer (2.5%)
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle
                className="h-3 w-3 cursor-help opacity-60 hover:opacity-100"
                style={{ color: "#00FF41" }}
              />
            </TooltipTrigger>
            <TooltipContent
              className="max-w-[240px] border"
              style={{ backgroundColor: "var(--terminal-bg)", borderColor: "rgba(0,255,65,0.3)" }}
            >
              <p className="text-xs" style={{ color: "#00FF41" }}>
                2.5% for Eco-Pool to counter liquidity volatility.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="text-sm font-bold" style={{ color: "#00FFFF" }}>
          ${ecoPoolBuffer}/hr
        </span>
      </div>

      <div className="mt-2 flex h-2 overflow-hidden">
        <div style={{ width: "95%", backgroundColor: "#00FF41" }} />
        <div style={{ width: "2.5%", backgroundColor: "#F7931A" }} />
        <div style={{ width: "2.5%", backgroundColor: "#00FFFF" }} />
      </div>
    </div>
  )
}

export function PricingSlider() {
  const { isConnected, address } = useWallet()
  const { nodeToMiner, nodeRentals, nodePrices, nodeBandwidth, getMinerNodes } = useMinerRegistry()
  const { data: treasury } = useTreasuryData()

  const myNodeIds = isConnected && address ? getMinerNodes(address) : []

  const platformHourly = useMemo(() => {
    let total = 0
    Object.keys(nodeToMiner).forEach((id) => {
      if (nodeRentals[id]) total += parsePriceToNumber(nodePrices[id] ?? "$0")
    })
    return total > 0 ? total : MOCK_PLATFORM_HOURLY
  }, [nodeToMiner, nodeRentals, nodePrices])

  const accountHourly = useMemo(() => {
    if (!address) return 0
    let total = 0
    Object.keys(nodeToMiner).forEach((id) => {
      if (nodeToMiner[id] === address && nodeRentals[id])
        total += parsePriceToNumber(nodePrices[id] ?? "$0")
    })
    return total
  }, [address, nodeToMiner, nodeRentals, nodePrices])

  const accountTotalRevenue = useMemo(() => {
    if (!address) return "0"
    if (accountHourly <= 0) return "0"
    const mockTotal = Math.round(accountHourly * 24 * 30 * 0.7)
    return mockTotal.toLocaleString()
  }, [address, accountHourly])

  return (
    <div
      className="flex flex-col border border-border overflow-hidden"
      style={{ backgroundColor: "var(--terminal-bg)", minHeight: "380px" }}
    >
      <div
        className="flex items-center justify-between border-b border-border px-4 py-2 shrink-0"
        style={{ backgroundColor: "rgba(0,255,65,0.03)" }}
      >
        <span className="text-xs uppercase tracking-wider" style={{ color: "#00cc33" }}>
          Pricing Configuration
        </span>
        <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
          {isConnected ? "Your Revenue" : "Platform Overview"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-0 min-h-0 p-4">
        {!isConnected ? (
          <>
            <div className="grid grid-cols-2 gap-3 min-h-0 flex-1">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(0,255,255,0.5)" }}>
                    Platform hourly revenue
                  </span>
                  <span className="text-xl font-bold tabular-nums" style={{ color: "#00FFFF" }}>
                    ${platformHourly.toFixed(2)}/hr
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(0,255,255,0.5)" }}>
                    Platform accumulated assets
                  </span>
                  <span className="text-xl font-bold tabular-nums" style={{ color: "#00FF41" }}>
                    ${treasury ? Math.round(treasury.totalReserveUsd).toLocaleString() : MOCK_PLATFORM_ACCUMULATED}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-0">
                <HardAssetDonut />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(0,255,65,0.5)" }}>
                  Estimated converted assets (from Protocol Stats)
                </span>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "rgba(0,255,65,0.85)" }}>
                  {(treasury?.assets ?? []).map((asset, i) => (
                    <li key={asset.symbol} className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                      />
                      <span>
                        {asset.symbol} {asset.amountFormatted} <span style={{ color: "rgba(0,255,65,0.6)" }}>(${Math.round(asset.usdValue).toLocaleString()})</span>
                      </span>
                    </li>
                  ))}
                  {(!treasury?.assets || treasury.assets.length === 0) && (
                    <li style={{ color: "rgba(0,255,65,0.5)" }}>—</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="mt-auto pt-2">
              <FeeBreakdownBlock baseHourly={platformHourly} />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-4 min-h-0">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(0,255,255,0.5)" }}>
                    Your hourly revenue (rented out)
                  </span>
                  <motion.div
                    key={accountHourly.toFixed(2)}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-baseline gap-2"
                  >
                    <span className="text-2xl font-bold tabular-nums" style={{ color: "#00FFFF" }}>
                      ${accountHourly.toFixed(2)}/hr
                    </span>
                    {accountHourly > 0 && (
                      <Zap className="h-5 w-5 shrink-0" style={{ color: "#00FF41" }} />
                    )}
                  </motion.div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(0,255,255,0.5)" }}>
                    Account total revenue
                  </span>
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="text-2xl font-bold tabular-nums" style={{ color: "#00FF41" }}>
                      ${accountTotalRevenue}
                    </span>
                    {Number(accountTotalRevenue.replace(/,/g, "")) > 0 && (
                      <TrendingUp className="h-5 w-5 shrink-0" style={{ color: "rgba(0,255,65,0.7)" }} />
                    )}
                  </motion.div>
                </div>
                {/* Cool visual: glow bar or pulse */}
                <div className="relative mt-2 overflow-hidden rounded border" style={{ borderColor: "rgba(0,255,65,0.2)", height: "48px" }}>
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(0,255,65,0.15) 50%, transparent 100%)",
                    }}
                  />
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-l"
                    style={{
                      width: `${Math.min(100, (accountHourly / 5) * 100)}%`,
                      backgroundColor: "rgba(0,255,65,0.25)",
                      boxShadow: "0 0 20px rgba(0,255,65,0.3)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (accountHourly / 5) * 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium tracking-wider" style={{ color: "rgba(0,255,65,0.9)" }}>
                      Revenue index
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* My Registered Miners — total 140px; title 32px; list scrollable */}
            <div
              className="flex w-full flex-col overflow-hidden border shrink-0 -mt-4"
              style={{
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "rgba(0,255,65,0.2)",
                backgroundColor: "rgba(0,255,65,0.04)",
                height: "140px",
              }}
            >
              <div
                className="flex items-center justify-between border-b px-2 shrink-0"
                style={{ borderColor: "rgba(0,255,65,0.15)", height: "32px" }}
              >
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "#00FFFF" }}>
                  My Registered Miners
                </span>
                {myNodeIds.length > 0 && (
                  <Link
                    href="/nodes"
                    className="text-[10px] underline hover:no-underline"
                    style={{ color: "rgba(0,255,255,0.7)" }}
                  >
                    Node Command Center
                  </Link>
                )}
              </div>
              <div
                className="min-h-0 flex-1 overflow-y-auto px-2 py-1"
                style={{ borderColor: "rgba(0,255,65,0.08)" }}
              >
                {myNodeIds.length === 0 ? (
                  <p className="text-[10px] py-1" style={{ color: "rgba(0,255,255,0.5)" }}>
                    No miners yet. Register in Node Onboarding above.
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: "rgba(0,255,65,0.08)" }}>
                    {myNodeIds.map((nodeId) => {
                      const renter = nodeRentals[nodeId] ?? null
                      const name = NODE_DISPLAY_NAMES[nodeId] ?? nodeId
                      const price = nodePrices[nodeId] ?? "—"
                      const bandwidth = nodeBandwidth[nodeId] ?? "—"
                      return (
                        <div
                          key={nodeId}
                          className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 py-1.5 min-h-[28px]"
                        >
                          <span className="text-xs font-bold" style={{ color: "#00FFFF" }}>
                            {name}
                          </span>
                          <span className="flex flex-wrap items-center gap-x-2 text-[10px]" style={{ color: "rgba(0,255,255,0.6)" }}>
                            <span>{price}</span>
                            <span>{bandwidth}</span>
                            <span style={{ color: "#00FF41" }}>{renter ? "$—" : "$0"}</span>
                          </span>
                          <span
                            className="inline-flex rounded border px-1.5 py-0.5 text-[10px] shrink-0"
                            style={{
                              backgroundColor: renter ? "rgba(0,255,65,0.1)" : "rgba(0,255,255,0.08)",
                              color: renter ? "#00FF41" : "rgba(0,255,255,0.8)",
                              borderColor: renter ? "rgba(0,255,65,0.35)" : "rgba(0,255,255,0.25)",
                            }}
                          >
                            {renter ? `Rented ${renter.slice(0, 6)}…` : "Available"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-2">
              <FeeBreakdownBlock baseHourly={platformHourly} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
