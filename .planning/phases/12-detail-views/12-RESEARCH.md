# Phase 12: Detail Views - Research

**Researched:** 2026-02-16
**Domain:** Drill-down navigation patterns, grouped list views, user aggregation, icon+count display patterns
**Confidence:** HIGH

## Summary

Phase 12 enhances the daily detail view with user-centric drill-down capabilities for team calendar views. Phase 11 already implemented basic DailyDetailView component that shows all records for a selected date. Phase 12 extends this with **grouped views**: when viewing team calendar details, users should see a list of team members (name + record count) rather than a flat list of all records. Clicking a team member's name then drills down to show that specific user's records for the date.

The research covers four primary areas: (1) nested navigation state using discriminated unions (CalendarView → DailyDetailView → UserDetailView), (2) grouping WorkoutRecord arrays by user_id with count aggregation using F# Array.groupBy, (3) mobile-friendly list UI patterns for showing grouped user records with count badges, and (4) icon+count display patterns for showing record type indicators when multiple records exist.

**Primary recommendation:** Extend CalendarViewState discriminated union with UserDetailView case for team member drill-down, use Array.groupBy to aggregate records by user_id with counts, implement two-level navigation (team day view → user detail view), and display record type icons with count badges following Material Design badge patterns (pill shape, minimal characters, outline stroke).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Feliz | 2.9.0 | F# React bindings | Already in project, discriminated unions for navigation state |
| F# Array functions | Built-in | groupBy, countBy, map | Type-safe aggregation, functional composition |
| Existing components | Current | DailyDetailView, RecordItem | Phase 11 built the foundation, extend for drill-down |
| Supabase Types | Current | WorkoutRecord, ProfileRecord | Already includes user_id for grouping |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 3.x | Badge styling | Count indicators, pill shapes, outline strokes |
| Material Design 3 | Guidelines | Badge patterns | Icon+count display, visual hierarchy |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Nested DU state | Separate component state | DU provides exhaustive pattern matching, better type safety |
| Custom grouping | Map.ofSeq grouping | Array.groupBy more idiomatic for F#, clearer intent |
| Third-party list library | Custom implementation | No need - simple grouping, existing patterns sufficient |

**Installation:**
No new dependencies needed. All required functionality exists in F# standard library and existing components.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── Components/
│   ├── DailyDetailView.fs        # MODIFY: Add viewScope parameter for team mode
│   ├── TeamDayDetailView.fs      # NEW: Grouped user list with counts (team mode only)
│   └── RecordItem.fs             # MODIFY: Add showOwner parameter for team context
├── Pages/
│   ├── TeamView.fs               # MODIFY: Extend CalendarViewState for user drill-down
│   └── ProgressView.fs           # Already complete (personal view)
└── Supabase/
    └── Team.fs                   # Already has getTeamWorkoutsForDate
```

### Pattern 1: Nested Navigation State with Discriminated Union
**What:** Three-level navigation state for team calendar: CalendarView → DailyDetailView → UserDetailView
**When to use:** Team calendar drill-down (DET-02, DET-03 requirements)
**Example:**
```fsharp
// Source: Existing CalendarViewState pattern from Phase 11
// EXTEND for Phase 12 user drill-down
type CalendarViewState =
    | CalendarView
    | DailyDetailView of selectedDate: string
    | UserDetailView of selectedDate: string * userId: string  // NEW: User-specific drill-down

// In TeamView.fs:
let (calendarViewState, setCalendarViewState) = React.useState(CalendarViewState.CalendarView)

// Render based on state:
match calendarViewState with
| CalendarView ->
    CalendarGrid "" year month allWorkouts (fun () -> ()) (fun () -> ()) handleDateClick
| DailyDetailView selectedDate ->
    // NEW: Team day detail view (grouped by user)
    TeamDayDetailView selectedDate selectedDateRecords
        (fun () -> setCalendarViewState CalendarView)              // Back to calendar
        (fun userId -> setCalendarViewState (UserDetailView (selectedDate, userId)))  // Drill to user
