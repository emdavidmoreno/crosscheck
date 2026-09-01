import { auth } from "@clerk/nextjs/server";
import { ChartBar, Code, Export } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ExportAction } from "@/components/billing/export-action";
import { SubscriptionStatus } from "@/components/billing/subscription-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLAN_NAME, isSubscribed } from "@/lib/billing";

export default async function DashboardPage() {
  const { has } = await auth.protect();

  if (!isSubscribed(has)) {
    redirect("/pricing");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <Badge>{PLAN_NAME}</Badge>
        </div>
        <SubscriptionStatus />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar />
              Analytics
            </CardTitle>
            <CardDescription>Included with {PLAN_NAME}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Analytics is included in your subscription.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Export />
              Export
            </CardTitle>
            <CardDescription>Included with {PLAN_NAME}</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportAction enabled />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code />
              API access
            </CardTitle>
            <CardDescription>Included with {PLAN_NAME}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>API access is included in your subscription.</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              render={<Link href="/account" />}
              nativeButton={false}
            >
              Manage billing
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
