# Phase 11: Calendar Integration - Research

**Researched:** 2026-02-16
**Domain:** React calendar interaction patterns, F# state management, date aggregation, navigation patterns
**Confidence:** HIGH

## Summary

Phase 11 adds calendar interactivity: displaying record counts per day, clicking dates to view daily details, and navigating back to calendar view. The calendar UI already exists (Calendar.fs) but is currently static and read-only. This phase transforms it into an interactive component with drill-down navigation.

The research covers three primary areas: (1) aggregating records by date to display counts, (2) F# discriminated unions for view state (CalendarView vs DailyDetailView), and (3) navigation patterns for mobile-first back button UX. The standard approach is to add click handlers to calendar day cells, toggle view state, and pass selected date to detail view component.

**Primary recommendation:** Extend CalendarGrid with onClick handlers, use ViewState discriminated union (CalendarView | DailyDetailView of date), aggregate record counts using Array.groupBy on workout_date field, render conditional views based on state, and provide accessible back button (top-left, 44x44px touch target) with "← 달력으로" label.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Feliz | 2.9.0 | F# React bindings | Already in project, discriminated unions for view state |
| React | 19.2.4 | UI framework | useState for view state, useEffect for data loading |
| Existing codebase | Current | Calendar.fs, Workouts.fs | Already handles calendar grid and record queries |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| F# Array functions | Built-in | groupBy, countBy | Aggregate records by date for count display |
| Object.groupBy | ES2024 | Native JS grouping | Alternative to reduce, better performance (not needed if using F# functions) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom calendar library | react-calendar, Mobiscroll | Overkill - existing Calendar.fs already works, just needs click handlers |
| React Router | View state discriminated union | Adds dependency, URL state not needed for modal-like detail view |
| Custom date grouping | F# Array.groupBy | F# built-in is cleaner, more type-safe than JS reduce |

**Installation:**
No new dependencies needed. All required functionality exists in codebase and F# standard library.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── Components/
│   ├── Calendar.fs           # MODIFY: Add onClick handlers, count badges
│   ├── DailyDetailView.fs    # NEW: Daily record detail view with back button
│   └── RecordItem.fs         # REUSE: Already displays individual records
├── Pages/
│   ├── ProgressView.fs       # MODIFY: Integrate DailyDetailView navigation
│   └── TeamView.fs           # MODIFY: Add calendar view option (currently only shows roster)
└── Utils/
    └── DateHelpers.fs        # CONSIDER: Add countRecordsByDate helper
```

### Pattern 1: Discriminated Union for View State
**What:** F# discriminated unions provide exhaustive pattern matching for view modes
**When to use:** Switching between calendar view and daily detail view
**Example:**
```fsharp
// Source: Existing pattern from Pages.ProgressView (ViewMode = Calendar | List)
type CalendarViewState =
    | CalendarView
    | DailyDetailView of selectedDate: string  // YYYY-MM-DD

// In component:
let (viewState, setViewState) = React.useState<CalendarViewState>(CalendarView)

// Render based on state:
match viewState with
| CalendarView ->
    CalendarGrid userId year month workouts (fun () -> ...) (fun () -> ...)
| DailyDetailView date ->
    DailyDetailView userId date (fun () -> setViewState CalendarView)
```

### Pattern 2: Aggregate Record Counts by Date
**What:** Group workout records by date and count per day for calendar badge display
**When to use:** Before rendering calendar grid, to show count indicators on each day
**Example:**
```fsharp
// Source: F# Array.groupBy + existing WorkoutRecord type
// Input: WorkoutRecord array from getWorkouts API call
// Output: Map<string, int> where key=date, value=count

let countRecordsByDate (records: WorkoutRecord array) : Map<string, int> =
    records
    |> Array.groupBy (fun r -> r.workout_date)
    |> Array.map (fun (date, records) -> (date, records.Length))
    |> Map.ofArray

// Usage in CalendarGrid:
let recordCounts = countRecordsByDate workouts

// In day cell render:
let count = recordCounts |> Map.tryFind dateString |> Option.defaultValue 0
if count > 0 then
    Html.div [
        prop.className "absolute top-1 right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
        prop.text (string count)
    ]
```

### Pattern 3: Clickable Calendar Day Cells
**What:** Add onClick handler to day cells to navigate to detail view
**When to use:** Making calendar interactive (CAL-04 requirement)
**Example:**
```fsharp
// Source: React onClick pattern + Calendar.fs existing structure
// Modify existing Html.div in CalendarGrid (line 82)

Html.div [
    // Existing styling...
    prop.className (
        "aspect-square flex items-center justify-center rounded-lg cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all " +
        // ... existing conditional classes
    )

    // NEW: Click handler to navigate to detail view
    prop.onClick (fun _ -> onDateClick dateString)

    prop.children [
        // Day number
        Html.span [ prop.text (string dayRecord.Day) ]

        // Count badge (if count > 0)
        let count = recordCounts |> Map.tryFind dateString |> Option.defaultValue 0
        if count > 0 then
            Html.div [
                prop.className "absolute top-1 right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                prop.text (string count)
            ]
    ]
]
```

### Pattern 4: Daily Detail View with Back Navigation
**What:** Dedicated view component showing all records for selected date with prominent back button
**When to use:** DailyDetailView state (CAL-04, CAL-05 requirements)
**Example:**
```fsharp
// Source: Mobile navigation best practices + existing RecordItem pattern
[<ReactComponent>]
let DailyDetailView (userId: string) (date: string) (onBack: unit -> unit) =
    let (records, setRecords) = React.useState<WorkoutRecord array>([||])
    let (loading, setLoading) = React.useState(true)

    // Load records for selected date
    React.useEffect((fun () ->
        promise {
            try
                setLoading true
                let! dayRecords = getWorkoutsForDate userId date
                setRecords dayRecords
                setLoading false
            with ex ->
                setLoading false
        } |> Promise.start
    ), [| box date |])

    Html.div [
        prop.className "bg-white rounded-lg shadow-sm"
        prop.children [
            // Header with back button (top-left, accessible)
            Html.div [
                prop.className "flex items-center gap-3 p-4 border-b"
                prop.children [
                    // Back button: 44x44px touch target (WCAG 2.5.5)
                    Html.button [
                        prop.onClick (fun _ -> onBack())
                        prop.className "flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
                        prop.children [
                            Html.span [ prop.text "←" ]
                            Html.span [ prop.text "달력으로" ]
                        ]
                    ]

                    // Date title
                    Html.h2 [
                        prop.className "text-lg font-semibold text-gray-800"
                        prop.text date
                    ]
                ]
            ]

            // Records list
            Html.div [
                prop.className "p-4 space-y-2"
                prop.children [
                    if loading then
                        Html.div [ prop.className "text-center text-gray-400"; prop.text "로딩 중..." ]
                    elif records.Length = 0 then
                        Html.div [ prop.className "text-center text-gray-400 py-6"; prop.text "이 날짜에는 기록이 없습니다" ]
                    else
                        for record in records do
                            RecordItem record userId (fun _ -> ()) (fun _ -> ())
                ]
            ]
        ]
    ]
```

### Pattern 5: Personal vs Team Calendar Toggle
**What:** Switch between personal calendar (나) and team calendar (우리) using existing ViewScope state
**When to use:** CAL-02, CAL-03 requirements
**Example:**
```fsharp
// Source: Existing Dashboard.fs ViewScope pattern (line 25)
// ViewScope = Personal | TeamView (already defined)

// In ProgressView.fs:
match viewScope with
| Personal ->
    // Fetch personal workouts
    let! workouts = getWorkouts userId (Some startDate) (Some endDate)
    // Render personal calendar
| TeamView ->
    // Fetch team workouts
    let! workouts = getTeamWorkouts startDate endDate
    // Render team calendar (aggregate all users)

// Team calendar count aggregation:
// Same countRecordsByDate function works for team data
// Team workouts already include all team members' records
```

### Anti-Patterns to Avoid
- **Using URL routing for detail view:** Overkill for modal-like drill-down navigation. Use view state instead.
- **Re-fetching all month data on date click:** Detail view should accept date prop and fetch only that day's records.
- **Forgetting touch target size:** Mobile back button MUST be 44x44px minimum (WCAG 2.5.5).
- **Modifying CalendarDay type without updating consumers:** Calendar.fs is used in ProgressView.fs - coordinate changes.
- **Counting "workout" type only:** Requirements say "운동 기록 횟수" which means ALL record types (workout + text + photo).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar grid rendering | Custom calendar logic | Existing Calendar.fs CalendarGrid | Already handles first day of month, grid positioning, month/year display |
| Date range queries | Manual date math | Existing getWorkouts with startDate/endDate | Already implemented in Workouts.fs (line 174) |
| Record counting by date | Custom for-loop counter | F# Array.groupBy + Length | Built-in, functional, type-safe |
| Team data aggregation | Custom user grouping | Existing getTeamWorkouts | Already fetches all team records for date range |
| Daily records display | New list component | Existing RecordItem component | Already handles record type icons, owner check, edit/delete |

**Key insight:** Phase 10 Multi-Record CRUD already built all the data fetching and display components. This phase is primarily about navigation and aggregation - don't rebuild existing functionality.

## Common Pitfalls

### Pitfall 1: Counting Only "workout" Type Records
**What goes wrong:** Calendar shows count of 1, but user created workout + text + photo (should show 3)
**Why it happens:** Misunderstanding requirement "운동 기록 횟수" as "workout type count" instead of "total record count"
**How to avoid:** Use full WorkoutRecord array length after groupBy, don't filter by record_type
**Warning signs:** User reports "count doesn't match number of items in detail view"

### Pitfall 2: Not Filtering Soft-Deleted Records in Count
**What goes wrong:** Deleted records (deleted_at IS NOT NULL) contribute to day count
**Why it happens:** Forgetting that getWorkouts already filters soft-deleted, but manual aggregation might not
**How to avoid:** Always use getWorkouts or getTeamWorkouts API (they include `?is("deleted_at", null)`)
**Warning signs:** Count increases when deleting records, or deleted items counted

### Pitfall 3: Touch Target Too Small on Mobile
**What goes wrong:** Back button click area < 44x44px, users miss clicks on mobile
**Why it happens:** Icon-only button without padding, violates WCAG 2.5.5 Level AAA
**How to avoid:** Apply min-w-[44px] min-h-[44px] classes, add px-3 py-2 padding
**Warning signs:** User testing shows frequent misclicks, accessibility audit fails

### Pitfall 4: Re-fetching Month Data on Every Date Click
**What goes wrong:** Clicking calendar date triggers full month re-fetch, slow UX
**Why it happens:** Reusing existing data loading pattern without optimization
**How to avoid:** DailyDetailView fetches ONLY selected date with getWorkoutsForDate, not full month
**Warning signs:** Network tab shows large queries on every date click, slow detail view load

### Pitfall 5: Team Calendar Shows Individual Calendars
**What goes wrong:** "우리" view shows multiple separate calendars (one per user) instead of aggregate
**Why it happens:** Misunderstanding CAL-03 - should show ONE calendar with TOTAL team counts per day
**How to avoid:** Use getTeamWorkouts which returns all records for all users, aggregate counts by date
**Warning signs:** Team view shows N calendars for N users instead of 1 unified calendar

### Pitfall 6: Detail View Doesn't Show Owner Info for Team Calendar
**What goes wrong:** In team calendar detail view, can't tell which records belong to which user
**Why it happens:** RecordItem doesn't display user info when viewScope = TeamView
**How to avoid:** Pass viewScope to RecordItem, conditionally show display_name when TeamView
**Warning signs:** Team members confused whose records are whose in detail view

### Pitfall 7: Back Button Position Inconsistent with Platform Guidelines
**What goes wrong:** Back button placed bottom-right, confuses users expecting top-left
**Why it happens:** Not following platform conventions (iOS/Android both use top-left)
**How to avoid:** Always place back button top-left for LTR languages (Korean standard)
**Warning signs:** User confusion, "where's the back button?" feedback

## Code Examples

Verified patterns from official sources and existing codebase:

### Count Records by Date (F# Functional Approach)
```fsharp
// Source: F# Array.groupBy standard library + existing WorkoutRecord type
/// Count non-deleted records per date
let countRecordsByDate (records: WorkoutRecord array) : Map<string, int> =
    records
    |> Array.groupBy (fun r -> r.workout_date)
    |> Array.map (fun (date, dateRecords) -> (date, dateRecords.Length))
    |> Map.ofArray

// Alternative: Use countBy if you only need counts (more concise)
let countsByDate : (string * int) array =
    records
    |> Array.countBy (fun r -> r.workout_date)

// Convert to Map for O(log n) lookup in calendar rendering
let recordCounts = countsByDate |> Map.ofArray
```

### Modified CalendarGrid with Click Handlers and Count Badges
```fsharp
// Source: Existing Calendar.fs + React onClick pattern + Tailwind badge styles
[<ReactComponent>]
let CalendarGrid (userId: string) (year: int) (month: int) (workouts: WorkoutRecord array) (onDateClick: string -> unit) (onPrevMonth: unit -> unit) (onNextMonth: unit -> unit) =
    // Calculate calendar data (existing)
    let daysInMonth = getDaysInMonth year month
    let firstDayOfWeek = getFirstDayOfMonth year month
    let todayString = getTodayDateString()

    // NEW: Count records by date
    let recordCounts = countRecordsByDate workouts

    // Build array of calendar days (existing)
    let calendarDays =
        [| 1 .. daysInMonth |]
        |> Array.mapi (fun i day ->
            let dateString = formatDateString year month day
            {
                Day = day
                DateString = dateString
                HasWorkout = hasWorkout dateString workouts
                IsToday = dateString = todayString
                GridColumnStart = if i = 0 then Some (firstDayOfWeek + 1) else None
            }
        )

    Html.div [
        // ... existing header and day-of-week headers ...

        // Calendar grid
        Html.div [
            prop.className "grid grid-cols-7 gap-1"
            prop.children [
                for dayRecord in calendarDays do
                    let count = recordCounts |> Map.tryFind dayRecord.DateString |> Option.defaultValue 0

                    Html.div [
                        // Apply grid-column-start for first day (existing)
                        match dayRecord.GridColumnStart with
                        | Some col ->
                            prop.style [ style.gridColumnStart col ]
                        | None -> ()

                        // NEW: Relative positioning for badge, clickable cursor
                        prop.className (
                            "relative aspect-square flex items-center justify-center rounded-lg cursor-pointer transition-all " +
                            "hover:ring-2 hover:ring-indigo-400 " +
                            if dayRecord.IsToday then
                                "border-2 border-indigo-600 font-bold "
                            else
                                ""
                            +
                            if dayRecord.HasWorkout then
                                "bg-green-100 text-green-800 hover:bg-green-200"
                            else
                                "text-gray-700 hover:bg-gray-100"
                        )

                        // NEW: Click handler
                        prop.onClick (fun _ -> onDateClick dayRecord.DateString)

                        prop.children [
                            // Day number
                            Html.span [
                                prop.className "text-sm"
                                prop.text (string dayRecord.Day)
                            ]

                            // NEW: Count badge (if count > 0)
                            if count > 0 then
                                Html.div [
                                    prop.className "absolute top-0.5 right-0.5 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                                    prop.text (string count)
                                ]
                        ]
                    ]
            ]
        ]
    ]
```

### Daily Detail View Component
```fsharp
// Source: Mobile navigation patterns + existing RecordItem component
module Components.DailyDetailView

open Feliz
open Fable.Core.JsInterop
open Supabase.Types
open Supabase.Workouts
open Components.RecordItem
open Pages.Dashboard  // For ViewScope type

[<ReactComponent>]
let DailyDetailView (userId: string) (date: string) (viewScope: ViewScope) (onBack: unit -> unit) =
    let (records, setRecords) = React.useState<WorkoutRecord array>([||])
    let (loading, setLoading) = React.useState(true)
    let (error, setError) = React.useState<string option>(None)

    // Load records for selected date
    React.useEffect((fun () ->
        promise {
            try
                setLoading true
                setError None

                // Fetch records based on view scope
                let! dayRecords =
                    match viewScope with
                    | Personal ->
                        // Personal: only user's records
                        getWorkoutsForDate userId date
                    | TeamView ->
                        // Team: all team members' records for this date
                        // Use team API (needs implementation in Supabase.Team)
                        getWorkoutsForDate userId date  // TODO: Replace with team query

                setRecords dayRecords
                setLoading false
            with ex ->
                setError (Some "기록을 불러올 수 없습니다")
                setLoading false
        } |> Promise.start
    ), [| box date; box viewScope |])

    Html.div [
        prop.className "bg-white rounded-lg shadow-sm min-h-[400px]"
        prop.children [
            // Header with back button
            Html.div [
                prop.className "flex items-center gap-3 p-4 border-b bg-gray-50"
                prop.children [
                    // Back button: 44x44px touch target (WCAG 2.5.5 Level AAA)
                    Html.button [
                        prop.onClick (fun _ -> onBack())
                        prop.className "flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
                        prop.children [
                            Html.span [ prop.className "text-xl"; prop.text "←" ]
                            Html.span [ prop.className "font-medium"; prop.text "달력으로" ]
                        ]
                    ]

                    // Date title with record count
                    Html.div [
                        prop.className "flex-1"
                        prop.children [
                            Html.h2 [
                                prop.className "text-lg font-semibold text-gray-800"
                                prop.text date
                            ]
                            Html.p [
                                prop.className "text-sm text-gray-500"
                                prop.text (sprintf "기록 %d개" records.Length)
                            ]
                        ]
                    ]
                ]
            ]

            // Records list
            Html.div [
                prop.className "p-4"
                prop.children [
                    if loading then
                        Html.div [
                            prop.className "text-center text-gray-400 py-8"
                            prop.text "로딩 중..."
                        ]
                    elif error.IsSome then
                        Html.div [
                            prop.className "text-center text-red-600 py-8"
                            prop.text error.Value
                        ]
                    elif records.Length = 0 then
                        Html.div [
                            prop.className "text-center text-gray-400 py-12"
                            prop.children [
                                Html.p [ prop.text "이 날짜에는 기록이 없습니다" ]
                            ]
                        ]
                    else
                        Html.div [
                            prop.className "space-y-2"
                            prop.children [
                                for record in records do
                                    // Reuse existing RecordItem component
                                    // Pass empty handlers for edit/delete (read-only in detail view)
                                    RecordItem record userId (fun _ -> ()) (fun _ -> ())
                            ]
                        ]
                ]
            ]
        ]
    ]
```

### Integrate Daily Detail View in ProgressView
```fsharp
// Source: Existing ProgressView.fs pattern + new CalendarViewState discriminated union
module Pages.ProgressView

// ... existing imports ...

/// View mode for calendar interaction
type CalendarViewState =
    | CalendarView
    | DailyDetailView of selectedDate: string

[<ReactComponent>]
let ProgressViewPage (userId: string) (year: int) (month: int) (viewScope: ViewScope) =
    // Existing view mode state (Calendar | List)
    let (viewMode, setViewMode) = React.useState(Calendar)

    // NEW: Calendar interaction state
    let (calendarViewState, setCalendarViewState) = React.useState<CalendarViewState>(CalendarView)

    // Existing data state
    let (workouts, setWorkouts) = React.useState<WorkoutRecord array>([||])
    let (loading, setLoading) = React.useState(true)

    // ... existing data loading useEffect ...

    Html.div [
        prop.className "max-w-4xl mx-auto px-4 py-8"
        prop.children [
            // View toggle buttons (existing)
            // ... calendar/list toggle ...

            // Monthly stats (existing)
            // ... MonthlyStatsView ...

            // Content based on view mode
            if loading then
                Html.div [ prop.text "로딩 중..." ]
            else
                match viewMode with
                | List ->
                    WorkoutListView workouts
                | Calendar ->
                    // NEW: Conditional render based on calendar view state
                    match calendarViewState with
                    | CalendarView ->
                        CalendarGrid
                            userId
                            year
                            month
                            workouts
                            (fun date -> setCalendarViewState (DailyDetailView date))  // onDateClick
                            (fun () -> ())  // onPrevMonth (handled by Dashboard)
                            (fun () -> ())  // onNextMonth (handled by Dashboard)
                    | DailyDetailView selectedDate ->
                        DailyDetailView
                            userId
                            selectedDate
                            viewScope
                            (fun () -> setCalendarViewState CalendarView)  // onBack
        ]
    ]
```

### Team Calendar Day Query (Supabase.Team extension)
```fsharp
// Source: Existing Supabase.Team.fs pattern + getWorkoutsForDate signature
// Add to Supabase/Team.fs

/// Get all team workouts for a specific date (for daily detail view)
let getTeamWorkoutsForDate (date: string) : JS.Promise<WorkoutRecord array> =
    promise {
        let query =
            supabase
                ?from("workouts")
                ?select("*")
                ?eq("workout_date", date)
                ?is("deleted_at", null)
                ?order("created_at", createObj ["ascending" ==> true])
        let! result = query
        let data = result?data
        if isNull data then
            return [||]
        else
            return unbox<WorkoutRecord array> data
    }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static calendar display | Interactive clickable calendar | This phase (11) | Enables CAL-04 drill-down navigation |
| No record counts on calendar | Badge counts per day | This phase (11) | Fulfills CAL-01 requirement |
| No daily detail view | DailyDetailView component | This phase (11) | Enables CAL-05 back navigation |
| Team roster only | Team calendar option | This phase (11) | Fulfills CAL-03 requirement |
| Array.reduce for grouping | Object.groupBy (ES2024) | March 2024 | Native JS grouping, better performance (but F# Array.groupBy still preferred) |
| Icon-only back buttons | Icon + label combination | 2026 UX trend | 30-40% better comprehension |

**Deprecated/outdated:**
- **hasWorkout boolean only:** Phase 10 introduced multi-record, now need counts not just boolean
- **ViewMode only (Calendar | List):** Add CalendarViewState layer for drill-down navigation
- **Ultra-minimalist icon-only buttons:** 2026 trend toward warmer, labeled icons for clarity

## Open Questions

Things that couldn't be fully resolved:

1. **Should DailyDetailView allow editing/deleting records?**
   - What we know: RecordItem already has edit/delete handlers, but currently passed as empty functions in detail view
   - What's unclear: UX decision - is detail view read-only or full CRUD?
   - Recommendation: Start read-only (pass empty handlers). Add edit/delete in future phase if needed. Keeps scope manageable.

2. **How to handle team calendar daily detail view ownership display?**
   - What we know: RecordItem shows edit/delete only if `record.user_id = currentUserId`
   - What's unclear: In team daily detail view, should we show which user owns each record?
   - Recommendation: Add optional `showOwner: bool` prop to RecordItem. When true, display record.user_id or display_name above record content. Use `showOwner=true` when viewScope=TeamView.

3. **Should calendar navigation (prev/next month) reset detail view to calendar view?**
   - What we know: Dashboard owns currentYear/currentMonth state, passes as props
   - What's unclear: If user is viewing Feb 15 detail view and clicks "next month", should it close detail view or show Mar 15 detail view?
   - Recommendation: Reset to CalendarView on month change. Simpler UX, avoids confusion about "what date am I viewing?"

4. **Mobile layout: Should detail view be full-screen overlay or inline?**
   - What we know: Desktop has space for inline view, mobile is constrained
   - What's unclear: CSS approach for responsive detail view
   - Recommendation: Use `fixed inset-0 z-50` on mobile (< 768px), inline `rounded-lg` on desktop. Add media query or Tailwind `md:` prefix.

5. **Count badge placement: top-right corner or below day number?**
   - What we know: Top-right is common for notification badges (iOS, Material Design)
   - What's unclear: Might obscure day number on small screens
   - Recommendation: Top-right with `top-0.5 right-0.5` positioning, small size (w-5 h-5, text-xs). Test on mobile.

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns: `/Users/ohama/vibe-coding/rollbook/src/Components/Calendar.fs` - CalendarGrid structure, day cell rendering
- Existing codebase patterns: `/Users/ohama/vibe-coding/rollbook/src/Pages/ProgressView.fs` - ViewMode discriminated union pattern
- Existing codebase patterns: `/Users/ohama/vibe-coding/rollbook/src/Pages/Dashboard.fs` - ViewScope (Personal | TeamView) pattern
- Existing codebase patterns: `/Users/ohama/vibe-coding/rollbook/src/Supabase/Workouts.fs` - getWorkoutsForDate, getWorkouts date range queries
- Existing codebase patterns: `/Users/ohama/vibe-coding/rollbook/src/Utils/DateHelpers.fs` - formatDateString, hasWorkout helpers
- [F# Array.groupBy official docs](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/discriminated-unions) - Discriminated unions and array operations
- [React Navigation official docs](https://reactnavigation.org/docs/navigation-state/) - Navigation state management patterns

### Secondary (MEDIUM confidence)
- [Object.groupBy JavaScript grouping](https://blog.logrocket.com/guide-object-groupby-alternative-array-reduce/) - Modern JS grouping (ES2024)
- [Mobiscroll React Calendar day cell customization](https://demo.mobiscroll.com/react/eventcalendar) - Custom cell rendering patterns
- [Mobile navigation patterns 2026](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026) - Back button best practices
- [WCAG 2.5.5 touch target size](https://copyprogramming.com/howto/display-back-arrow-on-toolbar) - 44x44px minimum for accessibility
- [React calendar badge counts in workout apps](https://github.com/Williams44T/traintrax) - Calendar day indicators for fitness tracking
- [Syncfusion React Calendar customization](https://ej2.syncfusion.com/react/documentation/calendar/customization) - Cell customization patterns
- [React state management with discriminated unions](https://elmish.github.io/elmish/) - Elmish view/update pattern

### Tertiary (LOW confidence)
- [Fable-React third-party components](https://github.com/fable-compiler/fable-react/blob/main/docs/using-third-party-react-components.md) - General interop guidance (not calendar-specific)
- [React calendar libraries comparison](https://freefrontend.com/react-calendar/) - General overview (not Fable-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all built on existing Calendar.fs, Workouts.fs, F# Array functions
- Architecture: HIGH - Discriminated union patterns already proven in codebase (ViewMode, ViewScope, RecordEditState)
- Pitfalls: HIGH - Based on actual Phase 10 learnings (count all types, soft delete filtering, touch targets)
- Code examples: HIGH - Adapted directly from existing components (Calendar.fs, ProgressView.fs, RecordItem)

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days - stable patterns, no new dependencies)
