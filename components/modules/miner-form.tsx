"use client"

import { useState } from "react"
import { HackerInput } from "@/components/atoms/hacker-input"
import { NeonButton } from "@/components/atoms/neon-button"
import { Slider } from "@/components/ui/slider"

export interface MinerFormSubmitPayload {
  pricePerHour: string
  bandwidth: string
  gpuModel?: string
  vram?: string
  gateway?: string
}

interface MinerFormProps {
  /** Min/max $/hr for same GPU type on platform (semi-transparent hint) */
  priceRange?: { min: number; max: number } | null
  /** Default GPU type for price hint label */
  gpuTypeLabel?: string
  /** False when no node slot is available (disables submit, shows message) */
  canRegister?: boolean
  onSubmit?: (payload: MinerFormSubmitPayload) => void
}

export function MinerForm({ priceRange, gpuTypeLabel = "Same type", canRegister = true, onSubmit }: MinerFormProps) {
  const [gpuModel, setGpuModel] = useState("")
  const [vram, setVram] = useState("")
  const [gateway, setGateway] = useState("")
  const [price, setPrice] = useState(0.59)
  const [bandwidth, setBandwidth] = useState("")
  const [fingerprintReady, setFingerprintReady] = useState(false)

  const handleFingerprint = () => {
    setFingerprintReady(true)
  }

  const canSubmit = canRegister && fingerprintReady

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const priceStr = `$${price.toFixed(2)}/hr`
    onSubmit?.({
      pricePerHour: priceStr,
      bandwidth: bandwidth.trim() || "1 Gbps",
      gpuModel: gpuModel.trim() || undefined,
      vram: vram.trim() || undefined,
      gateway: gateway.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <HackerInput
        label="GPU Model"
        placeholder="e.g. 1x RTX4090"
        value={gpuModel}
        onChange={(e) => setGpuModel(e.target.value)}
      />
      <HackerInput
        label="VRAM (GB)"
        placeholder="e.g. 24GB"
        type="number"
        value={vram}
        onChange={(e) => setVram(e.target.value)}
      />
      <HackerInput
        label="FRP Gateway Address"
        placeholder="e.g. yournode.ngrid.io"
        value={gateway}
        onChange={(e) => setGateway(e.target.value)}
      />

      {/* Price setting with same-type min/max hint */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(0,255,65,0.5)" }}>
          Rental price ($/hr)
        </span>
        {priceRange != null && (
          <p
            className="text-xs"
            style={{ color: "rgba(0,255,255,0.5)", opacity: 0.85 }}
          >
            {gpuTypeLabel} on platform: ${priceRange.min.toFixed(2)} – ${priceRange.max.toFixed(2)}/hr
          </p>
        )}
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold tabular-nums" style={{ color: "#00FFFF" }}>
            ${price.toFixed(2)}/hr
          </span>
          <div className="min-w-0 flex-1">
            <Slider
              value={[price]}
              min={0.1}
              max={3}
              step={0.01}
              onValueChange={(v) => setPrice(v[0] ?? 0.59)}
            />
          </div>
        </div>
      </div>

      {/* Home bandwidth */}
      <HackerInput
        label="Home bandwidth"
        placeholder="e.g. 1 Gbps, 500 Mbps"
        value={bandwidth}
        onChange={(e) => setBandwidth(e.target.value)}
      />

      {/* Hardware fingerprint — required before register */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(0,255,65,0.5)" }}>
          Hardware Fingerprint <span style={{ color: "rgba(255,255,255,0.4)" }}>(required)</span>
        </span>
        {fingerprintReady ? (
          <div
            className="flex items-center gap-2 border px-3 py-2"
            style={{ borderColor: "rgba(0,255,65,0.3)", backgroundColor: "rgba(0,255,65,0.05)" }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#00FF41", boxShadow: "0 0 4px #00FF41" }}
            />
            <span className="text-xs" style={{ color: "#00FF41" }}>
              Fingerprint captured: 0x7f3a...b291
            </span>
          </div>
        ) : (
          <NeonButton
            type="button"
            variant="secondary"
            onClick={handleFingerprint}
          >
            Collect Hardware Fingerprint
          </NeonButton>
        )}
      </div>

      {!canRegister && (
        <p className="text-xs" style={{ color: "rgba(255,150,100,0.9)" }}>
          All node slots are currently registered. You cannot register more miners.
        </p>
      )}

      {/* Submit */}
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <NeonButton
          type="submit"
          variant="primary"
          accentColor="#00FFFF"
          disabled={!canSubmit}
        >
          Register Miner
        </NeonButton>
        <NeonButton type="button" variant="secondary" accentColor="#00FF41">
          Start PoI Challenge
        </NeonButton>
      </div>
    </form>
  )
}
