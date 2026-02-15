# Production Migration Guide: v2.0 Schema

## Overview

This guide walks through applying the v2.0 schema migration to your production Supabase database.

**Migration file:** `20260216000000_multiple_records_per_day.sql`
**Estimated duration:** 2-5 minutes (depends on data volume)
**Downtime required:** None (blue-green pattern)

## Pre-Migration Checklist

- [ ] **Backup verification**: Confirm automatic Supabase backups are enabled
- [ ] **Application deployment**: Prepare v2.0 application code for deployment post-migration
- [ ] **Team notification**: Inform team of migration window
- [ ] **Read migration SQL**: Review `20260216000000_multiple_records_per_day.sql` to understand changes
- [ ] **Monitor access**: Ensure access to Supabase Dashboard and application logs

## Migration Steps

### Option A: Supabase Dashboard SQL Editor (Recommended)

1. **Navigate to SQL Editor**
   - Open Supabase Dashboard → Your Project
   - Go to "SQL Editor" in left sidebar

2. **Create new query**
   - Click "+ New Query"

3. **Paste migration SQL**
   - Open `supabase/migrations/20260216000000_multiple_records_per_day.sql`
   - Copy entire contents (lines 1-135)
   - Paste into SQL Editor

4. **Review migration**
   - Scroll through to verify content
   - Key operations:
     - Renames `workouts` → `workouts_v1_backup`
     - Creates new `workouts` table with v2.0 schema
     - Migrates all data (zero loss)
     - Verifies row count match
     - Creates indexes and RLS policies

5. **Run migration**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Watch for success message: "Migration verification passed: X rows migrated successfully"
   - **If error occurs:** See Troubleshooting section below

6. **Verify in Table Editor**
   - Go to "Table Editor" → Select "workouts" table
   - Confirm new columns exist: `id`, `record_type`, `text_content`, `photo_url`, `deleted_at`, `updated_at`
   - Check data: All existing records should show `record_type = 'workout'`
   - Verify row count matches pre-migration count

### Option B: Supabase CLI (Alternative)

If you have Supabase CLI installed and linked:

```bash
# Install CLI (if needed)
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
supabase db push

# Verify
supabase db diff
```

## Post-Migration Verification

### 1. Data Integrity Check

Run these queries in SQL Editor:

```sql
-- Check row counts match
SELECT
  (SELECT COUNT(*) FROM workouts_v1_backup) as backup_count,
  (SELECT COUNT(*) FROM workouts) as new_count;
-- Both should be identical

-- Verify all records are type 'workout'
SELECT COUNT(*) FROM workouts WHERE record_type = 'workout';
-- Should equal total row count

-- Check no deleted records
SELECT COUNT(*) FROM workouts WHERE deleted_at IS NOT NULL;
-- Should be 0
```

### 2. RLS Policy Check

Test as a regular user (not database owner):

```sql
-- Should return only your own records
SELECT * FROM workouts WHERE deleted_at IS NULL;

-- Try to insert a record
INSERT INTO workouts (user_id, workout_date, record_type)
VALUES (auth.uid(), CURRENT_DATE, 'workout');
-- Should succeed

-- Try to update own record
UPDATE workouts
SET updated_at = NOW()
WHERE user_id = auth.uid()
  AND workout_date = CURRENT_DATE;
-- Should succeed
```

### 3. Application Testing

