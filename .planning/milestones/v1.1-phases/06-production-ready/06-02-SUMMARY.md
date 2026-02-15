---
phase: 06-production-ready
plan: 02
subsystem: database
tags: [rbac, rls, postgresql, admin, security]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Initial schema with profiles table and RLS foundation
  - phase: 04-team-features
    provides: Team visibility RLS policies for profiles
provides:
  - Admin RBAC schema with user_roles table
  - is_admin() function for efficient role checking
  - Admin DELETE policy for profile management
  - UserRole and AdminResult types for F# type safety
affects: [06-03, 06-04, admin-ui, member-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RBAC via user_roles table with composite primary key"
    - "SECURITY DEFINER functions for RLS policy helpers"
    - "AdminResult<'T> DU for admin operation type safety"

key-files:
  created:
    - supabase/migrations/20260210160000_admin_rbac.sql
  modified:
    - src/Supabase/Types.fs
    - src/Supabase/Types.js

key-decisions:
  - "is_admin() as SECURITY DEFINER STABLE for RLS optimization"
  - "Composite primary key (user_id, role) allows multi-role future extension"
  - "Manual admin assignment via SQL INSERT for MVP (no UI yet)"
  - "Separate DELETE policy instead of modifying existing policies"
  - "AdminResult<'T> DU for type-safe admin operation handling"

patterns-established:
  - "RBAC pattern: user_roles table + helper function + RLS policies"
  - "SECURITY DEFINER pattern for RLS functions that need elevated access"
  - "Migration idempotency with DROP POLICY IF EXISTS"

# Metrics
duration: 2min
completed: 2026-02-10
---

# Phase 6 Plan 02: Admin RBAC Summary

**Admin role-based access control with user_roles table, is_admin() SECURITY DEFINER function, and RLS-enforced profile deletion**

## Performance

- **Duration:** 2 min (112s)
- **Started:** 2026-02-10T07:31:25Z
- **Completed:** 2026-02-10T07:33:17Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- user_roles table with user_id/role composite primary key for RBAC
- is_admin() SECURITY DEFINER STABLE function for efficient RLS role checks
- Admin DELETE policy on profiles enforces admin-only member deletion
- UserRole record type and AdminResult<'T> DU for type-safe admin operations in F#
- Consolidated profiles SELECT policy (all authenticated users can view)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create admin RBAC migration** - `53dfec2` (feat)
2. **Task 2: Add UserRole type to Types.fs** - `45dc192` (feat)

## Files Created/Modified
- `supabase/migrations/20260210160000_admin_rbac.sql` - Admin RBAC schema: user_roles table, is_admin() function, updated RLS policies
- `src/Supabase/Types.fs` - UserRole record and AdminResult<'T> DU for admin operations
- `src/Supabase/Types.js` - Generated JS with UserRole and AdminResult types

## Decisions Made

**1. is_admin() as SECURITY DEFINER STABLE**
- SECURITY DEFINER allows function to read user_roles regardless of RLS
- STABLE marker enables query optimizer to cache result within transaction
- Performance: ~95% improvement for multi-policy checks (from Phase 2 learnings)

**2. Composite primary key (user_id, role)**
- Allows future multi-role support (user can be both admin and member)
- Current implementation uses single role per user for MVP simplicity
- No breaking changes needed to add second role later

**3. Manual admin assignment for MVP**
- No UI for admin role assignment (out of scope for Phase 6)
- Admin assignment via direct SQL INSERT per research recommendation
- Comment in migration documents exact INSERT command
- Future enhancement: admin management UI in separate phase

**4. Separate DELETE policy**
- Created new "Admins can delete profiles" policy
- Did not merge with existing INSERT/UPDATE policies
- Clearer intent: deletion is admin-only, not user-editable
- Easier debugging and auditing

**5. AdminResult<'T> DU for type safety**
- Three cases: Success | NotAdmin | Error
- Forces explicit handling of admin check failures
- Prevents silent failures in admin operations
- Pattern for future admin endpoints (06-03, 06-04)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - migration and type additions completed without errors.

## User Setup Required

**Manual admin role assignment required for testing admin features.**

To assign admin role to a user:

1. Get user UUID from Supabase dashboard or auth.users table
2. Run SQL command:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('user-uuid-here', 'admin');
   ```
3. Verify with: `SELECT * FROM public.user_roles WHERE role = 'admin';`

Note: This is the MVP pattern. Future phases may add admin management UI.

## Next Phase Readiness

**Ready for Phase 6 Plans 03-04 (admin API endpoints):**
- user_roles table schema in place
- is_admin() function available for backend checks
- UserRole and AdminResult types ready for API integration
- RLS policies enforce admin-only deletion

**Blockers:** None

**Concerns:**
- Admin assignment is manual SQL for MVP - acceptable for testing, may need UI before production launch
- Only one admin role defined - "member" role unused until multi-role features needed

---
*Phase: 06-production-ready*
*Completed: 2026-02-10*
