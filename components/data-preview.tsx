"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { formatCell } from "@/lib/score"
import type { SheetTable, Side } from "@/types/crosscheck"

function defaultLabel(side?: Side) {
  if (side === "right") return "Archivo B"
  return "Archivo A"
}

export function DataPreview({
  table,
  side,
  label,
  layout = "side-by-side",
  className,
  onSheetChange,
  onHeaderRowChange,
}: {
  table: SheetTable
  side?: Side
  /** Overrides the default "Archivo A/B" title derived from `side`. */
  label?: string
  /**
   * Hint for parent grid placement. Component always renders a single-file card;
   * `side-by-side` optimizes for a 2-col parent grid (default).
   */
  layout?: "stack" | "side-by-side"
  className?: string
  onSheetChange: (sheet: string) => void
  onHeaderRowChange: (row: number) => void
}) {
  const title = label ?? defaultLabel(side)
  const sheetItems = table.sheetNames.map((s) => ({ label: s, value: s }))
  const meta = `${table.name} · ${table.rows.length.toLocaleString("es-AR")} filas · ${table.headers.length} columnas`

  return (
    <Card
      size="sm"
      className={cn(
        "min-w-0",
        layout === "side-by-side" && "h-full",
        className
      )}
    >
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-xs">{meta}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {table.sheetNames.length > 1 ? (
            <Select
              items={sheetItems}
              value={table.sheet}
              onValueChange={(v) => {
                if (typeof v === "string") onSheetChange(v)
              }}
            >
              <SelectTrigger size="sm" className="min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sheetItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : null}
          <Field orientation="horizontal" className="w-auto gap-2">
            <FieldLabel className="text-xs text-muted-foreground whitespace-nowrap">
              fila de encabezado
            </FieldLabel>
            <Input
              type="number"
              min={1}
              className="w-16"
              value={table.headerRow}
              onChange={(e) =>
                onHeaderRowChange(Math.max(1, +e.target.value || 1))
              }
            />
          </Field>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[290px] rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                {table.headers.map((h) => (
                  <TableHead key={h} className="sticky top-0 bg-muted/80">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.slice(0, 10).map((r, i) => (
                <TableRow key={i}>
                  {table.headers.map((h) => (
                    <TableCell
                      key={h}
                      className="max-w-60 truncate font-mono text-xs"
                    >
                      <span
                        className={
                          r[h] == null || r[h] === ""
                            ? "text-muted-foreground"
                            : undefined
                        }
                      >
                        {formatCell(r[h])}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
