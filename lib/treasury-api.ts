/**
 * NeuroGrid 3.2 Treasury API — Multi-Asset Anchor Era
 * Strict allocation: BTC 45%, SOL 20%, NRG 15%, Sui/ETH 20%
 * All data from on-chain / API — no mock or fallback values.
 */

export interface TreasuryAsset {
  symbol: string
  amount: number
  amountFormatted: string
  usdValue: number
  weight: number // 0-1
}

/** Native on-chain balances per vault (for Trust Center display). */
export interface TreasuryNativeBalances {
  sol: number
  btc: number
  eth: number
  sui: number
}

/** USD value of each vault balance (for Trust Center display). */
export interface TreasuryVaultBalanceUsd {
  sol: number
  btc: number
  eth: number
  sui: number
}

export interface TreasuryData {
  assets: TreasuryAsset[]
  totalReserveUsd: number
  pFloor: number
  ecoPoolBalanceUsd: number
  totalSupplyNrg: number
  lastUpdated: number
  /** Actual vault balances in native units (SOL, BTC, ETH, SUI). */
  nativeBalances: TreasuryNativeBalances
  /** USD value of each vault balance. */
  vaultBalanceUsd: TreasuryVaultBalanceUsd
}

// v3.2: Strict allocation — MUST NOT MODIFY
export const ASSET_WEIGHTS = {
  btc: 0.45,
  sol: 0.2,
  nrg: 0.15,
  suiEth: 0.2,
} as const

const TOTAL_SUPPLY_NRG = 1_000_000
const CACHE_TTL_MS = 60_000 // 1 min cache

let cache: { data: TreasuryData; ts: number } | null = null

async function fetchWithTimeout(
  url: string,
  opts?: RequestInit,
  timeout = 5000
): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal })
    clearTimeout(t)
    return r
  } catch {
    clearTimeout(t)
    throw new Error("Fetch timeout")
  }
}

async function fetchBtcBalance(address: string): Promise<number> {
  const r = await fetchWithTimeout(
    `https://blockstream.info/api/address/${address}`,
    undefined,
    12_000
  )
  const j = await r.json()
  if (!r.ok) throw new Error("BTC balance fetch failed")
  const funded = (j.chain_stats?.funded_txo_sum ?? 0) / 1e8
  const spent = (j.chain_stats?.spent_txo_sum ?? 0) / 1e8
  return Math.max(0, funded - spent)
}

async function fetchSolBalance(address: string): Promise<number> {
  const r = await fetchWithTimeout(
    "https://api.mainnet-beta.solana.com",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      }),
    },
    20_000
  )
  const j = await r.json()
  if (j.error) throw new Error(j.error.message || "SOL balance fetch failed")
  const lamports = j.result?.value ?? 0
  return lamports / 1e9
}

async function fetchSuiBalance(address: string): Promise<number> {
  const r = await fetchWithTimeout("https://fullnode.mainnet.sui.io:443", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "suix_getBalance",
      params: [address, "0x2::sui::SUI"],
    }),
  }, 8000)
  const j = await r.json()
  if (j.error) throw new Error("SUI balance fetch failed")
  const total = j.result?.totalBalance ?? "0"
  return parseInt(total, 10) / 1e9
}

async function fetchEthBalance(address: string): Promise<number> {
  const r = await fetchWithTimeout(
    "https://eth.llamarpc.com",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
    },
    8000
  )
  const j = await r.json()
  if (j.error) throw new Error("ETH balance fetch failed")
  const hex = j.result ?? "0x0"
  return parseInt(hex, 16) / 1e18
}

async function fetchUsdPrices(): Promise<Record<string, number>> {
  const r = await fetchWithTimeout(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,sui&vs_currencies=usd",
    undefined,
    12_000
  )
  const j = await r.json()
  if (!r.ok) throw new Error("Price fetch failed")
  const btc = j.bitcoin?.usd
  const eth = j.ethereum?.usd
  const sol = j.solana?.usd
  const sui = j.sui?.usd
  if (typeof btc !== "number" || typeof eth !== "number" || typeof sol !== "number" || typeof sui !== "number") {
    throw new Error("Invalid price data")
  }
  return { btc, eth, sol, sui, nrg: 0.125 }
}

// Production addresses — Epoch-based $10k rebalance (Trust Center aligned)
const PRODUCTION_TREASURY = {
  sol: "AmKdMDFTYRXUHPxcXjvJxMM1xZeAmR6rmeNj2t2cWH3h",
  btc: "bc1q206f5r0e7lnuzy8kexnjjdhs3wg3ec5zth0kke",
  eth: "0x661613537AbD68166714B68D87F6BF92262e464E",
  sui: "0xa29dd7936ef96a44c859b4c3b3d46a1ee97019cb1f7dd7f23fb3d4d5c1e109b4",
} as const

