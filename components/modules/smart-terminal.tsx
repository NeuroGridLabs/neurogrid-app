"use client"

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react"
import { ChevronDown, Minus, Square, X } from "lucide-react"
import { TerminalLog, type LogType } from "@/components/atoms/terminal-log"

interface TerminalLine {
  type: "input" | "output" | LogType
  content: string
  timestamp?: string
}

const INITIAL_LINES: TerminalLine[] = [
  { type: "SYSTEM", content: "NeuroGrid Protocol v3.0 -- Admin Terminal" },
  { type: "SYSTEM", content: "Type 'help' for available commands." },
  { type: "NETWORK", content: "Genesis Node Alpha-01 [ONLINE] | RTX4090 | 24GB VRAM | [Encrypted Tunnel Ready]" },
  { type: "PHYSICAL", content: "GPU temp: 64C | VRAM: 18.4/24GB | Fan: 72%" },
  { type: "NETWORK", content: "FRP tunnel status: ACTIVE | Latency: 12ms | Uptime: 99.97%" },
]

const COMMAND_MAP: Record<string, TerminalLine[]> = {
  help: [
    { type: "SYSTEM", content: "Available commands:" },
    { type: "SYSTEM", content: "  status     -- Node health & GPU metrics" },
    { type: "SYSTEM", content: "  nodes      -- List connected mining nodes" },
    { type: "SYSTEM", content: "  pool       -- Show reserve pool statistics" },
    { type: "SYSTEM", content: "  tunnel     -- FRP tunnel diagnostics" },
    { type: "SYSTEM", content: "  poi        -- Proof-of-Inference verification" },
    { type: "SYSTEM", content: "  fees       -- Fee structure breakdown" },
    { type: "SYSTEM", content: "  clear      -- Clear terminal output" },
  ],
  status: [
    { type: "PHYSICAL", content: "NODE STATUS: Alpha-01 [ONLINE]" },
    { type: "PHYSICAL", content: "GPU 0: RTX4090 | 24GB | Temp: 64C | Load: 87%" },
    { type: "PHYSICAL", content: "VRAM Used: 18.4/24GB (76.7%)" },
    { type: "NETWORK", content: "Inference Queue: 14 jobs | Avg: 340ms" },
    { type: "NETWORK", content: "PoI Verifications: 2,847 (24h)" },
    { type: "NETWORK", content: "Revenue: 0.0847 ETH (24h)" },
  ],
  nodes: [
    { type: "NETWORK", content: "Connected Nodes (3):" },
    { type: "PHYSICAL", content: "  [1] Alpha-01  | RTX4090 | 24GB  | ACTIVE  | [Tunnel Ready]" },
    { type: "NETWORK", content: "  [2] Beta-07   | RTX4090 | 24GB  | ACTIVE  | [Tunnel Ready]" },
    { type: "NETWORK", content: "  [3] Gamma-12  | 4x A100  | 320GB | SYNCING | [Tunnel Ready]" },
  ],
  pool: [
    { type: "NETWORK", content: "Macro Reserve Pool:" },
    { type: "NETWORK", content: "  Balance: 12.847 ETH" },
    { type: "NETWORK", content: "  24h Inflow: +0.234 ETH (2% tx fee)" },
    { type: "NETWORK", content: "  Pending Buyback: 0.15 ETH" },
    { type: "NETWORK", content: "  Floor Price Support: ACTIVE" },
  ],
  tunnel: [
    { type: "NETWORK", content: "FRP Tunnel Diagnostics:" },
    { type: "NETWORK", content: "  Gateway: [Encrypted Tunnel Ready]" },
    { type: "NETWORK", content: "  Protocol: TLS 1.3 + QUIC" },
    { type: "PHYSICAL", content: "  Latency: 12ms (avg) | 8ms (p50) | 24ms (p99)" },
    { type: "PHYSICAL", content: "  Bandwidth: 847 / 1000 Mbps" },
    { type: "NETWORK", content: "  Status: HEALTHY" },
  ],
  poi: [
    { type: "NETWORK", content: "Proof-of-Inference Engine:" },
    { type: "NETWORK", content: "  Verified GPUs: 7 (across 3 nodes)" },
    { type: "NETWORK", content: "  Challenges Passed: 12,471 / 12,483 (99.9%)" },
    { type: "NETWORK", content: "  Last: Alpha-01/GPU-0 PASSED (14s ago)" },
  ],
  fees: [
    { type: "NETWORK", content: "Fee Structure:" },
    { type: "NETWORK", content: "  Transaction Fee: 5% of compute cost" },
    { type: "NETWORK", content: "  2% -> Macro Reserve Pool" },
    { type: "NETWORK", content: "  2% -> Node Operator Reward" },
    { type: "NETWORK", content: "  1% -> Protocol Development Fund" },
  ],
}

function getTimestamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false })
}

interface SmartTerminalProps {
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

export function SmartTerminal({
  isMinimized = false,
  onToggleMinimize,
}: SmartTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(INITIAL_LINES)
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isSticky, setIsSticky] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Slow auto-feed — viewport is fixed, no layout jump
  useEffect(() => {
    const messages: TerminalLine[] = [
      { type: "NETWORK", content: "FRP heartbeat: [Gateway] -> Alpha-01 (12ms)" },
      { type: "PHYSICAL", content: "GPU temp stable: 64C | Fan: 72%" },
      { type: "NETWORK", content: "PoI challenge #12,484: Alpha-01 PASSED" },
      { type: "NETWORK", content: "Inference job #47,292 completed (LLaMA-70B, 338ms)" },
      { type: "PHYSICAL", content: "VRAM allocation: 18.6/24GB" },
    ]
    let i = 0
    const interval = setInterval(() => {
      const msg = messages[i % messages.length]
      setLines((prev) => [...prev, { ...msg, timestamp: getTimestamp() }])
      i++
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const checkStickyScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setIsSticky(el.scrollHeight - el.scrollTop - el.clientHeight < 60)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", checkStickyScroll)
    return () => el.removeEventListener("scroll", checkStickyScroll)
  }, [checkStickyScroll])

  useEffect(() => {
    if (isSticky && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [lines, isSticky])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    setIsSticky(true)
  }, [])

  const handleCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()
    const timestamp = getTimestamp()

    if (trimmed === "clear") {
      setLines([{ type: "SYSTEM", content: "Terminal cleared.", timestamp }])
      return
    }

    const newLines: TerminalLine[] = [
      { type: "input", content: `$ ${cmd}`, timestamp },
    ]

    if (COMMAND_MAP[trimmed]) {
      COMMAND_MAP[trimmed].forEach((line) => {
        newLines.push({ ...line, timestamp })
      })
    } else if (trimmed) {
      newLines.push({
        type: "ERROR",
        content: `Command not found: '${trimmed}'. Type 'help'.`,
        timestamp,
      })
    }

    setLines((prev) => [...prev, ...newLines])
    setHistory((prev) => [cmd, ...prev])
    setHistoryIndex(-1)
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(input)
      setInput("")
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (historyIndex < history.length - 1) {
        const next = historyIndex + 1
        setHistoryIndex(next)
        setInput(history[next])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const next = historyIndex - 1
        setHistoryIndex(next)
        setInput(history[next])
      } else {
        setHistoryIndex(-1)
        setInput("")
      }
    }
  }

