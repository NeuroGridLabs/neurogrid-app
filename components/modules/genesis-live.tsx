"use client"

import { useEffect, useState } from "react"
import { StatusBadge } from "@/components/atoms/status-badge"
import { GpuBar } from "@/components/atoms/gpu-bar"
import { Activity, Clock, Thermometer, DollarSign, HardDrive, Cpu } from "lucide-react"

export function GenesisLive() {
  const [temp, setTemp] = useState(64)
  const [load, setLoad] = useState(82)
  const [uptime, setUptime] = useState("47d 12h 33m")

  // Dynamic real-time stream: 1x RTX4090 (24GB VRAM), base price anchored $0.59/hr
  useEffect(() => {
    const interval = setInterval(() => {
      setTemp(60 + Math.floor(Math.random() * 10))
      setLoad((prev) => Math.max(50, Math.min(98, prev + Math.floor(Math.random() * 11) - 5)))
      const d = 47 + Math.floor(Math.random() * 2)
      const h = 10 + Math.floor(Math.random() * 14)
      const m = 20 + Math.floor(Math.random() * 40)
      setUptime(`${d}d ${h}h ${m}m`)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#00FFFF" }}>
            Genesis Node Live
          </h2>
          <StatusBadge status="ACTIVE" />
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
                Alpha-01
              </span>
              <span className="text-xs" style={{ color: "rgba(0,255,255,0.4)" }}>
                RTX4090 | [Encrypted Tunnel]
              </span>
            </div>
            <span className="text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
              FRP_STABLE
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-px md:grid-cols-3 lg:grid-cols-6" style={{ backgroundColor: "rgba(0,255,65,0.05)" }}>
            {[
              { icon: <DollarSign className="h-3.5 w-3.5" />, label: "Cost/hr", value: "$0.59", color: "#00FFFF" },
              { icon: <HardDrive className="h-3.5 w-3.5" />, label: "VRAM", value: "24GB", color: "#00FFFF" },
              { icon: <Cpu className="h-3.5 w-3.5" />, label: "vCPUs", value: "8", color: "#00FFFF" },
              { icon: <Thermometer className="h-3.5 w-3.5" />, label: "Temp", value: `${temp}C`, color: temp > 68 ? "#ffc800" : "#00FF41" },
              { icon: <Activity className="h-3.5 w-3.5" />, label: "Load", value: `${load}%`, color: "#00FF41" },
              { icon: <Clock className="h-3.5 w-3.5" />, label: "Uptime", value: uptime, color: "#00FF41" },
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

          {/* Load bar */}
          <div className="px-4 py-3">
            <div className="mb-1 flex items-center justify-between text-xs" style={{ color: "rgba(0,255,65,0.4)" }}>
              <span>GPU Utilization</span>
              <span style={{ color: "#00FF41" }}>{load}%</span>
            </div>
            <GpuBar value={load} />
          </div>

          {/* Action */}
          <div className="flex border-t border-border px-4 py-3">
            <a
              href="/admin"
              className="text-xs uppercase tracking-wider transition-colors hover:opacity-80"
              style={{ color: "#00FF41" }}
            >
              {'>'} Inspect Node Logs
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
