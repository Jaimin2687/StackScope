-- ============================================================
-- Razorpay Route: DB additions for split payment + subscription
-- ============================================================

-- 1. Extend user_billing with Razorpay Route + Subscription columns
alter table public.user_billing
  add column if not exists razorpay_account_id     text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists is_pro                  boolean not null default false,
  add column if not exists plan_expires_at         timestamptz;

-- 2. Payment routing errors table
--    Written only by the webhook handler (service_role).
--    No user-facing reads needed.
create table if not exists public.payment_routing_errors (
  id           uuid        primary key default gen_random_uuid(),
  order_id     text        not null,
  event        text        not null,
  error_reason text,
  payload      jsonb,
  created_at   timestamptz not null default now()
);

alter table public.payment_routing_errors enable row level security;

-- Service-role can insert; no user reads (audit-only table)
create policy "payment_routing_errors_service_insert"
  on public.payment_routing_errors for insert
  to service_role
  with check (true);

-- Index for order-based lookups
create index if not exists idx_payment_routing_errors_order
  on public.payment_routing_errors (order_id);
