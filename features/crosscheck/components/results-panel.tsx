"use client"

import { Fragment, useMemo, useState } from "react"
import { AlertCircle, ChevronDown, Download } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Mismatches } from "@/components/mismatches"
import { ScoreCell } from "@/components/score-cell"
import { ScoreSpectrum } from "@/components/score-spectrum"
import { SectionHeader } from "@/components/section-header"
import { labelOf } from "@/constants/bands"
import { DEMO_LIMITS } from "@/constants/demo"
import { download } from "@/lib/download"
import { formatCell } from "@/lib/score"
import { S } from "@/lib/normalize"
import { cn } from "@/lib/utils"
import type {
  FilterKey,
  FlatReportRow,
  MatchField,
  MatchResult,
  OutputColumn,
} from "@/types/crosscheck"

export type ResultsPanelStatus = "idle" | "running" | "error" | "done"

function resolveSideValues(
  fields: MatchField[],
  outCols: OutputColumn[],
  values: Record<number, unknown>
): Partial<Record<number, { left?: unknown; right?: unknown }>> {
  const out: Partial<Record<number, { left?: unknown; right?: unknown }>> = {}
  fields.forEach((f, fi) => {
    const li = outCols.findIndex(
      (c) => c.source === "left" && c.column === f.left
    )
    const ri = outCols.findIndex(
      (c) => c.source === "right" && c.column === f.right
    )
    out[fi] = {
      left: li >= 0 ? values[li] : undefined,
      right: ri >= 0 ? values[ri] : undefined,
    }
  })
  return out
}

