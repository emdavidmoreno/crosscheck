import type { Combinator, MatchField, MatchResult } from "@/types/crosscheck"
import { normFor, normNumeric, toDate } from "@/lib/normalize"

export const QGRAM = 3

type PrepValue = string | number | null

type ActiveField = MatchField & { fi: number }

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = new Uint32Array(b.length + 1)
  let cur = new Uint32Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1
      let m = prev[j] + 1
      const d = cur[j - 1] + 1
      if (d < m) m = d
      const e = prev[j - 1] + cost
      if (e < m) m = e
      cur[j] = m
    }
    const t = prev
    prev = cur
    cur = t
  }
  return prev[b.length]
}

function ratio(a: string, b: string): number {
  const max = a.length > b.length ? a.length : b.length
  if (!max) return 0
  return 1 - levenshtein(a, b) / max
}

function prepColumn(
  f: MatchField,
  rows: Record<string, unknown>[],
  key: string
): PrepValue[] {
  const nz = f.normalizer
  const n = rows.length
  const out: PrepValue[] = new Array(n)
  for (let i = 0; i < n; i++) {
    const v = rows[i][key]
    if (v == null || String(v).trim() === "") {
      out[i] = null
      continue
    }
    if (nz === "date") {
      const d = toDate(v)
      out[i] = d ? Math.floor(d.getTime() / 86400000) : null
    } else if (nz === "numeric") out[i] = normNumeric(v)
    else if (f.mode === "exact") out[i] = String(v).trim()
    else out[i] = normFor(nz, v) || null
  }
  return out
}

function simOf(
  f: MatchField,
  a: PrepValue,
  b: PrepValue
): { sim: number | null; pass: boolean } {
  if (a == null && b == null) return { sim: null, pass: false }
  if (a == null || b == null) return { sim: 0, pass: false }
  const nz = f.normalizer

  if (nz === "date") {
    const d = Math.abs((a as number) - (b as number))
    const tol = f.mode === "exact" ? 0 : f.tolerance || 0
    if (d === 0) return { sim: 1, pass: true }
    if (tol <= 0 || d > tol) return { sim: 0, pass: false }
    return { sim: Math.max(0, 1 - d / (tol + 1)), pass: true }
  }

  if (nz === "numeric") {
    const d = Math.abs((a as number) - (b as number))
    if (d === 0) return { sim: 1, pass: true }
    const tol = f.mode === "exact" ? 0 : f.tolerance || 0
    if (d > tol) {
      const s = Math.max(Math.abs(a as number), Math.abs(b as number), 1)
      return { sim: Math.max(0, 1 - d / s), pass: false }
    }
    return { sim: 1 - (d / (tol || 1)) * 0.15, pass: true }
  }

  const as = a as string
  const bs = b as string
  if (as === bs) return { sim: 1, pass: true }
  if (f.mode === "exact") return { sim: 0, pass: false }
  if (f.mode === "loose") return { sim: ratio(as, bs), pass: false }

  const t = f.threshold || 0.85
  const mx = as.length > bs.length ? as.length : bs.length
  const lenSim = 1 - Math.abs(as.length - bs.length) / mx
  if (lenSim < t) return { sim: lenSim, pass: false }
  const r = ratio(as, bs)
  return { sim: r, pass: r >= t }
}

function gramsOf(s: string): string[] {
  if (s.length <= QGRAM) return ["e" + s]
  const o = new Set<string>()
  for (let i = 0; i + QGRAM <= s.length; i++) o.add(s.slice(i, i + QGRAM))
  return [...o]
}

function maxEdits(len: number, t: number): number {
  return Math.floor(((1 - t) / t) * len)
}

function prefixGrams(
  grams: string[],
  freq: Map<string, number>,
  len: number,
  t: number
): string[] {
  if (grams.length && grams[0][0] === "e") return grams
  const k = maxEdits(len, t)
  const p = Math.min(grams.length, QGRAM * k + 1)
  const sorted = grams
    .slice()
    .sort((a, b) => (freq.get(a) || 0) - (freq.get(b) || 0))
  return sorted.slice(0, p)
}

function blockKeysPrep(
  f: MatchField,
  pv: PrepValue,
  side: "index" | "probe"
): string[] {
  if (pv == null) return []
  const nz = f.normalizer

  if (nz === "date") {
    if (side === "index") return ["d" + pv]
    const tol = f.mode === "exact" ? 0 : Math.min(f.tolerance || 0, 60)
    const o: string[] = []
    for (let k = -tol; k <= tol; k++) o.push("d" + ((pv as number) + k))
    return o
  }

  if (nz === "numeric") {
    const tol = f.mode === "exact" ? 0 : f.tolerance || 0
    if (tol <= 0) return ["n" + pv]
    const b = Math.round((pv as number) / tol)
    return side === "index"
      ? ["n" + b]
      : ["n" + (b - 1), "n" + b, "n" + (b + 1)]
  }

  if (f.mode !== "fuzzy") return ["e" + pv]
  return gramsOf(pv as string)
}

