import Link from "next/link"
import { Show } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { scoreBackground } from "@/lib/score"

function ScoreSpectrum({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div
        className="flex h-3 max-w-sm overflow-hidden rounded-lg ring-1 ring-border/60 sm:max-w-md"
        aria-hidden="true"
      >
        {Array.from({ length: 60 }, (_, i) => {
          const s = Math.pow(1 - i / 59, 0.55)
          return (
            <i
              key={i}
              className="min-w-px flex-1"
              style={{ background: scoreBackground(s) }}
            />
          )
        })}
      </div>
      <div className="mt-1.5 flex max-w-sm justify-between font-mono text-[9px] tracking-wide text-muted-foreground uppercase sm:max-w-md">
        <span>100% coincidencia</span>
        <span>0%</span>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <section className="relative flex min-h-[calc(100svh-3.5rem)] flex-col justify-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]"
          aria-hidden="true"
        />
        <div className="relative z-10 px-6 py-28 sm:px-10 sm:py-32">
          <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
              Crosscheck
            </p>
            <h1 className="mt-4 max-w-[14ch] text-5xl font-bold tracking-tight leading-[0.95] sm:text-6xl">
              Dos hojas. Una respuesta.
            </h1>
            <p className="mt-5 max-w-[42ch] text-base text-muted-foreground leading-relaxed sm:text-lg">
              Cruzá dos archivos de Excel con las reglas que vos definas y mirá
              de un vistazo qué cuadra, qué cuadra a medias y qué falta.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Show when="signed-in">
                <Button
                  size="lg"
                  render={<Link href="/dashboard" />}
                  nativeButton={false}
                >
                  Empezar
                </Button>
              </Show>
              <Show when="signed-out">
                <Button
                  size="lg"
                  render={<Link href="/sign-up" />}
                  nativeButton={false}
                >
                  Empezar
                </Button>
              </Show>
              <Button
                variant="outline"
                size="lg"
                render={<Link href="/dashboard?demo=1" />}
                nativeButton={false}
              >
                Usar demo sin cuenta
              </Button>
            </div>
            <a
              href="#como-funciona"
              className="mt-4 inline-block text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Ver cómo funciona
            </a>

            <ScoreSpectrum className="mt-10 animate-in fade-in duration-700 fill-mode-both delay-200" />
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="border-t px-6 py-20 sm:px-10 sm:py-28"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Cómo funciona
          </h2>
          <p className="mt-3 max-w-[40ch] text-muted-foreground leading-relaxed">
            Tres pasos. Sin curva de aprendizaje.
          </p>

          <ol className="mt-12 flex flex-col gap-10 border-l border-border pl-6 sm:pl-8">
            <li>
              <span className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
                01
              </span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                Subí dos hojas
              </h3>
              <p className="mt-2 max-w-[44ch] text-sm text-muted-foreground leading-relaxed">
                Cargá los dos archivos de Excel que querés comparar. Crosscheck
                los lee en tu navegador.
              </p>
            </li>
            <li>
              <span className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
                02
              </span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                Definí las reglas
              </h3>
              <p className="mt-2 max-w-[44ch] text-sm text-muted-foreground leading-relaxed">
                Elegí qué columnas cruzar, cómo normalizar los datos y qué tan
                estricta querés la coincidencia.
              </p>
            </li>
            <li>
              <span className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
                03
              </span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                Mirá el resultado
              </h3>
              <p className="mt-2 max-w-[44ch] text-sm text-muted-foreground leading-relaxed">
                Un espectro de coincidencia te muestra qué filas cuadran al
                100%, qué cuadran a medias y qué falta en uno de los dos
                archivos.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="border-t bg-[linear-gradient(180deg,color-mix(in_oklch,var(--muted)_40%,transparent),transparent)] px-6 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Todo queda en tu máquina
          </h2>
          <p className="mt-4 max-w-[46ch] text-muted-foreground leading-relaxed">
            El cálculo corre en tu navegador. Tus archivos no se suben a ningún
            servidor — comparás con privacidad, sin esperar a que alguien más
            procese tus datos.
          </p>
        </div>
      </section>

      <section className="border-t px-6 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-3xl text-center sm:text-left">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Listo para cruzar tus hojas
          </h2>
          <p className="mx-auto mt-3 max-w-[40ch] text-muted-foreground leading-relaxed sm:mx-0">
            Entrá con tu cuenta o probá la demo sin registrarte.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
            <Show when="signed-in">
              <Button
                size="lg"
                render={<Link href="/dashboard" />}
                nativeButton={false}
              >
                Empezar
              </Button>
            </Show>
            <Show when="signed-out">
              <Button
                size="lg"
                render={<Link href="/sign-up" />}
                nativeButton={false}
              >
                Empezar
              </Button>
            </Show>
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/dashboard?demo=1" />}
              nativeButton={false}
            >
              Usar demo sin cuenta
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            Crosscheck
          </span>
          <p className="text-xs text-muted-foreground">
            Comparador de hojas de Excel en el navegador.
          </p>
        </div>
      </footer>
    </div>
  )
}
