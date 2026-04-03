-- Run this in your Supabase SQL Editor to update your table

-- 1. Add column to track whether a scope is softly deleted
ALTER TABLE public.client_scopes
ADD COLUMN IF NOT EXISTS is_deleted boolean default false;

-- 2. Add column to track when it was deleted (for auto-GC)
ALTER TABLE public.client_scopes
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 3. Backfill existing records if they have it defined inside their JSONB
UPDATE public.client_scopes
SET 
  is_deleted = COALESCE((generated_proposal->>'is_deleted')::boolean, false),
  deleted_at = (generated_proposal->>'deleted_at')::timestamptz
WHERE 
  generated_proposal->>'is_deleted' IS NOT NULL;
