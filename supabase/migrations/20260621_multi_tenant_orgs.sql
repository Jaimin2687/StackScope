-- =============================================================
-- StackScope — Multi-Tenant Organization Model
-- Migration: 20260621_multi_tenant_orgs.sql
-- =============================================================
-- This migration introduces:
--   1. organizations          — agency/team billing entity
--   2. organization_members   — role-based membership + invite state
--   3. org_id column on client_scopes, scope_jobs, user_billing
--   4. Full RLS policies for tenant isolation
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. ORGANIZATIONS TABLE
-- ─────────────────────────────────────────────────────────────
create table if not exists public.organizations (
  id                   uuid        primary key default gen_random_uuid(),
  name                 text        not null,
  -- stripe_customer_id reserved for future Stripe integration
  stripe_customer_id   text        unique,
  -- razorpay_subscription_id used for current Razorpay billing
  razorpay_subscription_id text,
  subscription_status  text        not null default 'free'
                        check (subscription_status in ('free', 'active', 'trialing', 'past_due', 'canceled')),
  created_at           timestamptz not null default now()
);

comment on table public.organizations is
  'Top-level billing entity. An agency owner purchases a subscription for the org, then invites team members.';

-- ─────────────────────────────────────────────────────────────
-- 2. ORGANIZATION_MEMBERS TABLE
-- ─────────────────────────────────────────────────────────────
create table if not exists public.organization_members (
  id          uuid        primary key default gen_random_uuid(),
  org_id      uuid        not null
                references public.organizations(id) on delete cascade,
  -- user_id is NULL for pending (invited-but-not-yet-accepted) members
  user_id     uuid
                references auth.users(id) on delete set null,
  -- email is the canonical identifier for invitations
  email       text        not null,
  role        text        not null default 'member'
                check (role in ('owner', 'admin', 'member')),
  status      text        not null default 'invited'
                check (status in ('invited', 'active')),
  invited_at  timestamptz not null default now(),
  -- Enforce one membership record per email per org
  unique (org_id, email)
);

comment on table public.organization_members is
  'Maps users to organizations with a role. status=invited means awaiting acceptance.';

create index if not exists idx_org_members_user_id  on public.organization_members(user_id);
create index if not exists idx_org_members_org_id   on public.organization_members(org_id);
create index if not exists idx_org_members_email     on public.organization_members(email);

-- ─────────────────────────────────────────────────────────────
-- 3. ADD org_id TO EXISTING TABLES (nullable for backcompat)
-- ─────────────────────────────────────────────────────────────

-- client_scopes — tie generated SOWs / architecture docs to an org
alter table public.client_scopes
  add column if not exists org_id uuid
    references public.organizations(id) on delete set null;

create index if not exists idx_client_scopes_org_id on public.client_scopes(org_id);

-- scope_jobs — tie the async generation queue to an org
alter table public.scope_jobs
  add column if not exists org_id uuid
    references public.organizations(id) on delete set null;

create index if not exists idx_scope_jobs_org_id on public.scope_jobs(org_id);

-- user_billing — link a billing record to an org (agency owner's billing = org billing)
alter table public.user_billing
  add column if not exists org_id uuid
    references public.organizations(id) on delete set null;

-- ─────────────────────────────────────────────────────────────
-- 4. RLS — ORGANIZATIONS
-- ─────────────────────────────────────────────────────────────
alter table public.organizations enable row level security;

-- Active org members can read their own org
create policy "org_members_can_read_own_org"
  on public.organizations for select
  using (
    id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
        and status = 'active'
    )
  );

-- Only owners can update org details / billing
create policy "org_owners_can_update_org"
  on public.organizations for update
  using (
    id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
        and role = 'owner'
        and status = 'active'
    )
  );

-- Only service_role can insert (orgs are created server-side)
create policy "service_role_can_insert_org"
  on public.organizations for insert
  to service_role
  with check (true);

-- Only service_role can delete
create policy "service_role_can_delete_org"
  on public.organizations for delete
  to service_role
  using (true);

-- ─────────────────────────────────────────────────────────────
-- 5. RLS — ORGANIZATION_MEMBERS
-- ─────────────────────────────────────────────────────────────
alter table public.organization_members enable row level security;

-- Active members can list all members within their same org
create policy "active_members_can_read_org_roster"
  on public.organization_members for select
  using (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
        and status = 'active'
    )
    -- Also allow invited users to see their own pending record (for accept flow)
    or (user_id = auth.uid())
    or (
      -- Invited-but-not-yet-active users can see their pending invite by email
      email = (select email from auth.users where id = auth.uid())
    )
  );

