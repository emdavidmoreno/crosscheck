import type { CSSProperties } from "react"
import type { BandKey, StructKey } from "@/types/crosscheck"

export type ScoreTone = "exact" | "high" | "mid" | "low" | "cat"

/** Discrete score / categorical tokens with CSS-var fallbacks (WS-A may define the vars). */
export const SCORE_TONES: Record<
  ScoreTone,
  { bg: string; fg: string; line: string }
> = {
  exact: {
    bg: "var(--score-exact-bg, color-mix(in oklch, var(--primary) 16%, white))",
    fg: "var(--score-exact-fg, color-mix(in oklch, var(--primary) 90%, black 20%))",
    line: "var(--score-exact-line, var(--primary))",
  },
  high: {
    bg: "var(--score-high-bg, #f6ecd2)",
    fg: "var(--score-high-fg, #7a5a17)",
    line: "var(--score-high-line, #b3860f)",
  },
  mid: {
    bg: "var(--score-mid-bg, #f7ded0)",
    fg: "var(--score-mid-fg, #8a4a1f)",
    line: "var(--score-mid-line, #c2661f)",
  },
  low: {
    bg: "var(--score-low-bg, color-mix(in oklch, var(--destructive) 16%, white))",
    fg: "var(--score-low-fg, color-mix(in oklch, var(--destructive) 88%, black 18%))",
    line: "var(--score-low-line, var(--destructive))",
  },
  cat: {
    bg: "var(--cat-bg, var(--secondary))",
    fg: "var(--cat-fg, var(--secondary-foreground))",
    line: "var(--cat-line, var(--muted-foreground))",
  },
}

export const BANDS: {
  key: BandKey
  label: string
  tone: Exclude<ScoreTone, "cat">
  test: (s: number) => boolean
  /** Representative score for spectrum/chip color */
  sample: number
}[] = [
  {
    key: "b100",
    label: "Exacto",
    tone: "exact",
    test: (s) => s >= 0.999,
    sample: 1,
  },
  {
    key: "b80",
    label: "Alta",
    tone: "high",
    test: (s) => s >= 0.8 && s < 0.999,
    sample: 0.88,
  },
  {
    key: "b50",
    label: "Media",
    tone: "mid",
    test: (s) => s >= 0.5 && s < 0.8,
    sample: 0.62,
  },
  {
    key: "b0",
    label: "Baja",
    tone: "low",
    test: (s) => s < 0.5,
    sample: 0.2,
  },
]

export const STRUCT: {
  key: StructKey
  label: string
  tone: "cat"
  hatched: true
}[] = [
  { key: "ambiguous", label: "Ambiguo", tone: "cat", hatched: true },
  { key: "left_only", label: "Solo en A", tone: "cat", hatched: true },
  { key: "right_only", label: "Solo en B", tone: "cat", hatched: true },
]

export function bandOf(s: number): BandKey {
  return BANDS.find((b) => b.test(s))!.key
}

export function toneOfScore(s: number): Exclude<ScoreTone, "cat"> {
  return BANDS.find((b) => b.test(s))!.tone
}

export function labelOf(kind: string): string {
  const s = STRUCT.find((x) => x.key === kind)
  if (s) return s.label
  return BANDS.find((b) => b.key === kind)?.label || ""
}

/** Solid band chip / cell surface. */
export function toneStyle(
  tone: ScoreTone,
  opts?: { hatched?: boolean }
): CSSProperties {
  const t = SCORE_TONES[tone]
  if (opts?.hatched || tone === "cat") {
    return {
      backgroundColor: t.bg,
      backgroundImage: `repeating-linear-gradient(135deg, ${t.line} 0 1px, transparent 1px 5px)`,
      color: t.fg,
      borderColor: t.line,
    }
  }
  return {
    background: t.bg,
    color: t.fg,
    borderColor: t.line,
  }
}

/** Solid fill only (spectrum segments for continuous bands). */
export function toneFill(tone: ScoreTone): string {
  return SCORE_TONES[tone].bg
}

export function toneLine(tone: ScoreTone): string {
  return SCORE_TONES[tone].line
}
