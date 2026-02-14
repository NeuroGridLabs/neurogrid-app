interface GpuBarProps {
  value: number
  color?: string
  hideLabel?: boolean
}

export function GpuBar({ value, color = "#00FF41", hideLabel }: GpuBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 flex-1 overflow-hidden"
        style={{ backgroundColor: `${color}1a` }}
      >
        <div
          className="h-full transition-all duration-1000"
          style={{
            width: `${value}%`,
            backgroundColor: value > 80 ? color : value > 50 ? `${color}cc` : `${color}66`,
            boxShadow: value > 80 ? `0 0 8px ${color}80` : "none",
          }}
        />
      </div>
      {!hideLabel && (
        <span className="w-8 shrink-0 text-right text-xs" style={{ color }}>
          {value}%
        </span>
      )}
    </div>
  )
}
