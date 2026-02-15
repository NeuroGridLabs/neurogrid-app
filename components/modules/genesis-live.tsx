"use client"

import { StatusBadge } from "@/components/atoms/status-badge"
import { DollarSign, HardDrive, Cpu, MemoryStick } from "lucide-react"

// Genesis Node: locked RTX 4090 specs — not live yet; bootstrapping / waitlist
const WAITLIST_URL = process.env.NEXT_PUBLIC_GENESIS_WAITLIST_URL || "https://discord.gg"

export function GenesisLive() {
  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#00FFFF" }}>
            Genesis Node
          </h2>
          <StatusBadge status="STANDBY" />
        </div>

        <div
          className="border border-border"
          style={{ backgroundColor: "var(--terminal-bg)" }}
        >
          {/* Node header */}
          <div
            className="flex flex-wrap items-center justify-between border-b border-border px-4 py-3"
            style={{ backgroundColor: "rgba(0,255,255,0.02)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: "#00FFFF" }}>
                Alpha-01 [RTX 4090]
              </span>
              <span className="text-xs" style={{ color: "rgba(0,255,255,0.4)" }}>
                [Encrypted Tunnel]
              </span>
            </div>
            <span className="text-xs font-medium" style={{ color: "#ffc800" }}>
              STATUS: AWAITING IGNITION
            </span>
          </div>

          {/* Specs only — no fake live stats */}
          <div className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ backgroundColor: "rgba(0,255,65,0.05)" }}>
            {[
              { icon: <DollarSign className="h-3.5 w-3.5" />, label: "Cost/hr", value: "$0.59", color: "#00FFFF" },
              { icon: <HardDrive className="h-3.5 w-3.5" />, label: "VRAM", value: "24GB", color: "#00FFFF" },
              { icon: <MemoryStick className="h-3.5 w-3.5" />, label: "RAM", value: "31GB", color: "#00FFFF" },
              { icon: <Cpu className="h-3.5 w-3.5" />, label: "vCPUs", value: "6", color: "#00FFFF" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 p-4"
                style={{ backgroundColor: "var(--terminal-bg)" }}
              >
                <div style={{ color: `${stat.color}66` }}>{stat.icon}</div>
                <div className="flex flex-col">
                  <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
                    {stat.label}
                  </span>
                  <span className="text-sm font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Whitelist badge — no fake utilization bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border px-4 py-3" style={{ backgroundColor: "rgba(255,200,0,0.04)" }}>
            <span
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
              style={{
                color: "#ffc800",
                border: "1px solid rgba(255,200,0,0.4)",
                backgroundColor: "rgba(255,200,0,0.08)",
              }}
            >
              [ NODE LOCKED: WHITELIST ONLY ]
            </span>
          </div>

          {/* CTA: Join waitlist → Discord / Telegram / Twitter */}
          <div className="flex border-t border-border px-4 py-3">
            <a
              href={WAITLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-90"
              style={{ color: "#00FF41" }}
            >
              {'>'} JOIN GENESIS WAITLIST
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
