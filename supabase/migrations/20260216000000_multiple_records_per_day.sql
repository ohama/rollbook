-- Migration: Enable multiple workout records per day
--
-- Breaking change: Removes UNIQUE(user_id, workout_date) constraint
-- Strategy: Blue-green table rename for zero-data-loss migration
-- Backup retention: 7 days (workouts_v1_backup)
--
-- v2.0 Features enabled:
-- - Multiple records per day (텍스트/사진 기록)
-- - Record types: workout, text, photo
-- - Soft delete support (deleted_at)
-- - Updated timestamp tracking
--
-- Rollback: See rollback_migration.sql

BEGIN;

-- Step 1: Rename existing table to backup
-- This preserves all existing data for 7-day retention
ALTER TABLE public.workouts RENAME TO workouts_v1_backup;

-- Step 2: Create new workouts table with v2.0 schema
-- Primary key changed from composite (user_id, workout_date) to BIGSERIAL id
CREATE TABLE public.workouts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'workout' CHECK (record_type IN ('workout', 'text', 'photo')),
  text_content TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Step 3: Migrate existing data
-- All existing records become record_type='workout'
INSERT INTO public.workouts (
  user_id,
  workout_date,
  record_type,
  text_content,
  photo_url,
  created_at,
  updated_at,
  deleted_at
)
SELECT
  user_id,
  workout_date,
  'workout'::TEXT as record_type,
  NULL as text_content,
  NULL as photo_url,
  created_at,
  NULL as updated_at,
  NULL as deleted_at
FROM public.workouts_v1_backup;

-- Step 4: Verification block
-- Compare row counts and raise exception if mismatch
DO $$
DECLARE
  v1_count INTEGER;
  v2_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v1_count FROM public.workouts_v1_backup;
  SELECT COUNT(*) INTO v2_count FROM public.workouts;

  IF v1_count != v2_count THEN
    RAISE EXCEPTION 'Migration verification failed: workouts_v1_backup has % rows but workouts has % rows',
      v1_count, v2_count;
  END IF;

  RAISE NOTICE 'Migration verification passed: % rows migrated successfully', v2_count;
END $$;

-- Step 5: Drop old indexes inherited by backup table (name conflicts)
DROP INDEX IF EXISTS idx_workouts_date;

-- Create indexes for performance
-- Primary access pattern: user_id + workout_date
CREATE INDEX idx_workouts_user_date ON public.workouts(user_id, workout_date);

-- Date-range queries for calendar view
CREATE INDEX idx_workouts_date ON public.workouts(workout_date);

-- Partial index for active records (soft delete support)
CREATE INDEX idx_workouts_deleted ON public.workouts(deleted_at) WHERE deleted_at IS NULL;

-- Step 6: Enable Row Level Security
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
-- Policy: SELECT - Users can view all non-deleted records (for team visibility)
-- Note: Team visibility is controlled by separate team membership checks in application
CREATE POLICY "Users can view non-deleted workouts"
  ON public.workouts FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Policy: INSERT - Users can create their own records
CREATE POLICY "Users can insert own workouts"
  ON public.workouts FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: UPDATE - Users can update their own non-deleted records
-- This enables soft delete (setting deleted_at)
CREATE POLICY "Users can update own workouts"
  ON public.workouts FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND deleted_at IS NULL
  )
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Step 8: Add table comment documenting schema version
COMMENT ON TABLE public.workouts IS 'v2.0 schema: Multiple workout records per day with record types (workout/text/photo). Supports soft delete via deleted_at. Migrated from v1.0 composite PK to BIGSERIAL id. RLS enabled. Backup retained in workouts_v1_backup for 7 days.';

-- Step 9: Add column comments for clarity
COMMENT ON COLUMN public.workouts.id IS 'Primary key (v2.0): BIGSERIAL for multiple records per day';
COMMENT ON COLUMN public.workouts.record_type IS 'Record type: workout (운동), text (텍스트 기록), photo (사진 기록)';
COMMENT ON COLUMN public.workouts.text_content IS 'Text note content for record_type=text';
COMMENT ON COLUMN public.workouts.photo_url IS 'Supabase storage URL for record_type=photo';
COMMENT ON COLUMN public.workouts.deleted_at IS 'Soft delete timestamp (NULL = active)';
COMMENT ON COLUMN public.workouts.updated_at IS 'Last update timestamp for audit trail';

COMMIT;

-- Migration complete
-- Next steps:
-- 1. Verify migration success in Supabase Dashboard
-- 2. Test application with new schema
-- 3. Monitor for 7 days before dropping workouts_v1_backup
-- 4. Drop backup: DROP TABLE public.workouts_v1_backup;