| UserDetailView (selectedDate, userId) ->
    // NEW: Specific user's records for this date
    let userRecords = selectedDateRecords |> Array.filter (fun r -> r.user_id = userId)
    Components.DailyDetailView.DailyDetailView selectedDate userRecords ""
        (fun () -> setCalendarViewState (DailyDetailView selectedDate))  // Back to grouped view
        (fun _ -> ())  // No edit in team view
        (fun _ -> ())  // No delete in team view
```

### Pattern 2: Group Records by User with Count Aggregation
**What:** F# Array.groupBy to organize WorkoutRecord array by user_id, then count and attach profile info
**When to use:** Team daily detail view (DET-02 requirement)
**Example:**
```fsharp
// Source: F# Array.groupBy + existing TeamMemberSummary pattern
/// Group workout records by user and attach profile information
let groupRecordsByUser (records: WorkoutRecord array) (profiles: ProfileRecord array) : UserRecordGroup array =
    // Create profile lookup map
    let profileMap =
        profiles
        |> Array.map (fun p -> p.id, p)
        |> Map.ofArray

    // Group records by user_id
    records
    |> Array.groupBy (fun r -> r.user_id)
    |> Array.map (fun (userId, userRecords) ->
        let profile = Map.tryFind userId profileMap
        let displayName =
            profile
            |> Option.bind (fun p -> p.display_name)
            |> Option.defaultWith (fun () ->
                profile
                |> Option.map (fun p -> p.email)
                |> Option.defaultValue "Unknown"
            )
        {
            UserId = userId
            DisplayName = displayName
            RecordCount = userRecords.Length
            Records = userRecords
        }
    )
    |> Array.sortBy (fun g -> g.DisplayName)  // Alphabetical by name

// Type definition:
type UserRecordGroup = {
    UserId: string
    DisplayName: string
    RecordCount: int
    Records: WorkoutRecord array
}
```

### Pattern 3: Team Day Detail View with User List
**What:** Dedicated component showing grouped user list with name and count badges for team day view
**When to use:** DailyDetailView state when viewScope = TeamView (DET-02 requirement)
**Example:**
```fsharp
// Source: Material Design badge patterns + existing DailyDetailView structure
[<ReactComponent>]
let TeamDayDetailView (selectedDate: string) (records: WorkoutRecord array) (onBack: unit -> unit) (onUserClick: string -> unit) =
    let (userGroups, setUserGroups) = React.useState<UserRecordGroup array>([||])
    let (loading, setLoading) = React.useState(true)

    // Load profiles and group records
    React.useEffect((fun () ->
        promise {
            try
                setLoading true
                let! profiles = getTeamProfiles()
                let groups = groupRecordsByUser records profiles
                setUserGroups groups
                setLoading false
            with ex ->
                setLoading false
        } |> Promise.start
    ), [| box records |])

    // Format date for display
    let displayDate =
        let parts = selectedDate.Split('-')
        if parts.Length = 3 then
            sprintf "%s년 %s월 %s일" parts.[0] (parts.[1].TrimStart('0')) (parts.[2].TrimStart('0'))
        else
            selectedDate

    Html.div [
        prop.className "space-y-4"
        prop.children [
            // Header with back button
            Html.div [
                prop.className "flex items-center gap-3 mb-4"
                prop.children [
                    Html.button [
                        prop.onClick (fun _ -> onBack())
                        prop.className "w-11 h-11 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                        prop.text "←"
                    ]
                    Html.h2 [
                        prop.className "text-lg font-semibold text-gray-800"
                        prop.text (sprintf "%s - 팀 기록" displayDate)
                    ]
                ]
            ]

            // User list with count badges
            if loading then
                Html.div [
                    prop.className "text-center text-gray-400 py-8"
                    prop.text "로딩 중..."
                ]
            elif userGroups.Length = 0 then
                Html.div [
                    prop.className "text-center text-gray-400 py-8"
                    prop.text "이 날의 기록이 없습니다"
                ]
            else
                Html.div [
                    prop.className "space-y-2"
                    prop.children [
                        for group in userGroups do
                            // User list item (clickable)
                            Html.button [
                                prop.onClick (fun _ -> onUserClick group.UserId)
                                prop.className "w-full bg-white rounded-lg p-4 shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
                                prop.children [
                                    // Left: User name
                                    Html.div [
                                        prop.className "flex items-center gap-3"
                                        prop.children [
                                            // Avatar placeholder
                                            Html.div [
                                                prop.className "w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center"
                                                prop.children [
                                                    Html.span [
                                                        prop.className "text-sm font-semibold text-indigo-700"
                                                        prop.text (group.DisplayName.Substring(0, 1))  // First letter
                                                    ]
                                                ]
                                            ]
                                            Html.span [
                                                prop.className "font-medium text-gray-800"
                                                prop.text group.DisplayName
                                            ]
                                        ]
                                    ]

                                    // Right: Count badge
                                    Html.div [
                                        prop.className "flex items-center gap-2"
                                        prop.children [
                                            // Record type icons with counts (DET-04)
                                            let recordTypes = group.Records |> Array.countBy (fun r -> r.record_type)
                                            for (recordType, count) in recordTypes do
                                                let icon, bgColor =
                                                    match recordType with
                                                    | "workout" -> "운동", "bg-green-100 text-green-700"
                                                    | "text" -> "메모", "bg-blue-100 text-blue-700"
                                                    | "photo" -> "사진", "bg-purple-100 text-purple-700"
                                                    | _ -> "기록", "bg-gray-100 text-gray-700"

                                                Html.div [
                                                    prop.className (sprintf "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold %s" bgColor)
                                                    prop.children [
                                                        Html.span [ prop.text icon ]
                                                        if count > 1 then
                                                            Html.span [
                                                                prop.className "ml-1"
                                                                prop.text (sprintf "×%d" count)
                                                            ]
                                                    ]
                                                ]
                                        ]
                                    ]
                                ]
                            ]
                    ]
                ]
        ]
    ]
