import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { CrosscheckApp } from "@/features/crosscheck/crosscheck-app"
import { isSubscribed } from "@/lib/billing"

function isDemoParam(demo: string | string[] | undefined) {
  return demo === "1" || (Array.isArray(demo) && demo.includes("1"))
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const params = await searchParams
  const demoRequested = isDemoParam(params.demo)
  const { isAuthenticated, has } = await auth()
  const subscribed = Boolean(isAuthenticated && isSubscribed(has))

  if (subscribed) {
    return <CrosscheckApp demo={false} />
  }

  if (demoRequested) {
    return <CrosscheckApp demo />
  }

  if (!isAuthenticated) {
    redirect("/sign-in")
  }

  redirect("/pricing")
}