1. **Deploy v2.0 application code** to match new schema
2. **Test critical flows:**
   - User login
   - Create workout record
   - View calendar (existing records appear)
   - Team view (team members' records visible)
3. **Monitor error logs** for 24 hours
4. **Check offline sync** (if enabled) works with new schema

### 4. Index Performance Check

```sql
-- Verify indexes created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'workouts'
ORDER BY indexname;

-- Expected indexes:
-- - idx_workouts_user_date (user_id, workout_date)
-- - idx_workouts_date (workout_date)
-- - idx_workouts_deleted (deleted_at) WHERE deleted_at IS NULL
-- - workouts_pkey (id) - primary key
```

## Monitoring Period (7 Days)

The migration creates a backup table `workouts_v1_backup` retained for 7 days.

**Daily checks:**
- [ ] Application errors related to workouts (check logs)
- [ ] User reports of missing data
- [ ] Performance degradation

**After 7 days of stable operation:**
- Drop backup table to reclaim storage:

```sql
-- Only run after 7 days of verified stability
DROP TABLE IF EXISTS public.workouts_v1_backup;
```

## Rollback Procedure

**⚠️ WARNING:** Rollback will lose ALL data created after migration (new workout/text/photo records).

Only rollback if:
- Critical bug discovered in v2.0 schema
- Data corruption detected
- Application cannot be fixed quickly

### Rollback Steps

1. **Notify team immediately**
2. **Stop application** to prevent new data creation
3. **Run rollback script:**

```sql
-- In Supabase Dashboard SQL Editor
-- Paste contents of supabase/migrations/rollback_migration.sql
-- Or run manually:

BEGIN;

DROP TABLE IF EXISTS public.workouts CASCADE;
ALTER TABLE public.workouts_v1_backup RENAME TO workouts;

-- Verification
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.workouts;
  RAISE NOTICE 'Rollback complete: % rows restored to v1.0 schema', row_count;
END $$;

COMMIT;
```

4. **Verify rollback:**
   - Check `workouts` table has composite PRIMARY KEY (user_id, workout_date)
   - Confirm data matches pre-migration state
5. **Rollback application** to v1.x version
6. **Investigate root cause** before attempting migration again

## Troubleshooting

### Error: "Migration verification failed: row count mismatch"

**Cause:** Data migration INSERT failed
**Action:**
1. Check error details in SQL Editor
2. Rollback immediately (see Rollback Procedure)
3. Review migration SQL for issues
4. Contact support if needed

### Error: "Relation workouts already exists"

**Cause:** Migration already applied, or previous migration failed
**Action:**
1. Check if `workouts` table has new schema (id column exists)
2. If yes: Migration already applied, no action needed
3. If no: Check for `workouts_v1_backup` table existence
4. If backup exists: Drop `workouts` and re-run migration
5. If backup missing: Contact support, do NOT proceed

### Error: "Permission denied for table workouts"

**Cause:** Insufficient database privileges
**Action:**
1. Ensure you're logged in as database owner
2. In Supabase Dashboard, verify you have admin access
3. Check project permissions in Team Settings

### Performance degradation after migration

**Cause:** Indexes not created, or statistics outdated
**Action:**
1. Verify indexes exist (see Index Performance Check)
2. Update table statistics:
   ```sql
   ANALYZE public.workouts;
   ```
3. Monitor query performance in Supabase Dashboard

## Support

**Migration issues:**
- Review this guide thoroughly
- Check Supabase Dashboard logs
- Consult `LOCAL_TESTING_SKIPPED.md` for deviation notes
- Contact team lead before rollback

**Post-migration bugs:**
- Document issue (table structure, query, error message)
- Check if rollback needed (data loss vs. bug severity)
- Consider fix-forward if minor issue

## Summary

This migration enables v2.0 features (multiple records per day, text/photo entries) while preserving all existing data. The blue-green table rename pattern ensures zero data loss and quick rollback if needed.

**Key points:**
- ✓ Zero downtime migration
- ✓ Zero data loss (backup retained 7 days)
- ✓ RLS policies updated for new schema
- ✓ Rollback script ready
- ✓ Verification built into migration SQL

**Timeline:**
- Migration: 2-5 minutes
- Verification: 15 minutes
- Monitoring: 7 days
- Backup cleanup: After 7 days

---

**Migration file:** supabase/migrations/20260216000000_multiple_records_per_day.sql
**Rollback file:** supabase/migrations/rollback_migration.sql
**Created:** 2026-02-15
**Phase:** 08-01 (Schema Migration)
