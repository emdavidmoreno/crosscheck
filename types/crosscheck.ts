export type NormalizerKey =
  | "text"
  | "alphanumeric"
  | "name"
  | "date"
  | "numeric"

export type MatchMode = "exact" | "loose" | "fuzzy"

export type Combinator = "AND" | "OR"

export type Side = "left" | "right"

export interface MatchField {
  id: string
  left: string
  right: string
  normalizer: NormalizerKey
  mode: MatchMode
  threshold: number
  tolerance: number
  isKey: boolean
}

export interface OutputColumn {
  source: Side
  column: string
}

export interface SheetTable {
  name: string
  wb: import("xlsx").WorkBook
  sheetNames: string[]
  sheet: string
  headerRow: number
  headers: string[]
  rows: Record<string, unknown>[]
}

export interface MatchDetail {
  fi: number
  sim: number | null
  pass: boolean
}

export interface MatchPair {
  li: number
  ri: number
  score: number
  detail: MatchDetail[]
}

export interface AmbiguousMatch {
  li: number
  candidates: { ri: number; rank: number; score: number }[]
}

export interface MatchStats {
  compared: number
  candidates: number
  truncated: number
  ms: number
  verified: number
  verifyMismatch: number
  strongHits: number
}

export interface MatchResult {
  pairs: MatchPair[]
  ambiguous: AmbiguousMatch[]
  left_only: { li: number }[]
  right_only: { ri: number }[]
  stats: MatchStats
  /**
   * Demo mode: real flattened row count before capping.
   * When set, `pairs` / `ambiguous` / `left_only` / `right_only` only hold
   * the first N stored rows — filters must not reveal more.
   */
  demoTotalRows?: number
}

export type BandKey = "b100" | "b80" | "b50" | "b0"
export type StructKey = "ambiguous" | "left_only" | "right_only"
export type FilterKey = BandKey | StructKey

export interface RuleSetPayload {
  version: number
  name?: string
  combinator: Combinator
  fields: Omit<MatchField, "id">[]
  output?: {
    columns?: OutputColumn[]
    groupBy?: string[]
  }
  files?: {
    left?: { label: string; sheet: string; headerRow: number }
    right?: { label: string; sheet: string; headerRow: number }
  }
}

export interface LibrarySet {
  id: string
  name: string
  owner: string
  savedAt: string
  link?: string
  payload: RuleSetPayload
}

export interface WorkspaceUser {
  id: string
  email: string
  name: string
}

export interface FlatReportRow {
  kind: FilterKey
  score: number | null
  values: Record<number, unknown>
  detail?: MatchDetail[]
  cands?: AmbiguousMatch["candidates"]
}
