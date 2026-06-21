import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { getOrCreateBillingSnapshot, getCurrentUsagePeriod, BillingSnapshot, getOrgBillingSnapshot } from "./billing";

export type SubscriptionContext = {
  userId: string;
  orgId?: string;
  billing: BillingSnapshot;
  quotaRemaining: number;
  quotaUsed: number;
  canProceed: boolean;
  reason?: string;
};

// Simple in-memory cache with TTL
const subscriptionCache = new Map<
  string,
  { billing: BillingSnapshot; timestamp: number }
>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function validateSubscription(
  supabase: SupabaseClient,
  userId: string,
  option?: { skipQuotaCheck?: boolean; orgId?: string }
): Promise<SubscriptionContext> {
  const orgId = option?.orgId;
  const cacheKey = orgId ? `org:${orgId}` : `user:${userId}`;

  // Check cache first
  const cached = subscriptionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    const billing = cached.billing;
    return buildContext(supabase, userId, billing, option);
  }

  // Fetch from database — org-aware path
  const billing = orgId
    ? await getOrgBillingSnapshot(supabase, orgId, userId)
    : await getOrCreateBillingSnapshot(supabase, userId);

  subscriptionCache.set(cacheKey, { billing, timestamp: Date.now() });

  return buildContext(supabase, userId, billing, option);
}

async function buildContext(
  supabase: SupabaseClient,
  userId: string,
  billing: BillingSnapshot,
  option?: { skipQuotaCheck?: boolean; orgId?: string }
): Promise<SubscriptionContext> {
  const orgId = option?.orgId;

  if (option?.skipQuotaCheck) {
    return {
      userId,
      orgId,
      billing,
      quotaRemaining: billing.monthlyQuota,
      quotaUsed: 0,
      canProceed: true,
    };
  }

  const usagePeriod = getCurrentUsagePeriod();

  let totalUsed = 0;

  if (orgId) {
    // ── Org-scoped usage: aggregate across ALL active org members ──────────
    // Get all active member user IDs for this org
    const { data: members } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("status", "active")
      .not("user_id", "is", null);

    const memberIds = (members || []).map((m: { user_id: string }) => m.user_id).filter(Boolean);

    if (memberIds.length > 0) {
      // Sum completed usage across all members
      const { data: usageRows } = await supabase
        .from("user_usage")
        .select("requests_used")
        .in("user_id", memberIds)
        .eq("period_start", usagePeriod.start);

      const completedUsage = (usageRows || []).reduce(
        (sum: number, row: { requests_used: number }) => sum + (row.requests_used ?? 0),
        0
      );

      // Sum in-flight jobs
      const { count: queuedCount } = await supabase
        .from("scope_jobs")
        .select("id", { count: "exact", head: true })
        .in("user_id", memberIds)
        .in("status", ["queued", "processing"])
        .gte("created_at", usagePeriod.startDate.toISOString())
        .lt("created_at", usagePeriod.endDate.toISOString());

      totalUsed = completedUsage + (queuedCount ?? 0);
    }
  } else {
    // ── Legacy single-user usage ───────────────────────────────────────────
    const { data: usageRow, error: usageError } = await supabase
      .from("user_usage")
      .select("requests_used")
      .eq("user_id", userId)
      .eq("period_start", usagePeriod.start)
      .maybeSingle();

    if (usageError) {
      throw new Error(`Failed to read usage: ${usageError.message}`);
    }

    const { count: queuedCount, error: queuedError } = await supabase
      .from("scope_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["queued", "processing"])
      .gte("created_at", usagePeriod.startDate.toISOString())
      .lt("created_at", usagePeriod.endDate.toISOString());

    if (queuedError) {
      throw new Error(`Failed to read queued usage: ${queuedError.message}`);
    }

    totalUsed = (usageRow?.requests_used ?? 0) + (queuedCount ?? 0);
  }

  const quotaRemaining = Math.max(0, billing.monthlyQuota - totalUsed);

  return {
    userId,
    orgId,
    billing,
    quotaRemaining,
    quotaUsed: totalUsed,
    canProceed: quotaRemaining > 0 || billing.monthlyQuota === 0, // 0 = unlimited for agency
    reason:
      quotaRemaining === 0 && billing.monthlyQuota > 0
        ? "Monthly quota exceeded"
        : undefined,
  };
}

export function invalidateSubscriptionCache(userId: string, orgId?: string): void {
  subscriptionCache.delete(orgId ? `org:${orgId}` : `user:${userId}`);
}

export function invalidateAllCache(): void {
  subscriptionCache.clear();
}

export function createSubscriptionMiddleware(
  featureRequiredTier?: "pro" | "agency" | "free"
) {
  return async (
    req: NextRequest,
    userId: string,
    supabase: SupabaseClient,
    orgId?: string
  ): Promise<{ response: NextResponse | null; context: SubscriptionContext | null }> => {
    try {
      const context = await validateSubscription(supabase, userId, { orgId });

      const TIER_RANK: Record<string, number> = { free: 0, pro: 1, agency: 2 };
      const userRank = TIER_RANK[context.billing.tier] ?? 0;
      const requiredRank = featureRequiredTier ? (TIER_RANK[featureRequiredTier] ?? 0) : 0;

      // Check feature tier access
      if (featureRequiredTier && userRank < requiredRank) {
        const upgradeTarget =
          featureRequiredTier === "agency" ? "Agency Blueprint" : "Pro";
        return {
          response: NextResponse.json(
            {
              error: `This feature requires the ${upgradeTarget} plan`,
              upgradeUrl: "/pricing",
            },
            { status: 403 }
          ),
          context: null,
        };
      }

      // Check quota
      if (!context.canProceed) {
        return {
          response: NextResponse.json(
            {
              error: context.reason || "Usage quota exceeded",
              tier: context.billing.tier,
              quotaUsed: context.quotaUsed,
              monthlyQuota: context.billing.monthlyQuota,
              upgradeUrl: "/pricing",
            },
            { status: 403 }
          ),
          context: null,
        };
      }

      return { response: null, context };
    } catch (error: any) {
      return {
        response: NextResponse.json(
          { error: error.message || "Failed to validate subscription" },
          { status: 500 }
        ),
        context: null,
      };
    }
  };
}
