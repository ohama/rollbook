# Phase 8: Schema Migration - Research

**Researched:** 2026-02-15
**Domain:** PostgreSQL schema migration, offline queue compatibility, RLS policy updates
**Confidence:** HIGH

## Summary

Phase 8 migrates the database from one-record-per-day (composite PRIMARY KEY on user_id, workout_date) to multiple-records-per-day (BIGSERIAL id PRIMARY KEY). This is a breaking schema change affecting database, offline queue, and RLS policies. The LIVE production system with ~20 users requires zero-data-loss migration with rollback capability.

**Critical finding:** The current offline queue uses `onConflict: "user_id,workout_date"` which will break after migration. Queue operations must be versioned or cleared before migration. IndexedDB schema version must be bumped to v2.

**Primary recommendation:** Use table rename + migrate + verify pattern. Keep backup table for 1 week. Clear offline queue 24h before migration. Update IndexedDB version and queue structure simultaneously with database migration.

## Standard Stack

The established tools for this migration:

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Supabase CLI | Latest (Feb 2026) | Database migrations | Built-in migration system, auto-generates SQL diffs, version controlled migrations, production-ready |
| PostgreSQL | 15.x (Supabase default) | Database engine | Standard for Supabase, supports transactional DDL, composite key alterations |
| idb | 8.x | IndexedDB wrapper | Current project dependency, handles version upgrades with onupgradeneeded |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pg_dump | 15.x | Backup utility | Pre-migration backup, disaster recovery |
| psql | 15.x | SQL execution | Testing migration locally, rollback scripts |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase CLI | Flyway/Liquibase | More complex, requires external tool, not Supabase-native |
| Table rename pattern | ALTER TABLE DROP CONSTRAINT | Higher risk, longer locks, harder rollback |
| Clear queue | Dual-write queue versioning | More complex code, harder to test |

**Installation:**

Already installed from v1.1:
```bash
# Supabase CLI already available
supabase --version

# idb already in package.json
npm list idb
```

No new dependencies needed.

## Architecture Patterns

### Recommended Migration Approach

**Pattern: Table Rename + Migrate + Verify (Blue-Green for Database)**

This pattern provides safe rollback without data loss:

```
Current State:
  workouts table (PRIMARY KEY user_id, workout_date)

Migration Steps:
  1. Rename workouts → workouts_v1_backup
  2. Create new workouts table (id BIGSERIAL PRIMARY KEY)
  3. Copy data from backup to new table
  4. Verify data integrity (row count, sample records)
  5. Update RLS policies on new table
  6. Keep backup table for 1 week
  7. Drop backup after production validation

Rollback Plan:
  - If migration fails: DROP new table, RENAME backup back to workouts
  - If post-deploy issues: Same rollback within 1 week retention window
```

**Why this pattern:**
- Zero data loss (backup table preserved)
- Fast rollback (simple RENAME)
- Clear verification step
- Production-tested pattern (from GoCardless, Xata.io research)

### Pattern 1: Composite PK to SERIAL Migration

**What:** Remove composite PRIMARY KEY, add auto-increment id column

**Migration SQL:**

