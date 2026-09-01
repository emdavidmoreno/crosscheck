"use client";

import { useState } from "react";
import { Export } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

export function ExportAction({ enabled }: { enabled: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function exportData() {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/export");
      const body = (await response.json()) as { error?: string; exportedAt?: string };

      if (!response.ok) {
        setMessage(body.error ?? "Export failed");
        return;
      }

      setMessage(`Exported at ${body.exportedAt}`);
    } catch {
      setMessage("Export failed");
    } finally {
      setPending(false);
    }
  }

  if (!enabled) {
    return (
      <Button disabled title="Unique Subscription is required">
        <Export data-icon="inline-start" />
        Export (subscribe required)
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={exportData} disabled={pending}>
        <Export data-icon="inline-start" />
        Export
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
