---
phase: 14-admin-audit
plan: 02
subsystem: database
tags: [rls, postgres, audit, fable, fsharp]

# Dependency graph
requires:
  - phase: 14-01
    provides: "audit.record_version table with AFTER triggers and log_change() function"
provides:
  - "RLS policies for admin role management (user_roles INSERT/DELETE)"
  - "RLS policy for audit log viewing (audit.record_version SELECT)"
  - "Updated workouts RLS policy allowing admins to view soft-deleted records"
  - "Default admin user initialization (ohama100@naver.com)"
  - "Audit.fs F# module with getRecentChanges, restoreWorkout, getDeletedWorkouts functions"
affects: [14-03-admin-ui, 14-04-restore-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin RLS policy pattern: is_admin() function guards for role management"
    - "Admin bypass pattern: workouts policy allows admins to view ALL records including soft-deleted"
    - "Audit log RLS: read-only SELECT policy for admins (triggers write, humans read)"
    - "JSONB handling pattern: keep record/old_record as obj type for dynamic access with ? operator"

key-files:
  created:
    - supabase/migrations/20260216150000_admin_audit_policies.sql
    - src/Supabase/Audit.fs
  modified:
    - src/App.fsproj

key-decisions:
  - "Admin bypass for workouts viewing: Enables viewing soft-deleted records for restoration (ADM-05)"
  - "Audit log read-only: No write policies, triggers handle all writes (research Anti-Pattern)"
  - "JSONB as obj type: Avoids snake_case mismatch with F# records (research Pitfall 4)"
  - "Result<T, string> return type: Consistent error handling pattern across all Audit.fs functions"

patterns-established:
  - "Admin role management via RLS: user_roles INSERT/DELETE policies gated by is_admin()"
  - "Audit query pattern: query with schema option createObj [\"schema\" ==> \"audit\"]"
  - "Soft-delete restoration: update deleted_at = null on workouts table"

# Metrics
duration: 4min
completed: 2026-02-16
---

# Phase 14 Plan 02: Admin Audit Policies Summary

**RLS policies for admin role management, soft-delete viewing, and audit log access with F# query module**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-16T08:09:34Z
- **Completed:** 2026-02-16T08:13:39Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Admin RLS policies enable role management (INSERT/DELETE on user_roles)
- Updated workouts RLS policy allows admins to view ALL records including soft-deleted
- Audit log RLS protects audit.record_version with admin-only SELECT policy
- Default admin user (ohama100@naver.com) initialized from existing auth.users
- Audit.fs module provides getRecentChanges, restoreWorkout, getDeletedWorkouts functions
- Bonus functions: getChangesByTable, getChangesByUser for filtered audit queries

## Task Commits

Each task was committed atomically:

1. **Task 1: Create admin RLS policies and default admins migration** - `f8739a9` (feat)
2. **Task 2: Create Audit.fs module with query and restore functions** - `d1a05db` (feat)

## Files Created/Modified
- `supabase/migrations/20260216150000_admin_audit_policies.sql` - RLS policies for user_roles (admin role management), workouts (admin view all including deleted), audit.record_version (admin read-only), default admin initialization
- `src/Supabase/Audit.fs` - F# module with AuditEntry type and functions for querying audit logs, viewing deleted workouts, and restoring soft-deleted records
- `src/App.fsproj` - Registered Audit.fs in Supabase section after Admin.fs

## Decisions Made

**1. Admin bypass for workouts viewing**
- Rationale: Admins need to see deleted_at IS NOT NULL records for restoration functionality (ADM-05)
- Implementation: Updated workouts SELECT policy with OR public.is_admin() clause
- Impact: Admin users see ALL workout records regardless of deleted_at value

**2. Audit log read-only RLS**
- Rationale: Triggers write to audit.record_version, humans should only read (research Anti-Pattern)
- Implementation: Only SELECT policy created, no INSERT/UPDATE/DELETE policies
- Impact: Prevents accidental or malicious modification of audit history

**3. JSONB fields as obj type**
- Rationale: JSONB has snake_case keys that won't match F# record fields (research Pitfall 4)
- Implementation: AuditEntry.record and old_record typed as obj, UI accesses with ? operator
- Impact: Flexible JSONB access without deserialization issues

**4. Bonus audit query functions**
- Rationale: Common filtering patterns for audit log viewing UI
- Implementation: Added getChangesByTable and getChangesByUser functions
- Impact: Phase 14-03 admin UI can filter audit logs by table or user without new backend code

## Deviations from Plan

None - plan executed exactly as written.

Plan specified 3 must-have functions (getRecentChanges, restoreWorkout, getDeletedWorkouts) - delivered those plus 2 bonus filtering functions (getChangesByTable, getChangesByUser) that follow same pattern and will be useful for Phase 14-03 admin UI.

## Issues Encountered

**1. Index comment syntax error**
- Issue: COMMENT ON INDEX idx_record_version_ts failed because index is in audit schema
- Resolution: Re-ran with schema-qualified name: COMMENT ON INDEX audit.idx_record_version_ts
- Impact: Fixed immediately, no remaining issues

**2. Fable script name**
- Issue: npm run fable script doesn't exist, only fable:watch
- Resolution: Used direct dotnet fable src/App.fsproj -o src command
- Impact: Compilation succeeded, no functional difference

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 14-03 (Admin UI):**
- RLS policies in place for role management (INSERT/DELETE on user_roles)
- Audit.fs module exports all required functions (getRecentChanges, restoreWorkout, getDeletedWorkouts)
- Admin can view soft-deleted workouts (workouts RLS policy allows)
- Audit log queries return Result<T, string> for consistent error handling

**Next phase should:**
- Create admin UI components for viewing audit logs (call Audit.getRecentChanges)
- Add role management UI (INSERT/DELETE to user_roles table with RLS enforcement)
- Add soft-delete restoration UI (call Audit.restoreWorkout)
- Wire Audit.getDeletedWorkouts to display deleted records table

**No blockers identified.**

---
*Phase: 14-admin-audit*
*Completed: 2026-02-16*