function RunningSkeleton() {
  return (
    <div
      className="pointer-events-none mt-4 flex flex-col gap-2 opacity-35"
      aria-hidden
    >
      <div className="rounded-xl border p-3.5">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton
            key={i}
            className="mb-2 h-4 rounded-md last:mb-0"
            style={{ width: `${72 - i * 7}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export function ResultsPanel({
  status: statusProp,
  results,
  running = false,
  progress = 0,
  error = null,
  onRun,
  onCancel,
  onRetry,
  onBack,
  backLabel = "Volver",
  readySummary,
  etaLabel,
  progressCurrent,
  progressTotal,
  leftRowCount = 0,
  rightRowCount = 0,
  outCols = [],
  fields = [],
  filters,
  onToggleFilter,
  search = "",
  onSearchChange,
  visible = [],
  grouped = [],
  bandCounts = { b100: 0, b80: 0, b50: 0, b0: 0 },
  groupByColumns: groupByColumnsProp,
  onGroupByColumnsChange,
  demoMode = false,
  onExportBlocked,
  onSubscribe,
}: {
  /** First-class UI state. Inferred from running/error/results when omitted. */
  status?: ResultsPanelStatus
  results?: MatchResult | null
  running?: boolean
  /** 0–1 progress fraction */
  progress?: number
  error?: string | null
  onRun?: () => void
  onCancel?: () => void
  onRetry?: () => void
  onBack?: () => void
  backLabel?: string
  /** Idle copy, e.g. “2 campos definidos…” */
  readySummary?: string
  etaLabel?: string
  progressCurrent?: number
  progressTotal?: number
  leftRowCount?: number
  rightRowCount?: number
  outCols?: OutputColumn[]
  fields?: MatchField[]
  filters?: Record<FilterKey, boolean>
  onToggleFilter?: (key: FilterKey) => void
  search?: string
  onSearchChange?: (v: string) => void
  visible?: FlatReportRow[]
  grouped?: { key: string | null; rows: FlatReportRow[] }[]
  bandCounts?: Record<string, number>
  groupByColumns?: string[]
  onGroupByColumnsChange?: (next: string[]) => void
  /** Guest/demo: export gated + skeleton placeholders for uncapped rows. */
  demoMode?: boolean
  onExportBlocked?: () => void
  onSubscribe?: () => void
}) {
  const [localGroupByColumns, setLocalGroupByColumns] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set()
  )

  const groupByColumns = groupByColumnsProp ?? localGroupByColumns
  const setGroupByColumns = onGroupByColumnsChange ?? setLocalGroupByColumns

  const status: ResultsPanelStatus =
    statusProp ??
    (running ? "running" : error ? "error" : results ? "done" : "idle")

  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100)

  const idleSummary =
    readySummary ??
    (() => {
      const keyCount = fields.filter((f) => f.isKey).length
      const parts: string[] = []
      if (fields.length) {
        const campos = `${fields.length} campo${fields.length === 1 ? "" : "s"} definido${fields.length === 1 ? "" : "s"}`
        const claves =
          keyCount === 0
            ? null
            : keyCount === 1
              ? "uno de ellos clave"
              : `${keyCount} de ellos claves`
        parts.push(claves ? `${campos}, ${claves}` : campos)
      }
      if (leftRowCount || rightRowCount) {
        parts.push(
          `${leftRowCount.toLocaleString("es")} filas contra ${rightRowCount.toLocaleString("es")} filas`
        )
      }
      return parts.length
        ? `${parts.join(". ")}.`
        : "Definí los campos y columnas, luego ejecutá el cruce."
    })()

  const availableGroupBy = useMemo(
    () =>
      outCols.map((c) => ({
        value: `${c.source}|${c.column}`,
        label: `${c.column} (${c.source === "left" ? "A" : "B"})`,
      })),
    [outCols]
  )

  const displayGroups = useMemo(() => {
    if (!groupByColumns.length) return grouped
    const indexed = groupByColumns
      .map((id) => ({
        i: outCols.findIndex((c) => `${c.source}|${c.column}` === id),
      }))
      .filter((x) => x.i >= 0)
    if (!indexed.length) return grouped
    const map = new Map<string, { key: string; rows: FlatReportRow[] }>()
    for (const r of visible) {
      const parts = indexed.map(({ i }) => S(r.values[i]) || "(vacío)")
      const id = JSON.stringify(parts)
      const label = indexed
        .map(({ i }, idx) => `${outCols[i]?.column}: ${parts[idx]}`)
        .join(" · ")
      const bucket = map.get(id)
      if (bucket) bucket.rows.push(r)
      else map.set(id, { key: label, rows: [r] })
    }
    return [...map.values()]
      .sort((a, b) => b.rows.length - a.rows.length)
      .map((x) => ({ key: x.key, rows: x.rows }))
  }, [groupByColumns, grouped, outCols, visible])

  const groupByLabel = useMemo(() => {
    if (!groupByColumns.length) return "Sin agrupar"
    if (groupByColumns.length === 1) {
      return (
        availableGroupBy.find((x) => x.value === groupByColumns[0])?.label ??
        "1 columna"
      )
    }
    return `${groupByColumns.length} columnas`
  }, [availableGroupBy, groupByColumns])

  const toggleGroupByColumn = (id: string, checked: boolean) => {
    if (checked) {
      if (groupByColumns.includes(id)) return
      setGroupByColumns([...groupByColumns, id])
      return
    }
    setGroupByColumns(groupByColumns.filter((x) => x !== id))
  }

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleGroupCollapsed = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exportCSV = () => {
    if (demoMode) {
      onExportBlocked?.()
      return
    }
    const head = outCols
      .map((c) => `"${c.column} (${c.source === "left" ? "izq" : "der"})"`)
      .concat('"Puntaje"', '"Estado"')
      .join(",")
    const body = visible.map((r) =>
      outCols
        .map((_, i) => `"${S(r.values[i]).replace(/"/g, '""')}"`)
        .concat(
          `"${r.score == null ? "" : Math.round(r.score * 100) + "%"}"`,
          `"${labelOf(r.kind)}"`
        )
        .join(",")
    )
    download(
      [head, ...body].join("\n"),
      "conciliacion.csv",
      "text/csv;charset=utf-8"
    )
  }

  if (status === "idle") {
    return (
      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Resultado"
          title="Resultados"
          description="Cuando el cruce termine, acá vas a ver el espectro y la tabla de pares."
        />
        <Empty className="border border-dashed bg-card py-14">
          <EmptyHeader>
            <EmptyTitle>Todo listo para cruzar</EmptyTitle>
            <EmptyDescription>{idleSummary}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onRun} disabled={!onRun}>
              Ejecutar cruce
            </Button>
          </EmptyContent>
        </Empty>
      </section>
    )
  }

  if (status === "running") {
    const rowLabel =
      progressCurrent != null && progressTotal != null
        ? `Fila ${progressCurrent.toLocaleString("es")} de ${progressTotal.toLocaleString("es")}`
        : null
    const meta = [rowLabel, etaLabel].filter(Boolean).join(" · ")

    return (
      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Resultado"
          title="Cruzando archivos…"
          description="El resto de la interfaz sigue disponible — podés volver a Campos a ajustar mientras corre."
        />
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">
              Cruzando archivos… {pct}%
            </span>
            {onCancel ? (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancelar
              </Button>
            ) : null}
          </div>
          <Progress value={pct} className="w-full">
            <ProgressLabel className="sr-only">Progreso del cruce</ProgressLabel>
            <ProgressValue />
          </Progress>
          {meta ? (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {meta}
            </p>
          ) : null}
        </div>
        <RunningSkeleton />
      </section>
    )
  }

  if (status === "error") {
    return (
      <section className="flex flex-col gap-4">
        <SectionHeader
          eyebrow="Resultado"
          title="Resultados"
          description="Hubo un problema al cruzar. Revisá el mensaje y reintentá."
        />
        <Alert
          variant="destructive"
          className="border-[color:var(--score-low-line,var(--destructive))]"
        >
          <AlertCircle />
          <AlertTitle>No pudimos completar el cruce</AlertTitle>
          <AlertDescription>
            {error || "Ocurrió un error inesperado."}
          </AlertDescription>
          <div className="col-start-2 mt-3 flex flex-wrap gap-2.5">
            {onBack ? (
              <Button variant="outline" size="sm" onClick={onBack}>
                {backLabel}
              </Button>
            ) : null}
            <Button size="sm" onClick={onRetry ?? onRun} disabled={!onRetry && !onRun}>
              Reintentar
            </Button>
          </div>
        </Alert>
      </section>
    )
  }

  // done
  if (!results || !filters || !onToggleFilter) {
    return null
  }

  const unresolved =
    results.ambiguous.length +
    results.left_only.length +
    results.right_only.length
  const storedRows =
    results.pairs.length +
    results.ambiguous.length +
    results.left_only.length +
    results.right_only.length
  const demoTotalRows = results.demoTotalRows ?? storedRows
  const skeletonCount =
    demoMode && demoTotalRows > storedRows
      ? Math.min(
          DEMO_LIMITS.maxSkeletonRows,
          demoTotalRows - storedRows
        )
      : 0
  const colSpan = outCols.length + 3

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        eyebrow="Resultado"
        title={`${results.pairs.length} pares · ${unresolved} sin resolver`}
        description={
          demoMode && demoTotalRows > storedRows
            ? `Modo demo: se guardan las primeras ${DEMO_LIMITS.maxResultRows} filas de ${demoTotalRows.toLocaleString("es")}. El resto aparece como vista previa bloqueada.`
            : "Cada franja del espectro es una banda de coincidencia. Los bloques rayados son filas sin puntaje — otra categoría, no un 0%."
        }
      />

      {results.stats ? (
        <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-xl border bg-card px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
          <span>
            <b className="font-semibold text-foreground">{results.stats.ms} ms</b>{" "}
            de cómputo
          </span>
          <span>
            <b className="font-semibold text-foreground">
              {results.stats.compared.toLocaleString("es")}
            </b>{" "}
            comparaciones sobre{" "}
            {(leftRowCount * rightRowCount).toLocaleString("es")} pares posibles
          </span>
          <span>
            {results.stats.verifyMismatch === 0 ? (
              <>
                índice verificado contra el barrido completo en{" "}
                <b className="font-semibold text-foreground">
                  {results.stats.verified}
                </b>{" "}
                filas
              </>
            ) : (
              <span className="text-destructive">
                <b className="font-semibold">{results.stats.verifyMismatch}</b>{" "}
                filas difieren del barrido completo
              </span>
            )}
          </span>
          {results.stats.truncated > 0 ? (
            <span className="text-chart-4">
              <b className="font-semibold">{results.stats.truncated}</b> filas
              con demasiados candidatos — revisá las claves
            </span>
          ) : null}
        </div>
      ) : null}

      <ScoreSpectrum
        results={results}
        filters={filters}
        onToggle={onToggleFilter}
        bandCounts={bandCounts}
      />

      <div className="flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="sm" variant="outline" className="gap-1.5">
                Agrupar por: {groupByLabel}
                <ChevronDown className="size-3.5" />
              </Button>
            }
          />
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Columnas del reporte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableGroupBy.length ? (
                availableGroupBy.map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.value}
                    checked={groupByColumns.includes(item.value)}
                    onCheckedChange={(v) =>
                      toggleGroupByColumn(item.value, v === true)
                    }
                  >
                    {item.label}
                  </DropdownMenuCheckboxItem>
                ))
              ) : (
                <DropdownMenuLabel className="py-2 text-xs">
                  Sin columnas de salida para agrupar
                </DropdownMenuLabel>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setGroupByColumns([])}
              disabled={!groupByColumns.length}
            >
              Limpiar agrupamiento
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>

        <Input
          className="max-w-70"
          placeholder="Buscar en el reporte…"
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
        <span className="text-xs text-muted-foreground">
          {demoMode && demoTotalRows > storedRows
            ? `${visible.length} de ${demoTotalRows.toLocaleString("es")} filas (demo)`
            : `${visible.length} filas visibles`}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto gap-1.5"
          onClick={exportCSV}
        >
          <Download className="size-3.5" />
          Exportar
        </Button>
      </div>

      <ScrollArea className="h-[640px] rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky top-0 w-10 bg-muted/80" />
              <TableHead className="sticky top-0 w-36 bg-muted/80">
                Estado / Puntaje
              </TableHead>
              {outCols.map((c, i) => (
                <TableHead key={i} className="sticky top-0 bg-muted/80">
                  {c.column}{" "}
                  <span className="text-muted-foreground">
                    {c.source === "left" ? "· A" : "· B"}
                  </span>
                </TableHead>
              ))}
              <TableHead className="sticky top-0 bg-muted/80">
                Campos que no coinciden
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayGroups.map((g, gi) => {
              const groupId = `${gi}-${g.key ?? "flat"}`
              const isCollapsed =
                g.key !== null && collapsedGroups.has(groupId)
              return (
                <Fragment key={`g-${gi}-${g.key ?? "flat"}`}>
                  {g.key !== null ? (
                    <TableRow>
                      <TableCell
                        colSpan={outCols.length + 3}
                        className="bg-muted/60 font-mono text-[11px] tracking-wide text-muted-foreground uppercase"
                      >
                        <button
                          type="button"
                          onClick={() => toggleGroupCollapsed(groupId)}
                          className="flex w-full items-center gap-2 text-left"
                          aria-expanded={!isCollapsed}
                          aria-label={`Alternar grupo ${g.key}`}
                        >
                          <ChevronDown
                            className={cn(
                              "size-3.5 shrink-0 transition-transform duration-150",
                              isCollapsed && "-rotate-90"
                            )}
                          />
                          <span>
                            {g.key} — {g.rows.length}
                          </span>
                        </button>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {!isCollapsed
                    ? g.rows.map((r, i) => {
                  const rowId = `${gi}-${i}`
                  const isOpen = expanded.has(rowId)
                  const canExpand = Boolean(r.detail?.length || r.cands?.length)
                  const sides =
                    r.detail && fields.length
                      ? resolveSideValues(fields, outCols, r.values)
                      : undefined
                  return (
                    <Fragment key={rowId}>
                      <TableRow
                        className={cn(isOpen && "border-b-0")}
                        data-state={isOpen ? "open" : undefined}
                      >
                        <TableCell className="w-10 px-1">
                          {canExpand ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              aria-expanded={isOpen}
                              aria-label="Por qué quedó así"
                              onClick={() => toggleExpanded(rowId)}
                            >
                              <ChevronDown
                                className={cn(
                                  "size-3.5 transition-transform duration-150",
                                  isOpen && "rotate-180"
                                )}
                              />
                            </Button>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <ScoreCell score={r.score} kind={r.kind} />
                        </TableCell>
                        {outCols.map((_, j) => (
                          <TableCell
                            key={j}
                            className="max-w-60 truncate font-mono text-xs"
                          >
                            <span
                              className={
                                r.values[j] == null || r.values[j] === ""
                                  ? "text-muted-foreground"
                                  : undefined
                              }
                            >
                              {formatCell(r.values[j])}
                            </span>
                          </TableCell>
                        ))}
                        <TableCell className="max-w-85">
                          {r.cands ? (
                            <Alert className="py-2">
                              <AlertDescription className="text-[11px]">
                                {r.cands.length} candidatos empatados
                              </AlertDescription>
                            </Alert>
                          ) : r.detail ? (
                            <Mismatches
                              detail={r.detail}
                              fields={fields}
                              sideValues={sides}
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                      {isOpen && canExpand ? (
                        <TableRow key={`${rowId}-detail`}>
                          <TableCell />
                          <TableCell
                            colSpan={outCols.length + 2}
                            className="bg-muted/30 py-3"
                          >
                            {r.cands ? (
                              <div className="text-[12.5px]">
                                <div className="mb-2 text-[11.5px] text-muted-foreground">
                                  Por qué quedó así:
                                </div>
                                <p className="text-sm">
                                  {r.cands.length} candidatos empatados — no hay
                                  un único par claro.
                                </p>
                              </div>
                            ) : r.detail ? (
                              <Mismatches
                                detail={r.detail}
                                fields={fields}
                                sideValues={sides}
                                variant="breakdown"
                              />
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  )
                })
                    : null}
                </Fragment>
              )
            })}
            {!visible.length ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="py-12 text-center text-muted-foreground"
                >
                  Ninguna fila coincide con los filtros activos.
                </TableCell>
              </TableRow>
            ) : null}
            {skeletonCount > 0
              ? Array.from({ length: skeletonCount }, (_, i) => (
                  <TableRow
                    key={`demo-skel-${i}`}
                    className="pointer-events-none opacity-50"
                    aria-hidden
                  >
                    <TableCell className="w-10 px-1" />
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-md" />
                    </TableCell>
                    {outCols.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton
                          className="h-3.5 rounded-md"
                          style={{ width: `${55 + ((i + j) % 4) * 10}%` }}
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Skeleton className="h-3.5 w-2/3 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              : null}
            {demoMode && demoTotalRows > storedRows + skeletonCount ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="py-3 text-center text-xs text-muted-foreground"
                >
                  +{" "}
                  {(
                    demoTotalRows -
                    storedRows -
                    skeletonCount
                  ).toLocaleString("es")}{" "}
                  filas.{" "}
                  <button
                    onClick={onSubscribe}
                    className="text-primary hover:underline font-medium"
                  >
                    Para hacer todas las filas visibles Suscribirse
                  </button>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </ScrollArea>
    </section>
  )
}
