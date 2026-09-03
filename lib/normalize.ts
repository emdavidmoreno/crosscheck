import type { NormalizerKey, SheetTable } from "@/types/crosscheck"

export const S = (v: unknown) => (v == null ? "" : String(v))

export const normRaw = (v: unknown) => S(v).trim()
export const normText = (v: unknown) =>
  S(v).trim().replace(/\s+/g, " ").toUpperCase()
export const normAlnum = (v: unknown) =>
  S(v)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")

export function normNumeric(v: unknown): number | null {
  if (v == null || v === "") return null
  const n = parseFloat(S(v).replace(/[^0-9.\-]/g, ""))
  return Number.isNaN(n) ? null : n
}

/** "NODAL, ORESTE" y "Oreste Nodal" colapsan a la misma clave. */
export function normName(v: unknown): string {
  let s = S(v)
    .toUpperCase()
    .replace(/[^A-Z,\s]/g, " ")
  const parts = s.split(",")
  if (parts.length === 2) s = `${parts[1]} ${parts[0]}`
  return s
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .sort()
    .join(" ")
}

export function toDate(v: unknown): Date | null {
  if (v == null || v === "") return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  if (typeof v === "number") {
    if (v < 1 || v > 2958465) return null
    return new Date(Math.round((v - 25569) * 86400 * 1000))
  }
  const s = S(v).trim()
  if (!s) return null
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/)
  if (m) return new Date(Date.UTC(+m[3], +m[1] - 1, +m[2]))
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

export function normFor(nz: NormalizerKey, v: unknown): string {
  if (nz === "alphanumeric") return normAlnum(v)
  if (nz === "name") return normName(v)
  if (nz === "date") {
    const d = toDate(v)
    return d ? d.toISOString().slice(0, 10) : ""
  }
  if (nz === "numeric") {
    const n = normNumeric(v)
    return n == null ? "" : String(n)
  }
  return normText(v)
}

export function detectType(
  rows: Record<string, unknown>[],
  col: string
): NormalizerKey {
  const vals: unknown[] = []
  for (let i = 0; i < Math.min(300, rows.length); i++) {
    const v = rows[i][col]
    if (v != null && S(v).trim() !== "") vals.push(v)
  }
  if (vals.length < 3) return "text"
  let dates = 0
  let nums = 0
  let names = 0
  for (const v of vals) {
    const s = S(v).trim()
    if (v instanceof Date || (/\d/.test(s) && /[-/.]/.test(s) && toDate(v)))
      dates++
    if (/^-?[\d.,\s$]+$/.test(s) && /\d/.test(s)) nums++
    if (!/\d/.test(s) && (s.includes(",") || s.split(/\s+/).length >= 2))
      names++
  }
  const n = vals.length
  if (dates / n >= 0.7) return "date"
  if (nums / n >= 0.7) return "numeric"
  if (names / n >= 0.6) return "name"
  return "alphanumeric"
}

export function autoNormalizer(
  left: Pick<SheetTable, "rows">,
  right: Pick<SheetTable, "rows">,
  lc: string,
  rc: string
): NormalizerKey {
  const a = detectType(left.rows, lc)
  const b = detectType(right.rows, rc)
  if (a === b) return a
  if (a === "date" || b === "date") return "text"
  if (a === "name" || b === "name") return "name"
  return "alphanumeric"
}
