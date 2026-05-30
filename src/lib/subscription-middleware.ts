import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { getOrCreateBillingSnapshot, getCurrentUsagePeriod, BillingSnapshot } from "./billing";

export type SubscriptionContext = {
  userId: string;
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
  option?: { skipQuotaCheck?: boolean }
): Promise<SubscriptionContext> {
  // Check cache first
  const cached = subscriptionCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    const billing = cached.billing;
    const context = await buildContext(supabase, userId, billing, option);
    return context;
  }

  // Fetch from database if not cached
  const billing = await getOrCreateBillingSnapshot(supabase, userId);
  subscriptionCache.set(userId, { billing, timestamp: Date.now() });

  const context = await buildContext(supabase, userId, billing, option);
  return context;
}

async function buildContext(
  supabase: SupabaseClient,
  userId: string,
  billing: BillingSnapshot,
  option?: { skipQuotaCheck?: boolean }
): Promise<SubscriptionContext> {
  if (option?.skipQuotaCheck) {
    return {
      userId,
      billing,
      quotaRemaining: billing.monthlyQuota,
      quotaUsed: 0,
      canProceed: true,
    };
  }

  const usagePeriod = getCurrentUsagePeriod();

  // Get completed usage
  const { data: usageRow, error: usageError } = await supabase
    .from("user_usage")
    .select("requests_used")
    .eq("user_id", userId)
    .eq("period_start", usagePeriod.start)
    .maybeSingle();

  if (usageError) {
    throw new Error(`Failed to read usage: ${usageError.message}`);
  }

  const completedUsage = usageRow?.requests_used ?? 0;

  // Get queued/processing jobs in this period
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

  const totalUsed = completedUsage + (queuedCount ?? 0);
  const quotaRemaining = Math.max(0, billing.monthlyQuota - totalUsed);

  return {
    userId,
    billing,
    quotaRemaining,
    quotaUsed: totalUsed,
    canProceed: quotaRemaining > 0 || billing.monthlyQuota === 0, // Pro tier has 0 quota (unlimited)
    reason:
      quotaRemaining === 0 && billing.monthlyQuota > 0
        ? "Monthly quota exceeded"
        : undefined,
  };
}

export function invalidateSubscriptionCache(userId: string): void {
  subscriptionCache.delete(userId);
}

export function invalidateAllCache(): void {
  subscriptionCache.clear();
}

export function createSubscriptionMiddleware(
  featureRequiredTier?: "pro" | "free"
) {
  return async (
    req: NextRequest,
    userId: string,
    supabase: SupabaseClient
  ): Promise<{ response: NextResponse | null; context: SubscriptionContext | null }> => {
    try {
      const context = await validateSubscription(supabase, userId);

      // Check feature access
      if (featureRequiredTier === "pro" && context.billing.tier === "free") {
        return {
          response: NextResponse.json(
            {
              error: "This feature requires a Pro subscription",
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
