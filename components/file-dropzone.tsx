"use client"

import { useRef, useState } from "react"
import { FileSpreadsheetIcon, UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import type { Side } from "@/types/crosscheck"

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function defaultLabel(side?: Side) {
  if (side === "right") return "Archivo B"
  return "Archivo A"
}

function buildMeta({
  meta,
  sheet,
  rows,
  cols,
  fileSize,
}: {
  meta?: string
  sheet?: string
  rows?: number
  cols?: number
  fileSize?: number | string
}) {
  if (meta) return meta
  const parts: string[] = []
  if (sheet) parts.push(`Hoja "${sheet}"`)
  if (rows != null) parts.push(`${rows.toLocaleString("es-AR")} filas`)
  if (cols != null) parts.push(`${cols} columnas`)
  if (fileSize != null) {
    parts.push(
      typeof fileSize === "number" ? formatFileSize(fileSize) : fileSize
    )
  }
  return parts.length ? parts.join(" · ") : undefined
}

export function FileDropzone({
  side,
  label,
  fileName,
  meta,
  sheet,
  rows,
  cols,
  fileSize,
  emptyTitle,
  emptyDescription,
  onFile,
  onClear,
  className,
}: {
  side?: Side
  label?: string
  fileName?: string
  meta?: string
  sheet?: string
  rows?: number
  cols?: number
  fileSize?: number | string
  emptyTitle?: string
  emptyDescription?: string
  onFile: (file: File) => void
  onClear?: () => void
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const filled = Boolean(fileName)
  const title = label ?? defaultLabel(side)
  const displayMeta = buildMeta({ meta, sheet, rows, cols, fileSize })
  const emptyHeading =
    emptyTitle ??
    (side === "right"
      ? "Arrastrá el archivo B"
      : "Arrastrá el archivo A")
  const emptyHint =
    emptyDescription ?? "o hacé clic para elegirlo · .xlsx, .xls, .csv"

  const openPicker = () => inputRef.current?.click()

  return (
    <Card
      size="sm"
      className={cn(
        "min-w-0 transition-colors",
        dragging && "bg-muted/40 ring-foreground/20",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) onFile(f)
      }}
    >
      <CardHeader>
        <CardDescription className="font-mono text-[10px] tracking-[0.16em] uppercase">
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ""
          }}
        />
        {filled ? (
          <>
            <div className="flex items-start gap-3">
              <FileSpreadsheetIcon className="size-7 shrink-0 text-primary" />
              <div className="min-w-0 flex-1 flex flex-col gap-1">
                <div className="font-mono text-sm font-medium break-all">
                  {fileName}
                </div>
                {displayMeta ? (
                  <div className="text-xs text-muted-foreground">
                    {displayMeta}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  openPicker()
                }}
              >
                Reemplazar
              </Button>
              {onClear ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClear()
                  }}
                >
                  Quitar
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <Empty
            className={cn(
              "cursor-pointer border border-dashed p-8 transition-colors",
              dragging && "border-foreground/40 bg-muted/30"
            )}
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                openPicker()
              }
            }}
          >
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UploadIcon />
              </EmptyMedia>
              <EmptyTitle>{emptyHeading}</EmptyTitle>
              <EmptyDescription>{emptyHint}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
