-- =============================================================
-- StackScope — Free Tier Quota Bump (3 → 4 scopes/month)
-- Migration: 20260621_free_tier_4_scopes.sql
-- =============================================================
-- Updates all existing free-tier users from 3 → 4 scopes/month.
-- New users already get 4 via the updated DEFAULT_MONTHLY_QUOTA in billing.ts.
-- =============================================================

-- Update all existing free-tier billing records from 3 to 4
update public.user_billing
set monthly_quota = 4
where monthly_quota = 3
  and razorpay_subscription_status in ('free', null);

-- Also update any null quota rows (shouldn't exist, but be safe)
update public.user_billing
set monthly_quota = 4
where monthly_quota is null
  and razorpay_subscription_status in ('free', null);
