export const PLANS = {
  uniqueSubscription: "unique_subscription",
} as const;

export const PLAN_NAME = "Unique Subscription";

export function isSubscribed(
  has: (params: { plan: string }) => boolean
): boolean {
  return has({ plan: PLANS.uniqueSubscription });
}
