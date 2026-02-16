---
phase: 14-admin-audit
plan: 01
subsystem: database
tags: [postgresql, audit, triggers, jsonb, plpgsql]

# Dependency graph
requires:
  - phase: 08-schema-migration
    provides: "Soft delete pattern with deleted_at column for undo support"
  - phase: 06-admin-offline
    provides: "RBAC infrastructure with user_roles table"
provides:
  - "audit.record_version table with JSONB snapshots for complete audit trail"
  - "Generic audit.log_change() trigger function with SECURITY DEFINER"
  - "Automatic change logging on workouts, profiles, user_roles tables"
  - "BRIN index on timestamp for efficient time-series queries"
affects: [14-02-admin-ui, 14-03-undo-system, admin-dashboard, compliance-reporting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Trigger-based audit logging with AFTER triggers for complete state capture"
    - "JSONB snapshots for schema-flexible change tracking"
    - "BRIN indexing for time-series audit data"
    - "SECURITY DEFINER for privilege escalation to access auth.users"
    - "pg_trigger_depth() guard for recursion prevention"

key-files:
  created:
    - "supabase/migrations/20260216140000_audit_schema.sql"
  modified: []

key-decisions:
  - "AFTER triggers instead of BEFORE: Capture final state after all trigger chains execute"
  - "JSONB for record snapshots: Schema-flexible, queryable, native PostgreSQL support"
  - "BRIN index on timestamp: Optimal for time-series queries, much smaller than B-tree"
  - "SECURITY DEFINER on log_change(): Enable auth.users lookup without granting direct access"
  - "pg_trigger_depth() guard: Prevent recursion if future triggers added to audit table"
  - "gen_random_uuid() for workouts record_id: workouts.id is BIGSERIAL, audit uses UUID"

patterns-established:
  - "Generic trigger function pattern: Single log_change() function reused across tables"
  - "User context capture: auth.uid() + auth.users lookup for user_id and user_email"
  - "Operation-based JSONB population: record for INSERT/UPDATE, old_record for UPDATE/DELETE"
  - "Table-specific record_id logic: CASE statement handles different PK types"

# Metrics
duration: 2min
completed: 2026-02-16
---

# Phase 14 Plan 01: Audit Infrastructure Summary

**Trigger-based audit logging with JSONB snapshots capturing all changes to workouts, profiles, and user_roles tables**

## Performance

- **Duration:** 2 min 13 sec
- **Started:** 2026-02-16T08:00:15Z
- **Completed:** 2026-02-16T08:02:28Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created audit schema with record_version table for comprehensive change tracking
- Implemented generic log_change() trigger function with SECURITY DEFINER privilege escalation
- Attached triggers to workouts, profiles, user_roles for automatic audit logging
- Verified INSERT/UPDATE/DELETE operations create correct JSONB snapshots
- Optimized time-series queries with BRIN index on timestamp column

## Task Commits

Each task was committed atomically:

1. **Task 1: Create audit schema with trigger-based change logging** - `7f4266f` (feat)

## Files Created/Modified
- `supabase/migrations/20260216140000_audit_schema.sql` - Complete audit infrastructure: schema, table (12 columns), 5 indexes (BRIN + B-tree), generic trigger function, 3 table triggers

## Decisions Made

**1. AFTER triggers for complete state capture**
- Rationale: Capture final state after all trigger chains execute (vs BEFORE which sees intermediate state)
- Research basis: 14-RESEARCH.md Pattern 2

**2. JSONB for record snapshots**
- Rationale: Schema-flexible (handles future column additions), queryable with -> operators, native PostgreSQL type
- Trade-off: Slightly larger storage than normalized approach, but eliminates need for schema synchronization
- Research basis: 14-RESEARCH.md Pattern 1

**3. BRIN index on timestamp**
- Rationale: Time-series data is monotonically increasing, BRIN index is ~90% smaller than B-tree for same performance
- Use case: Audit queries are typically time-range based ("show changes in last week")
- Research basis: 14-RESEARCH.md Pitfall 6

**4. SECURITY DEFINER for auth.users lookup**
- Rationale: Trigger function needs to lookup user email from auth.users, but table access restricted by RLS
- Security: Function runs with owner privileges (postgres), enabling auth.users SELECT without granting direct access
- Alternative considered: Store only user_id (rejected - user_email valuable for audit reports)

**5. pg_trigger_depth() recursion guard**
- Rationale: Prevent infinite loop if future triggers added to audit.record_version table
- Pattern: IF pg_trigger_depth() > 1 THEN RETURN immediately
- Research basis: 14-RESEARCH.md Pitfall 1

**6. gen_random_uuid() for workouts record_id**
- Rationale: workouts.id is BIGSERIAL (not UUID), but audit.record_version.record_id is UUID type for profiles/user_roles compatibility
- Alternative considered: Change audit.record_id to BIGINT (rejected - profiles.id is UUID)
- Trade-off: workouts audit entries can't easily join back to workouts.id, but record JSONB contains id field

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - migration applied successfully, all triggers verified working.

## User Setup Required

None - no external service configuration required. This is pure database infrastructure.

## Verification Results

**Database structure:**
- ✅ audit.record_version table exists with 12 columns (id, record_id, old_record_id, op, ts, user_id, user_email, table_oid, table_schema, table_name, record, old_record)
- ✅ 5 indexes created: PK, BRIN on ts, B-tree on table_oid, B-tree on record_id (WHERE NOT NULL), B-tree on user_id (WHERE NOT NULL)
- ✅ audit.log_change() function exists with SECURITY DEFINER (prosecdef = t)

**Triggers attached:**
- ✅ audit_workouts on public.workouts
- ✅ audit_profiles on public.profiles
- ✅ audit_user_roles on public.user_roles

**Functional testing:**
- ✅ INSERT operation: record JSONB populated, old_record NULL
- ✅ UPDATE operation: both record and old_record JSONB populated with correct before/after state
- ✅ DELETE operation: record NULL, old_record JSONB populated

**JSONB structure validation:**
- ✅ Snake_case keys preserved (workout_date, record_type, user_id)
- ✅ All columns captured including metadata (created_at, updated_at, deleted_at)
- ✅ Timestamp values in ISO 8601 format with timezone

## Next Phase Readiness

**Ready for Plan 14-02 (Admin UI):**
- ✅ Audit infrastructure complete and verified
- ✅ All admin-managed tables (workouts, profiles, user_roles) have audit logging
- ✅ JSONB snapshots provide complete before/after state for UI display

**Ready for Plan 14-03 (Undo System):**
- ✅ old_record JSONB contains complete state for undo operations
- ✅ User context (user_id, user_email) enables permission checking
- ✅ Table metadata (table_name, table_oid) enables dynamic table routing

**Performance considerations:**
- BRIN index on timestamp optimized for time-series queries
- If audit table grows large (>1M rows), consider partitioning by timestamp (monthly/yearly)
- Current implementation: No retention policy - audit logs accumulate indefinitely

**No blockers or concerns.**

---
*Phase: 14-admin-audit*
*Completed: 2026-02-16*
