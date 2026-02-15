"use client"

import { useEffect, useState, useCallback } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import {
  PublicKey,
  Transaction,
  TransactionExpiredBlockheightExceededError,
} from "@solana/web3.js"
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { StatusBadge, type BadgeStatus } from "@/components/atoms/status-badge"
import { GpuBar } from "@/components/atoms/gpu-bar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Rocket, Circle, X, ArrowRight, TrendingUp, CheckCircle2, Lock } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  TREASURY_WALLET_ADDRESS,
  USDT_MINT_ADDRESS,
  USDT_DECIMALS,
} from "@/lib/solana-constants"
import type { Node } from "@/lib/types/node"
import {
  useMinerRegistry,
  NODE_DISPLAY_NAMES,
  NODE_GPU_MAP,
  NODE_VRAM_MAP,
} from "@/lib/miner-registry-context"

const DEPLOY_DURATION_MS = 2500
const UNDEPLOY_DURATION_MS = 1800
const ALLOCATE_MS = 600
const NODES_FETCH_INTERVAL_MS = 30_000

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
  triggerUndeployNodeId?: string | null
  onUndeployModalOpen?: () => void
}

async function fetchNodes(): Promise<Node[]> {
  const res = await fetch("/api/nodes", { cache: "no-store" })
  if (!res.ok) return []
  const data = (await res.json()) as { nodes?: Node[] }
  return Array.isArray(data.nodes) ? data.nodes : []
}

/** USDT raw amount (6 decimals). No careless rounding. */
function usdtToRaw(humanAmount: number): bigint {
  const scaled = humanAmount * 10 ** USDT_DECIMALS
  return BigInt(Math.floor(scaled))
}

/** Build Node[] from miner registry when /api/nodes returns empty (no backend linked). */
function buildNodesFromRegistry(
  nodeToMiner: Record<string, string>,
  nodeRentals: Record<string, string | null>,
  nodePrices: Record<string, string>,
  nodeBandwidth: Record<string, string>,
): Node[] {
  return Object.keys(nodeToMiner).map((id): Node => {
    const priceStr = nodePrices[id] ?? "$0.59/hr"
    const match = priceStr.match(/\$?([\d.]+)/)
    const priceInUSDT = match ? parseFloat(match[1]) : 0.59
    return {
      id,
      name: NODE_DISPLAY_NAMES[id] ?? id,
      gpus: NODE_GPU_MAP[id] ?? "—",
      vram: NODE_VRAM_MAP[id] ?? "24GB",
      status: "PENDING",
      utilization: 0,
      bandwidth: nodeBandwidth[id] ?? "1 Gbps",
      latencyMs: 0,
      rentedBy: nodeRentals[id] ?? null,
      minerWalletAddress: nodeToMiner[id],
      priceInUSDT: Number.isFinite(priceInUSDT) ? priceInUSDT : 0.59,
      pricePerHour: priceStr,
    }
  })
}

