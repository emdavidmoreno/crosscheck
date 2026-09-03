import type { ReactNode } from "react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow: string
  title: string
  description?: string
  /** Right-aligned controls on the title row (wraps on narrow screens). */
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          {eyebrow}
        </span>
        <Separator className="flex-1" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {description ? (
        <p className="max-w-[74ch] text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
  )
}
