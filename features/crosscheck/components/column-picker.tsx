"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { OutputColumn, SheetTable, Side } from "@/types/crosscheck"

export type AvailableColumn = {
  source: Side
  column: string
  tag: "A" | "B"
}

type SideFilter = "all" | Side

const SIDE_FILTER_ITEMS: { label: string; value: SideFilter }[] = [
  { label: "All fields", value: "all" },
  { label: "Left file fields", value: "left" },
  { label: "Right file fields", value: "right" },
]

export function buildAvailableColumns(
  left: SheetTable,
  right: SheetTable
): AvailableColumn[] {
  return [
    ...left.headers.map((column) => ({
      source: "left" as const,
      column,
      tag: "A" as const,
    })),
    ...right.headers.map((column) => ({
      source: "right" as const,
      column,
      tag: "B" as const,
    })),
  ]
}

export function isColumnSelected(
  outCols: OutputColumn[],
  source: Side,
  column: string
) {
  return outCols.some((c) => c.source === source && c.column === column)
}

export function ColumnPicker({
  columns,
  outCols,
  onToggle,
}: {
  columns: AvailableColumn[]
  outCols: OutputColumn[]
  onToggle: (col: AvailableColumn, selected: boolean) => void
}) {
  const [sideFilter, setSideFilter] = useState<SideFilter>("all")

  const visibleColumns =
    sideFilter === "all"
      ? columns
      : columns.filter((col) => col.source === sideFilter)

  return (
    <div className="flex min-h-0 flex-col gap-2 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-mono text-[10px] tracking-[0.1em] text-primary uppercase">
          Disponibles
        </div>
        <Select
          items={SIDE_FILTER_ITEMS}
          value={sideFilter}
          onValueChange={(v) => {
            if (v === "all" || v === "left" || v === "right") setSideFilter(v)
          }}
        >
          <SelectTrigger size="sm" className="min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              {SIDE_FILTER_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="h-[min(460px,55vh)]">
        <div className="flex flex-col pr-3">
          {visibleColumns.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No hay campos para este filtro
            </p>
          ) : (
            visibleColumns.map((col) => {
              const id = `out-col-${col.source}-${col.column}`
              const selected = isColumnSelected(outCols, col.source, col.column)
              return (
                <Label
                  key={`${col.source}-${col.column}`}
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-2.5 border-b border-border/70 py-2 pr-1 font-normal last:border-b-0"
                >
                  <Checkbox
                    id={id}
                    checked={selected}
                    onCheckedChange={(checked) =>
                      onToggle(col, checked === true)
                    }
                  />
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 justify-center rounded-md px-1.5 font-mono text-[10px]"
                  >
                    {col.tag}
                  </Badge>
                  <span className="font-mono text-[13px] leading-snug">
                    {col.column}
                  </span>
                </Label>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
