"use client"

import { useState } from "react"
import { KeyRound, Download, Copy } from "lucide-react"
import { GpuBar } from "@/components/atoms/gpu-bar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { RentedNodeSnapshot } from "@/components/modules/node-cluster"

function ConnectionDetailsModal({
  node,
  walletAddress,
  open,
  onOpenChange,
}: {
  node: RentedNodeSnapshot
  walletAddress: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const tenantUser = walletAddress
    ? `tenant-${walletAddress.slice(0, 2).toUpperCase()}${walletAddress.slice(2, 6)}`
    : "tenant-0x742D"
  const sshCommand = `ssh -i neurogrid-${node.id}.pem ${tenantUser}@${node.gateway} -p ${node.port}`
  const [copied, setCopied] = useState(false)

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(sshCommand)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleDownloadPem = () => {
    const blob = new Blob([`-----BEGIN PRIVATE KEY-----\n(placeholder-key)\n-----END PRIVATE KEY-----`], {
      type: "application/x-pem-file",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `neurogrid-${node.id}.pem`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border"
        style={{
          backgroundColor: "var(--terminal-bg)",
          borderColor: "rgba(0,255,65,0.3)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-wider" style={{ color: "#00FF41" }}>
            Connection Details — {node.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <span style={{ color: "rgba(0,255,65,0.5)" }}>Host:</span>
            <p className="font-mono" style={{ color: "#00FF41" }}>{node.gateway}</p>
          </div>
          <div className="space-y-1">
            <span style={{ color: "rgba(0,255,65,0.5)" }}>Port:</span>
            <p className="font-mono" style={{ color: "#00FF41" }}>{node.port}</p>
          </div>
          <div className="space-y-1">
            <span style={{ color: "rgba(0,255,65,0.5)" }}>User:</span>
            <p className="font-mono" style={{ color: "#00FF41" }}>{tenantUser}</p>
          </div>
          <div className="space-y-2">
            <span style={{ color: "rgba(0,255,65,0.5)" }}>SSH Key:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadPem}
                className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-90"
                style={{ borderColor: "#00FF41", color: "#00FF41" }}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Download SSH Key
              </button>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-90"
                style={{ borderColor: "#00FF41", color: "#00FF41" }}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied" : "Copy Command"}
              </button>
            </div>
            <p
              className="break-all font-mono text-[10px]"
              style={{ color: "rgba(0,255,65,0.5)" }}
            >
              {sshCommand}
            </p>
          </div>
          <div
            className="mt-3 space-y-1.5 rounded border p-3 text-[10px]"
            style={{
              borderColor: "rgba(0,255,65,0.2)",
              backgroundColor: "rgba(0,255,65,0.04)",
              color: "rgba(0,255,65,0.7)",
            }}
          >
            <p className="font-semibold" style={{ color: "#00FF41" }}>
              📦 DATA AIRLOCK & QoS GUIDE:
            </p>
            <ul className="list-inside list-disc space-y-0.5">
              <li><strong>Small Scripts:</strong> Use VS Code Remote / SFTP (Speed limited).</li>
              <li><strong>Public Models:</strong> Run <code className="font-mono">wget --limit-rate=20m [URL]</code> directly inside the node terminal.</li>
              <li><strong>Large Private Data:</strong> Use P2P <code className="font-mono">croc</code> to bypass relay bottlenecks. DO NOT upload &gt;1GB via SFTP.</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface RentedNodesPanelProps {
  walletAddress?: string | null
  rentedNodes: RentedNodeSnapshot[]
  onUndeploy?: (nodeId: string) => void
}

const ROW_GAP = 6
/** ~2mm below device info */
const CARD_PADDING_BOTTOM = 6
/** One row = 2 cards; fixed height so container never grows, scroll for more */
const SINGLE_ROW_HEIGHT_PX = 106

export function RentedNodesPanel({ walletAddress, rentedNodes, onUndeploy }: RentedNodesPanelProps) {
  const [credentialNode, setCredentialNode] = useState<RentedNodeSnapshot | null>(null)

  return (
    <>
      <div
        className="flex flex-col overflow-hidden border border-border"
        style={{ backgroundColor: "var(--terminal-bg)" }}
      >
        <div
          className="flex items-center justify-between border-b border-border px-3 py-1.5"
          style={{ backgroundColor: "rgba(0,255,65,0.03)" }}
        >
          <span className="text-xs uppercase tracking-wider" style={{ color: "#00cc33" }}>
            My Rented Nodes
          </span>
          {rentedNodes.length > 0 && (
            <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
              {rentedNodes.length} node{rentedNodes.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div
          className="grid grid-cols-2 gap-x-3 gap-y-2 overflow-x-hidden overflow-y-auto px-2.5 py-2"
          style={{
            maxHeight: SINGLE_ROW_HEIGHT_PX,
            scrollbarWidth: "thin",
          }}
        >
          {rentedNodes.length === 0 ? (
            <div
              className="col-span-2 flex items-center justify-center py-4 text-xs"
              style={{ color: "rgba(0,255,65,0.4)" }}
            >
              No rented nodes. Deploy from Node Command Center above.
            </div>
          ) : (
            rentedNodes.map((node) => (
              <div
                key={node.id}
                className="grid grid-cols-[1fr_auto] gap-x-2 rounded border pl-2 pr-2 pt-1 pb-1 shrink-0"
                style={{
                  borderColor: "rgba(0,255,65,0.15)",
                  backgroundColor: "rgba(0,255,65,0.02)",
                  paddingBottom: CARD_PADDING_BOTTOM,
                }}
              >
                {/* Left column: name, gateway, device info — tight spacing */}
                <div className="flex min-w-0 flex-col gap-0">
                  <span className="truncate text-xs font-bold" style={{ color: "#00FF41" }}>
                    {node.name}
                  </span>
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span
                      className="min-w-0 truncate text-[10px]"
                      style={{ color: "rgba(0,255,65,0.6)" }}
                      title={`${node.gateway}:${node.port}`}
                    >
                      {node.gateway}:{node.port}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCredentialNode(node)}
                      className="shrink-0 p-0.5 transition-opacity hover:opacity-80"
                      style={{ color: "#00FF41" }}
                      aria-label="Connection details"
                    >
                      <KeyRound className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]" style={{ color: "rgba(0,255,65,0.5)" }}>
                      {node.gpus} {node.vram}
                    </span>
                    <div className="w-14 shrink-0">
                      <GpuBar value={node.utilization} color="#00FF41" hideLabel />
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: "#00FF41" }}>
                      {node.utilization}%
                    </span>
                  </div>
                </div>
                {/* Right column: ACTIVE + Undeploy, dots aligned (fixed dot column), ACTIVE can have more right space */}
                <div className="flex min-w-[72px] flex-col items-stretch gap-0.5">
                  <span
                    className="inline-flex items-center rounded border px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: "rgba(0,255,65,0.1)",
                      color: "#00FF41",
                      borderColor: "rgba(0,255,65,0.35)",
                    }}
                  >
                    <span className="flex w-4 shrink-0 justify-center">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: "#00FF41", boxShadow: "0 0 4px #00FF41" }}
                      />
                    </span>
                    {node.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUndeploy?.(node.id)}
                    className="inline-flex items-center rounded border px-2 py-0.5 text-xs transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: "rgba(255,68,68,0.1)",
                      color: "#ff4444",
                      borderColor: "rgba(255,68,68,0.35)",
                    }}
                    aria-label="Undeploy"
                    title="Undeploy"
                  >
                    <span className="flex w-4 shrink-0 justify-center">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: "#ff4444", boxShadow: "0 0 4px #ff4444" }}
                      />
                    </span>
                    Undeploy
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {credentialNode && (
        <ConnectionDetailsModal
          node={credentialNode}
          walletAddress={walletAddress ?? null}
          open={!!credentialNode}
          onOpenChange={(open) => !open && setCredentialNode(null)}
        />
      )}
    </>
  )
}
