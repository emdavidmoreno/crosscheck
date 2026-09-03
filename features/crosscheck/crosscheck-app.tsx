"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Toaster } from "@/components/ui/sonner"
import { SEED_LIBRARY } from "@/constants/library"
import { CrosscheckWorkspace } from "@/features/crosscheck/crosscheck-workspace"
import { loadLibrary, saveLibrary } from "@/lib/library-storage"
import type { LibrarySet, WorkspaceUser } from "@/types/crosscheck"

const GUEST_USER: WorkspaceUser = {
  id: "guest",
  email: "invitado",
  name: "Invitado",
}

function toWorkspaceUser(
  clerkUser: NonNullable<ReturnType<typeof useUser>["user"]>
): WorkspaceUser {
  return {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.id,
    name: clerkUser.fullName ?? clerkUser.firstName ?? "Usuario",
  }
}

function initialLibrary(userId: string, demo: boolean): LibrarySet[] {
  if (demo || userId === "guest") return []
  return loadLibrary(userId) ?? SEED_LIBRARY
}

function CrosscheckAppReady({
  demo,
  user,
}: {
  demo: boolean
  user: WorkspaceUser
}) {
  const router = useRouter()
  const [library, setLibraryState] = useState<LibrarySet[]>(() =>
    initialLibrary(user.id, demo)
  )

  const setLibrary = (next: LibrarySet[]) => {
    setLibraryState(next)
    if (!demo && user.id !== "guest") saveLibrary(user.id, next)
  }

  return (
    <>
      <CrosscheckWorkspace
        user={user}
        demo={demo}
        onSubscribe={() =>
          router.push(demo && user.id === "guest" ? "/sign-up" : "/pricing")
        }
        library={library}
        setLibrary={setLibrary}
      />
      <Toaster />
    </>
  )
}

export function CrosscheckApp({ demo }: { demo: boolean }) {
  const { user: clerkUser, isLoaded } = useUser()

  if (demo) {
    return <CrosscheckAppReady demo user={GUEST_USER} />
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  if (!clerkUser) {
    return <CrosscheckAppReady demo user={GUEST_USER} />
  }

  return <CrosscheckAppReady demo={false} user={toWorkspaceUser(clerkUser)} />
}