```sql
-- Migration: 20260216_multiple_records_per_day.sql

BEGIN;

-- Step 1: Rename existing table (preserves data)
ALTER TABLE public.workouts RENAME TO workouts_v1_backup;

-- Step 2: Create new table with id primary key
CREATE TABLE public.workouts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'workout'
    CHECK (record_type IN ('workout', 'text', 'photo')),
  text_content TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Step 3: Copy existing data (all become record_type = 'workout')
INSERT INTO public.workouts (user_id, workout_date, record_type, created_at)
SELECT user_id, workout_date, 'workout', created_at
FROM workouts_v1_backup;

-- Step 4: Verify data integrity
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM workouts_v1_backup;
  SELECT COUNT(*) INTO new_count FROM workouts WHERE record_type = 'workout';

  IF old_count != new_count THEN
    RAISE EXCEPTION 'Data migration failed: old=%, new=%', old_count, new_count;
  END IF;

  RAISE NOTICE 'Migration verified: % records migrated', new_count;
END $$;

-- Step 5: Create indexes for query performance
CREATE INDEX idx_workouts_user_date ON public.workouts(user_id, workout_date);
CREATE INDEX idx_workouts_date ON public.workouts(workout_date);
CREATE INDEX idx_workouts_deleted ON public.workouts(deleted_at)
  WHERE deleted_at IS NULL;

-- Step 6: Enable RLS (required before policies)
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Step 7: Recreate RLS policies for new table

-- SELECT: Team visibility (all users see all non-deleted records)
CREATE POLICY "Users can view all workouts"
  ON public.workouts FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- INSERT: Users can create own records
CREATE POLICY "Users can insert own workouts"
  ON public.workouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update own non-deleted records
CREATE POLICY "Users can update own workouts"
  ON public.workouts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Soft delete (actually UPDATE deleted_at)
-- Hard DELETE policy for admins only (via UPDATE to set deleted_at)
CREATE POLICY "Users can soft-delete own workouts"
  ON public.workouts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Step 8: Table comment documenting changes
COMMENT ON TABLE public.workouts IS
  'v2.0 schema: Multiple records per day supported. Soft delete via deleted_at. RLS enabled.';

COMMIT;
```

**Rollback script:**

```sql
-- Rollback: Drop new table, restore backup
BEGIN;

DROP TABLE IF EXISTS public.workouts CASCADE;
ALTER TABLE public.workouts_v1_backup RENAME TO workouts;

ROLLBACK; -- Test rollback first, then COMMIT when ready
```

