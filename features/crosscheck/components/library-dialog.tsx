"use client"

import { XIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LibrarySet, RuleSetPayload, WorkspaceUser } from "@/types/crosscheck"

export function LibraryDialog({
  open,
  onOpenChange,
  user,
  library,
  setName,
  onSetNameChange,
  canSave,
  onSave,
  onLoad,
  onRemove,
  onShare,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: WorkspaceUser
  library: LibrarySet[]
  setName: string
  onSetNameChange: (v: string) => void
  canSave: boolean
  onSave: () => void
  onLoad: (payload: RuleSetPayload) => void
  onRemove: (id: string) => void
  onShare: (set: LibrarySet) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 p-0" showCloseButton={false}>
        <DialogHeader className="flex-row items-center gap-3 border-b p-4">
          <div className="flex flex-col gap-1">
            <DialogTitle>Mis sets de reglas</DialogTitle>
            <DialogDescription className="sr-only">
              Guardá y reutilizá configuraciones de cruce
            </DialogDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogHeader>
        <div className="flex gap-2 border-b p-4">
          <Input
            placeholder="Nombre del set actual…"
            value={setName}
            onChange={(e) => onSetNameChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSave()}
          />
          <Button onClick={onSave} disabled={!canSave}>
            Guardar
          </Button>
        </div>
        <ScrollArea className="max-h-[50vh]">
          {library.length === 0 ? (
            <Empty className="border-0 py-10">
              <EmptyHeader>
                <EmptyTitle>Todavía no guardaste ningún set</EmptyTitle>
                <EmptyDescription>
                  Armá tus campos y guardalos con un nombre para reusarlos.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col">
              {library.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <b className="text-sm font-semibold">{s.name}</b>
                    <div className="font-mono text-[10.5px] text-muted-foreground">
                      {s.payload.fields?.length || 0} campos · {s.savedAt}
                      {s.link ? ` · ${s.link}` : ""}
                    </div>
                  </div>
                  {s.owner !== user.email ? (
                    <Badge variant="outline" className="font-mono text-[9px]">
                      compartido
                    </Badge>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => onLoad(s.payload)}>
                    Cargar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onShare(s)
                      toast.success("Enlace copiado al portapapeles")
                    }}
                  >
                    Compartir
                  </Button>
                  {s.owner === user.email ? (
                    <Button
                      size="icon-xs"
                      variant="destructive"
                      aria-label="Eliminar"
                      onClick={() => onRemove(s.id)}
                    >
                      <XIcon />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
