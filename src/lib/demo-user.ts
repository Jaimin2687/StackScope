/**
 * demo-user.ts — RETIRED
 *
 * The demo-login flow has been removed. Free-tier users now receive
 * 4 scope generations per month with unlimited edits as a built-in
 * trial experience — no separate demo account needed.
 *
 * These stubs are kept so that existing imports compile without changes.
 * All functions are no-ops that return safe defaults.
 */

import type { BillingSnapshot } from "./billing";

/** @deprecated Always returns null — demo mode is disabled. */
export function getDemoEmail(): string | null {
  return null;
}

/** @deprecated Always returns false — demo mode is disabled. */
export function isDemoUser(_email: string | null | undefined): boolean {
  return false;
}

/** @deprecated Never called — demo mode is disabled. */
export function getDemoBillingSnapshot(): BillingSnapshot {
  // Fallback to free tier — should never be reached
  return {
    subscriptionStatus: "free",
    monthlyQuota: 4,
    tier: "free",
  };
}
