"use client"

import { useState } from "react"
import { Shield, ExternalLink, Activity, Copy } from "lucide-react"
import { TerminalLog } from "@/components/atoms/terminal-log"
import { useTreasuryData } from "@/components/modules/treasury-api"

const NARRATIVE =
  "NeuroGrid Epoch Treasury. 100% of protocol fees are routed to the Solana Multi-sig for continuous $NRG buybacks. Hard-asset reserve rebalance is triggered automatically every $10,000 USDT accumulated."

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", { hour12: false })
}

function truncateAddress(addr: string, chain: string): string {
  if (chain === "BTC" && addr.startsWith("bc1")) return `${addr.slice(0, 6)}...${addr.slice(-6)}`
  if (addr.length <= 16) return addr
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

function getExplorerHref(chain: string, address: string): string {
  switch (chain) {
    case "SOL":
      return `https://solscan.io/account/${address}`
    case "BTC":
      return `https://mempool.space/address/${address}`
    case "ETH":
      return `https://etherscan.io/address/${address}`
    case "SUI":
      return `https://suiexplorer.com/address/${address}`
    default:
      return "#"
  }
}

/** Dual-track balance: native amount + USD value (from API/Oracle). */
export interface VaultBalanceData {
  nativeAmount: number
  usdValue: number
  ticker: string
}

function formatNativeAmount(amount: number, ticker: string): string {
  const decimals = ticker === "BTC" ? 8 : ticker === "NRG" ? 2 : 6
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimals })} ${ticker}`
}

function formatUsdEquivalent(usd: number): string {
  return `≈ $${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Production vaults — Epoch-based $10k rebalance tokenomics
type VaultItem = {
  chain: string
  label: string
  address: string
  description: string
  status: string
  statusType: "active" | "awaiting"
  balanceDisplay: string | null
}

const VAULTS: VaultItem[] = [
  {
    chain: "SOL",
    label: "ACTIVE PROTOCOL VAULT",
    address: "AmKdMDFTYRXUHPxcXjvJxMM1xZeAmR6rmeNj2t2cWH3h",
    description: "Primary Protocol Vault (Receives 100% of 5% fees for $NRG Buybacks)",
    status: "🟢 ACTIVE: Accumulating Epoch 1 Fees",
    statusType: "active" as const,
    balanceDisplay: null as string | null,
  },
  {
    chain: "BTC",
    label: "HARD ASSET RESERVE",
    address: "bc1q206f5r0e7lnuzy8kexnjjdhs3wg3ec5zth0kke",
    description: "Physical Gold of Web3. 45% Target Ratio.",
    status: "⏳ AWAITING: Epoch 1 Rebalance ($10k TVL)",
    statusType: "awaiting" as const,
    balanceDisplay: "$0.00",
  },
  {
    chain: "ETH",
    label: "SMART CONTRACT RESERVE",
    address: "0x661613537AbD68166714B68D87F6BF92262e464E",
    description: "EVM Ecosystem Liquidity. Target Ratio.",
    status: "⏳ AWAITING: Epoch 1 Rebalance ($10k TVL)",
    statusType: "awaiting" as const,
    balanceDisplay: "$0.00",
  },
  {
    chain: "SUI",
    label: "EMERGING ECO RESERVE",
    address: "0xa29dd7936ef96a44c859b4c3b3d46a1ee97019cb1f7dd7f23fb3d4d5c1e109b4",
    description: "High-Performance Compute Reserve. Target Ratio.",
    status: "⏳ AWAITING: Epoch 1 Rebalance ($10k TVL)",
    statusType: "awaiting" as const,
    balanceDisplay: "$0.00",
  },
]

function LiveFlowSection() {
  const { data: treasury, loading, error } = useTreasuryData()

  type LogLine = { type: "NETWORK" | "FINANCIAL" | "SYSTEM"; content: string; ts: string }
  const lines: LogLine[] = []

  if (loading) {
    lines.push({
      type: "SYSTEM",
      content: "[Live] Fetching on-chain treasury data…",
      ts: formatTime(Date.now()),
    })
  } else if (error) {
    // Genesis / Epoch 0: show listening state instead of error
    const ts = formatTime(Date.now())
    lines.push({
      type: "SYSTEM",
      content: "Genesis Node Online · Listening for incoming 5% protocol fees...",
      ts,
    })
    lines.push({
      type: "SYSTEM",
      content: "Epoch 1 Target: $10,000 USDT",
      ts,
    })
  } else if (treasury) {
    const ts = formatTime(treasury.lastUpdated)
    const total = treasury.totalReserveUsd
    const solUsd = treasury.assets.find((a) => a.symbol === "SOL")?.usdValue ?? 0
    const btcUsd = treasury.assets.find((a) => a.symbol === "BTC")?.usdValue ?? 0
    const suiEthUsd = treasury.assets.find((a) => a.symbol === "Sui/ETH")?.usdValue ?? 0
    const hardUsd = btcUsd + suiEthUsd

    lines.push({
      type: "FINANCIAL",
      content: `[Treasury] Total reserve $${total.toLocaleString(undefined, { maximumFractionDigits: 0 })} · P_floor $${treasury.pFloor.toFixed(4)} · Updated ${ts}`,
      ts,
    })
    lines.push({
      type: "SYSTEM",
      content: `[Epoch 1] SOL accumulator $${solUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} | BTC+Sui/ETH reserves $${hardUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} · Rebalance at $10k TVL`,
      ts,
    })
  }

  return (
    <div
      className="overflow-hidden border border-border"
      style={{ backgroundColor: "rgba(0,255,65,0.02)" }}
    >
      <div
        className="flex items-center gap-2 border-b border-border px-3 py-2"
        style={{ backgroundColor: "rgba(0,255,65,0.03)" }}
      >
        <Activity className="h-3.5 w-3.5" style={{ color: "#00FF41" }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#00FF41" }}>
          Live Flow
        </span>
        <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
          Epoch 1 · $10k rebalance
        </span>
      </div>
      <div
        className="grid h-[4.5rem] grid-rows-2 content-start gap-0 overflow-hidden p-2"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.01) 2px, rgba(0,255,65,0.01) 4px)",
        }}
      >
        {lines.length > 0 ? (
          lines.map((e, i) => (
            <TerminalLog key={i} type={e.type} message={e.content} timestamp={e.ts} />
          ))
        ) : (
          <>
            <TerminalLog type="SYSTEM" message="Genesis Node Online · Listening for incoming 5% protocol fees..." timestamp={formatTime(Date.now())} />
            <TerminalLog type="SYSTEM" message="Epoch 1 Target: $10,000 USDT" timestamp={formatTime(Date.now())} />
          </>
        )}
      </div>
    </div>
  )
}

