// Minimal payment types for legacy code compatibility
export enum SubscriptionStatus {
  Active = 'active',
  Deleted = 'deleted',
  PastDue = 'past_due',
  CancelAtPeriodEnd = 'cancel_at_period_end',
}

export function parsePaymentPlanId(planId: string): string {
  return planId || 'free';
}

export function prettyPaymentPlanName(planId: string): string {
  return planId.charAt(0).toUpperCase() + planId.slice(1);
}
