---
phase: 11-calendar-integration
plan: 01
subsystem: ui
tags: [fsharp, fable, feliz, calendar, react-components]

# Dependency graph
requires:
  - phase: 10-multi-record-crud
    provides: RecordItem component for rendering individual records
  - phase: 09-ui-layout-navigation
    provides: ProgressView page for calendar integration
  - phase: 08-schema-migration
    provides: WorkoutRecord type with record_type field
provides:
  - Calendar count badges showing record count per date
  - Click handlers for calendar navigation to daily detail
  - DailyDetailView component for date-specific record display
affects: [11-02-daily-detail-routing, 11-03-navigation-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "countRecordsByDate helper using Array.groupBy for Map<string, int> aggregation"
    - "Html.button for calendar day cells (semantic HTML + keyboard accessibility)"
    - "Absolute positioning for count badges (top-1 right-1)"
    - "Korean date formatting pattern (YYYY년 MM월 DD일)"
    - "44x44px touch target for mobile back button"

key-files:
  created:
    - "src/Components/DailyDetailView.fs"
  modified:
    - "src/Components/Calendar.fs"
    - "src/Pages/ProgressView.fs"
    - "src/App.fsproj"

key-decisions:
  - "Count ALL record types (workout/text/photo) in badge - not just hasWorkout boolean"
  - "Use Array.groupBy pattern for date aggregation (F# standard library)"
  - "Button replaces div for calendar day cells (accessibility)"
  - "Indigo-600 badge color (matches app theme)"
  - "Placeholder onDateClick handler in ProgressView (wired in Wave 2)"

patterns-established:
  - "countRecordsByDate: WorkoutRecord array → Map<string, int> aggregation pattern"
  - "Korean date formatting: Split('-') + sprintf pattern"
  - "Back button: w-11 h-11 (44x44px) with arrow-only text"

# Metrics
duration: 3min
completed: 2026-02-16
---

# Phase 11 Plan 01: Calendar Count Badges & Daily Detail View Summary

**Calendar count badges using Array.groupBy aggregation + DailyDetailView component with Korean date formatting and RecordItem reuse**

## Performance

- **Duration:** 3 min (166 seconds)
- **Started:** 2026-02-16T02:42:19Z
- **Completed:** 2026-02-16T02:45:05Z
- **Tasks:** 2
- **Files modified:** 4 (3 .fs source + 1 .fsproj)

## Accomplishments
- Calendar displays record count badges (1-9) on dates with records
- Calendar day cells are clickable buttons with onDateClick callback
- DailyDetailView component renders date-specific records with back navigation
- Korean date formatting (2026년 2월 16일) for visual consistency
- RecordItem component reused for consistent record display

## Task Commits

Each task was committed atomically:

1. **Task 1: Add count badges and click handlers to CalendarGrid** - `af5b9a8` (feat)
2. **Task 2: Create DailyDetailView component** - `bd1877f` (feat)

## Files Created/Modified
- `src/Components/Calendar.fs` - Added countRecordsByDate helper, updated CalendarGrid with onDateClick callback, Html.button for days, count badge rendering (138 lines total)
- `src/Components/DailyDetailView.fs` - NEW component for daily record display with back button and Korean date format (56 lines)
- `src/Pages/ProgressView.fs` - Updated CalendarGrid call with placeholder onDateClick handler
- `src/App.fsproj` - Registered DailyDetailView.fs after RecordEditModal.fs

## Decisions Made

**1. Count ALL record types in badge**
- Rationale: Users want to see total activity count (workout + memo + photo), not just boolean workout presence
- Implementation: Array.groupBy on workout_date → count array length per group

**2. Array.groupBy pattern for aggregation**
- Rationale: F# standard library pattern, functional approach, type-safe Map output
- Alternative considered: Array.fold (more verbose, same performance)

**3. Html.button for calendar day cells**
- Rationale: Semantic HTML for clickable elements + keyboard navigation support
- Replaces: Html.div (required adding onClick after)

**4. Indigo-600 badge color**
- Rationale: Matches app theme (indigo-600 used for primary actions)
- Positioning: absolute top-1 right-1 (doesn't shift day number)

**5. Korean date formatting via string manipulation**
- Rationale: Simple pattern (split + sprintf) avoids external libraries
- Format: "YYYY년 MM월 DD일" with leading zeros trimmed

**6. 44x44px back button**
- Rationale: Mobile touch target guidelines (minimum 44px)
- Text: "←" only (visual clarity over "← 달력으로" verbosity)

**7. Placeholder onDateClick in ProgressView**
- Rationale: Maintains build compatibility until Wave 2 wires real routing state
- Handler: `(fun _ -> ())` - noop until replaced

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. Fable cache caused build error**
- Issue: Vite build failed with "Utils_DateHelpers_getDaysInMonth" not exported
- Cause: Compiled .js files out of sync after .fs source changes
- Solution: `dotnet fable src/App.fsproj -o src --noRestore --noCache` to force recompile
- Prevention: Run `dotnet fable clean` when switching branches or after major changes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Wave 2 (11-02):**
- CalendarGrid accepts onDateClick callback (signature ready)
- DailyDetailView accepts onBack callback (routing integration point)
- RecordItem reused (onEdit/onDelete callbacks already wired)

**Integration points:**
- ProgressView needs state for selectedDate + filtered records
- Replace placeholder `(fun _ -> ())` with actual state setter
- Wire DailyDetailView into conditional rendering (Calendar | List | DailyDetail)

**No blockers.**

---
*Phase: 11-calendar-integration*
*Completed: 2026-02-16*
