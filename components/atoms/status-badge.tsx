export type BadgeStatus = "ACTIVE" | "SYNCING" | "OFFLINE" | "VERIFIED" | "PENDING" | "STANDBY"

const STATUS_STYLES: Record<BadgeStatus, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: "rgba(0,255,65,0.1)", text: "#00FF41", dot: "#00FF41" },
  VERIFIED: { bg: "rgba(0,255,65,0.1)", text: "#00FF41", dot: "#00FF41" },
  SYNCING: { bg: "rgba(255,200,0,0.1)", text: "#ffc800", dot: "#ffc800" },
  PENDING: { bg: "rgba(255,200,0,0.1)", text: "#ffc800", dot: "#ffc800" },
  OFFLINE: { bg: "rgba(255,68,68,0.1)", text: "#ff4444", dot: "#ff4444" },
  STANDBY: { bg: "rgba(0,255,255,0.08)", text: "#00FFFF", dot: "#00FFFF" },
}

interface StatusBadgeProps {
  status: BadgeStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_STYLES[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: s.dot, boxShadow: `0 0 4px ${s.dot}` }}
      />
      {status}
    </span>
  )
}