```

### Pattern 4: Icon + Count Display for Multiple Records
**What:** Show record type icon with count multiplier when user has multiple records of same type
**When to use:** DET-04 requirement - displaying record summary in lists
**Example:**
```fsharp
// Source: Material Design badge guidelines - pill shape, minimal characters
/// Display record type icons with optional count badge
let renderRecordTypeBadge (recordType: string) (count: int) =
    let icon, bgColor =
        match recordType with
        | "workout" -> "운동", "bg-green-100 text-green-700"
        | "text" -> "메모", "bg-blue-100 text-blue-700"
        | "photo" -> "사진", "bg-purple-100 text-purple-700"
        | _ -> "기록", "bg-gray-100 text-gray-700"

    Html.div [
        prop.className (sprintf "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold %s" bgColor)
        prop.children [
            Html.span [ prop.text icon ]
            // Show count only if > 1
            if count > 1 then
                Html.span [
                    prop.className "ml-0.5"
                    prop.text (sprintf "×%d" count)
                ]
        ]
    ]

// Usage: Group records by type and display with counts
let recordTypeCounts = records |> Array.countBy (fun r -> r.record_type)
for (recordType, count) in recordTypeCounts do
    renderRecordTypeBadge recordType count
```

### Pattern 5: Show Owner in Team Context
**What:** Display user's display_name when showing records in team context (who owns the record)
**When to use:** Team daily detail view after drilling down to specific user's records
**Example:**
```fsharp
// Source: Existing RecordItem component pattern
// MODIFY RecordItem to accept optional showOwner parameter

[<ReactComponent>]
let RecordItem (record: WorkoutRecord) (currentUserId: string) (showOwner: bool) (ownerName: string option) (onEdit: int -> unit) (onDelete: int -> unit) =
    // ... existing code ...

    Html.div [
        prop.className "bg-white rounded-lg p-3 shadow-sm flex items-start gap-3"
        prop.children [
            // ... existing icon/content ...

            // NEW: Owner label (if showOwner = true)
            if showOwner && ownerName.IsSome then
                Html.div [
                    prop.className "text-xs text-gray-500 mt-1"
                    prop.text (sprintf "작성자: %s" ownerName.Value)
                ]

            // Edit/delete buttons (only if owner)
            // ... existing code ...
        ]
    ]
