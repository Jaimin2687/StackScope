/**
 * Demo / test-user utilities.
 *
 * Set DEMO_USER_EMAIL in your environment to designate a single account that
 * always receives full Pro access with unlimited quota — no payment required.
 * Hand these credentials to clients for evaluation.
 *
 * Usage:
 *   DEMO_USER_EMAIL=demo@yourapp.com   (in .env.local / Vercel env vars)
 */

import type { BillingSnapshot } from "./billing";

/** Returns the configured demo email, lower-cased, or null if not set. */
export function getDemoEmail(): string | null {
  const raw = process.env.DEMO_USER_EMAIL;
  return raw ? raw.trim().toLowerCase() : null;
}

/**
 * Returns true when the supplied email matches the demo user.
 * Safe to call server-side only — never expose DEMO_USER_EMAIL to the client.
 */
export function isDemoUser(email: string | null | undefined): boolean {
  const demoEmail = getDemoEmail();
  if (!demoEmail || !email) return false;
  return email.trim().toLowerCase() === demoEmail;
}

/**
 * Returns a fully-unlocked BillingSnapshot for the demo account.
 * monthly_quota = 0  →  unlimited (subscription-middleware treats 0 as unlimited)
 */
export function getDemoBillingSnapshot(): BillingSnapshot {
  return {
    subscriptionStatus: "active",
    monthlyQuota: 0, // 0 = unlimited (see subscription-middleware line: monthlyQuota === 0)
    tier: "pro",
  };
}
