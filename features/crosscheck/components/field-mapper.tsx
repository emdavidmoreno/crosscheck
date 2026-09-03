"use client"

import type { ReactNode } from "react"
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  KeyRoundIcon,
  ListIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SectionHeader } from "@/components/section-header"
import { NORMALIZERS } from "@/constants/normalizers"
import { cn } from "@/lib/utils"
import type {
  Combinator,
  MatchField,
  MatchMode,
  NormalizerKey,
  SheetTable,
} from "@/types/crosscheck"

const MODE_ITEMS = [
  { value: "exact", label: "Exacto" },
  { value: "loose", label: "Flexible" },
  { value: "fuzzy", label: "Difuso" },
] as const

const NORMALIZER_ITEMS = Object.entries(NORMALIZERS).map(([value, v]) => ({
  value,
  label: v.label,
}))

export function FieldMapper({
  left,
  right,
  fields,
  combinator,
  onCombinatorChange,
  onSetAllModes,
  onResuggest,
  onSuggest,
  onPatch,
  onMove,
  onDrop,
  onAdd,
  maxFields,
  setControls,
  onSubscribe,
}: {
  left: SheetTable
  right: SheetTable
  fields: MatchField[]
  combinator: Combinator
  onCombinatorChange: (c: Combinator) => void
  onSetAllModes: (mode: MatchMode) => void
  onResuggest?: () => void
  onSuggest?: () => void
  onPatch: (id: string, patch: Partial<MatchField>) => void
  onMove: (index: number, delta: number) => void
  onDrop: (id: string) => void
  onAdd: () => void
  /** When set, UI hints the demo/paid field cap (enforcement lives in onAdd). */
  maxFields?: number
  /** Mis sets / Importar / Exportar — lives with field construction. */
  setControls?: ReactNode
  onSubscribe?: () => void
}) {
  const suggest = onSuggest ?? onResuggest
  const keyCount = fields.filter((f) => f.isKey && f.left && f.right).length
  const scoredCount = fields.filter((f) => f.left && f.right).length
  const leftItems = left.headers.map((h) => ({ label: h, value: h }))
  const rightItems = right.headers.map((h) => ({ label: h, value: h }))
  const uniformMode = MODE_ITEMS.find(
    (m) => fields.length > 0 && fields.every((f) => f.mode === m.value)
  )?.value
  const isEmpty = fields.length === 0

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        eyebrow="Campos"
        title="Constructor de campos"
        description='Cada fila define un par de columnas a comparar. Marcá "clave" en el o los campos que definen el emparejamiento.'
        actions={setControls}
      />

      {isEmpty ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListIcon />
            </EmptyMedia>
            <EmptyTitle>Todavía no definiste campos a comparar</EmptyTitle>
            <EmptyDescription>
              Elegí qué columnas de cada archivo representan lo mismo, o dejá
              que Crosscheck sugiera pares por nombre similar.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {suggest ? (
                <Button variant="outline" onClick={suggest}>
                  Sugerir automáticamente
                </Button>
              ) : null}
              <Button onClick={onAdd}>
                <PlusIcon data-icon="inline-start" />
                Agregar campo
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">Rigor</span>
            <ToggleGroup
              value={uniformMode ? [uniformMode] : []}
              onValueChange={(v) => {
                const mode = v[0] as MatchMode | undefined
                if (mode) onSetAllModes(mode)
              }}
              variant="outline"
              size="sm"
              spacing={0}
            >
              {MODE_ITEMS.map((m) => (
                <ToggleGroupItem key={m.value} value={m.value}>
                  {m.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <span className="text-xs text-muted-foreground">Claves con</span>
            <ToggleGroup
              value={[combinator]}
              onValueChange={(v) => {
                const c = v[0] as Combinator | undefined
                if (c) onCombinatorChange(c)
              }}
              variant="outline"
              size="sm"
              spacing={0}
            >
              <ToggleGroupItem value="AND">AND</ToggleGroupItem>
              <ToggleGroupItem value="OR">OR</ToggleGroupItem>
            </ToggleGroup>
            {suggest ? (
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                onClick={suggest}
              >
                Sugerir automáticamente
              </Button>
            ) : null}
          </div>

          <div className="max-h-[520px] overflow-y-auto rounded-xl border">
            {fields.map((f, i) => (
              <div
                key={f.id}
                className={cn(
                  "flex flex-col gap-2 border-b px-4 py-3 last:border-b-0",
                  f.isKey && "bg-muted/30"
                )}
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <Field orientation="horizontal" className="w-auto gap-1.5">
                    <Checkbox
                      checked={!!f.isKey}
                      onCheckedChange={(checked) =>
                        onPatch(f.id, { isKey: checked === true })
                      }
                      id={`key-${f.id}`}
                      aria-label="Campo clave"
                    />
                    <FieldLabel
                      htmlFor={`key-${f.id}`}
                      className="cursor-pointer"
                      title="Campo clave"
                    >
                      <KeyRoundIcon
                        className={cn(
                          "size-3.5",
                          f.isKey ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span className="sr-only">clave</span>
                    </FieldLabel>
                  </Field>

                  <Select
                    items={leftItems}
                    value={f.left}
                    onValueChange={(v) => {
                      if (typeof v === "string") onPatch(f.id, { left: v })
                    }}
                  >
                    <SelectTrigger size="sm" className="min-w-36 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {leftItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" />

                  <Select
                    items={rightItems}
                    value={f.right}
                    onValueChange={(v) => {
                      if (typeof v === "string") onPatch(f.id, { right: v })
                    }}
                  >
                    <SelectTrigger size="sm" className="min-w-36 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {rightItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <div className="ml-auto flex gap-1">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Subir"
                      onClick={() => onMove(i, -1)}
                    >
                      <ChevronUpIcon />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Bajar"
                      onClick={() => onMove(i, 1)}
                    >
                      <ChevronDownIcon />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Eliminar campo"
                      onClick={() => onDrop(f.id)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>

                <FieldGroup className="flex-row flex-wrap items-center gap-3.5 pl-6">
                  <Field orientation="horizontal" className="w-auto gap-1.5">
                    <FieldLabel className="text-xs text-muted-foreground">
                      Normalizar
                    </FieldLabel>
                    <Select
                      items={NORMALIZER_ITEMS}
                      value={f.normalizer}
                      onValueChange={(v) => {
                        if (typeof v === "string")
                          onPatch(f.id, { normalizer: v as NormalizerKey })
                      }}
                    >
                      <SelectTrigger size="sm" className="w-auto min-w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {NORMALIZER_ITEMS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <ToggleGroup
                    value={[f.mode]}
                    onValueChange={(v) => {
                      const mode = v[0] as MatchMode | undefined
                      if (mode) onPatch(f.id, { mode })
                    }}
                    variant="outline"
                    size="sm"
                    spacing={0}
                  >
                    {MODE_ITEMS.map((m) => (
                      <ToggleGroupItem key={m.value} value={m.value}>
                        {m.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>

                  {f.mode === "fuzzy" ? (
                    <Field orientation="horizontal" className="w-auto gap-1.5">
                      <FieldLabel className="text-xs text-muted-foreground">
                        Umbral
                      </FieldLabel>
                      <Input
                        type="number"
                        step={1}
                        min={50}
                        max={100}
                        className="w-16 font-mono text-right"
                        value={Math.round((f.threshold || 0.85) * 100)}
                        title="Umbral difuso"
                        onChange={(e) =>
                          onPatch(f.id, {
                            threshold: Math.min(
                              1,
                              Math.max(0.5, +e.target.value / 100)
                            ),
                          })
                        }
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </Field>
                  ) : null}

                  {(f.normalizer === "date" || f.normalizer === "numeric") &&
                  f.mode !== "exact" ? (
                    <Field orientation="horizontal" className="w-auto gap-1.5">
                      <FieldLabel className="text-xs text-muted-foreground">
                        {f.normalizer === "date" ? "Tolerancia (días)" : "Tolerancia"}
                      </FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        step={f.normalizer === "numeric" ? 0.01 : 1}
                        className="w-16"
                        value={f.tolerance}
                        title={
                          f.normalizer === "date"
                            ? "Tolerancia en días"
                            : "Tolerancia"
                        }
                        onChange={(e) =>
                          onPatch(f.id, { tolerance: +e.target.value })
                        }
                      />
                    </Field>
                  ) : null}
                </FieldGroup>
              </div>
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={onAdd}>
            <PlusIcon data-icon="inline-start" />
            Agregar campo
            {maxFields != null ? ` (${fields.length}/${maxFields})` : ""}
          </Button>
        </>
      )}

      {!keyCount && fields.length > 0 ? (
        <Alert>
          <AlertDescription>
            Marcá al menos un campo como clave. Sin clave no hay con qué
            emparejar filas.
          </AlertDescription>
        </Alert>
      ) : null}
      {scoredCount === 1 ? (
        <Alert>
          <AlertDescription>
            Con un solo campo el puntaje solo puede ser 0% o 100%. Agregá
            campos —aunque no sean clave— para que el degradado tenga
            escalones.
          </AlertDescription>
        </Alert>
      ) : null}
      {maxFields != null && fields.length >= maxFields ? (
        <Alert>
          <AlertDescription>
            Modo demo: hasta {maxFields} campos. Para agregar más necesitás{" "}
            <button
              onClick={onSubscribe}
              className="text-primary hover:underline font-medium"
            >
              Suscribirse
            </button>
          </AlertDescription>
        </Alert>
      ) : null}
    </section>
  )
}