```

### Anti-Patterns to Avoid
- **Flattening team day view:** Don't show all team members' records in one flat list - group by user first (DET-02)
- **Missing back navigation:** User drill-down MUST have back button to grouped view, not just to calendar
- **Re-fetching profiles on every render:** Load profiles once, reuse for grouping
- **Forgetting to sort user list:** Alphabetical sort by display_name improves UX
- **Count badge overflow:** Use "99+" for counts ≥ 100, don't display huge numbers
- **Missing empty state:** Handle case where date has no records (show "이 날의 기록이 없습니다")

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| User grouping logic | Custom for-loop grouping | F# Array.groupBy + Map.ofArray | Built-in, functional, type-safe, handles edge cases |
| Profile lookup | Array.find in loop | Map lookup with tryFind | O(log n) vs O(n), handles missing profiles gracefully |
| Record type counting | Manual counter accumulation | Array.countBy | One-liner, clearer intent, functional composition |
| Navigation state | Multiple useState bools | Discriminated union CalendarViewState | Exhaustive matching, impossible states prevented |
| Badge display | Custom CSS classes | Material Design badge patterns | Proven UX, accessibility tested, mobile-optimized |
| User avatar fallback | Custom initial extraction | displayName.Substring(0,1) | Simple, handles Korean/English/special chars |

**Key insight:** Phase 11 already built CalendarViewState pattern and DailyDetailView component. Phase 12 is primarily about **extending** the state machine (add UserDetailView case) and **grouping data** (Array.groupBy). Don't rebuild - extend existing patterns.

## Common Pitfalls

### Pitfall 1: Not Handling Missing Profiles
**What goes wrong:** User deleted from profiles table but has workout records, causes crash when grouping
**Why it happens:** Foreign key doesn't cascade delete workout records, profile lookup fails
**How to avoid:** Use Map.tryFind with Option.defaultValue for display name fallback to email or "Unknown"
**Warning signs:** Runtime error "NullReferenceException" when rendering team day detail view

### Pitfall 2: Forgetting to Filter Soft-Deleted Records in User Drill-Down
**What goes wrong:** User detail view shows deleted records (deleted_at IS NOT NULL)
**Why it happens:** Array.filter by user_id doesn't check deleted_at
**How to avoid:** getTeamWorkoutsForDate already filters deleted, but client-side filtering should also check
**Warning signs:** Deleted records appear when drilling down to user detail

### Pitfall 3: State Management - Back Button Goes to Wrong View
**What goes wrong:** User clicks back from user detail view, goes to calendar instead of grouped day view
**Why it happens:** Using single setCalendarViewState(CalendarView) instead of tracking previous state
**How to avoid:** Back button from UserDetailView should go to DailyDetailView, not CalendarView
**Warning signs:** User confusion - "I was looking at the team list, where did it go?"

### Pitfall 4: Count Badge Overflow on Small Screens
**What goes wrong:** User with 50+ records causes badge text to wrap or truncate awkwardly
**Why it happens:** Not limiting display digits, no max width on badge
**How to avoid:** Use conditional display - "×2" for 2-9, "×10+" for 10-99, "×99+" for 100+
**Warning signs:** Badge layout breaks on mobile, text clips

### Pitfall 5: Grouping Empty Array Causes Render Issue
**What goes wrong:** Array.groupBy on empty array returns [||], component tries to map over it and shows nothing
**Why it happens:** Not handling empty state explicitly in UI
**How to avoid:** Check userGroups.Length = 0 before mapping, show "이 날의 기록이 없습니다" empty state
**Warning signs:** Blank screen when no team records exist for date

### Pitfall 6: Profile Fetch Race Condition
**What goes wrong:** Records load before profiles, grouping uses stale/empty profile map
**Why it happens:** Two separate useEffect hooks racing, no dependency coordination
**How to avoid:** Single useEffect that fetches profiles, THEN groups records (sequential promises)
**Warning signs:** User sees "Unknown" names briefly, then names appear (flash of incorrect content)

### Pitfall 7: Not Propagating Edit/Delete Handlers to Nested Views
**What goes wrong:** User drills down, can't edit/delete their own records even in team context
**Why it happens:** Passing empty handlers (fun _ -> ()) to DailyDetailView in user drill-down mode
**How to avoid:** Team view is read-only by design - pass empty handlers intentionally, document why
**Warning signs:** User confusion "Why can't I edit my record in team view?" (this is CORRECT behavior)

### Pitfall 8: Icon Colors Not Distinct for Colorblind Users
**What goes wrong:** Green/blue badges hard to distinguish for deuteranopia users
**Why it happens:** Using only color to convey record type
**How to avoid:** Always pair color with icon label text ("운동", "메모", "사진"), don't rely on color alone
**Warning signs:** Accessibility audit fails WCAG 1.4.1 (Use of Color)

## Code Examples

Verified patterns from official sources and existing codebase:

### Extended CalendarViewState for Three-Level Navigation
```fsharp
// Source: Existing Phase 11 pattern + nested state extension
module Pages.TeamView

