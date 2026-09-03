"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { download } from "@/lib/download"

export function RulesDialog({
  mode,
  open,
  onOpenChange,
  json,
  importText,
  onImportTextChange,
  onApplyImport,
}: {
  mode: "export" | "import" | null
  open: boolean
  onOpenChange: (open: boolean) => void
  json: string
  importText: string
  onImportTextChange: (v: string) => void
  onApplyImport: () => void
}) {
  const isExport = mode === "export"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 p-0" showCloseButton={false}>
        <DialogHeader className="flex-row items-center gap-3 border-b p-4">
          <div className="flex flex-col gap-1">
            <DialogTitle>
              {isExport ? "Set de reglas" : "Importar set de reglas"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isExport
                ? "Exportá la configuración actual como JSON"
                : "Importá un JSON de reglas compartido"}
            </DialogDescription>
          </div>
          <div className="ml-auto flex gap-2">
            {isExport ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard?.writeText(json)
                    toast.success("JSON copiado")
                  }}
                >
                  Copiar
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    download(json, "reglas.json", "application/json")
                  }
                >
                  Descargar
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={onApplyImport}
                disabled={!importText.trim()}
              >
                Aplicar
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogHeader>
        <Textarea
          className="min-h-80 resize-none rounded-none border-0 font-mono text-xs focus-visible:ring-0"
          readOnly={isExport}
          value={isExport ? json : importText}
          placeholder="Pegá acá el JSON que te compartieron…"
          onChange={(e) => onImportTextChange(e.target.value)}
        />
      </DialogContent>
    </Dialog>
  )
}
