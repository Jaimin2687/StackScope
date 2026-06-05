import type { SupabaseClient } from "@supabase/supabase-js";
import { isDemoUser, getDemoBillingSnapshot } from "./demo-user";

export type UserTier = "free" | "pro" | "agency";

export type BillingSnapshot = {
  subscriptionStatus: string;
  monthlyQuota: number;
  tier: UserTier;
};

export type UsagePeriod = {
  startDate: Date;
  endDate: Date;
  start: string;
  end: string;
};

export type TierLimits = {
  maxTreeTokens: number;
  maxTreeItems: number;
  maxTreeDepth: number;
  maxContextChars: number;
};

const DEFAULT_MONTHLY_QUOTA = 3;

const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    maxTreeTokens: 2600,
    maxTreeItems: 5000,
    maxTreeDepth: 5,
    maxContextChars: 14000,
  },
  pro: {
    maxTreeTokens: 9000,
    maxTreeItems: 20000,
    maxTreeDepth: 10,
    maxContextChars: 32000,
  },
  agency: {
    maxTreeTokens: 9000,   // same generation quality as pro
    maxTreeItems: 20000,
    maxTreeDepth: 10,
    maxContextChars: 32000,
  },
};

export function resolveUserTier(status: string | null | undefined): UserTier {
  const normalized = String(status || "").toLowerCase();
  if (["active", "paid", "trialing"].includes(normalized)) {
    return "pro";
  }
  if (["agency", "agency_active", "agency_paid"].includes(normalized)) {
    return "agency";
  }
  return "free";
}

export function getTierLimits(tier: UserTier): TierLimits {
  return TIER_LIMITS[tier];
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function getCurrentUsagePeriod(now = new Date()): UsagePeriod {
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    startDate,
    endDate,
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
  };
}

export async function getOrCreateBillingSnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<BillingSnapshot> {
  // ── Demo / test-user fast path ─────────────────────────────────────────────
  // If DEMO_USER_EMAIL is set and this user matches, grant full Pro + unlimited
  // quota without any DB interaction.
  const { data: { user } } = await supabase.auth.getUser();
  if (isDemoUser(user?.email)) {
    return getDemoBillingSnapshot();
  }
  const { data, error } = await supabase
    .from("user_billing")
    .select("razorpay_subscription_status, monthly_quota")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from("user_billing")
      .insert({
        user_id: userId,
        razorpay_subscription_status: "free",
        monthly_quota: DEFAULT_MONTHLY_QUOTA,
      })
      .select("razorpay_subscription_status, monthly_quota")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message || "Failed to initialize billing record");
    }

    return {
      subscriptionStatus: inserted.razorpay_subscription_status,
      monthlyQuota: inserted.monthly_quota ?? DEFAULT_MONTHLY_QUOTA,
      tier: resolveUserTier(inserted.razorpay_subscription_status),
    };
  }

  return {
    subscriptionStatus: data.razorpay_subscription_status,
    monthlyQuota: data.monthly_quota ?? DEFAULT_MONTHLY_QUOTA,
    tier: resolveUserTier(data.razorpay_subscription_status),
  };
}