/// Calendar view state for drill-down navigation
type CalendarViewState =
    | CalendarView
    | DailyDetailView of selectedDate: string
    | UserDetailView of selectedDate: string * userId: string  // NEW for Phase 12

[<ReactComponent>]
let TeamViewPage (year: int) (month: int) =
    let (calendarViewState, setCalendarViewState) = React.useState(CalendarViewState.CalendarView)
    let (selectedDateRecords, setSelectedDateRecords) = React.useState<WorkoutRecord array>([||])
    let (allWorkouts, setAllWorkouts) = React.useState<WorkoutRecord array>([||])

    // ... existing data loading ...

    let handleDateClick (dateString: string) =
        promise {
            try
                let! records = getTeamWorkoutsForDate dateString
                setSelectedDateRecords records
                setCalendarViewState (CalendarViewState.DailyDetailView dateString)
            with ex -> ()
        } |> Promise.start

    let handleUserClick (userId: string) =
        // Drill down to specific user's records
        setCalendarViewState (CalendarViewState.UserDetailView (fst (match calendarViewState with
            | DailyDetailView date -> (date, userId)
            | UserDetailView (date, _) -> (date, userId)
            | _ -> ("", userId)), userId))

    // Render based on state
    match calendarViewState with
    | CalendarView ->
        CalendarGrid "" year month allWorkouts (fun () -> ()) (fun () -> ()) handleDateClick
    | DailyDetailView selectedDate ->
        TeamDayDetailView selectedDate selectedDateRecords
            (fun () -> setCalendarViewState CalendarView)
            handleUserClick
    | UserDetailView (selectedDate, userId) ->
        let userRecords = selectedDateRecords |> Array.filter (fun r -> r.user_id = userId)
        Components.DailyDetailView.DailyDetailView selectedDate userRecords ""
            (fun () -> setCalendarViewState (DailyDetailView selectedDate))
            (fun _ -> ())
            (fun _ -> ())
```

### Group Records by User with Profile Lookup
```fsharp
// Source: F# Array.groupBy documentation + existing Team.fs groupWorkoutsByUser pattern
module Components.TeamDayDetailView

open Supabase.Types
open Supabase.Team

/// User record group for team day detail view
type UserRecordGroup = {
    UserId: string
    DisplayName: string
    RecordCount: int
    RecordsByType: (string * int) array  // (recordType, count) pairs
    Records: WorkoutRecord array
}

