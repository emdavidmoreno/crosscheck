"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CheckIcon, MoonIcon, SunIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type WizardStage =
  | "upload"
  | "preview"
  | "fields"
  | "columns"
  | "results"

const STEPS: { key: WizardStage; label: string; n: number }[] = [
  { key: "upload", label: "Cargar", n: 1 },
  { key: "preview", label: "Vista previa", n: 2 },
  { key: "fields", label: "Campos", n: 3 },
  { key: "columns", label: "Columnas", n: 4 },
  { key: "results", label: "Resultados", n: 5 },
]

function readInitialDark() {
  if (typeof document === "undefined") return false
  try {
    const stored = localStorage.getItem("crosscheck-theme")
    if (stored === "dark") return true
    if (stored === "light") return false
  } catch {
    /* ignore */
  }
  if (document.documentElement.classList.contains("dark")) return true
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function useThemeToggle() {
  const [isDark, setIsDark] = useState(readInitialDark)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
    try {
      localStorage.setItem("crosscheck-theme", isDark ? "dark" : "light")
    } catch {
      /* ignore */
    }
  }, [isDark])

  return {
    isDark,
    toggleTheme: () => setIsDark((v) => !v),
  }
}

export function WizardNav({
  stage,
  onStageChange,
  actions,
}: {
  stage: WizardStage
  onStageChange: (stage: WizardStage) => void
  actions?: ReactNode
}) {
  const { isDark, toggleTheme } = useThemeToggle()
  const curIdx = STEPS.findIndex((s) => s.key === stage)

  return (
    <header className="sticky top-0 z-20 border-b bg-muted px-6 py-3.5">
      <div className="mx-auto flex max-w-[1360px] items-center gap-4">
        <span className="shrink-0 font-heading text-base font-semibold tracking-[0.02em]">
          CROSSCHECK
        </span>

        <nav
          className="flex min-w-0 flex-1 items-center"
          aria-label="Pasos del asistente"
        >
          {STEPS.map((step, idx) => {
            const done = idx < curIdx
            const active = idx === curIdx
            const hasConnector = idx < STEPS.length - 1

            return (
              <div
                key={step.key}
                className={cn(
                  "flex items-center",
                  hasConnector ? "flex-1" : "shrink-0"
                )}
              >
                <button
                  type="button"
                  onClick={() => onStageChange(step.key)}
                  className="flex shrink-0 items-center gap-2.5 py-1"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      done && "bg-primary text-primary-foreground",
                      active &&
                        !done &&
                        "border-[1.5px] border-primary text-primary",
                      !done &&
                        !active &&
                        "border-[1.5px] border-border text-muted-foreground"
                    )}
                  >
                    {done ? (
                      <CheckIcon className="size-3.5" strokeWidth={2.2} />
                    ) : (
                      step.n
                    )}
                  </span>
                  <span
                    className={cn(
                      "hidden text-[13px] sm:inline",
                      active || done
                        ? "font-semibold text-foreground"
                        : "font-normal text-muted-foreground",
                      active && "font-semibold"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {hasConnector ? (
                  <div
                    className={cn(
                      "mx-2 h-[1.5px] flex-1",
                      idx < curIdx ? "bg-primary" : "bg-border"
                    )}
                  />
                ) : null}
              </div>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <Button
            size="icon-sm"
            variant="outline"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
          >
            {isDark ? (
              <SunIcon className="size-[17px]" strokeWidth={1.5} />
            ) : (
              <MoonIcon className="size-[17px]" strokeWidth={1.5} />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
