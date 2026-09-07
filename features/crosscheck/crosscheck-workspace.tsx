"use client"

import { SignUpButton, UserButton } from "@clerk/nextjs"
import { useMemo, useRef, useState } from "react"
import { FileSpreadsheetIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { DataPreview } from "@/components/data-preview"
import { FileDropzone } from "@/components/file-dropzone"
import { SectionHeader } from "@/components/section-header"
import { bandOf } from "@/constants/bands"
import { DEMO_LIMITS } from "@/constants/demo"
import { useMatchWorker } from "@/hooks/use-match-worker"
import { autoNormalizer } from "@/lib/normalize"
import { S } from "@/lib/normalize"
import { readWorkbookFile, reparseSheet, suggestFields } from "@/lib/parse-table"
import type {
  Combinator,
  FilterKey,
  FlatReportRow,
  LibrarySet,
  MatchField,
  MatchMode,
  OutputColumn,
  RuleSetPayload,
  SheetTable,
  Side,
  WorkspaceUser,
} from "@/types/crosscheck"
import { FieldMapper } from "@/features/crosscheck/components/field-mapper"
import { LibraryDialog } from "@/features/crosscheck/components/library-dialog"
import { OutputColumns } from "@/features/crosscheck/components/output-columns"
import { PremiumFeatureDialog } from "@/features/crosscheck/components/premium-feature-dialog"
import { ResultsPanel } from "@/features/crosscheck/components/results-panel"
import { RulesDialog } from "@/features/crosscheck/components/rules-dialog"
import {
  WizardNav,
  type WizardStage,
} from "@/features/crosscheck/components/wizard-nav"

const DEFAULT_FILTERS: Record<FilterKey, boolean> = {
  b100: true,
  b80: true,
  b50: true,
  b0: true,
  ambiguous: true,
  left_only: true,
  right_only: true,
}

function StagePlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Empty className="border border-dashed bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileSpreadsheetIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function CrosscheckWorkspace({
  user,
  demo,
  onSubscribe,
  library,
  setLibrary,
}: {
  user: WorkspaceUser
  demo: boolean
  onSubscribe: () => void
  library: LibrarySet[]
  setLibrary: (l: LibrarySet[]) => void
}) {
  const [stage, setStage] = useState<WizardStage>("upload")
  const [setName, setSetName] = useState("")
  const [left, setLeft] = useState<SheetTable | null>(null)
  const [right, setRight] = useState<SheetTable | null>(null)
  const [fields, setFields] = useState<MatchField[]>([])
  const [combinator, setCombinator] = useState<Combinator>("OR")
  const [outCols, setOutCols] = useState<OutputColumn[]>([])
  const [groupBy, setGroupBy] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [modal, setModal] = useState<"library" | "import" | "export" | null>(
    null
  )
  const [importText, setImportText] = useState("")
  const [localErr, setLocalErr] = useState("")
  const [premiumOpen, setPremiumOpen] = useState(false)

  const showPremium = () => setPremiumOpen(true)

  const {
    running,
    progress,
    results,
    error: workerErr,
    setError: setWorkerErr,
    run,
    cancel,
    clearResults,
  } = useMatchWorker()

  const ready = Boolean(left && right)

  const runMatch = () => {
    if (!left || !right) return
    setStage("results")
    run({
      left: left.rows,
      right: right.rows,
      fields,
      combinator,
      maxResultRows: demo ? DEMO_LIMITS.maxResultRows : undefined,
    })
  }

  const tablesRef = useRef<{
    left: SheetTable | null
    right: SheetTable | null
  }>({ left: null, right: null })

  const seed = (l: SheetTable, r: SheetTable) => {
    const s = suggestFields(l, r)
    const capped = demo ? s.slice(0, DEMO_LIMITS.maxMatchFields) : s
    setFields(
      capped.map((x, i) => ({
        id: "f" + i + Date.now(),
        left: x.left,
        right: x.right,
        normalizer: x.normalizer,
        mode:
          x.normalizer === "date" || x.normalizer === "numeric"
            ? "loose"
            : "fuzzy",
        threshold: 0.85,
        tolerance: x.normalizer === "date" ? 3 : 0,
        isKey: x.identifier && i < 2,
      }))
    )
    clearResults()
  }

  const seedDefaultsIfNeeded = (l: SheetTable, r: SheetTable) => {
    setFields((prev) => {
      if (prev.length) return prev
      const s = suggestFields(l, r)
      const capped = demo ? s.slice(0, DEMO_LIMITS.maxMatchFields) : s
      return capped.map((x, i) => ({
        id: "f" + i + Date.now(),
        left: x.left,
        right: x.right,
        normalizer: x.normalizer,
        mode:
          x.normalizer === "date" || x.normalizer === "numeric"
            ? "loose"
            : "fuzzy",
        threshold: 0.85,
        tolerance: x.normalizer === "date" ? 3 : 0,
        isKey: x.identifier && i < 2,
      }))
    })
    setOutCols((prev) => {
      if (prev.length) return prev
      const seeded: OutputColumn[] = [
        ...l.headers.slice(0, 2).map((c) => ({
          source: "left" as const,
          column: c,
        })),
        ...r.headers.slice(0, 2).map((c) => ({
          source: "right" as const,
          column: c,
        })),
      ]
      return demo ? seeded.slice(0, DEMO_LIMITS.maxOutputColumns) : seeded
    })
  }

  const readFile = (file: File, side: Side) => {
    setLocalErr("")
    setWorkerErr("")
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result
        if (!(buffer instanceof ArrayBuffer)) throw new Error("empty")
        const table = readWorkbookFile(file, buffer)
        if (side === "left") {
          setLeft(table)
          tablesRef.current.left = table
        } else {
          setRight(table)
          tablesRef.current.right = table
        }
        const next = tablesRef.current
        if (next.left && next.right) seedDefaultsIfNeeded(next.left, next.right)
        clearResults()
      } catch {
        setLocalErr(
          `No se pudo leer "${file.name}". Verificá que sea un .xlsx o .csv válido.`
        )
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const reparse = (side: Side, patch: Partial<Pick<SheetTable, "sheet" | "headerRow">>) => {
    const cur = side === "left" ? left : right
    if (!cur) return
    const next = reparseSheet(cur, patch)
    if (side === "left") {
      setLeft(next)
      tablesRef.current.left = next
    } else {
      setRight(next)
      tablesRef.current.right = next
    }
    clearResults()
  }

  const patchField = (id: string, patch: Partial<MatchField>) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f
        const n = { ...f, ...patch }
        if ((patch.left || patch.right) && left && right) {
          n.normalizer = autoNormalizer(left, right, n.left, n.right)
        }
        return n
      })
    )
    clearResults()
  }

  const dropField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
    clearResults()
  }

  const moveField = (i: number, d: number) => {
    setFields((prev) => {
      const a = [...prev]
      const j = i + d
      if (j < 0 || j >= a.length) return prev
      ;[a[i], a[j]] = [a[j], a[i]]
      return a
    })
    clearResults()
  }

  const addField = () => {
    if (!left || !right) return
    if (demo && fields.length >= DEMO_LIMITS.maxMatchFields) {
      showPremium()
      return
    }
    const lc = left.headers[0]
    const rc = right.headers[0]
    setFields((prev) => [
      ...prev,
      {
        id: "f" + Date.now(),
        left: lc,
        right: rc,
        normalizer: autoNormalizer(left, right, lc, rc),
        mode: "loose",
        threshold: 0.85,
        tolerance: 0,
        isKey: false,
      },
    ])
    clearResults()
  }

  const handleOutColsChange = (cols: OutputColumn[]) => {
    if (demo && cols.length > DEMO_LIMITS.maxOutputColumns) {
      showPremium()
      return
    }
    setOutCols(cols)
  }

  const openPremiumOr = (action: () => void) => {
    if (demo) {
      showPremium()
      return
    }
    action()
  }

  const setAllModes = (mode: MatchMode) => {
    setFields((prev) => prev.map((f) => ({ ...f, mode })))
    clearResults()
  }

  const keyCount = fields.filter((f) => f.isKey && f.left && f.right).length

  const json = useMemo(
    () =>
      JSON.stringify(
        {
          version: 2,
          name:
            left && right
              ? `${left.name} ↔ ${right.name}`
              : "Set de reglas",
          files: {
            left: {
              label: left?.name || "",
              sheet: left?.sheet || "",
              headerRow: left?.headerRow || 1,
            },
            right: {
              label: right?.name || "",
              sheet: right?.sheet || "",
              headerRow: right?.headerRow || 1,
            },
          },
          combinator,
          fields: fields.map(
            ({ left, right, normalizer, mode, threshold, tolerance, isKey }) => ({
              left,
              right,
              normalizer,
              mode,
              threshold,
              tolerance,
              isKey,
            })
          ),
          output: { columns: outCols, groupBy },
        },
        null,
        2
      ),
    [left, right, combinator, fields, outCols, groupBy]
  )

  const applyRuleSet = (j: RuleSetPayload) => {
    setCombinator(j.combinator || "OR")
    const nextFields = (j.fields || []).map((f, i) => {
      const {
        threshold = 0.85,
        tolerance = 0,
        mode = "loose",
        isKey = false,
        ...rest
      } = f
      return {
        ...rest,
        threshold,
        tolerance,
        mode,
        isKey,
        id: "i" + i + Date.now(),
      }
    })
    setFields(
      demo ? nextFields.slice(0, DEMO_LIMITS.maxMatchFields) : nextFields
    )
    const nextOut = j.output?.columns || []
    setOutCols(
      demo ? nextOut.slice(0, DEMO_LIMITS.maxOutputColumns) : nextOut
    )
    const rawGroupBy = j.output?.groupBy
    setGroupBy(
      Array.isArray(rawGroupBy)
        ? rawGroupBy.filter((x): x is string => typeof x === "string")
        : typeof rawGroupBy === "string"
          ? [rawGroupBy]
          : []
    )
    clearResults()
    setModal(null)
    setImportText("")
  }

  const applyImport = () => {
    try {
      applyRuleSet(JSON.parse(importText) as RuleSetPayload)
    } catch {
      setLocalErr("Ese JSON no se pudo leer.")
    }
  }

  const saveSet = () => {
    const name = setName.trim()
    if (!name) return
    setLibrary([
      {
        id: "set" + Date.now(),
        name,
        owner: user.email,
        savedAt: new Date().toISOString().slice(0, 10),
        payload: JSON.parse(json) as RuleSetPayload,
      },
      ...library,
    ])
    setSetName("")
  }

  const shareSet = (s: LibrarySet) => {
    const slug = s.id.slice(-6)
    const link = `https://crosscheck.app/s/${slug}`
    void navigator.clipboard?.writeText(link)
    setLibrary(
      library.map((x) =>
        x.id === s.id ? { ...x, link: `crosscheck.app/s/${slug}` } : x
      )
    )
  }

  const flat = useMemo(() => {
    if (!results || !left || !right) return [] as FlatReportRow[]
    const cell = (
      src: Side,
      col: string,
      li: number | null,
      ri: number | null
    ) =>
      src === "left"
        ? li == null
          ? null
          : left.rows[li][col]
        : ri == null
          ? null
          : right.rows[ri][col]

    const mk = (
      e: {
        li?: number
        ri?: number
        detail?: FlatReportRow["detail"]
        candidates?: FlatReportRow["cands"]
      },
      kind: FilterKey,
      score: number | null
    ): FlatReportRow => {
      const row: FlatReportRow = {
        kind,
        score,
        values: {},
        detail: e.detail,
        cands: e.candidates,
      }
      outCols.forEach((c, i) => {
        row.values[i] = cell(c.source, c.column, e.li ?? null, e.ri ?? null)
      })
      return row
    }

    return [
      ...results.pairs.map((e) => mk(e, bandOf(e.score), e.score)),
      ...results.ambiguous.map((e) => mk(e, "ambiguous", null)),
      ...results.left_only.map((e) => mk(e, "left_only", null)),
      ...results.right_only.map((e) => mk(e, "right_only", null)),
    ]
  }, [results, outCols, left, right])

  const visible = useMemo(() => {
    const q = search.trim().toUpperCase()
    return flat.filter(
      (r) =>
        filters[r.kind] &&
        (!q ||
          Object.values(r.values).some((v) => S(v).toUpperCase().includes(q)))
    )
  }, [flat, filters, search])

  const grouped = useMemo(() => {
    if (!groupBy.length) return [{ key: null as string | null, rows: visible }]
    const indexed = groupBy
      .map((id) => ({
        i: outCols.findIndex((c) => `${c.source}|${c.column}` === id),
      }))
      .filter((x) => x.i >= 0)
    if (!indexed.length) return [{ key: null as string | null, rows: visible }]
    const m = new Map<string, { key: string; rows: FlatReportRow[] }>()
    for (const r of visible) {
      const parts = indexed.map(({ i }) => S(r.values[i]) || "(vacío)")
      const id = JSON.stringify(parts)
      const label = indexed
        .map(({ i }, idx) => `${outCols[i]?.column}: ${parts[idx]}`)
        .join(" · ")
      const bucket = m.get(id)
      if (bucket) bucket.rows.push(r)
      else m.set(id, { key: label, rows: [r] })
    }
    return [...m.values()]
      .sort((a, b) => b.rows.length - a.rows.length)
      .map((x) => ({ key: x.key, rows: x.rows }))
  }, [visible, groupBy, outCols])

  const bandCounts = useMemo(() => {
    const c = { b100: 0, b80: 0, b50: 0, b0: 0 }
    results?.pairs.forEach((p) => {
      c[bandOf(p.score)]++
    })
    return c
  }, [results])

  const setControls = (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => openPremiumOr(() => setModal("library"))}
      >
        Mis sets{!demo && library.length ? ` (${library.length})` : ""}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => openPremiumOr(() => setModal("import"))}
      >
        Importar
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => openPremiumOr(() => setModal("export"))}
        disabled={!demo && !fields.length}
      >
        Exportar
      </Button>
    </>
  )

  const headerActions = demo ? (
    <div className="flex items-center gap-2">
      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        Demo
      </span>
      <SignUpButton>
        <Button size="sm">Crear cuenta</Button>
      </SignUpButton>
    </div>
  ) : (
    <UserButton />
  )

  return (
    <div className="min-h-svh bg-background text-foreground">
      <WizardNav
        stage={stage}
        onStageChange={setStage}
        actions={headerActions}
      />

      <div className="mx-auto flex max-w-[1360px] flex-col gap-8 px-7 py-6 pb-20">
        {localErr || (stage !== "results" && workerErr) ? (
          <Alert variant="destructive">
            <AlertDescription>{localErr || workerErr}</AlertDescription>
          </Alert>
        ) : null}

        {stage === "upload" ? (
          <section className="flex flex-col gap-4">
            <SectionHeader
              eyebrow="Archivos"
              title="Cargar archivos"
              description="Los archivos nunca se suben a un servidor: todo el cruce corre en este navegador."
            />
            <div className="grid gap-5 md:grid-cols-2">
              <FileDropzone
                side="left"
                label="Archivo A"
                fileName={left?.name}
                sheet={left?.sheet}
                rows={left?.rows.length}
                cols={left?.headers.length}
                onFile={(f) => readFile(f, "left")}
                onClear={() => {
                  setLeft(null)
                  tablesRef.current.left = null
                  clearResults()
                }}
              />
              <FileDropzone
                side="right"
                label="Archivo B"
                fileName={right?.name}
                sheet={right?.sheet}
                rows={right?.rows.length}
                cols={right?.headers.length}
                onFile={(f) => readFile(f, "right")}
                onClear={() => {
                  setRight(null)
                  tablesRef.current.right = null
                  clearResults()
                }}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setStage("preview")}
                disabled={!ready}
              >
                Continuar a vista previa →
              </Button>
            </div>
          </section>
        ) : null}

        {stage === "preview" ? (
          <section className="flex flex-col gap-4">
            <SectionHeader
              eyebrow="Vista previa"
              title="Primeras 10 filas de cada archivo"
              description="Revisá hoja y fila de encabezado antes de mapear campos."
            />
            {ready && left && right ? (
              <div className="grid gap-5 md:grid-cols-2">
                <DataPreview
                  table={left}
                  side="left"
                  label="Archivo A"
                  layout="side-by-side"
                  onSheetChange={(sheet) => reparse("left", { sheet })}
                  onHeaderRowChange={(headerRow) =>
                    reparse("left", { headerRow })
                  }
                />
                <DataPreview
                  table={right}
                  side="right"
                  label="Archivo B"
                  layout="side-by-side"
                  onSheetChange={(sheet) => reparse("right", { sheet })}
                  onHeaderRowChange={(headerRow) =>
                    reparse("right", { headerRow })
                  }
                />
              </div>
            ) : (
              <StagePlaceholder
                title="Sin archivos cargados"
                description="Cargá Archivo A y Archivo B en el paso Cargar para ver la vista previa."
              />
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={() => setStage("upload")}>
                ← Atrás
              </Button>
              <Button
                onClick={() => setStage("fields")}
                disabled={!ready}
              >
                Continuar a campos →
              </Button>
            </div>
          </section>
        ) : null}

        {stage === "fields" ? (
          ready && left && right ? (
            <div className="flex flex-col gap-4">
              <FieldMapper
                left={left}
                right={right}
                fields={fields}
                combinator={combinator}
                onCombinatorChange={(c) => {
                  setCombinator(c)
                  clearResults()
                }}
                onSetAllModes={setAllModes}
                onResuggest={() => seed(left, right)}
                onPatch={patchField}
                onMove={moveField}
                onDrop={dropField}
                onAdd={addField}
                maxFields={demo ? DEMO_LIMITS.maxMatchFields : undefined}
                setControls={setControls}
                onSubscribe={onSubscribe}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="outline" onClick={() => setStage("preview")}>
                  ← Atrás
                </Button>
                <Button
                  onClick={() => setStage("columns")}
                  disabled={!fields.length}
                >
                  Continuar a columnas →
                </Button>
              </div>
            </div>
          ) : (
            <section className="flex flex-col gap-4">
              <SectionHeader
                eyebrow="Campos"
                title="Constructor de campos"
                description="Definí qué columnas se comparan y con qué rigor."
                actions={setControls}
              />
              <StagePlaceholder
                title="Faltan los archivos"
                description="Cargá ambas hojas antes de configurar el mapeo de campos."
              />
              <div className="flex justify-start">
                <Button variant="outline" onClick={() => setStage("preview")}>
                  ← Atrás
                </Button>
              </div>
            </section>
          )
        ) : null}

        {stage === "columns" ? (
          ready && left && right ? (
            <OutputColumns
              left={left}
              right={right}
              outCols={outCols}
              groupBy=""
              keyCount={keyCount}
              running={running}
              progress={progress}
              leftRows={left.rows.length}
              rightRows={right.rows.length}
              onOutColsChange={handleOutColsChange}
              onGroupByChange={() => {}}
              onRun={runMatch}
              onCancel={cancel}
              onBack={() => setStage("fields")}
              showGroupBy={false}
              maxColumns={demo ? DEMO_LIMITS.maxOutputColumns : undefined}
              onSubscribe={onSubscribe}
            />
          ) : (
            <section className="flex flex-col gap-4">
              <SectionHeader
                eyebrow="Columnas"
                title="Columnas de salida"
                description="Elegí qué columnas aparecen en el reporte final."
              />
              <StagePlaceholder
                title="Faltan los archivos"
                description="Cargá ambas hojas para armar las columnas de salida."
              />
              <div className="flex justify-start">
                <Button variant="outline" onClick={() => setStage("fields")}>
                  ← Atrás
                </Button>
              </div>
            </section>
          )
        ) : null}

        {stage === "results" ? (
          <ResultsPanel
            results={results}
            leftRowCount={left?.rows.length ?? 0}
            rightRowCount={right?.rows.length ?? 0}
            outCols={outCols}
            fields={fields}
            filters={filters}
            onToggleFilter={(key: FilterKey) =>
              setFilters((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            search={search}
            onSearchChange={setSearch}
            visible={visible}
            grouped={grouped}
            groupByColumns={groupBy}
            onGroupByColumnsChange={setGroupBy}
            bandCounts={bandCounts}
            running={running}
            progress={progress}
            error={workerErr || null}
            onRun={ready && fields.length ? runMatch : undefined}
            onCancel={cancel}
            onRetry={ready && fields.length ? runMatch : undefined}
            onBack={() => setStage("columns")}
            demoMode={demo}
            onExportBlocked={showPremium}
            onSubscribe={onSubscribe}
          />
        ) : null}
      </div>

      <PremiumFeatureDialog
        open={premiumOpen}
        onOpenChange={setPremiumOpen}
        onSubscribe={onSubscribe}
      />

      <LibraryDialog
        open={!demo && modal === "library"}
        onOpenChange={(open) => setModal(open ? "library" : null)}
        user={user}
        library={library}
        setName={setName}
        onSetNameChange={setSetName}
        canSave={Boolean(setName.trim() && fields.length)}
        onSave={saveSet}
        onLoad={applyRuleSet}
        onRemove={(id) => setLibrary(library.filter((x) => x.id !== id))}
        onShare={shareSet}
      />

      <RulesDialog
        mode={modal === "export" || modal === "import" ? modal : null}
        open={!demo && (modal === "export" || modal === "import")}
        onOpenChange={(open) => {
          if (!open) setModal(null)
        }}
        json={json}
        importText={importText}
        onImportTextChange={setImportText}
        onApplyImport={applyImport}
      />
    </div>
  )
}
