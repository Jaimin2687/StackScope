import type { SupabaseClient } from "@supabase/supabase-js";
// demo-user is retired; kept import so the module stub resolves cleanly
// (isDemoUser always returns false, getDemoBillingSnapshot is unreachable)

export type OrgContext = {
  orgId: string;
  role: 'owner' | 'admin' | 'member';
};

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

/**
 * Free-tier monthly scope quota.
 * Override at any time by setting FREE_TIER_MONTHLY_QUOTA in your environment.
 * Defaults to 4 if unset or invalid.
 */
function getFreeTierQuota(): number {
  const raw = process.env.FREE_TIER_MONTHLY_QUOTA;
  if (!raw) return 4;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4;
}

// Evaluated once per cold start — stable for the lifetime of the Lambda/Edge fn.
const DEFAULT_MONTHLY_QUOTA = getFreeTierQuota();

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

/**
 * Resolve a tier from an organization's subscription_status.
 * Agency orgs map to 'agency' tier; active/trialing individual plans map to 'pro'.
 */
export function resolveOrgTier(subscriptionStatus: string | null | undefined): UserTier {
  const normalized = String(subscriptionStatus || "").toLowerCase();
  if (["active", "trialing"].includes(normalized)) {
    return "agency"; // org subscriptions are always the agency plan
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

/**
 * Resolve the effective monthly quota for a given tier and DB-stored quota.
 *
 * FREE users always get the live env-var value — so changing
 * FREE_TIER_MONTHLY_QUOTA + redeploying instantly applies to everyone
 * without any SQL backfill.
 *
 * Paid/agency users keep the quota stored in the DB (set by subscription
 * webhooks), which allows custom per-account overrides if needed.
 */
export function resolveQuota(tier: UserTier, dbQuota: number | null | undefined): number {
  if (tier === "free") return getFreeTierQuota();
  if (tier === "agency") return 0; // 0 = unlimited
  // pro: use DB value, fall back to env quota if DB is unset
  return dbQuota ?? getFreeTierQuota();
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
  const { data, error } = await supabase
    .from("user_billing")
    .select("razorpay_subscription_status, monthly_quota")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    // First visit — create the billing record.
    // We store DEFAULT_MONTHLY_QUOTA in the DB but it is only used for
    // paid tiers; free tier always reads from the env var at runtime.
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

    const insertedTier = resolveUserTier(inserted.razorpay_subscription_status);
    return {
      subscriptionStatus: inserted.razorpay_subscription_status,
      monthlyQuota: resolveQuota(insertedTier, inserted.monthly_quota),
      tier: insertedTier,
    };
  }

  const tier = resolveUserTier(data.razorpay_subscription_status);
  return {
    subscriptionStatus: data.razorpay_subscription_status,
    // Free users: always use the live env var — DB value is intentionally ignored.
    // This means FREE_TIER_MONTHLY_QUOTA changes take effect on next cold start.
    monthlyQuota: resolveQuota(tier, data.monthly_quota),
    tier,
  };
}

/**
 * Resolve billing for an org by reading from the organization row directly.
 * The org's subscription_status drives the tier; monthly_quota comes from
 * the owner's user_billing record (the first owner we find).
 *
 * Falls back to getOrCreateBillingSnapshot() if the org has no active owner.
 */
export async function getOrgBillingSnapshot(
  supabase: SupabaseClient,
  orgId: string,
  fallbackUserId: string
): Promise<BillingSnapshot> {
  // Fetch org subscription status
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("subscription_status, razorpay_subscription_id")
    .eq("id", orgId)
    .maybeSingle();

  if (orgError || !org) {
    // Org not found — fall back to personal billing
    return getOrCreateBillingSnapshot(supabase, fallbackUserId);
  }

  // Fetch the owner's billing to get monthly_quota
  const { data: ownerMember } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("role", "owner")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  let dbQuota: number | null = null;

  if (ownerMember?.user_id) {
    const { data: ownerBilling } = await supabase
      .from("user_billing")
      .select("monthly_quota")
      .eq("user_id", ownerMember.user_id)
      .maybeSingle();
    if (ownerBilling?.monthly_quota != null) {
      dbQuota = ownerBilling.monthly_quota;
    }
  }

  const tier = resolveOrgTier(org.subscription_status);

  return {
    subscriptionStatus: org.subscription_status,
    // Free orgs also use the env var — resolveQuota() handles all tiers uniformly.
    monthlyQuota: resolveQuota(tier, dbQuota),
    tier,
  };
}
