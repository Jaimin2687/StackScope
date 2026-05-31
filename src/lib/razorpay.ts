import Razorpay from "razorpay";

let _instance: Razorpay | null = null;

/**
 * Returns a singleton Razorpay client.
 * Validates env vars at call time so Next.js edge-runtime module loading
 * doesn't throw before the runtime env is populated.
 */
export function getRazorpay(): Razorpay {
  if (_instance) return _instance;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are not configured. " +
        "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment."
    );
  }

  _instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return _instance;
}

/**
 * Safe integer conversion for INR amounts.
 * Accepts a value in whole rupees (e.g. 1499.00) and returns paise (149900).
 * Uses Math.round to avoid floating-point drift, then validates the minimum.
 */
export function rupeesToPaise(rupees: number): number {
  if (typeof rupees !== "number" || isNaN(rupees) || !isFinite(rupees)) {
    throw new Error("Invalid amount: must be a finite number.");
  }
  if (rupees < 0) {
    throw new Error("Invalid amount: must be non-negative.");
  }
  const paise = Math.round(rupees * 100);
  if (paise < 100) {
    throw new Error(
      `Amount too small: minimum is ₹1.00 (100 paise), got ${paise} paise.`
    );
  }
  return paise;
}

/**
 * Computes the 92/8 split.
 * Returns integer paise values; no floating-point multiplication on final totals.
 */
export function computeSplit(totalPaise: number): {
  freelancerPaise: number;
  platformFeePaise: number;
} {
  // 8% platform fee — floor keeps us conservative, avoids over-charging
  const platformFeePaise = Math.floor(totalPaise * 0.08);
  const freelancerPaise = totalPaise - platformFeePaise;
  return { freelancerPaise, platformFeePaise };
}
