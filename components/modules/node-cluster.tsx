"use client"

import { useEffect, useState, useCallback } from "react"
import { StatusBadge, type BadgeStatus } from "@/components/atoms/status-badge"
import { GpuBar } from "@/components/atoms/gpu-bar"
import { useMinerRegistry } from "@/lib/miner-registry-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Rocket, Circle, X, ArrowRight, TrendingUp, CheckCircle2, Lock } from "lucide-react"
import { motion } from "framer-motion"

const DEPLOY_DURATION_MS = 2500
const UNDEPLOY_DURATION_MS = 1800
const ALLOCATE_MS = 600
const SYNC_MS = DEPLOY_DURATION_MS - ALLOCATE_MS

type ActionModalType = "deploy" | "undeploy"
type ModalPhase = "confirm" | "in_progress" | "done"
type ProgressStep = "allocating" | "syncing" | "ready" | "unbinding" | "unbound"

/** Snapshot passed to parent when deploy completes; used by My Rented Nodes */
export interface RentedNodeSnapshot {
  id: string
  name: string
  gpus: string
  vram: string
  status: BadgeStatus
  utilization: number
  gateway: string
  port: number
}

interface NodeClusterProps {
  isConnected?: boolean
  walletAddress?: string | null
  openConnectModal?: () => void
  onDeployComplete?: (node: RentedNodeSnapshot) => void
  onUndeployComplete?: (nodeId: string) => void
  /** When set, open undeploy confirm modal for this node (e.g. from My Rented Nodes panel) */
  triggerUndeployNodeId?: string | null
  /** Called when undeploy modal is opened from trigger (parent should clear trigger) */
  onUndeployModalOpen?: () => void
}

interface Node {
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
  /** Miner-set rental price per hour (e.g. "$0.59/hr") */
  pricePerHour: string
}

function mockGateway(nodeId: string): string {
  return `${nodeId.replace(/-/g, "")}.ngrid.xyz`
}
function mockPort(nodeId: string): number {
  return nodeId.charCodeAt(nodeId.length - 1) % 2 === 0 ? 443 : 7890
}

const INITIAL_NODES: Node[] = [
  { id: "alpha-01", name: "Alpha-01", gpus: "1x RTX4090", vram: "24GB", status: "ACTIVE", utilization: 87, bandwidth: "1 Gbps", latencyMs: 12, isGenesis: true, rentedBy: null, pricePerHour: "$0.59/hr" },
  { id: "beta-07", name: "Beta-07", gpus: "1x RTX4090", vram: "24GB", status: "ACTIVE", utilization: 62, bandwidth: "500 Mbps", latencyMs: 28, isGenesis: false, rentedBy: null, pricePerHour: "$0.62/hr" },
  { id: "gamma-12", name: "Gamma-12", gpus: "4x A100", vram: "320GB", status: "SYNCING", utilization: 34, bandwidth: "2 Gbps", latencyMs: 45, isGenesis: false, rentedBy: null, pricePerHour: "$2.40/hr" },
  { id: "delta-03", name: "Delta-03", gpus: "2x H100", vram: "160GB", status: "ACTIVE", utilization: 71, bandwidth: "1 Gbps", latencyMs: 18, isGenesis: false, rentedBy: null, pricePerHour: "$1.85/hr" },
  { id: "epsilon-09", name: "Epsilon-09", gpus: "1x RTX4090", vram: "24GB", status: "ACTIVE", utilization: 45, bandwidth: "500 Mbps", latencyMs: 52, isGenesis: false, rentedBy: null, pricePerHour: "$0.55/hr" },
  { id: "zeta-15", name: "Zeta-15", gpus: "2x A100", vram: "160GB", status: "ACTIVE", utilization: 78, bandwidth: "1 Gbps", latencyMs: 33, isGenesis: false, rentedBy: null, pricePerHour: "$1.20/hr" },
  { id: "eta-22", name: "Eta-22", gpus: "4x H100", vram: "320GB", status: "SYNCING", utilization: 12, bandwidth: "2 Gbps", latencyMs: 67, isGenesis: false, rentedBy: null, pricePerHour: "$3.10/hr" },
  { id: "theta-08", name: "Theta-08", gpus: "1x RTX4090", vram: "24GB", status: "ACTIVE", utilization: 91, bandwidth: "1 Gbps", latencyMs: 15, isGenesis: false, rentedBy: null, pricePerHour: "$0.65/hr" },
  { id: "iota-11", name: "Iota-11", gpus: "2x RTX4090", vram: "48GB", status: "ACTIVE", utilization: 56, bandwidth: "1 Gbps", latencyMs: 41, isGenesis: false, rentedBy: null, pricePerHour: "$1.05/hr" },
  { id: "kappa-04", name: "Kappa-04", gpus: "1x A100", vram: "80GB", status: "ACTIVE", utilization: 68, bandwidth: "500 Mbps", latencyMs: 38, isGenesis: false, rentedBy: null, pricePerHour: "$0.89/hr" },
]