export function NodeCluster({
  isConnected = false,
  walletAddress = null,
  openConnectModal,
  onDeployComplete,
  onUndeployComplete,
  triggerUndeployNodeId = null,
  onUndeployModalOpen,
}: NodeClusterProps) {
  const {
    setNodeRental,
    nodeToMiner,
    nodeRentals,
    nodePrices,
    nodeBandwidth,
  } = useMinerRegistry()
  const [nodes, setNodes] = useState<Node[]>([])
  const [nodesLoading, setNodesLoading] = useState(true)
  const [hoverUndeployId, setHoverUndeployId] = useState<string | null>(null)
  const [actionModal, setActionModal] = useState<{
    type: ActionModalType
    node: Node
  } | null>(null)
  const [modalPhase, setModalPhase] = useState<ModalPhase>("confirm")
  const [progressStep, setProgressStep] = useState<ProgressStep | null>(null)
  const [lastTriggerUndeployId, setLastTriggerUndeployId] = useState<string | null>(null)
  const [deployTxPending, setDeployTxPending] = useState(false)

  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const usdtMint = USDT_MINT_ADDRESS
  const treasuryPubkey = TREASURY_WALLET_ADDRESS

  useEffect(() => {
    let cancelled = false
    async function load() {
      setNodesLoading(true)
      try {
        const list = await fetchNodes()
        if (!cancelled) {
          if (list.length > 0) {
            setNodes(list)
          } else {
            const fromRegistry = buildNodesFromRegistry(
              nodeToMiner,
              nodeRentals,
              nodePrices,
              nodeBandwidth,
            )
            setNodes(fromRegistry)
          }
        }
      } catch {
        if (!cancelled) {
          const fromRegistry = buildNodesFromRegistry(
            nodeToMiner,
            nodeRentals,
            nodePrices,
            nodeBandwidth,
          )
          setNodes(fromRegistry)
        }
      } finally {
        if (!cancelled) setNodesLoading(false)
      }
    }
    load()
    const t = setInterval(load, NODES_FETCH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [nodeToMiner, nodeRentals, nodePrices, nodeBandwidth])

  const closeModal = useCallback(() => {
    setActionModal(null)
    setModalPhase("confirm")
    setProgressStep(null)
  }, [])

  const runDeploySequence = useCallback(
    (node: Node, gateway: string, port: number) => {
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

  const onConfirmDeploy = useCallback(async () => {
    if (!actionModal || actionModal.type !== "deploy") return
    const node = actionModal.node
    if (!publicKey) {
      toast.error("Wallet not connected")
      openConnectModal?.()
      return
    }
    const X = node.priceInUSDT
    if (!Number.isFinite(X) || X <= 0) {
      toast.error("Invalid node price")
      return
    }

    setDeployTxPending(true)
    const toastId = toast.loading("Processing Web3 Payment...")

    try {
      // 95/5 split: minerAmount = X * 0.95, treasuryAmount = X * 0.05 (raw = X * 10^6, Math.floor)
      const totalRaw = usdtToRaw(X)
      const minerRaw = BigInt(Math.floor(Number(totalRaw) * 0.95))
      const treasuryRaw = totalRaw - minerRaw

      const payerATA = getAssociatedTokenAddressSync(
        usdtMint,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
      const minerATA = getAssociatedTokenAddressSync(
        usdtMint,
        new PublicKey(node.minerWalletAddress),
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
      const treasuryATA = getAssociatedTokenAddressSync(
        usdtMint,
        treasuryPubkey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )

      let balance = BigInt(0)
      try {
        const r = await connection.getTokenAccountBalance(payerATA)
        balance = BigInt(r.value.amount)
      } catch {
        toast.error("No USDT token account. Please add USDT to your wallet first.")
        toast.dismiss(toastId)
        setDeployTxPending(false)
        return
      }
      if (balance < totalRaw) {
        toast.error("Insufficient USDT balance")
        toast.dismiss(toastId)
        setDeployTxPending(false)
        return
      }

      const tx = new Transaction()

      const minerAccountInfo = await connection.getAccountInfo(minerATA)
      if (!minerAccountInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            minerATA,
            new PublicKey(node.minerWalletAddress),
            usdtMint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        )
      }
      const treasuryAccountInfo = await connection.getAccountInfo(treasuryATA)
      if (!treasuryAccountInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            treasuryATA,
            treasuryPubkey,
            usdtMint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        )
      }

      tx.add(
        createTransferInstruction(
          payerATA,
          minerATA,
          publicKey,
          minerRaw,
          [],
          TOKEN_PROGRAM_ID
        ),
        createTransferInstruction(
          payerATA,
          treasuryATA,
          publicKey,
          treasuryRaw,
          [],
          TOKEN_PROGRAM_ID
        )
      )

      const sig = await sendTransaction(tx, connection, { skipPreflight: false })
      await connection.confirmTransaction(sig, "confirmed")

      const assignRes = await fetch("/api/deploy/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: node.id,
          renterWalletAddress: publicKey.toBase58(),
          transactionSignature: sig,
        }),
      })
      if (!assignRes.ok) {
        const errBody = await assignRes.text()
        throw new Error(errBody || "Assign failed")
      }
      const { gateway, port } = (await assignRes.json()) as { gateway: string; port: number }

      setModalPhase("in_progress")
      runDeploySequence(node, gateway, port)
      toast.success("Deployment Successful! 5% fee routed to NeuroGrid Treasury.")
    } catch (e: unknown) {
      if (e instanceof TransactionExpiredBlockheightExceededError) {
        toast.error("Transaction expired. Please try again.")
      } else {
        const msg =
          e instanceof Error ? e.message : "Payment failed"
        toast.error(msg)
      }
      // Do not reveal connection details or move node to My Rented Nodes on failure
    } finally {
      toast.dismiss(toastId)
      setDeployTxPending(false)
    }
  }, [
    actionModal,
    publicKey,
    sendTransaction,
    connection,
    openConnectModal,
    runDeploySequence,
    treasuryPubkey,
    usdtMint,
  ])

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
          {nodesLoading ? "Loading…" : `${activeCount}/${nodes.length} running`}
        </span>
      </div>

      <div
        className="overflow-y-auto overflow-x-hidden"
        style={{ height: "400px" }}
      >
        {nodesLoading ? (
          <div
            className="flex flex-col items-center justify-center gap-2 px-4 py-12"
            style={{ color: "rgba(0,255,65,0.5)" }}
          >
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-xs">Loading nodes…</p>
          </div>
        ) : nodes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center"
            style={{ color: "rgba(0,255,65,0.5)" }}
          >
            <p className="text-xs">
              No nodes on sale. Miners register GPUs via Miner Portal → Node Onboarding; registered nodes appear here when the backend lists them.
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
              <div className="row-span-2 flex items-start pt-0.5">
                {node.status === "PENDING" ? (
                  <span
                    className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded opacity-80"
                    style={{ color: "#ffc800" }}
                    title="Pending FRP verification — not rentable until backend confirms physical link and FRP"
                    aria-label="Pending verification"
                  >
                    <Lock className="h-5 w-5" />
                  </span>
                ) : node.status === "SYNCING" ? (
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
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-0.5 font-mono text-xs" style={{ color: "rgba(0,255,65,0.6)" }}>
                <span className="truncate" title={node.gpus}>{node.gpus}</span>
                <span>{node.vram}</span>
                <span>[Encrypted Tunnel Ready]</span>
                <span>Bandwidth: {node.bandwidth}</span>
                <span>Status: Idle</span>
              </div>
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
                    Confirm you want to deploy to this node. Payment in USDT: 95% to miner, 5% to protocol treasury.
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
                      onClick={() => void onConfirmDeploy()}
                      disabled={deployTxPending}
                      className="flex-1 border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-90 disabled:opacity-50"
                      style={{ borderColor: "#00FF41", color: "#00FF41" }}
                    >
                      {deployTxPending ? (
                        <>
                          <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" />
                          Paying…
                        </>
                      ) : (
                        "Confirm Deploy"
                      )}
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