/// Group workout records by user with profile information
let groupRecordsByUser (records: WorkoutRecord array) (profiles: ProfileRecord array) : UserRecordGroup array =
    // Create profile lookup map (O(log n) access)
    let profileMap =
        profiles
        |> Array.map (fun p -> p.id, p)
        |> Map.ofArray

    // Group by user_id and aggregate
    records
    |> Array.groupBy (fun r -> r.user_id)
    |> Array.map (fun (userId, userRecords) ->
        // Lookup profile
        let profile = Map.tryFind userId profileMap
        let displayName =
            profile
            |> Option.bind (fun p -> p.display_name)
            |> Option.defaultWith (fun () ->
                profile
                |> Option.map (fun p -> p.email)
                |> Option.defaultValue "Unknown User"
            )

        // Count records by type
        let recordsByType = userRecords |> Array.countBy (fun r -> r.record_type)

        {
            UserId = userId
            DisplayName = displayName
            RecordCount = userRecords.Length
            RecordsByType = recordsByType
            Records = userRecords
        }
    )
    |> Array.sortBy (fun g -> g.DisplayName)  // Alphabetical order
```

### TeamDayDetailView Component with Grouped User List
```fsharp
// Source: Material Design badge patterns + existing DailyDetailView structure
module Components.TeamDayDetailView

open Feliz
open Supabase.Types
open Supabase.Team

[<ReactComponent>]
let TeamDayDetailView (selectedDate: string) (records: WorkoutRecord array) (onBack: unit -> unit) (onUserClick: string -> unit) =
    let (userGroups, setUserGroups) = React.useState<UserRecordGroup array>([||])
    let (loading, setLoading) = React.useState(true)

    // Load profiles and group records
    React.useEffect((fun () ->
        promise {
            try
                setLoading true
                let! profiles = getTeamProfiles()
                let groups = groupRecordsByUser records profiles
                setUserGroups groups
                setLoading false
            with ex ->
                setLoading false
        } |> Promise.start
    ), [| box records |])

    // Format date for display (YYYY-MM-DD → "YYYY년 M월 D일")
    let displayDate =
        let parts = selectedDate.Split('-')
        if parts.Length = 3 then
            sprintf "%s년 %s월 %s일" parts.[0] (parts.[1].TrimStart('0')) (parts.[2].TrimStart('0'))
        else
            selectedDate

    Html.div [
        prop.className "space-y-4"
        prop.children [
            // Header with back button
            Html.div [
                prop.className "flex items-center gap-3 mb-4"
                prop.children [
                    Html.button [
                        prop.onClick (fun _ -> onBack())
                        prop.className "w-11 h-11 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                        prop.text "←"
                    ]
                    Html.h2 [
                        prop.className "text-lg font-semibold text-gray-800"
                        prop.text (sprintf "%s - 팀 기록" displayDate)
                    ]
                ]
            ]

            // User list
            if loading then
                Html.div [
                    prop.className "text-center text-gray-400 py-8"
                    prop.text "로딩 중..."
                ]
            elif userGroups.Length = 0 then
                Html.div [
                    prop.className "text-center text-gray-400 py-8"
                    prop.text "이 날의 기록이 없습니다"
                ]
            else
                Html.div [
                    prop.className "space-y-2"
                    prop.children [
                        for group in userGroups do
                            Html.button [
                                prop.key group.UserId
                                prop.onClick (fun _ -> onUserClick group.UserId)
                                prop.className "w-full bg-white rounded-lg p-4 shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-[0.98]"
                                prop.children [
                                    // Left: User info
                                    Html.div [
                                        prop.className "flex items-center gap-3"
                                        prop.children [
                                            // Avatar (first letter of name)
                                            Html.div [
                                                prop.className "w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0"
                                                prop.children [
                                                    Html.span [
                                                        prop.className "text-sm font-semibold text-indigo-700"
                                                        prop.text (if group.DisplayName.Length > 0 then group.DisplayName.Substring(0, 1) else "?")
                                                    ]
                                                ]
                                            ]
                                            // Name
                                            Html.span [
                                                prop.className "font-medium text-gray-800"
                                                prop.text group.DisplayName
                                            ]
                                        ]
                                    ]

                                    // Right: Record type badges with counts
                                    Html.div [
                                        prop.className "flex items-center gap-2"
                                        prop.children [
                                            for (recordType, count) in group.RecordsByType do
                                                let icon, bgColor =
                                                    match recordType with
                                                    | "workout" -> "운동", "bg-green-100 text-green-700"
                                                    | "text" -> "메모", "bg-blue-100 text-blue-700"
                                                    | "photo" -> "사진", "bg-purple-100 text-purple-700"
                                                    | _ -> "기록", "bg-gray-100 text-gray-700"

                                                Html.div [
                                                    prop.className (sprintf "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold %s" bgColor)
                                                    prop.children [
                                                        Html.span [ prop.text icon ]
                                                        // Show multiplier if count > 1
                                                        if count > 1 then
                                                            Html.span [
                                                                prop.className "ml-0.5"
                                                                prop.text (
                                                                    if count < 100 then sprintf "×%d" count
                                                                    else "×99+"
                                                                )
                                                            ]
                                                    ]
                                                ]
                                        ]
                                    ]
                                ]
                            ]
                    ]
                ]
        ]
    ]
