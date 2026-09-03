"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DEMO_PREMIUM_COPY } from "@/constants/demo"

export function PremiumFeatureDialog({
  open,
  onOpenChange,
  onSubscribe,
  title = DEMO_PREMIUM_COPY.title,
  description = DEMO_PREMIUM_COPY.description,
  subscribeLabel = DEMO_PREMIUM_COPY.subscribeLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Signed-out demo → sign-up; signed-in without plan → pricing. */
  onSubscribe: () => void
  title?: string
  description?: string
  subscribeLabel?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              onSubscribe()
            }}
          >
            {subscribeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
