import type { MatchResult } from "@/types/crosscheck"

export const DEMO_LIMITS = {
  /** Step 3 — matching fields */
  maxMatchFields: 2,
  /** Step 4 — output columns in the report */
  maxOutputColumns: 3,
  /** Step 5 — real result rows stored (not just UI-filtered) */
  maxResultRows: 5,
  /** Max skeleton placeholder rows rendered in the results table */
  maxSkeletonRows: 8,
} as const

export const DEMO_PREMIUM_COPY = {
  title: "Función premium",
  description:
    "Esta función solo está disponible con una suscripción. Creá una cuenta o suscribite para continuar.",
  subscribeLabel: "Suscribirme",
} as const

/** Flattened row count across all result categories. */
export function matchResultRowCount(result: MatchResult): number {
  return (
    result.pairs.length +
    result.ambiguous.length +
    result.left_only.length +
    result.right_only.length
  )
}

/**
 * Keep only the first `maxRows` result rows (pairs → ambiguous → left_only → right_only)
 * and record the real total so the UI can show skeleton placeholders.
 */
export function capMatchResultForDemo(
  result: MatchResult,
  maxRows: number = DEMO_LIMITS.maxResultRows
): MatchResult {
  // Already capped (e.g. by the worker) — keep the recorded total.
  if (result.demoTotalRows != null) return result

  const totalRows = matchResultRowCount(result)
  if (totalRows <= maxRows) {
    return { ...result, demoTotalRows: totalRows }
  }

  let remaining = maxRows
  const pairs = result.pairs.slice(0, remaining)
  remaining -= pairs.length
  const ambiguous = result.ambiguous.slice(0, remaining)
  remaining -= ambiguous.length
  const left_only = result.left_only.slice(0, remaining)
  remaining -= left_only.length
  const right_only = result.right_only.slice(0, remaining)

  return {
    ...result,
    pairs,
    ambiguous,
    left_only,
    right_only,
    demoTotalRows: totalRows,
  }
}