```

### Handle User Detail Drill-Down in TeamView
```fsharp
// Source: Existing TeamView.fs pattern + UserDetailView state handling
// In TeamView.fs, extend match statement:

match calendarViewState with
| CalendarView ->
    CalendarGrid "" year month allWorkouts (fun () -> ()) (fun () -> ()) handleDateClick
| DailyDetailView selectedDate ->
    // Team grouped view (NEW component)
    Components.TeamDayDetailView.TeamDayDetailView selectedDate selectedDateRecords
        (fun () -> setCalendarViewState CalendarView)
        (fun userId -> setCalendarViewState (UserDetailView (selectedDate, userId)))
| UserDetailView (selectedDate, userId) ->
    // Individual user's records for this date
    let userRecords = selectedDateRecords |> Array.filter (fun r -> r.user_id = userId)

    // Get user's display name from profiles
    let (userName, setUserName) = React.useState<string option>(None)
    React.useEffect((fun () ->
        promise {
            try
                let! profiles = getTeamProfiles()
                let profile = profiles |> Array.tryFind (fun p -> p.id = userId)
                let name = profile |> Option.bind (fun p -> p.display_name) |> Option.defaultValue "Unknown"
                setUserName (Some name)
            with ex -> ()
        } |> Promise.start
    ), [| box userId |])

    Html.div [
        prop.className "space-y-4"
        prop.children [
            // Back button to grouped view (NOT to calendar)
            Html.div [
                prop.className "flex items-center gap-3 mb-4"
                prop.children [
                    Html.button [
                        prop.onClick (fun () -> setCalendarViewState (DailyDetailView selectedDate))
                        prop.className "w-11 h-11 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                        prop.text "←"
                    ]
                    Html.h2 [
                        prop.className "text-lg font-semibold text-gray-800"
                        prop.text (sprintf "%s - %s" (userName |> Option.defaultValue "로딩 중...") selectedDate)
                    ]
                ]
            ]

            // Records list
            if userRecords.Length = 0 then
                Html.div [
                    prop.className "text-center text-gray-400 py-8"
                    prop.text "기록이 없습니다"
                ]
            else
                Html.div [
                    prop.className "space-y-2"
                    prop.children [
                        for record in userRecords do
                            RecordItem record "" (fun _ -> ()) (fun _ -> ())
                    ]
                ]
        ]
    ]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat list of all team records | Grouped by user with drill-down | This phase (12) | DET-02, DET-03 requirements fulfilled |
| No record type indicators | Icon + count badges | This phase (12) | DET-04 requirement - visual summary at a glance |
| Two-level navigation only | Three-level (Calendar → Day → User) | This phase (12) | Enables team member-specific detail views |
| Display name fallback to "Unknown" | Fallback chain: display_name → email → "Unknown" | This phase (12) | Better UX when display_name not set |
| Manual counting loops | Array.countBy for type aggregation | F# best practice | Functional, concise, type-safe |

**Deprecated/outdated:**
- **Flat team detail view:** Phase 11 showed all records in one list - Phase 12 groups by user
- **Boolean "has records" indicator:** Multi-record era needs counts, not just true/false
- **Single DU case for detail:** CalendarViewState.DailyDetailView now needs context (personal vs team)

