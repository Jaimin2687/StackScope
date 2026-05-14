create extension if not exists "pgcrypto";

create table if not exists public.user_billing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  razorpay_subscription_status text not null default 'free',
  monthly_quota integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  requests_used integer not null default 0,
  tokens_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_start)
);

create table if not exists public.scope_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('queued','processing','succeeded','failed')),
  payload jsonb not null,
  scope_id uuid references public.client_scopes(id) on delete set null,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scope_jobs_user_created on public.scope_jobs(user_id, created_at);

alter table public.user_billing enable row level security;
create policy "user_billing_select_own"
  on public.user_billing for select
  using (auth.uid() = user_id);

alter table public.user_usage enable row level security;
create policy "user_usage_select_own"
  on public.user_usage for select
  using (auth.uid() = user_id);

alter table public.scope_jobs enable row level security;
create policy "scope_jobs_select_own"
  on public.scope_jobs for select
  using (auth.uid() = user_id);
create policy "scope_jobs_insert_own"
  on public.scope_jobs for insert
  with check (auth.uid() = user_id);

create or replace function public.increment_user_usage(
  p_user_id uuid,
  p_period_start date,
  p_period_end date,
  p_requests_increment integer,
  p_tokens_increment integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'insufficient_privilege';
  end if;

  insert into public.user_usage (user_id, period_start, period_end, requests_used, tokens_used)
  values (p_user_id, p_period_start, p_period_end, p_requests_increment, p_tokens_increment)
  on conflict (user_id, period_start)
  do update set
    requests_used = public.user_usage.requests_used + excluded.requests_used,
    tokens_used = public.user_usage.tokens_used + excluded.tokens_used,
    period_end = excluded.period_end,
    updated_at = now();
end;
$$;

grant execute on function public.increment_user_usage(uuid, date, date, integer, integer) to service_role;

insert into storage.buckets (id, name, public)
values ('scope-audio', 'scope-audio', false)
on conflict (id) do nothing;