export function NodeCluster({
  isConnected = false,
  walletAddress = null,
  openConnectModal,
  onDeployComplete,
  onUndeployComplete,
  triggerUndeployNodeId = null,
  onUndeployModalOpen,
}: NodeClusterProps) {
  const { nodeToMiner, nodeRentals, nodePrices, setNodeRental } = useMinerRegistry()
  const [nodes, setNodes] = useState<Node[]>([])
  const [hoverUndeployId, setHoverUndeployId] = useState<string | null>(null)
  const [actionModal, setActionModal] = useState<{
    type: ActionModalType
    node: Node
  } | null>(null)
  const [modalPhase, setModalPhase] = useState<ModalPhase>("confirm")
  const [progressStep, setProgressStep] = useState<ProgressStep | null>(null)
  const [lastTriggerUndeployId, setLastTriggerUndeployId] = useState<string | null>(null)

  const registeredNodeIds = Object.keys(nodeToMiner)

  useEffect(() => {
    if (registeredNodeIds.length === 0) {
      setNodes([])
      return
    }
    setNodes((prev) =>
      registeredNodeIds.map((id) => {
        const template = INITIAL_NODES.find((n) => n.id === id)
        const rentedBy = nodeRentals[id] ?? null
        const pricePerHour = nodePrices[id] ?? template?.pricePerHour ?? "$0.59/hr"
        const existing = prev.find((n) => n.id === id)
        if (existing)
          return { ...existing, rentedBy, pricePerHour } as Node
        if (!template) return null
        return { ...template, rentedBy, pricePerHour } as Node
      }).filter((n): n is Node => n !== null)
    )
  }, [registeredNodeIds.join(","), nodePrices, nodeRentals])

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

  const closeModal = useCallback(() => {
    setActionModal(null)
    setModalPhase("confirm")
    setProgressStep(null)
  }, [])

  const runDeploySequence = useCallback(
    (node: Node) => {
      const nodeId = node.id
      const address = walletAddress ?? ""
      setProgressStep("allocating")
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, status: "PENDING" as BadgeStatus } : n
        )
      )
      const t1 = setTimeout(() => {
        setProgressStep("syncing")
        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId ? { ...n, status: "SYNCING" as BadgeStatus } : n
          )
        )
      }, ALLOCATE_MS)
      const t2 = setTimeout(() => {
        setProgressStep("ready")
        const gateway = mockGateway(nodeId)
        const port = mockPort(nodeId)
        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  status: "ACTIVE" as BadgeStatus,
                  rentedBy: address,
                  gateway,
                  port,
                }
              : n
          )
        )
        setModalPhase("done")
        setNodeRental(nodeId, address)
        onDeployComplete?.({
          id: nodeId,
          name: node.name,
          gpus: node.gpus,
          vram: node.vram,
          status: "ACTIVE",
          utilization: node.utilization,
          gateway,
          port,
        })
      }, DEPLOY_DURATION_MS)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    },
    [walletAddress, onDeployComplete, setNodeRental]
  )

  const runUndeploySequence = useCallback(
    (nodeId: string, skipModal?: boolean) => {
      setProgressStep("unbinding")
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, status: "SYNCING" as BadgeStatus } : n
        )
      )
      const t = setTimeout(() => {
        setProgressStep("unbound")
        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  status: "ACTIVE" as BadgeStatus,
                  rentedBy: null,
                  gateway: undefined,
                  port: undefined,
                }
              : n
          )
        )
        if (!skipModal) setModalPhase("done")
        setNodeRental(nodeId, null)
        onUndeployComplete?.(nodeId)
      }, UNDEPLOY_DURATION_MS)
      return () => clearTimeout(t)
    },
    [onUndeployComplete, setNodeRental]
  )

  useEffect(() => {
    if (!triggerUndeployNodeId) {
      setLastTriggerUndeployId(null)
      return
    }
    if (triggerUndeployNodeId === lastTriggerUndeployId) return
    const node = nodes.find((n) => n.id === triggerUndeployNodeId)
    if (!node) return
    setLastTriggerUndeployId(triggerUndeployNodeId)
    setActionModal({ type: "undeploy", node })
    setModalPhase("confirm")
    setProgressStep(null)
    onUndeployModalOpen?.()
  }, [triggerUndeployNodeId, lastTriggerUndeployId, nodes, onUndeployModalOpen])

  const onConfirmDeploy = useCallback(() => {
    if (!actionModal || actionModal.type !== "deploy") return
    setModalPhase("in_progress")
    runDeploySequence(actionModal.node)
  }, [actionModal, runDeploySequence])

  const onConfirmUndeploy = useCallback(() => {
    if (!actionModal || actionModal.type !== "undeploy") return
    setModalPhase("in_progress")
    runUndeploySequence(actionModal.node.id)
  }, [actionModal, runUndeploySequence])

  const openDeployModal = useCallback(
    (node: Node) => {
      if (!isConnected) {
        openConnectModal?.()
        return
      }
      setActionModal({ type: "deploy", node })
      setModalPhase("confirm")
      setProgressStep(null)
    },
    [isConnected, openConnectModal]
  )

  const openUndeployModal = useCallback((node: Node) => {
    setActionModal({ type: "undeploy", node })
    setModalPhase("confirm")
    setProgressStep(null)
  }, [])

  const onActionClick = useCallback(
    (node: Node) => {
      if (!isConnected) {
        openConnectModal?.()
        return
      }
      if (node.status === "SYNCING" || node.status === "PENDING") return
      const isMyNode = walletAddress && node.rentedBy === walletAddress
      const isOthersNode = node.rentedBy !== null && !isMyNode
      if (isOthersNode) return
      if (isMyNode && hoverUndeployId === node.id) {
        openUndeployModal(node)
      } else if (node.rentedBy === null) {
        openDeployModal(node)
      }
    },
    [isConnected, walletAddress, hoverUndeployId, openConnectModal, openDeployModal, openUndeployModal]
  )

  const activeCount = nodes.filter((n) => n.status === "ACTIVE").length

  return (
    <div
      className="flex flex-col overflow-hidden border border-border"
      style={{ backgroundColor: "var(--terminal-bg)" }}
    >
      <div
        className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2"
        style={{ backgroundColor: "rgba(0,255,65,0.03)" }}
      >
        <span className="text-xs uppercase tracking-wider" style={{ color: "#00cc33" }}>
          Node Command Center
        </span>
        <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
          {activeCount}/{nodes.length} running
        </span>
      </div>

      <div
        className="overflow-y-auto overflow-x-hidden"
        style={{ height: "400px" }}
      >
        {nodes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center"
            style={{ color: "rgba(0,255,65,0.5)" }}
          >
            <p className="text-xs">
              No nodes on sale. Miners register GPUs via Miner Portal → Node Onboarding; registered nodes appear here for rent.
            </p>
          </div>
        ) : (
        <div
          className="divide-y"
          style={{ borderColor: "rgba(0,255,65,0.08)" }}
        >
          {nodes.map((node) => (
            <div
              key={node.id}
              className="grid grid-cols-[1fr_auto] grid-rows-[auto_auto_auto] items-start gap-x-4 gap-y-1 px-4 py-3"
              style={{ minHeight: "72px" }}
            >
              {/* Line 1: Name, GENESIS badge, StatusBadge, miner rental price */}
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: node.isGenesis ? "#00FFFF" : "#00FF41" }}
                >
                  {node.name}
                </span>
                {node.isGenesis && (
                  <span
                    className="px-1.5 py-0.5 text-[10px] font-bold"
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
                <span
                  className="inline-flex items-center px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: "rgba(0,255,65,0.1)",
                    color: "#00FF41",
                    border: "1px solid rgba(0,255,65,0.35)",
                  }}
                >
                  {node.pricePerHour}
                </span>
              </div>
              {/* Action icon: col 2, rowspan 2 — wallet-bound: Deploy (available) / Undeploy (my node) / Not operable (other's) */}
              <div className="row-span-2 flex items-start pt-0.5">
                {node.status === "SYNCING" || node.status === "PENDING" ? (
                  <button
                    type="button"
                    disabled
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded transition-opacity"
                    style={{ color: "#ffc800" }}
                    aria-label="In progress"
                    title="In progress..."
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-5 w-5" />
                    </motion.div>
                  </button>
                ) : !isConnected ? (
                  <button
                    type="button"
                    onClick={() => onActionClick(node)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded transition-all hover:opacity-90"
                    style={{ color: "rgba(0,255,65,0.5)" }}
                    aria-label="Connect wallet"
                    title="Connect wallet to operate"
                  >
                    <Lock className="h-5 w-5" />
                  </button>
                ) : node.rentedBy !== null && node.rentedBy !== walletAddress ? (
                  <span
                    className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded opacity-60"
                    style={{ color: "rgba(0,255,65,0.4)" }}
                    title="Not operable — rented by another wallet"
                    aria-label="Not operable"
                  >
                    <Lock className="h-5 w-5" />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onActionClick(node)}
                    onMouseEnter={() =>
                      node.rentedBy === walletAddress && setHoverUndeployId(node.id)
                    }
                    onMouseLeave={() => setHoverUndeployId(null)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded transition-all hover:opacity-90"
                    style={{
                      color:
                        node.rentedBy === walletAddress
                          ? hoverUndeployId === node.id
                            ? "#ff4444"
                            : "#00FF41"
                          : node.isGenesis
                            ? "#00FFFF"
                            : "rgba(0,255,65,0.8)",
                    }}
                    aria-label={
                      node.rentedBy === walletAddress
                        ? hoverUndeployId === node.id
                          ? "Undeploy"
                          : "Active"
                        : "Deploy"
                    }
                    title={
                      node.rentedBy === walletAddress
                        ? hoverUndeployId === node.id
                          ? "Undeploy"
                          : "Active — hover to undeploy"
                        : "Deploy"
                    }
                  >
                    {node.rentedBy === walletAddress ? (
                      hoverUndeployId === node.id ? (
                        <X className="h-5 w-5" />
                      ) : (
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Circle className="h-3 w-3 fill-current" />
                        </motion.span>
                      )
                    ) : (
                      <Rocket className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
              {/* Line 2: GPU/VRAM + generic metadata (no FRP connection strings) */}
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-0.5 font-mono text-xs" style={{ color: "rgba(0,255,65,0.6)" }}>
                <span className="truncate" title={node.gpus}>{node.gpus}</span>
                <span>{node.vram}</span>
                <span>[Encrypted Tunnel Ready]</span>
                <span>Bandwidth: 1 Gbps Limit</span>
                <span>Status: Idle</span>
              </div>
              {/* Line 3: Progress bar + utilization */}
              <div className="flex min-w-0 items-center gap-2">
                <div className="min-w-0 flex-1">
                  <GpuBar
                    value={node.utilization}
                    color={node.isGenesis ? "#00FFFF" : "#00FF41"}
                    hideLabel
                  />
                </div>
                <span
                  className="w-8 shrink-0 text-right text-xs font-medium"
                  style={{ color: node.isGenesis ? "#00FFFF" : "#00FF41" }}
                >
                  {node.utilization}%
                </span>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Deploy / Undeploy confirmation & progress modal */}
      <Dialog
        open={!!actionModal}
        onOpenChange={(open) => {
          if (!open && (modalPhase === "confirm" || modalPhase === "done")) closeModal()
        }}
      >
        <DialogContent
          className="border"
          style={{
            backgroundColor: "var(--terminal-bg)",
            borderColor: "rgba(0,255,65,0.3)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider" style={{ color: "#00FF41" }}>
              {actionModal?.type === "deploy"
                ? "Confirm Deploy"
                : "Confirm Undeploy"}
              {actionModal?.node && (
                <span className="ml-2 font-mono" style={{ color: "rgba(0,255,65,0.7)" }}>
                  {actionModal.node.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {modalPhase === "confirm" && actionModal && (
            <div className="space-y-4">
              {actionModal.type === "deploy" ? (
                <>
                  <p className="text-xs" style={{ color: "rgba(0,255,65,0.6)" }}>
                    Confirm you want to deploy to this node. Protocol fee (5%) applies. This is not a misclick?
                  </p>
                  <div
                    className="flex flex-col items-center gap-2 border p-4"
                    style={{
                      borderColor: "rgba(0,255,65,0.2)",
                      backgroundColor: "rgba(0,255,65,0.03)",
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs" style={{ color: "#00FF41" }}>
                      <span className="flex items-center gap-1">Usage <TrendingUp className="h-3.5 w-3.5" /></span>
                      <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "rgba(0,255,65,0.5)" }} />
                      <span className="flex items-center gap-1">Buyback <TrendingUp className="h-3.5 w-3.5" /></span>
                      <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "rgba(0,255,65,0.5)" }} />
                      <span className="flex items-center gap-1">Floor Price <TrendingUp className="h-3.5 w-3.5" /></span>
                    </div>
                    <p className="text-[10px]" style={{ color: "rgba(0,255,65,0.5)" }}>
                      100% of Protocol Fees (5%) → Buyback Engine → $NRG Floor Price Appreciation
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onConfirmDeploy}
                      className="flex-1 border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-90"
                      style={{ borderColor: "#00FF41", color: "#00FF41" }}
                    >
                      Confirm Deploy
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-xs uppercase tracking-wider"
                      style={{ color: "rgba(0,255,65,0.5)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs" style={{ color: "rgba(0,255,65,0.6)" }}>
                    Unbind this node? You will lose access until you deploy again. Confirm this is not a misclick?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onConfirmUndeploy}
                      className="flex-1 border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-90"
                      style={{ borderColor: "#ff4444", color: "#ff4444" }}
                    >
                      Confirm Undeploy
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-xs uppercase tracking-wider"
                      style={{ color: "rgba(0,255,65,0.5)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {modalPhase === "in_progress" && actionModal && (
            <div className="flex flex-col items-center gap-4 py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-10 w-10" style={{ color: "#ffc800" }} />
              </motion.div>
              <p className="text-sm font-medium uppercase tracking-wider" style={{ color: "#00FF41" }}>
                {actionModal.type === "deploy"
                  ? progressStep === "allocating"
                    ? "Allocating tunnel..."
                    : progressStep === "syncing"
                      ? "Syncing node..."
                      : "Preparing..."
                  : "Unbinding..."}
              </p>
              <p className="text-xs" style={{ color: "rgba(0,255,65,0.5)" }}>
                {actionModal.node.name} — please wait
              </p>
            </div>
          )}

          {modalPhase === "done" && actionModal && (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="h-12 w-12" style={{ color: "#00FF41" }} />
              <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "#00FF41" }}>
                {actionModal.type === "deploy" ? "Ready" : "Unbind complete"}
              </p>
              <p className="text-xs" style={{ color: "rgba(0,255,65,0.5)" }}>
                {actionModal.type === "deploy"
                  ? "Node is ready. You can close this dialog."
                  : "Access released. You can close this dialog."}
              </p>
              <button
                type="button"
                onClick={closeModal}
                className="border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-90"
                style={{ borderColor: "#00FF41", color: "#00FF41" }}
              >
                Close
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
