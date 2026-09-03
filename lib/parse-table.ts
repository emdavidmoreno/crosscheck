import * as XLSX from "xlsx"
import type { SheetTable } from "@/types/crosscheck"
import { S, autoNormalizer, normFor } from "@/lib/normalize"

export function buildTable(aoa: unknown[][], headerRow: number) {
  const raw = (aoa[headerRow - 1] || []) as unknown[]
  const seen: Record<string, number> = {}
  const headers = raw.map((h, i) => {
    let name = S(h).trim() || `Columna ${i + 1}`
    if (seen[name]) {
      seen[name]++
      name = `${name} (${seen[name]})`
    } else seen[name] = 1
    return name
  })
  const rows: Record<string, unknown>[] = []
  for (let i = headerRow; i < aoa.length; i++) {
    const r = aoa[i] as unknown[] | undefined
    if (!r || r.every((c) => c == null || S(c).trim() === "")) continue
    const obj: Record<string, unknown> = {}
    headers.forEach((h, j) => {
      obj[h] = r[j] ?? null
    })
    rows.push(obj)
  }
  return { headers, rows }
}

export function readWorkbookFile(
  file: File,
  buffer: ArrayBuffer
): Omit<SheetTable, "name"> & { name: string } {
  const wb = XLSX.read(new Uint8Array(buffer), {
    type: "array",
    cellDates: true,
  })
  const sheet = wb.SheetNames[0]
  const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheet], {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  }) as unknown[][]
  return {
    name: file.name,
    wb,
    sheetNames: wb.SheetNames,
    sheet,
    headerRow: 1,
    ...buildTable(aoa, 1),
  }
}

export function reparseSheet(
  cur: SheetTable,
  patch: Partial<Pick<SheetTable, "sheet" | "headerRow">>
): SheetTable {
  const next = { ...cur, ...patch }
  const aoa = XLSX.utils.sheet_to_json(next.wb.Sheets[next.sheet], {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  }) as unknown[][]
  return { ...next, ...buildTable(aoa, next.headerRow) }
}

export function suggestFields(
  left: Pick<SheetTable, "headers" | "rows">,
  right: Pick<SheetTable, "headers" | "rows">
) {
  const SAMPLE = 250
  const out: {
    left: string
    right: string
    normalizer: ReturnType<typeof autoNormalizer>
    cov: number
    identifier: boolean
  }[] = []

  for (const lc of left.headers) {
    for (const rc of right.headers) {
      const nz = autoNormalizer(left, right, lc, rc)
      const fn = (v: unknown) => normFor(nz, v)
      const A = new Set<string>()
      const B = new Set<string>()
      for (let i = 0; i < Math.min(SAMPLE, left.rows.length); i++) {
        const v = fn(left.rows[i][lc])
        if (v) A.add(v)
      }
      for (let i = 0; i < Math.min(SAMPLE, right.rows.length); i++) {
        const v = fn(right.rows[i][rc])
        if (v) B.add(v)
      }
      if (A.size < 3 || B.size < 3) continue
      let inter = 0
      for (const v of A) if (B.has(v)) inter++
      const cov = inter / Math.min(A.size, B.size)
      const distinct = Math.min(
        A.size / left.rows.length,
        B.size / right.rows.length
      )
      if (cov < 0.2) continue
      out.push({
        left: lc,
        right: rc,
        normalizer: nz,
        cov,
        identifier: distinct >= 0.5,
      })
    }
  }
  out.sort((a, b) => b.cov - a.cov)
  const usedL = new Set<string>()
  const usedR = new Set<string>()
  const picked: typeof out = []
  for (const s of out) {
    if (usedL.has(s.left) || usedR.has(s.right)) continue
    usedL.add(s.left)
    usedR.add(s.right)
    picked.push(s)
    if (picked.length === 5) break
  }
  return picked
}