  if (isMinimized) {
    return (
      <div
        className="flex cursor-pointer items-center justify-between border border-border px-3 py-2"
        style={{ backgroundColor: "var(--terminal-bg)" }}
        onClick={onToggleMinimize}
        role="button"
        tabIndex={0}
        aria-label="Expand terminal"
        onKeyDown={(e) => e.key === "Enter" && onToggleMinimize?.()}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: "#00FF41" }}>
          <span style={{ color: "#00cc33" }}>{">"}</span>
          <span>TERMINAL</span>
          <span className="animate-blink">_</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-1.5 py-0.5 text-xs"
            style={{ backgroundColor: "rgba(0,255,65,0.1)", color: "#00FF41" }}
          >
            FRP_STABLE
          </span>
          <span
            className="px-1.5 py-0.5 text-xs"
            style={{ backgroundColor: "rgba(0,255,65,0.1)", color: "#00FF41" }}
          >
            PoI_VERIFIED
          </span>
          <ChevronDown className="h-3 w-3" style={{ color: "#00FF41" }} />
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col overflow-hidden border border-border"
      style={{ backgroundColor: "var(--terminal-bg)" }}
      role="region"
      aria-label="Admin terminal"
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between border-b border-border px-3 py-1.5"
        style={{ backgroundColor: "rgba(0,255,65,0.03)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <button
              onClick={onToggleMinimize}
              className="h-2.5 w-2.5 rounded-full transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#00FF41" }}
              aria-label="Minimize terminal"
            />
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "rgba(0,255,65,0.3)" }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "rgba(0,255,65,0.15)" }} />
          </div>
          <span className="text-xs tracking-wider" style={{ color: "#00cc33" }}>
            neurogrid@alpha-01:~
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-1.5 py-0.5 text-xs"
            style={{ backgroundColor: "rgba(0,255,65,0.1)", color: "#00FF41" }}
          >
            FRP_STABLE
          </span>
          <span
            className="px-1.5 py-0.5 text-xs"
            style={{ backgroundColor: "rgba(0,255,65,0.1)", color: "#00FF41" }}
          >
            PoI_VERIFIED
          </span>
          <div className="flex items-center gap-1">
            <button onClick={onToggleMinimize} className="p-0.5 hover:opacity-80" aria-label="Minimize">
              <Minus className="h-3 w-3" style={{ color: "#00cc33" }} />
            </button>
          </div>
        </div>
      </div>

      {/* Terminal body — fixed 6-line viewport, no jump */}
      <div
        ref={scrollRef}
        className="relative cursor-text overflow-y-auto overflow-x-hidden p-3"
        style={{ height: "10.5rem" }}
        onClick={() => inputRef.current?.focus()}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.01) 2px, rgba(0,255,65,0.01) 4px)",
          }}
        />

        <div className="relative z-10 flex flex-col gap-0.5">
          {lines.map((line, i) =>
            line.type === "input" ? (
              <div key={i} className="flex items-start gap-2 px-2 py-0.5 text-xs">
                {line.timestamp && (
                  <span className="shrink-0" style={{ color: "rgba(0,255,65,0.25)" }}>
                    [{line.timestamp}]
                  </span>
                )}
                <span style={{ color: "#00FF41" }}>{line.content}</span>
              </div>
            ) : (
              <TerminalLog
                key={i}
                type={line.type as LogType}
                message={line.content}
                timestamp={line.timestamp}
              />
            )
          )}

          {/* Input */}
          <div className="flex items-center gap-1 px-2">
            <span style={{ color: "#00FF41" }}>$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-none bg-transparent text-xs caret-transparent outline-none"
              style={{ color: "#00FF41" }}
              spellCheck={false}
              autoComplete="off"
              aria-label="Terminal input"
            />
            <span className="animate-blink" style={{ color: "#00FF41" }}>_</span>
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      {!isSticky && (
        <button
          onClick={scrollToBottom}
          className="flex items-center justify-center border-t border-border py-1 text-xs transition-colors hover:opacity-80"
          style={{ backgroundColor: "rgba(0,255,65,0.05)", color: "#00FF41" }}
          aria-label="Scroll to latest"
        >
          <ChevronDown className="mr-1 h-3 w-3" />
          New output below
        </button>
      )}
    </div>
  )
}
