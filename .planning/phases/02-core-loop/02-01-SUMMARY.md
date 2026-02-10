---
phase: 02-core-loop
plan: 01
subsystem: database
tags: [postgresql, supabase, rls, date-type, migrations]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase local development setup, RLS pattern with (SELECT auth.uid()), migration workflow
provides:
  - workouts table with DATE storage and compound primary key
  - Four separate RLS policies for user-owned workout records
  - Database foundation for one-tap workout logging
affects: [02-02, 02-03, calendar-view, workout-history]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Compound primary key (user_id, workout_date) for uniqueness enforcement"
    - "DATE type for date-only storage (4 bytes vs 8 bytes TIMESTAMPTZ)"
    - "Performance-optimized RLS with (SELECT auth.uid()) caching"

key-files:
  created:
    - supabase/migrations/20260210_workouts_schema.sql
  modified: []

key-decisions:
  - "Use DATE type (not TIMESTAMPTZ) - matches 'did I workout today' semantics, no timezone confusion"
  - "Compound primary key enforces one workout per user per date at database level"
  - "Four separate RLS policies (not FOR ALL) - clearer intent, easier debugging"

patterns-established:
  - "DATE storage for calendar-day semantics without time component"
  - "Index on workout_date for future date-range queries"
  - "Foreign key ON DELETE CASCADE to prevent orphaned records"

# Metrics
duration: 2min
completed: 2026-02-10
---

# Phase 02 Plan 01: Workout Schema Summary

**workouts table with DATE storage, compound primary key (user_id, workout_date), and four performance-optimized RLS policies using (SELECT auth.uid()) pattern**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-10T03:45:43Z
- **Completed:** 2026-02-10T03:47:34Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created workouts table with DATE column for workout_date (4 bytes, no timezone issues)
- Compound primary key (user_id, workout_date) enforces one workout per user per date
- Four separate RLS policies (SELECT, INSERT, UPDATE, DELETE) with performance-optimized (SELECT auth.uid())
- Foreign key to auth.users with ON DELETE CASCADE prevents orphaned records
- Index on workout_date for future date-range queries

## Task Commits

Each task was committed atomically:

1. **Task 1: Create workouts table migration with RLS policies** - `5a7e743` (feat)

## Files Created/Modified
- `supabase/migrations/20260210_workouts_schema.sql` - Workouts table schema with RLS policies

## Decisions Made

**1. Use DATE type instead of TIMESTAMPTZ for workout_date**
- Rationale: "Did I workout today" is a calendar-day question, not a timestamp question. DATE type uses 4 bytes vs 8 bytes, eliminates timezone complexity, and matches semantics perfectly.

**2. Compound primary key (user_id, workout_date)**
- Rationale: Enforces uniqueness at database level (one workout per user per date). More reliable than application-level checks, prevents race conditions.

**3. Four separate RLS policies instead of single FOR ALL policy**
- Rationale: Following Phase 1 patterns and RESEARCH.md guidance. Separate policies are clearer in intent, easier to debug, and provide better audit trail.

**4. Wrap auth.uid() in SELECT subquery**
- Rationale: (SELECT auth.uid()) allows PostgreSQL to cache result per statement instead of calling per row, providing ~95% performance improvement according to RESEARCH.md.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - migration applied cleanly on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 02 Plan 02:** Database schema complete, ready for F# bindings and CRUD operations.

**What's available:**
- workouts table with proper schema and constraints
- RLS policies ensuring user data isolation
- Migration applied and verified in local development

**No blockers:** Schema validation passed, RLS enabled, all policies active.

---
*Phase: 02-core-loop*
*Completed: 2026-02-10*
