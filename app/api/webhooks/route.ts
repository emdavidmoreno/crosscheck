import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

function payerId(payer?: {
  user_id?: string;
  organization_id?: string;
}) {
  return payer?.user_id ?? payer?.organization_id ?? null;
}

export async function POST(req: NextRequest) {
  let evt;

  try {
    evt = await verifyWebhook(req);
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new Response("Verification failed", { status: 400 });
  }

  const svixId = req.headers.get("svix-id");

  if (
    evt.type === "subscription.created" ||
    evt.type === "subscription.updated" ||
    evt.type === "subscription.active" ||
    evt.type === "subscription.pastDue"
  ) {
    const { id, payer, items, status } = evt.data;
    console.info("[billing]", evt.type, {
      svixId,
      subscriptionId: id,
      entityId: payerId(payer),
      plan: items[0]?.plan?.slug ?? null,
      status,
    });
  }

  if (
    evt.type === "subscriptionItem.active" ||
    evt.type === "subscriptionItem.updated" ||
    evt.type === "subscriptionItem.canceled" ||
    evt.type === "subscriptionItem.upcoming" ||
    evt.type === "subscriptionItem.ended" ||
    evt.type === "subscriptionItem.abandoned" ||
    evt.type === "subscriptionItem.incomplete" ||
    evt.type === "subscriptionItem.pastDue" ||
    evt.type === "subscriptionItem.freeTrialEnding"
  ) {
    const { id, payer, plan, status } = evt.data;
    console.info("[billing]", evt.type, {
      svixId,
      subscriptionItemId: id,
      entityId: payerId(payer),
      plan: plan?.slug ?? null,
      status,
    });
  }

  if (evt.type === "paymentAttempt.created" || evt.type === "paymentAttempt.updated") {
    const { id, payer, status, charge_type } = evt.data;
    console.info("[billing]", evt.type, {
      svixId,
      paymentAttemptId: id,
      entityId: payerId(payer),
      status,
      chargeType: charge_type,
    });
  }

  return new Response("OK", { status: 200 });
}
