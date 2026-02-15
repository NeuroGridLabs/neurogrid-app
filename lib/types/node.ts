import type { BadgeStatus } from "@/components/atoms/status-badge"

/** Production node from backend. All fields from API; no mock defaults. */
export interface Node {
  id: string
  name: string
  gpus: string
  vram: string
  status: BadgeStatus
  utilization: number
  bandwidth: string
  latencyMs: number
  isGenesis?: boolean
  /** Wallet address that rented this node; null = available */
  rentedBy: string | null
  gateway?: string
  port?: number
  /** Miner wallet address — receives 95% of payment (SPL USDT) */
  minerWalletAddress: string
  /** Price in USDT (human amount, e.g. 0.59 for $0.59/hr). Used for SPL transfer with 6 decimals. */
  priceInUSDT: number
  /** Display string e.g. "$0.59/hr" — can be derived from priceInUSDT */
  pricePerHour: string
}