export function runMatchCore(
  left: Record<string, unknown>[],
  right: Record<string, unknown>[],
  fields: MatchField[],
  combinator: Combinator,
  opts?: { onProgress?: (p: number) => void; candidateCap?: number }
): MatchResult {
  const report = opts?.onProgress
  const CAP = opts?.candidateCap || 2000
  const KEEP = 8
  const active: ActiveField[] = fields
    .map((f, fi) => ({ ...f, fi }))
    .filter((f) => f.left && f.right)
  const keys = active.filter((f) => f.isKey)

  const out: MatchResult = {
    pairs: [],
    ambiguous: [],
    left_only: [],
    right_only: [],
    stats: {
      compared: 0,
      candidates: 0,
      truncated: 0,
      ms: 0,
      verified: 0,
      verifyMismatch: 0,
      strongHits: 0,
    },
  }
  if (!keys.length) return out

  const t0 = Date.now()
  const nL = left.length
  const nR = right.length

  const L = active.map((f) => prepColumn(f, left, f.left))
  const R = active.map((f) => prepColumn(f, right, f.right))
  const keyPos = keys.map((f) => active.indexOf(f))

  const isFuzzyStr = (f: MatchField) =>
    f.mode === "fuzzy" && f.normalizer !== "date" && f.normalizer !== "numeric"

  const indexes = keys.map((f, ki) => {
    const col = R[keyPos[ki]]
    const m = new Map<string, number[]>()

    if (!isFuzzyStr(f)) {
      for (let ri = 0; ri < nR; ri++) {
        const ks = blockKeysPrep(f, col[ri], "index")
        for (let x = 0; x < ks.length; x++) {
          let arr = m.get(ks[x])
          if (!arr) {
            arr = []
            m.set(ks[x], arr)
          }
          arr.push(ri)
        }
      }
      return { map: m, freq: null as Map<string, number> | null }
    }

    const freq = new Map<string, number>()
    const all: (string[] | null)[] = new Array(nR)
    for (let ri = 0; ri < nR; ri++) {
      const v = col[ri]
      if (v == null) {
        all[ri] = null
        continue
      }
      const g = gramsOf(v as string)
      all[ri] = g
      for (let x = 0; x < g.length; x++)
        freq.set(g[x], (freq.get(g[x]) || 0) + 1)
    }
    const t = f.threshold || 0.85
    for (let ri = 0; ri < nR; ri++) {
      const g = all[ri]
      if (!g) continue
      const pre = prefixGrams(g, freq, (col[ri] as string).length, t)
      for (let x = 0; x < pre.length; x++) {
        let arr = m.get(pre[x])
        if (!arr) {
          arr = []
          m.set(pre[x], arr)
        }
        arr.push(ri)
      }
    }
    return { map: m, freq }
  })

  const counts = new Int32Array(nR)
  const touched: number[] = []
  const cand = new Set<number>()

  let strongHits = 0
  const gather = (li: number) => {
    cand.clear()
    for (let ki = 0; ki < keys.length; ki++) {
      const f = keys[ki]
      const a = keyPos[ki]
      const idx = indexes[ki].map
      const freq = indexes[ki].freq
      const pv = L[a][li]
      if (pv == null) continue

      const fuzzyStr =
        isFuzzyStr(f) && typeof pv === "string" && pv.length > QGRAM

      if (!fuzzyStr) {
        const probes = blockKeysPrep(f, pv, "probe")
        for (let x = 0; x < probes.length; x++) {
          const b = idx.get(probes[x])
          if (!b) continue
          for (let y = 0; y < b.length; y++) {
            cand.add(b[y])
            if (cand.size >= CAP) break
          }
          if (cand.size >= CAP) break
        }
        if (combinator === "OR" && ki < keys.length - 1 && cand.size) {
          let strong = false
          for (const ri of cand) {
            if (simOf(f, pv, R[a][ri]).pass) {
              strong = true
              break
            }
          }
          if (strong) {
            strongHits++
            break
          }
        }
      } else {
        const t = f.threshold || 0.85
        const grams = prefixGrams(
          gramsOf(pv as string),
          freq!,
          (pv as string).length,
          t
        )
        const need = 1

        for (let x = 0; x < grams.length; x++) {
          const b = idx.get(grams[x])
          if (!b) continue
          for (let y = 0; y < b.length; y++) {
            const ri = b[y]
            if (counts[ri] === 0) touched.push(ri)
            counts[ri]++
          }
        }
        for (let x = 0; x < touched.length; x++) {
          const ri = touched[x]
          if (counts[ri] >= need && cand.size < CAP) cand.add(ri)
          counts[ri] = 0
        }
        touched.length = 0
      }

      if (combinator === "AND" && cand.size) break
    }
    return cand
  }

  const keysPass = (li: number, ri: number) => {
    let hits = 0
    let bonus = 0
    for (let ki = 0; ki < keys.length; ki++) {
      const a = keyPos[ki]
      if (simOf(keys[ki], L[a][li], R[a][ri]).pass) {
        hits++
        bonus += keys.length - ki
      } else if (combinator === "AND") return -1
    }
    return hits === 0 ? -1 : bonus
  }

  const scoreOf = (li: number, ri: number) => {
    let sum = 0
    let w = 0
    for (let a = 0; a < active.length; a++) {
      const s = simOf(active[a], L[a][li], R[a][ri]).sim
      if (s != null) {
        sum += s
        w++
      }
    }
    return w ? sum / w : 0
  }

  const detailOf = (li: number, ri: number) => {
    const d = new Array(active.length)
    for (let a = 0; a < active.length; a++) {
      const s = simOf(active[a], L[a][li], R[a][ri])
      d[a] = { fi: active[a].fi, sim: s.sim, pass: s.pass }
    }
    return d
  }

  const tops: { ri: number; rank: number; score: number }[][] = new Array(nL)
  const step = Math.max(1, nL >> 6)

  for (let li = 0; li < nL; li++) {
    const set = gather(li)
    out.stats.candidates += set.size
    if (set.size >= CAP) out.stats.truncated++

    let found: { ri: number; rank: number; score: number }[] | null = null
    for (const ri of set) {
      out.stats.compared++
      const bonus = keysPass(li, ri)
      if (bonus < 0) continue
      const score = scoreOf(li, ri)
      const rank = bonus + score
      if (!found) found = []
      if (found.length < KEEP) {
        found.push({ ri, rank, score })
        found.sort((a, b) => b.rank - a.rank)
      } else if (rank > found[KEEP - 1].rank) {
        found[KEEP - 1] = { ri, rank, score }
        found.sort((a, b) => b.rank - a.rank)
      }
    }
    tops[li] = found || []
    if (report && li % step === 0) report(li / nL)
  }

  const order = new Array(nL)
  for (let li = 0; li < nL; li++)
    order[li] = { li, best: tops[li].length ? tops[li][0].rank : -1 }
  order.sort((a, b) => b.best - a.best)

  const taken = new Set<number>()
  for (let i = 0; i < order.length; i++) {
    const li = order[i].li
    const c = tops[li]
    if (!c.length) {
      out.left_only.push({ li })
      continue
    }
    if (c.length > 1 && Math.abs(c[1].rank - c[0].rank) < 1e-9) {
      out.ambiguous.push({
        li,
        candidates: c
          .filter((x) => Math.abs(x.rank - c[0].rank) < 1e-9)
          .slice(0, 6),
      })
      continue
    }
    let pick: (typeof c)[0] | null = null
    for (let x = 0; x < c.length; x++)
      if (!taken.has(c[x].ri)) {
        pick = c[x]
        break
      }
    if (!pick) {
      out.left_only.push({ li })
      continue
    }
    taken.add(pick.ri)
    out.pairs.push({
      li,
      ri: pick.ri,
      score: pick.score,
      detail: detailOf(li, pick.ri),
    })
  }
  for (let ri = 0; ri < nR; ri++) if (!taken.has(ri)) out.right_only.push({ ri })
  out.pairs.sort((a, b) => b.score - a.score)

  const budget = 400000
  const sample = Math.max(1, Math.min(150, Math.floor(budget / Math.max(nR, 1))))
  let mismatch = 0
  let checked = 0
  for (let li = 0; li < Math.min(sample, nL); li++) {
    let bestRank = -1
    for (let ri = 0; ri < nR; ri++) {
      const bonus = keysPass(li, ri)
      if (bonus < 0) continue
      const rank = bonus + scoreOf(li, ri)
      if (rank > bestRank) bestRank = rank
    }
    const viaIndex = tops[li].length ? tops[li][0].rank : -1
    checked++
    if (bestRank - viaIndex > 1e-9) mismatch++
  }
  out.stats.verified = checked
  out.stats.verifyMismatch = mismatch
  out.stats.ms = Date.now() - t0
  out.stats.strongHits = strongHits
  return out
}
