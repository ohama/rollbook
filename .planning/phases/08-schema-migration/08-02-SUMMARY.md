---
phase: 08-schema-migration
plan: 02
subsystem: api
tags: [supabase, indexeddb, schema, soft-delete, migration]

# Dependency graph
requires:
  - phase: 08-01
    provides: New database schema with id, record_type, soft-delete fields
provides:
  - Frontend API functions updated for new schema (no onConflict)
  - Soft-delete support in all queries (deleted_at filter)
  - IndexedDB queue v2 with new field support
  - createWorkout function replacing upsert pattern
affects: [08-03, 09-ui-components, 10-offline-sync]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Soft-delete pattern with deleted_at filter in all queries"
    - "Simple insert instead of upsert for new multi-record schema"
    - "IndexedDB version migration with queue clear strategy"

key-files:
  created: []
  modified:
    - src/Supabase/Workouts.js
    - src/offline/Queue.js

key-decisions:
  - "Remove onConflict pattern - incompatible with multiple records per day"
  - "Clear IndexedDB queue on v1→v2 upgrade (acceptable for ~20 beta users)"
  - "Keep upsertWorkout for backward compatibility during transition"
  - "Add getWorkoutsForDate for multi-record support"

patterns-established:
  - "deleted_at IS NULL filter required in all SELECT queries"
  - "Soft delete via UPDATE deleted_at instead of hard DELETE"
  - "Queue operations include recordType, textContent, photoUrl fields"

# Metrics
duration: 2min
completed: 2026-02-15
---

# Phase 08 Plan 02: Frontend Types and API Summary

**Frontend API updated for v2.0 schema with soft-delete support, simple insert pattern, and IndexedDB queue v2 migration**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-15T14:20:17Z
- **Completed:** 2026-02-15T14:22:27Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Removed onConflict pattern from Workouts.js (incompatible with new schema)
- Implemented soft-delete with deleted_at filter in all queries
- Added createWorkout function with support for record_type, text_content, photo_url
- Bumped IndexedDB queue to version 2 with safe migration
- Added getWorkoutsForDate function for multiple records per day

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Workouts.js for new schema** - `b12001e` (feat)
2. **Task 2: Update IndexedDB queue to version 2** - `ead06bd` (feat)

## Files Created/Modified
- `src/Supabase/Workouts.js` - Removed onConflict, added soft-delete filter, new createWorkout function, deleteWorkoutById, getWorkoutsForDate
- `src/offline/Queue.js` - Bumped to version 2, added upgrade handler with queue clear, new field support

## Decisions Made

**Remove onConflict upsert pattern**
- Rationale: New schema allows multiple records per user+date, onConflict on composite key would prevent this
- Solution: Replace with simple insert via createWorkout function
- Backward compatibility: Keep upsertWorkout as wrapper during transition

**Clear queue on IndexedDB v1→v2 upgrade**
- Rationale: Safe migration path for ~20 beta users, avoids complex data transformation
- Impact: Users may lose pending offline operations during upgrade (acceptable for beta)
- Alternative considered: Migrate v1 records to v2 format (too complex for small user base)

**Soft delete instead of hard delete**
- Rationale: Enables undo functionality in v2.0 UI (future feature)
- Implementation: UPDATE deleted_at timestamp, filter IS NULL in all queries
- Added deleteWorkoutById for ID-based deletion (new schema has id field)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - changes were straightforward schema alignment.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 08-03 (Offline sync update):**
- Frontend API functions now match new schema
- IndexedDB queue v2 ready for multi-record operations
- Soft-delete support in place

**Blockers/Concerns:**
- None - all success criteria met
- Build succeeds, no onConflict usage remains
- All queries filter deleted_at appropriately

**Production migration still pending:**
- User must apply 08-01 migration SQL before deploying this code
- Frontend code assumes new schema (id, record_type, deleted_at fields)
- Safe to deploy after DB migration complete

---
*Phase: 08-schema-migration*
*Completed: 2026-02-15*
