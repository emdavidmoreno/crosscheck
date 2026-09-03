import { Badge } from "@/components/ui/badge"
import { BANDS, labelOf, toneOfScore, toneStyle } from "@/constants/bands"
import { cn } from "@/lib/utils"
import type { FilterKey } from "@/types/crosscheck"

export function ScoreCell({
  score,
  kind,
}: {
  score: number | null
  kind: FilterKey
}) {
  if (score != null) {
    const band = BANDS.find((b) => b.test(score))
    const tone = toneOfScore(score)
    const pct = Math.round(score * 100)
    return (
      <Badge
        variant="outline"
        className="h-auto gap-1.5 rounded-md border px-2 py-0.5 font-medium"
        style={toneStyle(tone)}
        title={`${pct}% · ${band?.label ?? ""}`}
      >
        <span className="font-mono text-[11px] tabular-nums">{pct}%</span>
        <span className="text-[11px]">· {band?.label}</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide uppercase"
      )}
      style={toneStyle("cat", { hatched: true })}
      title={labelOf(kind)}
    >
      {labelOf(kind)}
    </Badge>
  )
}
