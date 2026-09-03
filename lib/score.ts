import { toneFill, toneOfScore } from "@/constants/bands"

/**
 * Discrete band fill for a score (Exacto / Alta / Media / Baja).
 * Categorical rows (null score) use muted — never a solid 0% on the ramp.
 */
export function scoreBackground(s: number | null | undefined): string {
  if (s == null) return "var(--muted)"
  return toneFill(toneOfScore(s))
}

export function initials(n: string): string {
  return n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase()
}

export function formatCell(v: unknown): string {
  if (v == null || v === "") return "—"
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}
