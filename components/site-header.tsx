"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) return null;

  return (
    <header className="flex items-center justify-between gap-3 border-b px-6 py-3">
      <nav className="flex items-center gap-1">
        <Button render={<Link href="/" />} nativeButton={false} variant="ghost">
          Crosscheck
        </Button>
        <Button
          render={<Link href="/pricing" />}
          nativeButton={false}
          variant="ghost"
        >
          Precios
        </Button>
        <Button
          render={<Link href="/dashboard?demo=1" />}
          nativeButton={false}
          variant="ghost"
        >
          Demo
        </Button>
        <Show when="signed-in">
          <Button
            render={<Link href="/dashboard" />}
            nativeButton={false}
            variant="ghost"
          >
            Dashboard
          </Button>
          <Button
            render={<Link href="/account" />}
            nativeButton={false}
            variant="ghost"
          >
            Cuenta
          </Button>
        </Show>
      </nav>
      <div className="flex items-center gap-2">
        <Show when="signed-out">
          <SignInButton>
            <Button variant="ghost">Entrar</Button>
          </SignInButton>
          <SignUpButton>
            <Button>Crear cuenta</Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
