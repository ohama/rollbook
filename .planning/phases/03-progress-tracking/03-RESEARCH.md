# Phase 3: Progress Tracking - Research

**Researched:** 2026-02-10
**Domain:** React calendar/list UIs, date manipulation, data visualization
**Confidence:** HIGH

## Summary

Phase 3 requires building a progress tracking interface with three main views: monthly calendar, list view, and monthly statistics. The research focused on identifying the best approach for building calendar UIs in React/Feliz, date manipulation patterns in F#/Fable, and component organization for multi-view interfaces.

**Standard approach:** Build a custom calendar component using CSS Grid for layout, native JavaScript Date for calculations, and controlled component patterns for month navigation. Avoid heavy calendar libraries since requirements are simple (display-only calendar with workout markers, no event scheduling). Use existing `getWorkouts` API with date range filtering.

**Key findings:**
- CSS Grid with `repeat(7, 1fr)` is the modern standard for calendar layouts
- Native JavaScript Date methods are sufficient for basic month/day calculations
- Fable's `emitJsExpr` enables safe JavaScript interop for date formatting
- React hooks (useState, useEffect) in Feliz handle state and data loading
- Multi-view patterns use tab/toggle controls with shared state

**Primary recommendation:** Build custom calendar and list components rather than importing heavy libraries. The requirements are simple (view-only, no drag-drop, no recurring events), and custom components integrate better with existing Feliz/Tailwind stack.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Feliz | 2.9.0 | React bindings for F# | Already in project, provides React hooks |
| React hooks | 18.x | State management | Built into React, useState/useEffect patterns |
| Tailwind CSS | 3.x+ | Styling calendar grid | Already in project, excellent for grid layouts |
| Native JS Date | ES2015+ | Date calculations | No dependencies, sufficient for basic operations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Fable.DateFunctions | 3.9.0 | Advanced date operations | If needed for complex date math (NOT required for Phase 3) |
| date-fns | 3.x | JS date utilities | If more date manipulation needed (Phase 4+) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom calendar | react-day-picker | Heavy library (6M+ downloads) for simple view-only needs; harder F# interop |
| Custom calendar | react-big-calendar | Overkill - designed for Google Calendar-style event scheduling |
| Native Date | Fable.DateFunctions | Adds dependency when native Date is sufficient for basic month/day/year operations |

**Installation:**
```bash
# No new packages needed - use existing stack
# Optional: If complex date manipulation needed later
# dotnet paket add Fable.DateFunctions --project src/App.fsproj
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── Pages/
│   └── Dashboard.fs           # Add Progress view alongside WorkoutToggle
├── Components/
│   ├── Calendar.fs            # Monthly calendar grid component
│   ├── WorkoutList.fs         # List view component
│   └── MonthlyStats.fs        # Statistics display component
├── Supabase/
│   └── Workouts.fs            # Already has getWorkouts with date filtering
└── Utils/
    └── DateHelpers.fs         # NEW: Date calculation utilities
```

### Pattern 1: CSS Grid Calendar Layout
**What:** Use CSS Grid with 7 columns for week layout, position first day using `grid-column-start`
**When to use:** All calendar month views
**Example:**
```css
/* Calendar grid container */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

/* Day headers (일 월 화 수 목 금 토) */
.day-header {
  /* Same 7-column grid for alignment */
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

/* Position first day of month */
.first-day {
  grid-column-start: 3; /* If month starts on Tuesday (0=Sun, 1=Mon, 2=Tue) */
}
```
**Source:** CSS-Tricks, Zell Liew calendar tutorials