**Source:** [PostgreSQL Primary Key - A Complete Guide](https://blog.devart.com/postgresql-primary-key.html)

### Pattern 2: IndexedDB Queue Version Migration

**What:** Update offline queue to track record IDs instead of (user_id, date) pairs

**Current queue structure (v1):**

```fsharp
type QueuedOperation = {
    id: int option
    operationType: string    // "CreateWorkout" | "DeleteWorkout"
    userId: string
    workoutDate: string
    timestamp: float
    retryCount: int
}
```

**New queue structure (v2):**

```fsharp
type QueuedOperation = {
    id: int option
    operationType: string    // "CreateWorkout" | "UpdateWorkout" | "DeleteWorkout"
    recordId: int64 option   // NEW: For update/delete operations
    userId: string
    workoutDate: string
    recordType: string       // NEW: "workout" | "text" | "photo"
    textContent: string option
    photoUrl: string option
    timestamp: float
    retryCount: int
}
```

**Migration strategy:**

```fsharp
// offline/Queue.fs - Update database version

let private dbVersion = 2  // Increment from 1 to 2

let private getDb () : JS.Promise<obj> =
    let upgradeConfig =
        createObj [
            "upgrade" ==> fun (db: obj) (oldVersion: int) (newVersion: int) ->
                printfn "IndexedDB upgrade: %d → %d" oldVersion newVersion

                // v1 → v2: Add new fields to queue store
                if oldVersion < 2 then
                    // Clear existing queue (safest migration path)
                    // Alternative: could migrate each record, but complex
                    if db?objectStoreNames?contains(storeName) then
                        let tx = db?transaction([| storeName |], "readwrite")
                        let store = tx?objectStore(storeName)
                        store?clear() |> ignore
                        printfn "Cleared v1 queue during upgrade"

                    // No schema change needed (IndexedDB is schemaless for fields)
                    // But we document the new structure here
                    ()
        ]
    openDB dbName dbVersion upgradeConfig
```

**Alternative: Pre-migration queue clear:**

Deploy notification 24h before migration:
```fsharp
// Display banner in UI
"중요: 2월 16일 시스템 업데이트 예정.
오프라인 기록이 있다면 온라인 상태에서 앱을 여세요."
```

**Source:** [Using IndexedDB - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB), [Migrating existing DB to Dexie](https://dexie.org/docs/Tutorial/Migrating-existing-DB-to-Dexie)

### Pattern 3: Offline Sync Compatibility

**What:** Update sync logic to handle new schema

**Current sync (v1):**

```fsharp
// Sync.fs - replayOperation function
client
    ?from("workouts")
    ?upsert(
        createObj [
            "user_id" ==> operation.userId
            "workout_date" ==> operation.workoutDate
        ],
        createObj ["onConflict" ==> "user_id,workout_date"]  // BREAKS after migration
    )
```

**New sync (v2):**

```fsharp
// Sync.fs - updated replayOperation
match operation.operationType with
| "CreateWorkout" ->
    // No longer use onConflict (no unique constraint)
    let! response =
        client
            ?from("workouts")
            ?insert(
                createObj [
                    "user_id" ==> operation.userId
                    "workout_date" ==> operation.workoutDate
                    "record_type" ==> operation.recordType
                    "text_content" ==> operation.textContent
                    "photo_url" ==> operation.photoUrl
                ]
            )
    // Handle response...

| "UpdateWorkout" ->
    // NEW: Update specific record by id
    let! response =
        client
            ?from("workouts")
            ?update(
                createObj [
                    "record_type" ==> operation.recordType
                    "text_content" ==> operation.textContent
                    "updated_at" ==> System.DateTime.UtcNow
                ]
            )
            ?eq("id", operation.recordId)
    // Handle response...

| "DeleteWorkout" ->
    // Soft delete by id
    let! response =
        client
            ?from("workouts")
            ?update(createObj ["deleted_at" ==> System.DateTime.UtcNow])
            ?eq("id", operation.recordId)
    // Handle response...
```

**Critical:** Deploy queue update AFTER database migration, in same release.

### Anti-Patterns to Avoid

**Anti-Pattern 1: ALTER TABLE DROP CONSTRAINT without backup**

Don't do:
```sql
ALTER TABLE workouts DROP CONSTRAINT workouts_pkey;
ALTER TABLE workouts ADD COLUMN id BIGSERIAL PRIMARY KEY;
```

Why bad: No rollback path, long ACCESS EXCLUSIVE lock, risk of corruption

**Anti-Pattern 2: Dual-write during migration**

Don't do: Write to both old and new tables simultaneously

Why bad: Complex logic, race conditions, hard to test, over-engineering

**Anti-Pattern 3: Client-side queue migration**

Don't do: Try to migrate IndexedDB records to new format on client

Why bad: Unpredictable success rate, users may not open app, data loss risk

Better: Clear queue before migration, or accept queue loss as acceptable (workout toggle can be re-done)

## Don't Hand-Roll

Problems that have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Zero-downtime migrations | Custom dual-table write logic | Table rename pattern (shown above) | Well-tested, simple rollback, minimal code |
| Database backups | Custom pg_dump scripts | Supabase CLI `supabase db dump` | Integrated, handles auth properly |
| Migration versioning | Custom SQL file numbering | Supabase migration timestamps | Auto-generated, conflict-free |
| Queue conflict resolution | Custom merge logic | Clear queue before migration | Simpler, acceptable data loss for toggles |
| RLS policy testing | Manual user creation | Supabase Dashboard RLS helper | Built-in policy simulator |

**Key insight:** For a ~20 user system, simplicity beats sophistication. Clearing the queue is acceptable (users can re-toggle workout). Backup table retention is sufficient rollback strategy.

## Common Pitfalls

### Pitfall 1: Offline Queue Breaks After Migration

**What goes wrong:** Existing queued operations use `onConflict: "user_id,workout_date"` which no longer exists after removing UNIQUE constraint. Queue replay fails silently or creates unexpected behavior.

**Why it happens:**
- Queue operations created before migration reference old schema
- Supabase upsert with non-existent conflict target may silently become INSERT
- No version check in sync code

**How to avoid:**
1. **Clear queue 24h before migration** - Deploy notification banner
2. **Version queue operations** - Add `version: 2` field to new operations
3. **Handle version mismatch in sync**:
   ```fsharp
   if operation.version < 2 then
       // Legacy operation: skip or handle specially
       printfn "Skipping v1 queue operation (schema outdated)"
       dequeue operation.id
   ```
4. **Monitor sync failures** - Track error rate spike after deployment

**Warning signs:**
- Duplicate workout records (same user, same date, different IDs)
- User reports: "My offline workout appeared twice"
- Sync error rate >5% after migration

**Reference:** [Offline-first frontend apps in 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)

### Pitfall 2: IndexedDB Version Upgrade Blocks Users

**What goes wrong:** Deploy new code with `dbVersion = 2`. Users with app open in multiple tabs get blocked from accessing IndexedDB.

**Why it happens:**
- IndexedDB requires all connections to close for version upgrade
- No automatic reload mechanism
- User sees: "VersionError: An attempt was made to open a database using a lower version than the existing version"

**How to avoid:**
1. **Handle onversionchange event**:
   ```javascript
   db.onversionchange = () => {
       db.close()
       if (confirm('앱이 업데이트되었습니다. 새로고침할까요?')) {
           window.location.reload()
       }
   }
   ```
2. **Service Worker reload prompt**:
   ```javascript
   navigator.serviceWorker.addEventListener('controllerchange', () => {
       window.location.reload()
   })
   ```
3. **Test multi-tab scenario** - Open 2 tabs, deploy, verify behavior

**Warning signs:**
- Browser console: "VersionError"
- Offline mode stops working after update
- User can't create workout records

**Reference:** [Dexie: Migrating existing DB](https://dexie.org/docs/Tutorial/Migrating-existing-DB-to-Dexie), [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

### Pitfall 3: RLS Policies Not Updated for New Schema

**What goes wrong:** Create new `workouts` table, forget to add RLS policies. Users get "permission denied" or can see other users' data.

**Why it happens:**
- RLS policies tied to table name (don't auto-copy)
- New table defaults to RLS disabled or no policies
- Easy to forget during migration

**How to avoid:**
1. **Enable RLS immediately** - First line after CREATE TABLE
2. **Copy policies from old table** - Use migration script pattern above
3. **Test RLS** - Create 2 test users, verify isolation
4. **Check Supabase Advisors** - Dashboard shows RLS warnings

**Warning signs:**
- Supabase dashboard shows "RLS not enabled"
- User reports: "I can see someone else's workouts"
- Test: SELECT as different user succeeds when it shouldn't

**Reference:** [Supabase Row Level Security: Complete Guide (2026)](https://designrevision.com/blog/supabase-row-level-security), [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Pitfall 4: Migration Fails Halfway (Corrupt State)

**What goes wrong:** Migration SQL fails mid-execution. Database in inconsistent state (no old table, incomplete new table).

**Why it happens:**
- Network interruption during Supabase migration
- SQL syntax error not caught in local testing
- Constraint violation during data copy

**How to avoid:**
1. **Wrap in transaction** - BEGIN/COMMIT block (shown in migration script)
2. **Test on production snapshot** - `supabase db dump`, restore locally, test migration
3. **Add verification step** - DO block that checks row counts
4. **Keep backup table** - Don't drop immediately

**Warning signs:**
- Migration stops mid-execution
- Error: "relation workouts does not exist"
- Row count mismatch between old and new tables

**Reference:** [Database Migrations | Supabase Docs](https://supabase.com/docs/guides/deployment/database-migrations)

### Pitfall 5: DELETE Policy Doesn't Support Soft Delete

**What goes wrong:** RLS DELETE policy blocks UPDATE to set `deleted_at`. Users can't "delete" their own records.

**Why it happens:**
- Soft delete is UPDATE, not DELETE
- Policy named "DELETE" but needs UPDATE permission
- Confusion between SQL DELETE and logical deletion

**How to avoid:**
1. **Use UPDATE policy for soft delete**:
   ```sql
   CREATE POLICY "Users can soft-delete own workouts"
     ON public.workouts FOR UPDATE  -- Not DELETE!
     TO authenticated
     USING (auth.uid() = user_id AND deleted_at IS NULL)
     WITH CHECK (auth.uid() = user_id);
   ```
2. **No DELETE policy** - Hard delete not allowed for users
3. **Test soft delete** - Try setting `deleted_at` via UPDATE

**Warning signs:**
- Delete button fails with "permission denied"
- Supabase error: "new row violates row-level security policy"
- Works in SQL editor but not from app

**Reference:** [Supabase RLS: Complete Guide](https://vibeappscanner.com/supabase-row-level-security)

## Code Examples

Verified patterns from official sources and current codebase:

### Migration Workflow

```bash
# Step 1: Backup production database
supabase db dump --db-url "$PRODUCTION_DB_URL" > backup_$(date +%Y%m%d).sql

# Step 2: Test migration on local Supabase
cd rollbook
supabase start
supabase db reset  # Clean slate

# Step 3: Create migration file
cat > supabase/migrations/20260216000000_multiple_records_per_day.sql <<'EOF'
-- Migration content from Pattern 1 above
EOF

# Step 4: Apply migration locally
supabase db push

# Step 5: Verify migration worked
supabase db diff  # Should show no changes (migration applied)

# Step 6: Test with local client
npm run dev  # Test app against local DB

# Step 7: Apply to production (if all tests pass)
supabase db push --db-url "$PRODUCTION_DB_URL"

# Step 8: Monitor production
# Watch Supabase logs for errors
# Check RLS policies in dashboard
# Verify row counts match
```

**Source:** [Database Migrations | Supabase Docs](https://supabase.com/docs/guides/deployment/database-migrations)

### Updated Supabase API Functions

```fsharp
// src/Supabase/Workouts.fs - Updated for v2.0 schema

/// Get all records for a specific date (multiple records support)
let getWorkoutsForDate (userId: string) (date: string) : JS.Promise<WorkoutRecord array> =
    promise {
        let query =
            supabase
                ?from("workouts")
                ?select("*")
                ?eq("user_id", userId)
                ?eq("workout_date", date)
                ?is("deleted_at", null)  // Exclude soft-deleted
                ?order("created_at", createObj ["ascending" ==> true])

        let! result = query
        let data = result?data

        if isNull data then [||]
        else unbox<WorkoutRecord array> data
    }

/// Create a new workout record (simple toggle)
let createWorkout (userId: string) (date: string) : JS.Promise<WorkoutResponse> =
    promise {
        let record = createObj [
            "user_id" ==> userId
            "workout_date" ==> date
            "record_type" ==> "workout"
        ]
        // No longer use onConflict - insert creates new record
        let query = supabase?from("workouts")?insert(record)?select()
        let! result = query
        return unbox<WorkoutResponse> result
    }

/// Delete a workout record by id (soft delete)
let deleteWorkout (recordId: int64) : JS.Promise<obj> =
    promise {
        let updates = createObj [
            "deleted_at" ==> System.DateTime.UtcNow.ToString("o")
        ]
        let query =
            supabase
                ?from("workouts")
                ?update(updates)
                ?eq("id", recordId)
        let! result = query
        return result
    }
```

**Source:** Current codebase `src/Supabase/Workouts.fs`, adapted for new schema

### Updated F# Types

```fsharp
// src/Supabase/Types.fs - Updated for v2.0

type RecordType =
    | Workout
    | Text of content: string
    | Photo of url: string

type WorkoutRecord = {
    id: int64                    // NEW: Auto-increment primary key
    user_id: string
    workout_date: string
    record_type: string          // NEW: "workout" | "text" | "photo"
    text_content: string option  // NEW: For text records
    photo_url: string option     // NEW: For photo records
    created_at: string
    updated_at: string option    // NEW: Track edits
    deleted_at: string option    // NEW: Soft delete
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Composite PRIMARY KEY (user_id, date) | BIGSERIAL id PRIMARY KEY | v2.0 (Feb 2026) | Enables multiple records per day |
| Hard DELETE | Soft delete (deleted_at) | v2.0 | Enables undo, audit trail |
| UPSERT with onConflict | INSERT (no conflict handling) | v2.0 | Queue sync logic simpler |
| Single record per date | Array of records per date | v2.0 | UI shows list instead of toggle |
| SERIAL type | BIGSERIAL type | PostgreSQL 10+ | Supports >2 billion records |

**Deprecated/outdated:**
- `onConflict: "user_id,workout_date"` - No longer valid after migration
- Single WorkoutRecord option - Now WorkoutRecord array
- Queue version 1 - Upgrade to version 2 with recordId field

**Source:** [The Evolution of Primary Keys in PostgreSQL](https://java-jedi.medium.com/the-evolution-of-primary-keys-in-postgresql-from-serial-to-identity-and-beyond-f62662bc2595)

## Open Questions

Things that couldn't be fully resolved:

1. **Should we preserve queue operations during migration?**
   - What we know: Clearing queue is safest, simple to implement
   - What's unclear: If users will be frustrated by losing queued toggles
   - Recommendation: Clear queue with 24h notice. For ~20 users, acceptable UX tradeoff

2. **How long to retain backup table?**
   - What we know: Industry standard is 7-30 days
   - What's unclear: Supabase storage costs for duplicate table
   - Recommendation: 7 days (1 week), then drop. Document in migration comment

3. **Should we version the migration itself?**
   - What we know: Supabase timestamps migrations automatically
   - What's unclear: If we need semantic versioning (v1.0 → v2.0 marker)
   - Recommendation: Use timestamp, add comment linking to v2.0 milestone

4. **Test data migration with 1000+ records?**
   - What we know: Current production has ~20 users × ~30 days = ~600 records
   - What's unclear: Performance at scale
   - Recommendation: Seed local DB with 10,000 records, time migration (<1s expected)

## Sources

### Primary (HIGH confidence)

- [PostgreSQL Primary Key - A Complete Guide (2025)](https://blog.devart.com/postgresql-primary-key.html) - Composite key migration patterns
- [Supabase Row Level Security: Complete Guide (2026)](https://designrevision.com/blog/supabase-row-level-security) - RLS policy patterns for UPDATE/DELETE
- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - Official RLS documentation
- [Database Migrations | Supabase Docs](https://supabase.com/docs/guides/deployment/database-migrations) - Migration workflow, rollback strategy
- [Using IndexedDB - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) - Version upgrade mechanics
- [Migrating existing DB to Dexie](https://dexie.org/docs/Tutorial/Migrating-existing-DB-to-Dexie) - Queue migration patterns

### Secondary (MEDIUM confidence)

- [Zero-downtime Postgres migrations - GoCardless](https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts/) - Blue-green pattern inspiration
- [Postgres: Safely renaming a table with no downtime](https://brandur.org/fragments/postgres-table-rename) - Table rename strategy
- [Backup and Restore using the CLI | Supabase Docs](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) - Backup best practices
- [How to handle data migrations in Supabase](https://bootstrapped.app/guide/how-to-handle-data-migrations-in-supabase) - Community patterns

### Tertiary (LOW confidence)

- [Serial Type Columns in PostgreSQL](https://atlasgo.io/guides/postgres/serial-columns) - SERIAL vs IDENTITY discussion
- [The Evolution of Primary Keys in PostgreSQL](https://java-jedi.medium.com/the-evolution-of-primary-keys-in-postgresql-from-serial-to-identity-and-beyond-f62662bc2595) - Historical context

## Metadata

**Confidence breakdown:**
- Migration SQL: HIGH - Standard PostgreSQL patterns, well-documented
- Offline queue compatibility: HIGH - Current codebase examined, clear breakage point
- RLS policy updates: HIGH - Official Supabase docs, verified patterns
- Rollback strategy: MEDIUM - Tested pattern but not on this specific schema
- IndexedDB versioning: MEDIUM - Standard approach but coordination risk

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days - stable domain, schema migration patterns don't change rapidly)

**Critical dependencies:**
- Existing workouts table schema (examined)
- Offline queue implementation (examined)
- RLS policies (examined)
- Supabase CLI version (latest as of Feb 2026)

**Ready for planning:** Yes. All necessary patterns, pitfalls, and code examples documented. Planner can create detailed task breakdown.
