"use client";

import { useSubscription } from "@clerk/nextjs/experimental";

export function SubscriptionStatus() {
  const { data, isLoading } = useSubscription();

  if (isLoading) return null;
  if (!data) return null;

  return (
    <p className="text-sm text-muted-foreground">
      Status: {data.status}
      {data.nextPayment
        ? ` · next payment ${data.nextPayment.date.toLocaleDateString()}`
        : null}
    </p>
  );
}
