import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Unique Subscription
        </h1>
        <p className="text-muted-foreground">
          The only plan. Subscribe to use Crosscheck Sheet.
        </p>
      </div>
      <PricingTable
        newSubscriptionRedirectUrl="/dashboard"
        fallback={
          <p className="text-center text-muted-foreground">Loading plans…</p>
        }
      />
    </main>
  );
}