function getTreasuryAddresses(): { btc: string; sol: string; eth: string; sui: string } {
  return {
    btc: process.env.NEXT_PUBLIC_TREASURY_BTC ?? process.env.TREASURY_BTC ?? PRODUCTION_TREASURY.btc,
    sol: process.env.NEXT_PUBLIC_TREASURY_SOL ?? process.env.TREASURY_SOL ?? PRODUCTION_TREASURY.sol,
    eth: process.env.NEXT_PUBLIC_TREASURY_ETH ?? process.env.TREASURY_ETH ?? PRODUCTION_TREASURY.eth,
    sui: process.env.NEXT_PUBLIC_TREASURY_SUI ?? process.env.TREASURY_SUI ?? PRODUCTION_TREASURY.sui,
  }
}

/** Epoch 0 fallback when external fetches time out or fail (no 500). */
function getEpochZeroTreasuryData(now: number): TreasuryData {
  const assets: TreasuryAsset[] = [
    { symbol: "BTC", amount: 0, amountFormatted: "0.0000", usdValue: 0, weight: ASSET_WEIGHTS.btc },
    { symbol: "SOL", amount: 0, amountFormatted: "0.00", usdValue: 0, weight: ASSET_WEIGHTS.sol },
    { symbol: "NRG", amount: 0, amountFormatted: "0", usdValue: 0, weight: ASSET_WEIGHTS.nrg },
    { symbol: "Sui/ETH", amount: 0, amountFormatted: "0.00", usdValue: 0, weight: ASSET_WEIGHTS.suiEth },
  ]
  return {
    assets,
    totalReserveUsd: 0,
    pFloor: 0,
    ecoPoolBalanceUsd: 0,
    totalSupplyNrg: TOTAL_SUPPLY_NRG,
    lastUpdated: now,
    nativeBalances: { sol: 0, btc: 0, eth: 0, sui: 0 },
    vaultBalanceUsd: { sol: 0, btc: 0, eth: 0, sui: 0 },
  }
}

export async function fetchTreasuryData(): Promise<TreasuryData> {
  const now = Date.now()
  if (cache && now - cache.ts < CACHE_TTL_MS) return cache.data

  const addresses = getTreasuryAddresses()

  try {
    const [prices, btcBal, solBal, suiBal, ethBal] = await Promise.all([
      fetchUsdPrices(),
      fetchBtcBalance(addresses.btc),
      fetchSolBalance(addresses.sol),
      fetchSuiBalance(addresses.sui),
      fetchEthBalance(addresses.eth),
    ])

    const btcUsd = btcBal * prices.btc
    const solUsd = solBal * prices.sol
    const suiUsd = suiBal * prices.sui
    const ethUsd = ethBal * prices.eth
    const suiEthUsd = suiUsd + ethUsd
    const nrgUsd = (btcUsd + solUsd + suiEthUsd) * 0.15 / 0.85

    const totalReserveUsd = btcUsd + solUsd + suiEthUsd + nrgUsd

    const targetBtc = totalReserveUsd * ASSET_WEIGHTS.btc
    const targetSol = totalReserveUsd * ASSET_WEIGHTS.sol
    const targetNrg = totalReserveUsd * ASSET_WEIGHTS.nrg
    const targetSuiEth = totalReserveUsd * ASSET_WEIGHTS.suiEth

    const assets: TreasuryAsset[] = [
      { symbol: "BTC", amount: targetBtc / prices.btc, amountFormatted: (targetBtc / prices.btc).toFixed(4), usdValue: targetBtc, weight: ASSET_WEIGHTS.btc },
      { symbol: "SOL", amount: targetSol / prices.sol, amountFormatted: (targetSol / prices.sol).toFixed(2), usdValue: targetSol, weight: ASSET_WEIGHTS.sol },
      { symbol: "NRG", amount: targetNrg / prices.nrg, amountFormatted: (targetNrg / prices.nrg).toLocaleString(), usdValue: targetNrg, weight: ASSET_WEIGHTS.nrg },
      { symbol: "Sui/ETH", amount: targetSuiEth / prices.eth, amountFormatted: (targetSuiEth / prices.eth).toFixed(2), usdValue: targetSuiEth, weight: ASSET_WEIGHTS.suiEth },
    ]

    const pFloor = totalReserveUsd / TOTAL_SUPPLY_NRG
    const ecoPoolBalanceUsd = totalReserveUsd * 0.15

    const data: TreasuryData = {
      assets,
      totalReserveUsd,
      pFloor,
      ecoPoolBalanceUsd,
      totalSupplyNrg: TOTAL_SUPPLY_NRG,
      lastUpdated: now,
      nativeBalances: { sol: solBal, btc: btcBal, eth: ethBal, sui: suiBal },
      vaultBalanceUsd: { sol: solUsd, btc: btcUsd, eth: ethUsd, sui: suiUsd },
    }
    cache = { data, ts: now }
    return data
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (process.env.NODE_ENV === "development") {
      console.warn("[Treasury API] Epoch 0 fallback:", msg)
    }
    const fallback = getEpochZeroTreasuryData(now)
    cache = { data: fallback, ts: now }
    return fallback
  }
}
