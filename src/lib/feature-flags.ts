/**
 * Feature flags — read from environment variables.
 *
 * ROUTING flag
 * ─────────────
 * Controls whether Razorpay payment-link generation, milestone routing,
 * and payout account creation are visible in the UI and PDFs.
 *
 * Set  NEXT_PUBLIC_ROUTING=off  to disable all routing/payment UI.
 * Omit it or set it to anything else (e.g. "on") to keep it enabled.
 *
 * It is NEXT_PUBLIC_ so it is available in both server and client components.
 */

/**
 * Returns true when the payment-routing feature is enabled (default).
 * Returns false when NEXT_PUBLIC_ROUTING is explicitly set to "off".
 */
export function isRoutingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ROUTING?.trim().toLowerCase() !== "off";
}
