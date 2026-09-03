import { formatCell } from "@/lib/score"
import { cn } from "@/lib/utils"
import type { MatchDetail, MatchField } from "@/types/crosscheck"

function noteFor(d: MatchDetail): { text: string; ok: boolean } {
  if (d.sim == null) return { text: "sin dato", ok: false }
  if (d.sim >= 0.999) return { text: "exacto", ok: true }
  return { text: `${Math.round(d.sim * 100)}% similar`, ok: Boolean(d.pass) }
}

function Breakdown({
  detail,
  fields,
  sideValues,
}: {
  detail: MatchDetail[]
  fields: MatchField[]
  sideValues?: Partial<Record<number, { left?: unknown; right?: unknown }>>
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="mb-1 text-[11.5px] text-muted-foreground">
        Por qué quedó así:
      </div>
      {detail.map((d, i) => {
        const field = fields[d.fi]
        const fieldLabel = field?.left ?? `Campo ${d.fi}`
        const sides = sideValues?.[d.fi]
        const note = noteFor(d)
        return (
          <div
            key={i}
            className="grid grid-cols-1 gap-1 text-[12.5px] sm:grid-cols-[minmax(100px,140px)_1fr_1fr_minmax(80px,100px)] sm:items-center sm:gap-3"
          >
            <span className="font-medium">{fieldLabel}</span>
            <span className="font-mono text-xs">{formatCell(sides?.left)}</span>
            <span className="font-mono text-xs">{formatCell(sides?.right)}</span>
            <span
              className={cn(
                "text-xs font-medium",
                note.ok
                  ? "text-[color:var(--score-exact-fg,color-mix(in_oklch,var(--primary)_90%,black_20%))]"
                  : "text-[color:var(--score-low-fg,color-mix(in_oklch,var(--destructive)_88%,black_18%))]"
              )}
            >
              {note.text}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function Mismatches({
  detail,
  fields,
  sideValues,
  variant = "inline",
}: {
  detail: MatchDetail[]
  fields: MatchField[]
  /** Optional left/right cell values keyed by field index */
  sideValues?: Partial<Record<number, { left?: unknown; right?: unknown }>>
  /** `inline` = compact summary; `breakdown` = field / left / right / note */
  variant?: "inline" | "breakdown"
}) {
  if (!detail.length) {
    return (
      <span className="text-[11px] text-muted-foreground">todos coinciden</span>
    )
  }

  if (variant === "breakdown") {
    return (
      <Breakdown detail={detail} fields={fields} sideValues={sideValues} />
    )
  }

  const bad = detail.filter((d) => d.sim != null && d.sim < 0.999)
  if (!bad.length) {
    return (
      <span className="text-[11px] text-muted-foreground">todos coinciden</span>
    )
  }
  return (
    <span className="font-mono text-[11px] text-destructive">
      {bad.map((d, i) => (
        <span key={i}>
          {i > 0 ? " · " : ""}
          {fields[d.fi]?.left ?? `campo ${d.fi}`}{" "}
          {Math.round((d.sim ?? 0) * 100)}%
        </span>
      ))}
    </span>
  )
}