-- Only owners and admins can invite (insert) new members
create policy "owners_admins_can_invite_members"
  on public.organization_members for insert
  with check (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
        and status = 'active'
    )
    -- Service role can always insert (used for auto-org creation in worker)
    or auth.role() = 'service_role'
  );

-- Allow invited users to update their own record (accept invite)
create policy "invited_users_can_accept_invite"
  on public.organization_members for update
  using (
    -- The accepting user matches by email
    email = (select email from auth.users where id = auth.uid())
    -- Or owners/admins can update membership within their org (e.g. role changes)
    or org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
        and status = 'active'
    )
    -- Service role always allowed
    or auth.role() = 'service_role'
  );

-- Only owners and admins can remove members
create policy "owners_admins_can_remove_members"
  on public.organization_members for delete
  using (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'admin')
        and status = 'active'
    )
    or auth.role() = 'service_role'
  );

-- ─────────────────────────────────────────────────────────────
-- 6. RLS — CLIENT_SCOPES (updated policies)
-- ─────────────────────────────────────────────────────────────
-- Drop any existing permissive policies that rely on user_id only
-- (We add org-aware policies while keeping backward compatibility for
--  rows where org_id IS NULL — those are read by direct user_id match)

-- Note: existing policies from prior migrations are left in place.
-- We ADD new org-aware policies. The two work together via OR semantics.

-- Org-scoped SELECT: all active org members can read their org's scopes
create policy "org_members_can_read_org_scopes"
  on public.client_scopes for select
  using (
    -- New path: scope belongs to an org the user is active in
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
        and status = 'active'
    )
    -- Backward compat: legacy scopes without org_id are user-owned
    or (org_id is null and user_id = auth.uid())
  );

-- Org-scoped INSERT: active members can create scopes for their org
create policy "org_members_can_insert_org_scopes"
  on public.client_scopes for insert
  with check (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
        and status = 'active'
    )
    or org_id is null  -- legacy / personal scopes
    or auth.role() = 'service_role'
  );

-- Org-scoped UPDATE: active members can update their org's scopes
create policy "org_members_can_update_org_scopes"
  on public.client_scopes for update
  using (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
        and status = 'active'
    )
    or (org_id is null and user_id = auth.uid())
    or auth.role() = 'service_role'
  );

-- Org-scoped DELETE: active members can delete their org's scopes
create policy "org_members_can_delete_org_scopes"
  on public.client_scopes for delete
  using (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
        and status = 'active'
    )
    or (org_id is null and user_id = auth.uid())
    or auth.role() = 'service_role'
  );

-- ─────────────────────────────────────────────────────────────
-- 7. RLS — SCOPE_JOBS (updated policies)
-- ─────────────────────────────────────────────────────────────

-- Org-scoped SELECT for scope_jobs
create policy "org_members_can_read_org_jobs"
  on public.scope_jobs for select
  using (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
        and status = 'active'
    )
    or (org_id is null and user_id = auth.uid())
  );

-- Org-scoped INSERT for scope_jobs (users queue their own jobs)
create policy "org_members_can_insert_org_jobs"
  on public.scope_jobs for insert
  with check (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
        and status = 'active'
    )
    or org_id is null
    or auth.role() = 'service_role'
  );

-- ─────────────────────────────────────────────────────────────
-- 8. HELPER FUNCTION — resolve org_id for a given user
-- ─────────────────────────────────────────────────────────────
create or replace function public.get_user_active_org_id(p_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id
  from public.organization_members
  where user_id = p_user_id
    and status = 'active'
  order by invited_at asc
  limit 1;
$$;

grant execute on function public.get_user_active_org_id(uuid) to authenticated;
grant execute on function public.get_user_active_org_id(uuid) to service_role;

-- ─────────────────────────────────────────────────────────────
-- 9. HELPER FUNCTION — check user role within an org
-- ─────────────────────────────────────────────────────────────
create or replace function public.get_user_org_role(p_user_id uuid, p_org_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.organization_members
  where user_id = p_user_id
    and org_id = p_org_id
    and status = 'active'
  limit 1;
$$;

grant execute on function public.get_user_org_role(uuid, uuid) to authenticated;
grant execute on function public.get_user_org_role(uuid, uuid) to service_role;
