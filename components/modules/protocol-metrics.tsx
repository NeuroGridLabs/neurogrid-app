"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/atoms/stat-card"
import { NeonButton } from "@/components/atoms/neon-button"
import { Flame, Shield, Cpu, Zap } from "lucide-react"

export function ProtocolMetrics() {
  const [burnTotal, setBurnTotal] = useState(847_291)
  const [activeGpus, setActiveGpus] = useState(7)

  useEffect(() => {
    const interval = setInterval(() => {
      setBurnTotal((p) => p + Math.floor(Math.random() * 50))
      setActiveGpus(5 + Math.floor(Math.random() * 5))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#00FF41" }}>
            Protocol Metrics
          </h2>
          <a
            href="https://pump.fun"
            target="_blank"
            rel="noopener noreferrer"
          >
            <NeonButton variant="primary" accentColor="#00FF41">
              Buy $NRG (Pump.fun)
            </NeonButton>
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="$NRG Burned"
            value={burnTotal.toLocaleString()}
            sub="Total supply reduction"
            icon={<Flame className="h-4 w-4" />}
            accentColor="#00FF41"
            pulse
          />
          <StatCard
            label="Reserve Balance"
            value="12.847 ETH"
            sub="2% tx fee inflow"
            icon={<Shield className="h-4 w-4" />}
            accentColor="#00FF41"
          />
          <StatCard
            label="Active GPUs"
            value={`${activeGpus}`}
            sub="Across 3 nodes"
            icon={<Cpu className="h-4 w-4" />}
            accentColor="#00FFFF"
          />
          <StatCard
            label="Network Rate"
            value="$0.59/hr"
            sub="RTX4090 base price"
            icon={<Zap className="h-4 w-4" />}
            accentColor="#00FFFF"
          />
        </div>
      </div>
    </section>
  )
}
