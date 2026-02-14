"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"

const STORAGE_KEY = "neurogrid-miner-registry"
const RENTALS_STORAGE_KEY = "neurogrid-miner-rentals"
const PRICES_STORAGE_KEY = "neurogrid-miner-node-prices"
const BANDWIDTH_STORAGE_KEY = "neurogrid-miner-node-bandwidth"

/** Node ids that can be registered as miners (same pool as Node Command Center) */
export const REGISTRABLE_NODE_IDS = [
  "alpha-01",
  "beta-07",
  "gamma-12",
  "delta-03",
  "epsilon-09",
  "zeta-15",
  "eta-22",
  "theta-08",
  "iota-11",
  "kappa-04",
] as const

export const NODE_DISPLAY_NAMES: Record<string, string> = {
  "alpha-01": "Alpha-01",
  "beta-07": "Beta-07",
  "gamma-12": "Gamma-12",
  "delta-03": "Delta-03",
  "epsilon-09": "Epsilon-09",
  "zeta-15": "Zeta-15",
  "eta-22": "Eta-22",
  "theta-08": "Theta-08",
  "iota-11": "Iota-11",
  "kappa-04": "Kappa-04",
}

/** Node id -> GPU spec for price range by same-type */
export const NODE_GPU_MAP: Record<string, string> = {
  "alpha-01": "1x RTX4090",
  "beta-07": "1x RTX4090",
  "gamma-12": "4x A100",
  "delta-03": "2x H100",
  "epsilon-09": "1x RTX4090",
  "zeta-15": "2x A100",
  "eta-22": "4x H100",
  "theta-08": "1x RTX4090",
  "iota-11": "2x RTX4090",
  "kappa-04": "1x A100",
}

function loadNodeToMiner(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return typeof parsed === "object" && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function saveNodeToMiner(map: Record<string, string>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

function loadNodeRentals(): Record<string, string | null> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(RENTALS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string | null>
    return typeof parsed === "object" && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function saveNodeRentals(map: Record<string, string | null>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(RENTALS_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

function loadNodePrices(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(PRICES_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return typeof parsed === "object" && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function saveNodePrices(map: Record<string, string>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PRICES_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

function loadNodeBandwidth(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(BANDWIDTH_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return typeof parsed === "object" && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function saveNodeBandwidth(map: Record<string, string>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(BANDWIDTH_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

interface MinerRegistryContextValue {
  /** nodeId -> miner wallet address (who registered this node as their miner) */
  nodeToMiner: Record<string, string>
  /** nodeId -> renter wallet address (who deployed/ordered; null = available) — synced from nodes page */
  nodeRentals: Record<string, string | null>
  /** nodeId -> miner-set price e.g. "$0.59/hr" */
  nodePrices: Record<string, string>
  /** nodeId -> home bandwidth e.g. "1 Gbps" */
  nodeBandwidth: Record<string, string>
  /** Register a node as miner for the given wallet; returns the nodeId if successful */
  registerMiner: (
    walletAddress: string,
    options?: { pricePerHour?: string; bandwidth?: string }
  ) => string | null
  /** Called by nodes page when deploy/undeploy completes to keep rentals in sync */
  setNodeRental: (nodeId: string, renterAddress: string | null) => void
  /** Get node ids registered by this wallet */
  getMinerNodes: (walletAddress: string) => string[]
  /** Get first node id not yet registered by any wallet */
  getAvailableNodeId: () => string | null
  /** Min/max price ($/hr) for same GPU type among registered nodes; for hint in miner form */
  getPriceRangeForGpu: (gpus: string) => { min: number; max: number } | null
}

const MinerRegistryContext = createContext<MinerRegistryContextValue | null>(null)

function parsePriceToNumber(priceStr: string): number | null {
  const m = priceStr.match(/\$?([\d.]+)/)
  if (!m) return null
  const n = parseFloat(m[1])
  return Number.isFinite(n) ? n : null
}

export function MinerRegistryProvider({ children }: { children: ReactNode }) {
  const [nodeToMiner, setNodeToMiner] = useState<Record<string, string>>({})
  const [nodeRentals, setNodeRentals] = useState<Record<string, string | null>>(() => loadNodeRentals())
  const [nodePrices, setNodePrices] = useState<Record<string, string>>(() => loadNodePrices())
  const [nodeBandwidth, setNodeBandwidth] = useState<Record<string, string>>(() => loadNodeBandwidth())

  useEffect(() => {
    setNodeToMiner(loadNodeToMiner())
  }, [])
  useEffect(() => {
    setNodePrices(loadNodePrices())
  }, [])
  useEffect(() => {
    setNodeBandwidth(loadNodeBandwidth())
  }, [])

  const persistNodeToMiner = useCallback((map: Record<string, string>) => {
    setNodeToMiner(map)
    saveNodeToMiner(map)
  }, [])

  const registerMiner = useCallback(
    (
      walletAddress: string,
      options?: { pricePerHour?: string; bandwidth?: string }
    ): string | null => {
      const current = loadNodeToMiner()
      const taken = new Set(Object.keys(current))
      const available = REGISTRABLE_NODE_IDS.find((id) => !taken.has(id))
      if (!available) return null
      const next = { ...current, [available]: walletAddress }
      persistNodeToMiner(next)
      const price = options?.pricePerHour ?? "$0.59/hr"
      const bandwidth = options?.bandwidth ?? "1 Gbps"
      setNodePrices((prev) => {
        const nextP = { ...prev, [available]: price }
        saveNodePrices(nextP)
        return nextP
      })
      setNodeBandwidth((prev) => {
        const nextB = { ...prev, [available]: bandwidth }
        saveNodeBandwidth(nextB)
        return nextB
      })
      return available
    },
    [persistNodeToMiner]
  )

  const setNodeRental = useCallback((nodeId: string, renterAddress: string | null) => {
    setNodeRentals((prev) => {
      const next = { ...prev, [nodeId]: renterAddress }
      saveNodeRentals(next)
      return next
    })
  }, [])

  const getMinerNodes = useCallback(
    (walletAddress: string): string[] => {
      return REGISTRABLE_NODE_IDS.filter((id) => nodeToMiner[id] === walletAddress)
    },
    [nodeToMiner]
  )

  const getAvailableNodeId = useCallback((): string | null => {
    const taken = new Set(Object.keys(nodeToMiner))
    return REGISTRABLE_NODE_IDS.find((id) => !taken.has(id)) ?? null
  }, [nodeToMiner])

  const getPriceRangeForGpu = useCallback(
    (gpus: string): { min: number; max: number } | null => {
      const prices: number[] = []
      REGISTRABLE_NODE_IDS.forEach((id) => {
        if (NODE_GPU_MAP[id] !== gpus) return
        if (!nodeToMiner[id]) return
        const p = nodePrices[id]
        if (!p) return
        const n = parsePriceToNumber(p)
        if (n != null) prices.push(n)
      })
      if (prices.length === 0) return null
      return { min: Math.min(...prices), max: Math.max(...prices) }
    },
    [nodeToMiner, nodePrices]
  )

  return (
    <MinerRegistryContext.Provider
      value={{
        nodeToMiner,
        nodeRentals,
        nodePrices,
        nodeBandwidth,
        registerMiner,
        setNodeRental,
        getMinerNodes,
        getAvailableNodeId,
        getPriceRangeForGpu,
      }}
    >
      {children}
    </MinerRegistryContext.Provider>
  )
}

export function useMinerRegistry() {
  const ctx = useContext(MinerRegistryContext)
  if (!ctx) throw new Error("useMinerRegistry must be used within MinerRegistryProvider")
  return ctx
}