interface VaultCardProps extends VaultItem {
  balanceData: VaultBalanceData
  /** SOL vault only: NRG balance (locked repurchased tokens). */
  nrgBalance?: VaultBalanceData
}

function VaultCard({
  chain,
  label,
  address,
  description,
  status,
  statusType,
  balanceData,
  nrgBalance,
}: VaultCardProps) {
  const [copied, setCopied] = useState(false)
  const short = truncateAddress(address, chain)
  const href = getExplorerHref(chain, address)

  const copyAddress = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const isActive = statusType === "active"

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex h-full min-h-0 flex-col border p-4 transition-colors hover:border-primary/40"
      style={{
        backgroundColor: isActive ? "rgba(0,255,65,0.04)" : "rgba(0,255,65,0.02)",
        borderColor: isActive ? "rgba(0,255,65,0.35)" : "var(--border)",
        boxShadow: isActive ? "0 0 0 1px rgba(0,255,65,0.15)" : undefined,
      }}
    >
      {/* 上方内容区 — flex-1 占满剩余空间，使下方余额行在各卡同一水平线 */}
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        {/* 标题行 — 固定高度，多卡水平对齐 */}
        <div className="flex min-h-6 shrink-0 items-center justify-between gap-2">
          <span
            className="truncate text-xs font-bold uppercase tracking-wider"
            style={{ color: isActive ? "#00FF41" : "#00FFFF" }}
          >
            {chain} · {label}
          </span>
          <ExternalLink
            className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100"
            style={{ color: "#00FF41" }}
          />
        </div>

        {/* 地址行 — 固定高度 */}
        <div className="flex min-h-6 shrink-0 items-center gap-1.5 font-mono text-xs">
          <span style={{ color: "#00FF41" }} title={address}>
            {short}
          </span>
          <button
            type="button"
            onClick={copyAddress}
            className="shrink-0 rounded p-0.5 transition-opacity hover:opacity-100 opacity-70"
            style={{ color: "#00FF41" }}
            title="Copy address"
            aria-label="Copy address"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {copied && (
            <span className="text-[10px] uppercase" style={{ color: "rgba(0,255,65,0.8)" }}>
              Copied
            </span>
          )}
        </div>

        {/* 描述 — 固定高度两行，多卡水平对齐 */}
        <div className="min-h-[2.5rem] shrink-0">
          <p className="text-[11px] leading-snug" style={{ color: "rgba(0,255,65,0.55)" }}>
            {description}
          </p>
        </div>

        {/* 状态徽章行 — 固定高度 */}
        <div className="flex min-h-7 shrink-0 flex-wrap items-center gap-2">
          <span
            className={`w-fit px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isActive ? "animate-pulse" : ""}`}
            style={
              isActive
                ? {
                    backgroundColor: "rgba(0,255,65,0.2)",
                    color: "#00FF41",
                    border: "1px solid rgba(0,255,65,0.5)",
                  }
                : {
                    backgroundColor: "rgba(245,158,11,0.15)",
                    color: "rgba(245,158,11,0.95)",
                    border: "1px solid rgba(245,158,11,0.4)",
                  }
            }
          >
            {status}
          </span>
        </div>
      </div>

      {/* Balance row — SOL vault: two lines (LOCKED NRG + LIQUIDITY SOL); others: single Cold Wallet */}
      <div className="mt-[10px] flex min-h-[2.75rem] shrink-0 flex-col justify-end gap-y-0.5 pt-0.5">
        {chain === "SOL" && nrgBalance != null ? (
          <>
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[10px] uppercase" style={{ color: "rgba(0,255,65,0.5)" }}>
                🔒 LOCKED NRG:
              </span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: "#00FF41" }}>
                {formatNativeAmount(nrgBalance.nativeAmount, nrgBalance.ticker)}
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: "rgba(0,255,65,0.45)" }}>
                ({formatUsdEquivalent(nrgBalance.usdValue)})
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[10px] uppercase" style={{ color: "rgba(0,255,65,0.35)" }}>
                💧 LIQUIDITY:
              </span>
              <span className="text-[11px] font-medium tabular-nums" style={{ color: "rgba(0,255,65,0.7)" }}>
                {formatNativeAmount(balanceData.nativeAmount, balanceData.ticker)}
              </span>
              <span className="text-[10px] tabular-nums" style={{ color: "rgba(0,255,65,0.35)" }}>
                ({formatUsdEquivalent(balanceData.usdValue)})
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-[10px] uppercase" style={{ color: "rgba(0,255,65,0.45)" }}>
              Cold Wallet:
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: "#00FF41" }}>
              {formatNativeAmount(balanceData.nativeAmount, balanceData.ticker)}
            </span>
            <span className="text-[11px] tabular-nums" style={{ color: "rgba(0,255,65,0.4)" }}>
              ({formatUsdEquivalent(balanceData.usdValue)})
            </span>
          </div>
        )}
      </div>

      {isActive && (
        <span
          className="absolute right-3 top-3 h-2 w-2 animate-pulse rounded-full"
          style={{ backgroundColor: "#00FF41", boxShadow: "0 0 6px #00FF41" }}
          aria-hidden
        />
      )}
    </a>
  )
}

