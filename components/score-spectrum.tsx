"use client"

import { Button } from "@/components/ui/button"
import {
  BANDS,
  STRUCT,
  bandOf,
  toneFill,
  toneLine,
  toneStyle,
} from "@/constants/bands"
import { cn } from "@/lib/utils"
import type { BandKey, FilterKey, MatchResult } from "@/types/crosscheck"

function countBands(
  results: MatchResult,
  bandCounts?: Record<string, number>
): Record<BandKey, number> {
  if (bandCounts) {
    return {
      b100: bandCounts.b100 ?? 0,
      b80: bandCounts.b80 ?? 0,
      b50: bandCounts.b50 ?? 0,
      b0: bandCounts.b0 ?? 0,
    }
  }
  const c: Record<BandKey, number> = { b100: 0, b80: 0, b50: 0, b0: 0 }
  for (const p of results.pairs) c[bandOf(p.score)]++
  return c
}

export function ScoreSpectrum({
  results,
  filters,
  onToggle,
  bandCounts,
}: {
  results: MatchResult
  filters: Record<FilterKey, boolean>
  onToggle: (key: FilterKey) => void
  bandCounts?: Record<string, number>
}) {
  const counts = countBands(results, bandCounts)
  const structCounts = {
    ambiguous: results.ambiguous.length,
    left_only: results.left_only.length,
    right_only: results.right_only.length,
  }

  const total = Math.max(
    BANDS.reduce((n, b) => n + counts[b.key], 0) +
      STRUCT.reduce((n, s) => n + structCounts[s.key], 0),
    1
  )

  const segments = [
    ...BANDS.map((b) => ({
      key: b.key as FilterKey,
      count: counts[b.key],
      hatched: false as const,
      fill: toneFill(b.tone),
      title: `${b.label}: ${counts[b.key]}`,
    })),
    ...STRUCT.map((s) => ({
      key: s.key as FilterKey,
      count: structCounts[s.key],
      hatched: true as const,
      fill: undefined as string | undefined,
      title: `${s.label}: ${structCounts[s.key]}`,
    })),
  ].filter((s) => s.count > 0)

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">
          {total.toLocaleString("es")} filas comparadas
        </span>
        <span className="text-[11px] text-muted-foreground">
          continuo (puntaje) — categórico (sin puntaje)
        </span>
      </div>

      <div
        className="flex h-5 w-full overflow-hidden rounded-md"
        role="img"
        aria-label="Espectro de coincidencia por franjas"
      >
        {segments.length ? (
          segments.map((s, i) => {
            const active = filters[s.key]
            return (
              <button
                key={s.key}
                type="button"
                title={s.title}
                aria-pressed={active}
                onClick={() => onToggle(s.key)}
                className={cn(
                  "min-w-px transition-opacity",
                  !active && "opacity-35",
                  i < segments.length - 1 && "border-r border-background"
                )}
                style={{
                  flexGrow: s.count,
                  flexBasis: 0,
                  ...(s.hatched
                    ? toneStyle("cat", { hatched: true })
                    : { background: s.fill }),
                }}
              />
            )
          })
        ) : (
          <div className="h-full flex-1 bg-muted" />
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {BANDS.map((b) => {
          const n = counts[b.key]
          const pct = Math.round((n / total) * 100)
          return (
            <Button
              key={b.key}
              size="sm"
              variant="ghost"
              className={cn(
                "h-auto gap-1.5 px-1.5 py-0.5 text-[11.5px] font-normal",
                !filters[b.key] && "text-muted-foreground opacity-60"
              )}
              onClick={() => onToggle(b.key)}
            >
              <i
                className="inline-block size-2.5 shrink-0 rounded-[2px] border"
                style={{
                  background: toneFill(b.tone),
                  borderColor: toneLine(b.tone),
                }}
              />
              {b.label} {pct}% · {n.toLocaleString("es")}
            </Button>
          )
        })}
        {STRUCT.map((s) => {
          const n = structCounts[s.key]
          const pct = Math.round((n / total) * 100)
          return (
            <Button
              key={s.key}
              size="sm"
              variant="ghost"
              className={cn(
                "h-auto gap-1.5 px-1.5 py-0.5 text-[11.5px] font-normal",
                !filters[s.key] && "text-muted-foreground opacity-60"
              )}
              onClick={() => onToggle(s.key)}
            >
              <i
                className="inline-block size-2.5 shrink-0 rounded-[2px] border"
                style={toneStyle("cat", { hatched: true })}
              />
              {s.label} {pct}% · {n.toLocaleString("es")}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