## Open Questions

Things that couldn't be fully resolved:

1. **Should TeamDayDetailView show total count or breakdown by type?**
   - What we know: DET-04 requires icon(count) display for multiple records
   - What's unclear: User list view - show "3 records" or "운동×2, 메모×1"?
   - Recommendation: Show breakdown by type (more informative). Use RecordsByType in UserRecordGroup.

2. **Should user drill-down allow editing in team context?**
   - What we know: RecordItem already has owner check, only shows edit/delete if user_id matches
   - What's unclear: In team calendar, should users be able to edit their own records when viewing team day?
   - Recommendation: No - team view is read-only for simplicity. Edit from "나" tab only. Pass empty handlers.

3. **How to handle profile fetch failures in grouping?**
   - What we know: getTeamProfiles() could fail, leaving profileMap empty
   - What's unclear: Show error state or fall back to "Unknown" for all users?
   - Recommendation: Catch in try-with, fall back to "Unknown User" for all. Log error but don't block UI.

4. **Should UserDetailView fetch fresh data or use filtered array?**
   - What we know: selectedDateRecords already loaded, can filter by user_id client-side
   - What's unclear: Does filtering client-side risk showing stale data?
   - Recommendation: Use client-side filter - data is fresh from handleDateClick promise. Avoids extra API call.

5. **Count badge max value - what threshold?**
   - What we know: Material Design recommends "99+" for large counts to avoid overflow
   - What's unclear: In workout context, is 99 realistic? Average user has 1-3 records per day.
   - Recommendation: Use "×99+" for counts ≥ 100. Unlikely to hit in practice, but handles edge case.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `/Users/ohama/vibe-coding/rollbook/src/Pages/TeamView.fs` - CalendarViewState pattern, getTeamWorkoutsForDate usage
- Existing codebase: `/Users/ohama/vibe-coding/rollbook/src/Components/DailyDetailView.fs` - Detail view structure, back button pattern
- Existing codebase: `/Users/ohama/vibe-coding/rollbook/src/Supabase/Team.fs` - groupWorkoutsByUser pattern, profile lookup
- [F# Array.groupBy documentation](https://learn.microsoft.com/en-us/dotnet/fsharp/language-reference/sequences) - Official F# sequence/array functions
- [Material Design 3 Badge Guidelines](https://m3.material.io/components/badges/guidelines) - Badge shapes, counts, visual design

### Secondary (MEDIUM confidence)
- [F# Friday – Seq.groupBy](https://bradcollins.com/2015/11/13/f-friday-seq-groupby/) - F# groupBy examples and patterns
- [Mobiscroll React Listview Grouping](https://demo.mobiscroll.com/react/listview/grouping) - Grouped list UI patterns
- [Badge UI Design Best Practices](https://mobbin.com/glossary/badge) - Count minimization, pill shapes, outline strokes
- [React Navigation patterns](https://elmish.github.io/elmish/) - Elmish MVU architecture for F# React apps
- [List UI Design Principles](https://www.justinmind.com/ui-design/list) - Visual hierarchy, white space, mobile optimization

### Tertiary (LOW confidence)
- [Navigation with Fable.Elmish](https://medium.com/@mikhailsmal/navigation-with-fable-elmish-1b33717dc14b) - Navigation state patterns (general)
- [F# and List manipulations](https://jamessdixon.com/2014/04/22/f-and-list-manipulations/) - F# collection operations (dated, pre-2026)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, extends Phase 11 patterns (CalendarViewState, DailyDetailView)
- Architecture: HIGH - Discriminated union navigation proven in Phase 11, Array.groupBy is F# standard library
- Pitfalls: HIGH - Based on actual Phase 11 learnings (profile lookup, soft delete filtering, state management)
- Code examples: HIGH - Adapted from existing Team.fs groupWorkoutsByUser and DailyDetailView patterns

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days - stable F# patterns, no new dependencies, Material Design guidelines stable)
