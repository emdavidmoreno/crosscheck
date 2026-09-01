import { Show } from "@clerk/nextjs";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="font-heading max-w-lg text-4xl font-semibold tracking-tight">
        Crosscheck Sheet
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Access requires Unique Subscription. Check out in-app and the session
        unlocks the product. There is no free tier.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button render={<Link href="/pricing" />} nativeButton={false}>
          View plan
        </Button>
        <Show when="signed-in">
          <Button
            variant="outline"
            render={<Link href="/dashboard" />}
            nativeButton={false}
          >
            Dashboard
          </Button>
        </Show>
        <Show when="signed-out">
          <Button
            variant="outline"
            render={<Link href="/sign-in" />}
            nativeButton={false}
          >
            Sign in
          </Button>
        </Show>
      </div>
    </main>
  );
}
