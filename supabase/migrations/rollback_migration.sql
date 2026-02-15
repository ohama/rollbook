-- Rollback script for 20260216000000_multiple_records_per_day.sql
--
-- WARNING: This rollback script will:
-- 1. Drop the new workouts table (v2.0 schema)
-- 2. Restore workouts_v1_backup to workouts (v1.0 schema)
-- 3. Any data created after migration will be LOST
--
-- Only use this if:
-- - Migration failed verification
-- - Critical bugs discovered in v2.0 schema
-- - Need to revert to v1.0 immediately
--
-- Prerequisites:
-- - workouts_v1_backup table must exist
-- - Coordinate with application deployment rollback

BEGIN;

-- Step 1: Drop new workouts table (v2.0 schema)
-- This removes all post-migration data
DROP TABLE IF EXISTS public.workouts CASCADE;

-- Step 2: Rename backup back to workouts
-- Restores original v1.0 schema with composite PK
ALTER TABLE public.workouts_v1_backup RENAME TO workouts;

-- Step 3: Verification
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.workouts;
  RAISE NOTICE 'Rollback complete: % rows restored to v1.0 schema', row_count;
END $$;

COMMIT;

-- Rollback complete
-- v1.0 schema restored: PRIMARY KEY (user_id, workout_date)
-- Application must be rolled back to v1.x version