### Pattern 2: Controlled Month Navigation
**What:** Parent component holds current month state, passes navigation functions to child
**When to use:** Calendar component with month switching
**Example (Feliz):**
```fsharp
[<ReactComponent>]
let CalendarView (userId: string) =
    // State: current year/month
    let (currentYear, setCurrentYear) = React.useState(System.DateTime.Now.Year)
    let (currentMonth, setCurrentMonth) = React.useState(System.DateTime.Now.Month)
    let (workouts, setWorkouts) = React.useState<WorkoutRecord array>([||])

    // Navigation functions
    let goToNextMonth () =
        if currentMonth = 12 then
            setCurrentYear (currentYear + 1)
            setCurrentMonth 1
        else
            setCurrentMonth (currentMonth + 1)

    let goToPrevMonth () =
        if currentMonth = 1 then
            setCurrentYear (currentYear - 1)
            setCurrentMonth 12
        else
            setCurrentMonth (currentMonth - 1)

    // Load workouts when month changes
    React.useEffect((fun () ->
        promise {
            let startDate = sprintf "%04d-%02d-01" currentYear currentMonth
            // Calculate last day of month
            let lastDay = // ... date calculation
            let endDate = sprintf "%04d-%02d-%02d" currentYear currentMonth lastDay
            let! data = getWorkouts userId (Some startDate) (Some endDate)
            setWorkouts data
        } |> Promise.start
    ), [| box currentYear; box currentMonth |])

    // Render calendar with data
    CalendarGrid currentYear currentMonth workouts goToPrevMonth goToNextMonth
```
**Source:** CBT Nuggets React Calendar Tutorial

### Pattern 3: Multi-View Toggle with Shared State
**What:** Tab/button controls switch between calendar and list views, sharing same data
**When to use:** When displaying same data in different formats
**Example (Feliz):**
```fsharp
type ViewMode = Calendar | List

[<ReactComponent>]
let ProgressView (userId: string) =
    let (viewMode, setViewMode) = React.useState(Calendar)
    let (currentMonth, setCurrentMonth) = React.useState(System.DateTime.Now.Month)
    let (workouts, setWorkouts) = React.useState<WorkoutRecord array>([||])

    // Shared data loading
    React.useEffect((fun () ->
        // Load workouts for current month
        // Both views use same data
    ), [| box currentMonth |])

    Html.div [
        // View toggle buttons
        Html.div [
            prop.className "flex gap-2 mb-4"
            prop.children [
                Html.button [
                    prop.onClick (fun _ -> setViewMode Calendar)
                    prop.text "캘린더"
                ]
                Html.button [
                    prop.onClick (fun _ -> setViewMode List)
                    prop.text "리스트"
                ]
            ]
        ]

        // Conditional rendering
        match viewMode with
        | Calendar -> CalendarView userId currentMonth workouts
        | List -> ListView userId workouts
    ]
```
**Source:** React calendar component organization patterns