type TreasuryLike = {
  nativeBalances: { sol: number; btc: number; eth: number; sui: number }
  vaultBalanceUsd: { sol: number; btc: number; eth: number; sui: number }
} | null

/** Build dual-track balance from API/Oracle data (native + USD). */
function getBalanceData(chain: string, treasury: TreasuryLike): VaultBalanceData {
  const fallback: VaultBalanceData = { nativeAmount: 0, usdValue: 0, ticker: chain }
  if (!treasury?.nativeBalances || !treasury?.vaultBalanceUsd) return fallback
  const nb = treasury.nativeBalances
  const vu = treasury.vaultBalanceUsd
  switch (chain) {
    case "SOL":
      return { nativeAmount: nb.sol, usdValue: vu.sol, ticker: "SOL" }
    case "BTC":
      return { nativeAmount: nb.btc, usdValue: vu.btc, ticker: "BTC" }
    case "ETH":
      return { nativeAmount: nb.eth, usdValue: vu.eth, ticker: "ETH" }
    case "SUI":
      return { nativeAmount: nb.sui, usdValue: vu.sui, ticker: "SUI" }
    default:
      return fallback
  }
}

/** SOL vault: NRG balance (locked repurchased tokens). From API/Oracle when available. */
function getSolVaultNrgBalance(_treasury: TreasuryLike): VaultBalanceData {
  // TODO: wire to treasury API / SPL token balance for NRG in vault
  return { nativeAmount: 0, usdValue: 0, ticker: "NRG" }
}

export function TrustCenter() {
  const { data: treasury } = useTreasuryData()

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div
          className="border border-border p-6"
          style={{ backgroundColor: "var(--terminal-bg)" }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" style={{ color: "#00FF41" }} />
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#00FF41" }}>
              Trust Center
            </h2>
          </div>
          <p className="mb-4 text-xs leading-relaxed" style={{ color: "rgba(0,255,65,0.5)" }}>
            {NARRATIVE}
          </p>

          <LiveFlowSection />

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            {VAULTS.map((vault) => (
              <div key={vault.chain} className="relative h-full min-h-0">
                <VaultCard
                  {...vault}
                  balanceData={getBalanceData(vault.chain, treasury)}
                  nrgBalance={vault.chain === "SOL" ? getSolVaultNrgBalance(treasury) : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
