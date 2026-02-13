"use client"

import { useEffect, useState } from "react"
import { StatusBadge, type BadgeStatus } from "@/components/atoms/status-badge"
import { GpuBar } from "@/components/atoms/gpu-bar"
import { NeonButton } from "@/components/atoms/neon-button"

interface NodeClusterProps {
  isConnected?: boolean
  onDeployClick?: () => void
}

interface Node {
  id: string
  name: string
  gpus: string
  vram: string
  status: BadgeStatus
  utilization: number
  gateway: string
  isGenesis?: boolean
}

const INITIAL_NODES: Node[] = [
  {
    id: "alpha-01",
    name: "Alpha-01",
    gpus: "1x RTX 4090",
    vram: "24 GB",
    status: "ACTIVE",
    utilization: 87,
    gateway: "blancopuff.xyz",
    isGenesis: true,
  },
  {
    id: "beta-07",
    name: "Beta-07",
    gpus: "1x RTX 4090",
    vram: "24 GB",
    status: "ACTIVE",
    utilization: 62,
    gateway: "node-beta.ngrid",
  },
  {
    id: "gamma-12",
    name: "Gamma-12",
    gpus: "4x A100",
    vram: "320 GB",
    status: "SYNCING",
    utilization: 34,
    gateway: "datacenter-eu.ngrid",
  },
]

export function NodeCluster({ isConnected = false, onDeployClick }: NodeClusterProps) {
  const [nodes, setNodes] = useState(INITIAL_NODES)

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          utilization: Math.max(
            10,
            Math.min(99, n.utilization + Math.floor(Math.random() * 11) - 5)
          ),
        }))
      )
    }, 2500)
    return () => clearInterval(interval)
  }, [])

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
          Node Command Center
        </span>
        <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
          {nodes.filter((n) => n.status === "ACTIVE").length}/{nodes.length} active
        </span>
      </div>

      <div className="flex flex-col divide-y" style={{ borderColor: "rgba(0,255,65,0.08)" }}>
        {nodes.map((node) => (
          <div key={node.id} className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="text-sm font-bold"
                  style={{ color: node.isGenesis ? "#00FFFF" : "#00FF41" }}
                >
                  {node.name}
                </span>
                {node.isGenesis && (
                  <span
                    className="px-1.5 py-0.5 text-xs font-bold"
                    style={{
                      backgroundColor: "rgba(0,255,255,0.1)",
                      color: "#00FFFF",
                      border: "1px solid rgba(0,255,255,0.3)",
                    }}
                  >
                    GENESIS
                  </span>
                )}
                <StatusBadge status={node.status} />
              </div>
              <span className="hidden text-xs md:inline" style={{ color: "rgba(0,255,65,0.4)" }}>
                {node.gateway}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(0,255,65,0.5)" }}>
              <span>{node.gpus}</span>
              <span>{node.vram}</span>
            </div>
            <GpuBar
              value={node.utilization}
              color={node.isGenesis ? "#00FFFF" : "#00FF41"}
            />
            {node.isGenesis && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <NeonButton variant="secondary" accentColor="#00FFFF" className="text-xs px-3 py-1.5">
                  Reboot Tunnel
                </NeonButton>
                <NeonButton variant="ghost" accentColor="#00FFFF" className="text-xs px-3 py-1.5">
                  Update Pricing
                </NeonButton>
                {onDeployClick && (
                  <div className="flex w-full flex-col gap-1">
                    <NeonButton
                      variant="primary"
                      accentColor="#00FF41"
                      className="text-xs px-3 py-1.5"
                      onClick={onDeployClick}
                    >
                      Deploy via NeuroGrid
                    </NeonButton>
                    <span className="text-[10px]" style={{ color: "rgba(0,255,65,0.4)" }}>
                      100% of Protocol Fees support the $NRG Hard-Asset Floor.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