### Pattern 4: Date Calculation Utilities
**What:** Helper functions for common date operations (days in month, first day of week)
**When to use:** Building calendar grids, formatting dates
**Example (F# with JS interop):**
```fsharp
module DateHelpers

open Fable.Core
open Fable.Core.JsInterop

/// Get number of days in a month (1-31)
let getDaysInMonth (year: int) (month: int) : int =
    // Create date for first day of next month, then subtract 1 day
    // JS months are 0-indexed, so month+1 gives next month
    // Day 0 gives last day of previous month
    emitJsExpr (year, month) "new Date($0, $1, 0).getDate()"

/// Get day of week for first day of month (0=Sunday, 6=Saturday)
let getFirstDayOfMonth (year: int) (month: int) : int =
    // JS months are 0-indexed, so month-1
    emitJsExpr (year, month - 1) "new Date($0, $1, 1).getDay()"

/// Format date as "YYYY-MM-DD"
let formatDateString (year: int) (month: int) (day: int) : string =
    sprintf "%04d-%02d-%02d" year month day

/// Format month/year display (e.g., "2026년 2월")
let formatMonthYear (year: int) (month: int) : string =
    sprintf "%d년 %d월" year month

/// Check if a date has a workout record
let hasWorkout (date: string) (workouts: WorkoutRecord array) : bool =
    workouts |> Array.exists (fun w -> w.workout_date = date)
```
**Source:** MDN JavaScript Date methods, existing getTodayDateString pattern

### Anti-Patterns to Avoid
- **Don't mutate Date objects:** JavaScript Date is mutable, but treat it as immutable (create new instances)
- **Don't use moment.js:** Deprecated library, too heavy for simple operations
- **Don't mix date formats:** Always use YYYY-MM-DD (ISO 8601) for consistency with database DATE type
- **Don't calculate dates with string manipulation:** Use Date constructor/methods to avoid off-by-one errors
- **Don't forget 0-indexed months:** JavaScript months are 0-11, not 1-12 (but days are 1-31)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Complex date formatting | Custom string builder | `toLocaleDateString()` via emitJsExpr | Handles locale, DST, edge cases |
| Timezone conversion | Manual offset math | JavaScript Date (already UTC-aware) | Phase 3 uses local dates only (DATE type, not TIMESTAMPTZ) |
| Date range filtering | Client-side array filter | Supabase `.gte()/.lte()` queries | Already implemented in getWorkouts, server-side filtering |
| Calendar event scheduling | Full calendar library | N/A - not needed | Phase 3 is view-only, no drag-drop or event creation |

**Key insight:** For this phase, the existing `getWorkouts(userId, startDate, endDate)` API already handles server-side filtering. Don't re-filter on client. The DATE type in database means dates are calendar days without timezone complexity.

## Common Pitfalls

### Pitfall 1: JavaScript Month 0-Indexing Confusion
**What goes wrong:** Creating `new Date(2026, 2, 1)` gives March 1st, not February 1st
**Why it happens:** JavaScript Date constructor uses 0-indexed months (0=Jan, 11=Dec) but 1-indexed days
**How to avoid:** Always subtract 1 when passing month to Date constructor: `new Date(year, month - 1, day)`
**Warning signs:** Calendar shows wrong month, off-by-one month errors

### Pitfall 2: First Day of Month Grid Positioning
**What goes wrong:** Calendar grid starts at wrong column, dates misaligned with day headers
**Why it happens:** Forgetting to set `grid-column-start` based on first day's weekday
**How to avoid:** Calculate first day of month with `getFirstDayOfMonth`, use it to position: `grid-column-start: {firstDay + 1}` (CSS is 1-indexed)
**Warning signs:** Monday date appears under Sunday column, all dates shifted

### Pitfall 3: Missing Days at End of Month
**What goes wrong:** Calendar grid cuts off last few days or shows wrong number of days
**Why it happens:** Hardcoding 30 days or using wrong month in calculation
**How to avoid:** Use `getDaysInMonth` utility that uses `new Date(year, month, 0).getDate()` trick
**Warning signs:** February shows 30 days, months missing 31st day

### Pitfall 4: Stale Data After Month Navigation
**What goes wrong:** Calendar shows previous month's data when navigating
**Why it happens:** useEffect dependencies missing, doesn't re-fetch when month changes
**How to avoid:** Include `currentYear` and `currentMonth` in useEffect dependency array: `[| box currentYear; box currentMonth |]`
**Warning signs:** Navigation works but data doesn't update, shows wrong workouts

### Pitfall 5: Locale-Specific First Day of Week
**What goes wrong:** Week starts on Sunday (US) when users expect Monday (Korea)
**Why it happens:** JavaScript `getDay()` returns 0=Sunday by default
**How to avoid:** For Korean users, adjust display order or shift values (Monday=0 in UI, but getDay() returns 1 for Monday)
**Warning signs:** User feedback about week starting on wrong day

### Pitfall 6: Array Mutation in State Updates
**What goes wrong:** Component doesn't re-render after filtering/mapping workouts array
**Why it happens:** Mutating array in place (`.push()`, `.sort()`) doesn't trigger React re-render
**How to avoid:** Always create new arrays: use `Array.map`, `Array.filter`, `[| ...existing; newItem |]` spread
**Warning signs:** State updates but UI doesn't refresh

## Code Examples

Verified patterns from official sources:

### Building Calendar Days Array
```fsharp
// Generate array of day objects for calendar grid
let buildCalendarDays (year: int) (month: int) (workouts: WorkoutRecord array) =
    let daysInMonth = getDaysInMonth year month
    let firstDayOfWeek = getFirstDayOfMonth year month

    // Create array of day records
    [| 1 .. daysInMonth |]
    |> Array.map (fun day ->
        let dateStr = formatDateString year month day
        {|
            Day = day
            Date = dateStr
            HasWorkout = hasWorkout dateStr workouts
            IsToday = dateStr = getTodayDateString()
            GridColumnStart = if day = 1 then Some (firstDayOfWeek + 1) else None
        |}
    )
```

### Calendar Grid Component (Feliz + Tailwind)
```fsharp
[<ReactComponent>]
let CalendarGrid (year: int) (month: int) (workouts: WorkoutRecord array) =
    let days = buildCalendarDays year month workouts

    Html.div [
        prop.className "space-y-2"
        prop.children [
            // Day headers (일 월 화 수 목 금 토)
            Html.div [
                prop.className "grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-600"
                prop.children [
                    Html.div "일"
                    Html.div "월"
                    Html.div "화"
                    Html.div "수"
                    Html.div "목"
                    Html.div "금"
                    Html.div "토"
                ]
            ]

            // Calendar grid
            Html.div [
                prop.className "grid grid-cols-7 gap-1"
                prop.children [
                    for dayInfo in days do
                        Html.div [
                            // Apply grid-column-start for first day
                            match dayInfo.GridColumnStart with
                            | Some col -> prop.style [ style.gridColumnStart col ]
                            | None -> ()

                            prop.className (
                                "aspect-square flex items-center justify-center rounded-lg " +
                                if dayInfo.IsToday then "bg-indigo-100 border-2 border-indigo-600 font-bold "
                                elif dayInfo.HasWorkout then "bg-green-100 text-green-800 font-semibold "
                                else "text-gray-700 "
                            )
                            prop.text (string dayInfo.Day)
                        ]
                ]
            ]
        ]
    ]
```
**Source:** CSS-Tricks calendar grid patterns, Tailwind CSS docs

### List View Component
```fsharp
[<ReactComponent>]
let WorkoutList (workouts: WorkoutRecord array) =
    // Sort by date descending (most recent first)
    let sortedWorkouts = workouts |> Array.sortByDescending (fun w -> w.workout_date)

    Html.div [
        prop.className "space-y-2"
        prop.children [
            if sortedWorkouts.Length = 0 then
                Html.p [
                    prop.className "text-center text-gray-500 py-8"
                    prop.text "운동 기록이 없습니다"
                ]
            else
                for workout in sortedWorkouts do
                    Html.div [
                        prop.key workout.id
                        prop.className "bg-white rounded-lg p-4 shadow-sm flex items-center justify-between"
                        prop.children [
                            Html.div [
                                prop.className "flex items-center gap-3"
                                prop.children [
                                    Html.span [
                                        prop.className "text-2xl"
                                        prop.text "💪"
                                    ]
                                    Html.span [
                                        prop.className "text-gray-800 font-medium"
                                        prop.text workout.workout_date
                                    ]
                                ]
                            ]
                            // Future: Edit/Delete buttons (Phase 3+ WORK-02)
                        ]
                    ]
        ]
    ]
```

### Monthly Statistics Component
```fsharp
[<ReactComponent>]
let MonthlyStats (workouts: WorkoutRecord array) (year: int) (month: int) =
    let totalWorkouts = workouts.Length
    let daysInMonth = getDaysInMonth year month
    let workoutPercentage =
        if daysInMonth > 0 then
            float totalWorkouts / float daysInMonth * 100.0
        else 0.0

    Html.div [
        prop.className "bg-white rounded-lg p-6 shadow-sm"
        prop.children [
            Html.h3 [
                prop.className "text-lg font-semibold text-gray-800 mb-4"
                prop.text (formatMonthYear year month)
            ]
            Html.div [
                prop.className "grid grid-cols-2 gap-4"
                prop.children [
                    // Total workouts
                    Html.div [
                        prop.className "text-center"
                        prop.children [
                            Html.div [
                                prop.className "text-3xl font-bold text-indigo-600"
                                prop.text (string totalWorkouts)
                            ]
                            Html.div [
                                prop.className "text-sm text-gray-600"
                                prop.text "운동 횟수"
                            ]
                        ]
                    ]

                    // Percentage
                    Html.div [
                        prop.className "text-center"
                        prop.children [
                            Html.div [
                                prop.className "text-3xl font-bold text-green-600"
                                prop.text (sprintf "%.0f%%" workoutPercentage)
                            ]
                            Html.div [
                                prop.className "text-sm text-gray-600"
                                prop.text "달성률"
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| moment.js | Native Date / date-fns | ~2020 | Moment deprecated, modern apps use lighter alternatives |
| HTML tables for calendars | CSS Grid | ~2017 | Simpler code, better responsive design, easier styling |
| jQuery datepicker | React calendar components | ~2015 | Component-based architecture, better state management |
| Client-side date filtering | Server-side date queries | Ongoing | Better performance with large datasets, Supabase supports this |

**Deprecated/outdated:**
- **moment.js**: Project in maintenance mode, recommends switching to alternatives
- **Table-based calendar layouts**: CSS Grid is cleaner and more semantic
- **Global state for simple views**: React hooks (useState/useEffect) handle local state well

## Open Questions

Things that couldn't be fully resolved:

1. **Week start preference (Sunday vs Monday)**
   - What we know: Korea typically uses Monday as first day, JavaScript defaults to Sunday
   - What's unclear: Whether to add user preference setting or hardcode Monday
   - Recommendation: Hardcode Monday for Phase 3 (Korean app), add preference in Phase 4+ if needed

2. **Fable.DateFunctions vs native Date**
   - What we know: Fable.DateFunctions provides date-fns bindings with 120+ methods
   - What's unclear: Whether simple operations justify the dependency
   - Recommendation: Start with native Date + emitJsExpr. Add Fable.DateFunctions only if complex operations needed (e.g., "relative time", "add business days")

3. **List view pagination/infinite scroll**
   - What we know: Requirements say "view history as list", Supabase query already has date filtering
   - What's unclear: Whether to paginate or load all workouts for current month
   - Recommendation: Phase 3 loads all workouts for selected month (simple, good UX). Add pagination in Phase 4+ if performance issues with users who have 100+ workouts/month

4. **Calendar navigation range limits**
   - What we know: Users can navigate prev/next months indefinitely
   - What's unclear: Whether to limit navigation (e.g., can't go before account creation date, can't go beyond current month)
   - Recommendation: Allow unlimited navigation for Phase 3. Future workouts (WORK-05) require future dates anyway.

## Sources

### Primary (HIGH confidence)
- [MDN JavaScript Date Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) - Date methods and constructor
- [CSS-Tricks: A Calendar in Three Lines of CSS](https://css-tricks.com/a-calendar-in-three-lines-of-css/) - CSS Grid calendar pattern
- [Zell Liew: How to build a calendar with CSS Grid](https://zellwk.com/blog/calendar-with-css-grid/) - Calendar grid positioning
- [CBT Nuggets: Build React Reusable Calendar Component](https://www.cbtnuggets.com/tutorials/build-react-reusable-calendar-component) - Controlled component pattern
- Existing codebase: `src/Supabase/Workouts.fs` - getWorkouts API with date filtering
- Existing codebase: `src/Pages/Dashboard.fs` - React hooks patterns in Feliz

### Secondary (MEDIUM confidence)
- [Compositional IT: Which React hooks to use from F#](https://www.compositional-it.com/news-blog/which-react-hooks-to-use-from-fsharp/) - useState vs useElmish guidance
- [Fable.DateFunctions documentation](https://zaid-ajaj.github.io/Fable.DateFunctions/) - Optional date utilities library
- [LogRocket: React list view patterns](https://blog.logrocket.com/react-infinite-scroll/) - Pagination vs infinite scroll
- [Builder.io: React calendar components](https://www.builder.io/blog/best-react-calendar-component-ai) - When to use libraries vs custom

### Tertiary (LOW confidence)
- [Droid on Roids: Date/Time edge cases](https://www.thedroidsonroids.com/blog/edge-cases-in-app-and-backend-development-dates-and-time) - Timezone pitfalls (not applicable - using DATE not TIMESTAMPTZ)
- [GitHub: Feliz repository](https://github.com/fable-hub/Feliz) - Hook patterns (docs URL was 404)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project stack (Feliz, React, Tailwind), no new dependencies
- Architecture: HIGH - CSS Grid calendar pattern is well-documented, controlled component pattern is React standard
- Pitfalls: MEDIUM-HIGH - Common calendar pitfalls documented, but F#/Fable specific issues less documented
- Date utilities: MEDIUM - JavaScript Date sufficient but not deeply tested in F# context

**Research date:** 2026-02-10
**Valid until:** 2026-03-15 (30 days - stable domain, React/CSS patterns don't change rapidly)
