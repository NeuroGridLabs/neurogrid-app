"use client"

import Link from "next/link"
import { useWallet } from "@/lib/wallet-context"
import { useMinerRegistry, NODE_DISPLAY_NAMES } from "@/lib/miner-registry-context"

export function MyRegisteredMiners() {
  const { isConnected, address } = useWallet()
  const { getMinerNodes, nodeRentals, nodePrices, nodeBandwidth } = useMinerRegistry()

  if (!isConnected || !address) return null

  const nodeIds = getMinerNodes(address)

  return (
    <div
      className="flex flex-col overflow-hidden border border-border"
      style={{ backgroundColor: "var(--terminal-bg)" }}
    >
      <div
        className="flex items-center justify-between border-b border-border px-3 py-2"
        style={{ backgroundColor: "rgba(0,255,255,0.03)" }}
      >
        <span className="text-xs uppercase tracking-wider" style={{ color: "#00FFFF" }}>
          My Registered Miners
        </span>
        <span className="text-xs" style={{ color: "rgba(0,255,255,0.4)" }}>
          {nodeIds.length === 0 ? (
            "Register above to list here"
          ) : (
            <>
              {nodeIds.length} node{nodeIds.length !== 1 ? "s" : ""} · Listed in{" "}
              <Link href="/nodes" className="underline hover:no-underline" style={{ color: "#00FFFF" }}>
                Node Command Center
              </Link>
            </>
          )}
        </span>
      </div>
      <div
        className="divide-y px-3 py-2"
        style={{ borderColor: "rgba(0,255,255,0.08)" }}
      >
        {nodeIds.length === 0 ? (
          <p className="py-3 text-xs" style={{ color: "rgba(0,255,255,0.5)" }}>
            No miners registered yet. Use the Node Onboarding form above to register your GPU. Once registered, your node will appear here and in{" "}
            <Link href="/nodes" className="underline hover:no-underline" style={{ color: "#00FFFF" }}>
              Node Command Center
            </Link>{" "}
            on the Nodes page.
          </p>
        ) : (
          nodeIds.map((nodeId) => {
            const renter = nodeRentals[nodeId] ?? null
            const name = NODE_DISPLAY_NAMES[nodeId] ?? nodeId
            const price = nodePrices[nodeId] ?? "—"
            const bandwidth = nodeBandwidth[nodeId] ?? "—"
            return (
              <div
                key={nodeId}
                className="flex flex-col gap-1 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <span className="text-sm font-bold" style={{ color: "#00FFFF" }}>
                    {name}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: renter ? "rgba(0,255,65,0.1)" : "rgba(0,255,255,0.08)",
                      color: renter ? "#00FF41" : "rgba(0,255,255,0.8)",
                      borderColor: renter ? "rgba(0,255,65,0.35)" : "rgba(0,255,255,0.25)",
                    }}
                  >
                    {renter ? (
                      <>Rented by {renter.slice(0, 6)}…{renter.slice(-4)}</>
                    ) : (
                      "Available"
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0 text-xs" style={{ color: "rgba(0,255,255,0.6)" }}>
                  <span>Price: {price}</span>
                  <span>Bandwidth: {bandwidth}</span>
                  <span style={{ color: "#00FF41" }}>Earned: {renter ? "$—" : "$0"}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
