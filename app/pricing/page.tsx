"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Show, useAuth, useClerk } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PricingPage() {
  const { isSignedIn } = useAuth();
  const { redirectToSignUp } = useClerk();

  const handleSubscribe = () => {
    if (!isSignedIn) {
      redirectToSignUp();
      return;
    }
    // Redirect to checkout if already signed in
    window.location.href = "/checkout";
  };

  const features = [
    "Comparar archivos de Excel ilimitados",
    "Definir reglas personalizadas de coincidencia",
    "Normalización automática de datos",
    "Algoritmo inteligente de scoring",
    "Descargar resultados en Excel",
    "Procesamiento 100% en el navegador",
    "Tus datos nunca se suben a servidores",
    "Soporte y actualizaciones permanentes",
  ];

  const faqs = [
    {
      question: "¿Cuál es el tamaño máximo de archivo?",
      answer:
        "Depende de la capacidad de tu navegador. La mayoría de navegadores modernos pueden manejar archivos de varios MB sin problemas. El procesamiento ocurre localmente en tu máquina.",
    },
    {
      question: "¿Puedo probar antes de pagar?",
      answer:
        "Sí, tenemos una demo gratuita con límites. Podés probar toda la funcionalidad sin crear cuenta, pero con algunas restricciones en cantidad de datos procesados.",
    },
    {
      question: "¿Qué formatos de archivo soportan?",
      answer:
        "Soportamos archivos de Excel (.xlsx, .xls) y archivos CSV. También puedes copiar y pegar datos directamente.",
    },
    {
      question: "¿Hay reembolso si no me gusta?",
      answer:
        "Sí, ofrecemos 30 días de reembolso sin preguntas si no quedas satisfecho con el producto.",
    },
    {
      question: "¿Necesito instalar algo?",
      answer:
        "No, Crosscheck funciona completamente en el navegador. Solo necesitas acceso a internet.",
    },
    {
      question: "¿Qué pasa si dejo de pagar?",
      answer:
        "Si tu suscripción vence, pierdes acceso a las funciones premium. Puedes renovar en cualquier momento.",
    },
  ];

  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 sm:px-10 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Un precio. Infinitas posibilidades.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Acceso completo a todas las funciones de Crosscheck con una única suscripción.
          </p>

          {/* Price Card */}
          <div className="mt-12 mx-auto max-w-sm">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Plan completo
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold">$25</span>
                <span className="text-lg text-muted-foreground">/mes</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Facturado mensualmente. Cancela cuando quieras.
              </p>

              <Separator className="my-6" />

              {/* Features List */}
              <ul className="space-y-3 text-left mb-8">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Separator className="mb-6" />

              {/* CTA Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleSubscribe}
              >
                {isSignedIn ? "Suscribirme ahora" : "Comenzar ahora"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                render={<Link href="/dashboard?demo=1" />}
                nativeButton={false}
              >
                Probar demo gratis
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Crosscheck Section */}
      <section className="border-t px-6 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">
            ¿Por qué elegir Crosscheck?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Diseñado para profesionales que necesitan precisión y velocidad.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div className="rounded-lg border border-border/50 p-6">
              <h3 className="font-semibold">🔒 Privacidad garantizada</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Tus datos nunca salen de tu navegador. Todo se procesa localmente.
              </p>
            </div>

            <div className="rounded-lg border border-border/50 p-6">
              <h3 className="font-semibold">⚡ Velocidad instantánea</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Resultados en segundos, sin esperar a que procese un servidor.
              </p>
            </div>

            <div className="rounded-lg border border-border/50 p-6">
              <h3 className="font-semibold">🎯 Inteligencia avanzada</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Algoritmo sofisticado que entiende variaciones en los datos.
              </p>
            </div>

            <div className="rounded-lg border border-border/50 p-6">
              <h3 className="font-semibold">🔧 Totalmente personalizable</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Define reglas exactamente como las necesitas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t bg-[linear-gradient(180deg,color-mix(in_oklch,var(--muted)_40%,transparent),transparent)] px-6 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">
            Preguntas frecuentes
          </h2>

          <div className="mt-12 space-y-6">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-lg border border-border/50 p-6 transition-all hover:border-border"
              >
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {faq.question}
                  <span className="transition-transform group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <p className="mt-4 text-sm text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="border-t px-6 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Listo para empezar
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Suscribite hoy y accede a todas las funciones de Crosscheck.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={handleSubscribe}
            >
              {isSignedIn ? "Suscribirme ahora" : "Crear cuenta"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/dashboard?demo=1" />}
              nativeButton={false}
            >
              Demo gratis
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            Crosscheck
          </span>
          <p className="text-xs text-muted-foreground">
            Comparador de hojas de Excel en el navegador.
          </p>
        </div>
      </footer>
    </main>
  );
}
