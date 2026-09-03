import { PricingTable } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function CheckoutPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-up");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Completar suscripción
        </h1>
        <p className="text-muted-foreground">
          Accede a todas las funciones de Crosscheck con un único pago.
        </p>
      </div>

      <div className="mt-12">
        <PricingTable newSubscriptionRedirectUrl="/dashboard" />
      </div>
    </main>
  );
}
