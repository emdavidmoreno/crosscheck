"use client"

import {
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SectionHeader } from "@/components/section-header"
import type { OutputColumn, SheetTable } from "@/types/crosscheck"
import {
  buildAvailableColumns,
  ColumnPicker,
  type AvailableColumn,
} from "@/features/crosscheck/components/column-picker"

function sourceTag(source: OutputColumn["source"]): "A" | "B" {
  return source === "left" ? "A" : "B"
}

export function OutputColumns({
  left,
  right,
  outCols,
  groupBy,
  keyCount,
  running,
  progress,
  leftRows,
  rightRows,
  onOutColsChange,
  onGroupByChange,
  onRun,
  onCancel,
  showGroupBy = true,
  onBack,
  maxColumns,
  onSubscribe,
}: {
  left: SheetTable
  right: SheetTable
  outCols: OutputColumn[]
  groupBy: string
  keyCount: number
  running: boolean
  progress: number
  leftRows: number
  rightRows: number
  onOutColsChange: (cols: OutputColumn[]) => void
  onGroupByChange: (v: string) => void
  onRun: () => void
  onCancel: () => void
  /** When false, hides agrupar-por (grouping lives in results in the design). Default true for backward compat. */
  showGroupBy?: boolean
  /** Optional wizard back control. */
  onBack?: () => void
  /** Demo/paid cap on selected output columns (enforced by onOutColsChange). */
  maxColumns?: number
  onSubscribe?: () => void
}) {
  const available = buildAvailableColumns(left, right)

  const groupItems = [
    { label: "Sin agrupar", value: "" },
    ...outCols.map((c) => ({
      label: `${c.column} (${sourceTag(c.source)})`,
      value: `${c.source}|${c.column}`,
    })),
  ]

  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= outCols.length) return
    const next = [...outCols]
    ;[next[i], next[j]] = [next[j], next[i]]
    onOutColsChange(next)
  }

  const toggleColumn = (col: AvailableColumn, selected: boolean) => {
    if (selected) {
      if (outCols.some((c) => c.source === col.source && c.column === col.column))
        return
      onOutColsChange([
        ...outCols,
        { source: col.source, column: col.column },
      ])
      return
    }
    onOutColsChange(
      outCols.filter(
        (c) => !(c.source === col.source && c.column === col.column)
      )
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <SectionHeader
        eyebrow="Reporte"
        title="Columnas del reporte"
        description="Elegí qué columnas mostrar en el resultado, además del estado de cada fila."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <ColumnPicker
          columns={available}
          outCols={outCols}
          onToggle={toggleColumn}
        />

        <div className="flex min-h-0 flex-col gap-2 rounded-xl border bg-card p-4">
          <div className="font-mono text-[10px] tracking-[0.1em] text-primary uppercase">
            Orden en el reporte · {outCols.length}
            {maxColumns != null ? `/${maxColumns}` : ""} seleccionadas
          </div>
          <ScrollArea className="h-[min(400px,50vh)]">
            <div className="flex flex-col gap-0.5 pr-3">
              {outCols.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  Marcá columnas a la izquierda para armar el orden del reporte.
                </p>
              ) : (
                outCols.map((c, i) => (
                  <div
                    key={`${c.source}-${c.column}-${i}`}
                    className="flex items-center gap-2 py-1.5"
                  >
                    <div className="flex gap-0.5">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label="Subir"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ChevronUpIcon />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label="Bajar"
                        disabled={i === outCols.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ChevronDownIcon />
                      </Button>
                    </div>
                    <span className="min-w-0 flex-1 truncate font-mono text-[13px]">
                      {c.column}
                    </span>
                    <Badge
                      variant="outline"
                      className="h-5 min-w-5 justify-center rounded-md px-1.5 font-mono text-[10px]"
                    >
                      {sourceTag(c.source)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="mt-1 flex items-center gap-2 border-t pt-3 text-muted-foreground opacity-70">
            <InfoIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="text-[12.5px] leading-snug">
              Estado / Puntaje — siempre incluida, al final
            </span>
          </div>
        </div>
      </div>

      {maxColumns != null && outCols.length >= maxColumns ? (
        <Alert>
          <AlertDescription>
            Modo demo: hasta {maxColumns} columnas en el reporte. Para agregar
            más necesitás{" "}
            <button
              onClick={onSubscribe}
              className="text-primary hover:underline font-medium"
            >
              Suscribirse
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      {showGroupBy ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted-foreground">Agrupar por</span>
          <Select
            items={groupItems}
            value={groupBy}
            onValueChange={(v) => {
              if (typeof v === "string") onGroupByChange(v)
            }}
          >
            <SelectTrigger size="sm" className="min-w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {groupItems.map((item) => (
                  <SelectItem key={item.value || "none"} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {running ? (
        <Progress value={Math.round(progress * 100)}>
          <ProgressLabel>
            {leftRows.toLocaleString("es")} × {rightRows.toLocaleString("es")}{" "}
            filas · la interfaz sigue respondiendo
          </ProgressLabel>
          <ProgressValue />
        </Progress>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {onBack ? (
          <Button variant="outline" onClick={onBack}>
            ← Atrás
          </Button>
        ) : (
          <span />
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {running ? (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          ) : null}
          <Button onClick={onRun} disabled={!keyCount || running}>
            {running ? "Cruzando…" : "Ejecutar cruce →"}
          </Button>
        </div>
      </div>
    </section>
  )
}
