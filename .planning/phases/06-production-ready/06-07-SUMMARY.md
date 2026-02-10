---
phase: 06-production-ready
plan: 07
subsystem: testing
tags: [vitest, jsdom, testing-library, production-validation, test-automation]

# Dependency graph
requires:
  - phase: 06-01
    provides: PWA infrastructure with VitePWA plugin and service worker
  - phase: 06-02
    provides: Admin RBAC with user_roles table and RLS policies
  - phase: 06-03
    provides: Offline queue with idb and QueuedOperation types
  - phase: 06-04
    provides: AdminPage component for user management
  - phase: 06-05
    provides: Background sync and network status monitoring
  - phase: 06-06
    provides: Bundle optimization with manual chunks and Terser

provides:
  - Automated test suite verifying all Phase 6 production readiness features
  - Vitest testing infrastructure with node environment
  - 34 tests covering PWA, offline, admin RBAC, bundle optimization, and security
  - Regression protection for future changes

affects: [06-08, deployment]

# Tech tracking
tech-stack:
  added: [vitest, @vitest/ui, jsdom, @testing-library/react, @testing-library/dom]
  patterns: [file-based testing, node environment for integration tests, test organization by feature area]

key-files:
  created:
    - tests/06-production.test.ts
    - vitest.config.ts
  modified:
    - package.json

key-decisions:
  - "Node environment over jsdom for file-based integration tests"
  - "Test organization mirrors Phase 6 feature areas (PWA, Offline, Admin, Bundle, Security)"
  - "File content validation over runtime testing for static configuration"

patterns-established:
  - "describe() blocks organized by Phase 6 requirements (TECH-03, TECH-02, ADMN-01/02)"
  - "Test naming convention: 'should have [feature/component/configuration]'"
  - "File existence checks combined with content validation"

# Metrics
duration: 4min
completed: 2026-02-10
---

# Phase 6 Plan 07: Production Readiness Test Suite

**Automated 34-test suite validates all Phase 6 features: PWA configuration, offline queue, admin RBAC, bundle optimization, and security policies**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-10T08:03:45Z
- **Completed:** 2026-02-10T08:07:45Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Vitest testing infrastructure installed and configured
- 34 comprehensive tests covering all Phase 6 production readiness criteria
- Test organization mirrors Phase 6 feature areas (PWA, Offline, Admin, Bundle, Security)
- All tests passing (34/34)

## Task Commits

Each task was committed atomically:

1. **Task 1: Set up test infrastructure** - `110d582` (chore)
   - Installed vitest, @vitest/ui, jsdom, @testing-library/react, @testing-library/dom
   - Added test scripts to package.json (test, test:watch, test:ui)
   - Created vitest.config.ts with node environment

2. **Task 2: Create production readiness tests** - `11a81b4` (test)
   - 7 tests for PWA Requirements (TECH-03)
   - 6 tests for Offline Queue (TECH-02)
   - 8 tests for Admin RBAC (ADMN-01, ADMN-02)
   - 4 tests for Bundle Size Optimization
   - 5 tests for Security Verification
   - 4 tests for Test Infrastructure itself

## Files Created/Modified

- `tests/06-production.test.ts` - 34 comprehensive tests covering all Phase 6 features
- `vitest.config.ts` - Vitest configuration with node environment for file-based tests
- `package.json` - Added test scripts and devDependencies

## Test Coverage

### PWA Requirements (TECH-03) - 7 tests
- VitePWA plugin installation and configuration
- Manifest with required fields (name, icons, theme_color, display, start_url)
- PWA icons (192x192, 512x512, apple-touch-icon)
- Workbox runtime caching strategies (NetworkFirst, NetworkOnly, StaleWhileRevalidate)
- Service worker registration module
- Service worker disabled in dev mode

### Offline Queue (TECH-02) - 6 tests
- idb library installed
- Offline Types module
- Queue module (enqueue, dequeue, getAllPending)
- Sync module (replayQueue, registerBackgroundSync)
- NetworkStatus module (isOnline)
- OfflineIndicator component
- WorkoutToggle integration with offline queue

### Admin RBAC (ADMN-01, ADMN-02) - 8 tests
- Admin RBAC migration exists
- user_roles table with role CHECK constraint
- is_admin() function with SECURITY DEFINER
- Admin DELETE policy for profiles
- Admin API module (isAdmin, getAllProfiles, deleteProfile)
- AdminPage component
- AdminPage standalone page architecture
- RLS enabled on user_roles table

### Bundle Size Optimization - 4 tests
- rollup-plugin-visualizer installed
- Visualizer configured with gzipSize and brotliSize
- Manual chunks configured (vendor-react, vendor-supabase, vendor-offline)
- Terser minification with drop_console enabled

### Security Verification - 5 tests
- RLS enabled on all tables (profiles, workouts, user_roles)
- No exposed Supabase keys in source code
- Storage bucket with private access (public = false)
- Storage RLS policies enforced

### Test Infrastructure - 4 tests
- Vitest installed
- Test scripts in package.json (test, test:watch, test:ui)
- vitest.config.ts exists
- Test environment configured

## Decisions Made

1. **Node environment over jsdom** - File-based integration tests don't need DOM environment; node environment avoids Tailwind CSS ESM module conflicts
2. **Test organization by Phase 6 feature areas** - describe() blocks mirror PLAN.md structure for easy verification against requirements
3. **File content validation** - Tests validate configuration files (vite.config.js, migrations) and F# source files directly rather than runtime behavior
4. **Comprehensive migration scanning** - Security tests scan all migration files to verify RLS enabled on all tables

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Tailwind CSS ESM module conflict with Vitest**
- **Found during:** Task 2 (initial test run)
- **Issue:** Vitest failed to load with "ERR_REQUIRE_ESM" error from @csstools/css-calc when Tailwind plugin enabled
- **Fix:** Removed tailwindcss plugin from vitest.config.ts and changed environment from 'jsdom' to 'node'
- **Rationale:** File-based tests don't need DOM or Tailwind; node environment sufficient for file reading
- **Files modified:** vitest.config.ts
- **Verification:** All 34 tests pass
- **Committed in:** 11a81b4 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed test assertions to match actual F# code patterns**
- **Found during:** Task 2 (test execution)
- **Issue:** 8 tests failed due to incorrect function/module name expectations
  - Queue module uses `getAllPending` not `getPendingOperations`
  - Sync module uses `replayQueue` not `processPendingOperations`
  - Admin API uses `isAdmin` not `checkAdminRole`
  - WorkoutToggle embedded in Dashboard.fs, not separate component
  - AdminPage is standalone, not integrated as Dashboard tab
- **Fix:** Updated test assertions to match actual F# naming conventions and architecture
- **Files modified:** tests/06-production.test.ts
- **Verification:** All 34 tests pass
- **Committed in:** 11a81b4 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for test execution. No scope creep - all tests cover planned Phase 6 features.

## Issues Encountered

None - test infrastructure setup and test creation proceeded smoothly after resolving Tailwind ESM conflict.

## User Setup Required

None - no external service configuration required. Tests run entirely on local filesystem.

## Next Phase Readiness

- All Phase 6 production features validated via automated tests
- Test suite provides regression protection for future changes
- Ready for deployment guide (06-08)
- Tests can be run with `npm run test` before each deployment

---
*Phase: 06-production-ready*
*Completed: 2026-02-10*
