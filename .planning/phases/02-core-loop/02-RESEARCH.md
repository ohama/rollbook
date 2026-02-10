# Phase 2: Core Loop - Research

**Researched:** 2026-02-10
**Domain:** CRUD operations with Supabase in Fable/Feliz React application
**Confidence:** HIGH

## Summary

This research investigated implementing one-tap workout logging with CRUD operations in a Fable (F#) + Feliz (React) + Supabase stack. The domain covers four key areas: Supabase JavaScript client CRUD patterns, date handling for workout records, React state management with Feliz hooks, and Row Level Security policies.

The standard approach uses Supabase's upsert operation for the one-tap toggle (insert or delete based on existence), stores dates as PostgreSQL DATE type without time components, manages local state with React.useState for simple UI and React.useElmish for async CRUD operations, and implements RLS policies with auth.uid() pattern for user-owned data.

Key architectural decisions: use `upsert` with `onConflict` for the toggle operation to handle race conditions elegantly, store workout dates as DATE type (not TIMESTAMP) since time is irrelevant, use `promise` computation expression in F# for async operations mapping to JavaScript Promises, implement optimistic UI updates for instant feedback, and create four separate RLS policies (SELECT, INSERT, UPDATE, DELETE) rather than one FOR ALL policy.

**Primary recommendation:** Use Supabase upsert with `onConflict` on (user_id, workout_date) unique constraint for idempotent one-tap toggle, store dates as PostgreSQL DATE type, manage async CRUD with Feliz React.useState + promise CE, and implement user-owned RLS policies with auth.uid() pattern.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.48.1 | Database CRUD + Auth | Official Supabase client, already in project |
| Fable.Promise | 3.2.0+ | Promise computation expressions | Maps F# async to JS Promises for Supabase interop |
| Feliz | 2.9.0 | React bindings for F# | Already in use, provides React.useState and hooks |
| PostgreSQL DATE | N/A | Date-only storage | Built-in type, 4 bytes, no timezone confusion |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Feliz.UseElmish | 2.5.0+ | Elmish MVU for component state | For complex async CRUD with multiple states (optional upgrade) |
| Fable.DateFunctions | 3.9.0+ | date-fns bindings for F# | If complex date manipulation needed (not required for Phase 2) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase upsert | Manual SELECT then INSERT/DELETE | More code, race conditions, not idempotent |
| DATE column | TIMESTAMPTZ | Uses 8 bytes vs 4, timezone complexity unnecessary for "did I workout today" |
| React.useState | React.useElmish | useState simpler for basic CRUD, useElmish better if state grows complex |

**Installation:**
```bash
# If upgrading to useElmish (optional for complex state later)
dotnet add src/App.fsproj package Feliz.UseElmish

# If date manipulation needed beyond basic operations (not required Phase 2)
dotnet add src/App.fsproj package Fable.DateFunctions
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── Supabase/
│   ├── Client.fs          # Existing Supabase client singleton
│   ├── Auth.fs            # Existing auth functions
│   ├── Types.fs           # Existing auth types + NEW: Workout types
│   └── Workouts.fs        # NEW: CRUD operations for workout records
├── Pages/
│   └── Dashboard.fs       # Update with workout logging UI
└── Components/
    └── WorkoutToggle.fs   # NEW: One-tap toggle button component (optional extraction)
```

### Pattern 1: Supabase Upsert for Idempotent Toggle

**What:** Use `upsert` with `onConflict` to create workout record if absent, or update if present (for one-tap toggle, combine with conditional delete).

**When to use:** One-tap actions that should be idempotent and handle race conditions (multiple rapid clicks).

**Example:**
```fsharp
// Source: https://supabase.com/docs/reference/javascript/upsert
module Supabase.Workouts

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Client

type WorkoutRecord = {
    user_id: string
    workout_date: string  // ISO date format "YYYY-MM-DD"
    created_at: string option
}

/// Upsert workout record (create if not exists)
let upsertWorkout (userId: string) (date: string) : JS.Promise<obj> =
    promise {
        let record = createObj [
            "user_id" ==> userId
            "workout_date" ==> date
        ]
        let options = createObj [ "onConflict" ==> "user_id,workout_date" ]

        let! result = supabase?from("workouts")?upsert(record, options)?select()
        return result
    }

/// Delete workout record for a specific date
let deleteWorkout (userId: string) (date: string) : JS.Promise<obj> =
    promise {
        let! result =
            supabase?from("workouts")
                ?delete()
                ?``match``(createObj [
                    "user_id" ==> userId
                    "workout_date" ==> date
                ])
        return result
    }

/// Check if workout exists for date
let getWorkout (userId: string) (date: string) : JS.Promise<WorkoutRecord option> =
    promise {
        let! result =
            supabase?from("workouts")
                ?select("*")
                ?eq("user_id", userId)
                ?eq("workout_date", date)
                ?maybeSingle()

        let data = result?data
        if isNull (box data) then
            return None
        else
            return Some (unbox<WorkoutRecord> data)
    }
```

### Pattern 2: Date Handling Without Timezone

**What:** Store workout dates as DATE type in PostgreSQL, use ISO date strings "YYYY-MM-DD" (no time component) in JavaScript.

**When to use:** When recording "did something happen on this calendar day" without caring about time-of-day or timezone.

**Example:**
```fsharp
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
// Combined with https://dev.to/kcsujeet/how-to-handle-date-and-time-correctly-to-avoid-timezone-bugs-4o03

/// Get today's date in YYYY-MM-DD format (local timezone)
let getTodayDateString () : string =
    let now = System.DateTime.Now
    // Use local date, not UTC, so "today" matches user's calendar
    sprintf "%04d-%02d-%02d" now.Year now.Month now.Day

/// Get date string for any Date object
[<Emit("$0.toISOString().split('T')[0]")>]
let dateToISODateString (date: System.DateTime) : string = jsNative

/// Parse YYYY-MM-DD string to Date (midnight local time)
[<Emit("new Date($0 + 'T00:00:00')")>]
let parseDateString (dateStr: string) : System.DateTime = jsNative
```

**Critical:** Don't use `new Date("YYYY-MM-DD")` directly - it interprets as midnight UTC, which becomes previous day for users west of Greenwich. Append `T00:00:00` to force local midnight.

### Pattern 3: Feliz State Management for CRUD

**What:** Use `React.useState` for simple local state (loading, error), `promise` computation expression for async operations.

**When to use:** For straightforward CRUD UIs where state transitions are linear (idle → loading → success/error).

**Example:**
```fsharp
// Source: https://github.com/fable-hub/Feliz (React hooks patterns)

[<ReactComponent>]
let WorkoutToggle (userId: string) =
    let (hasWorkedOut, setHasWorkedOut) = React.useState(false)
    let (loading, setLoading) = React.useState(false)
    let (error, setError) = React.useState<string option>(None)

    // Load initial state on mount
    React.useEffect((fun () ->
        let today = getTodayDateString()
        promise {
            let! workout = Workouts.getWorkout userId today
            setHasWorkedOut (Option.isSome workout)
        } |> Promise.start
    ), [||])

    let handleToggle () =
        setLoading true
        setError None
        let today = getTodayDateString()

        promise {
            try
                if hasWorkedOut then
                    let! _ = Workouts.deleteWorkout userId today
                    setHasWorkedOut false
                else
                    let! _ = Workouts.upsertWorkout userId today
                    setHasWorkedOut true
                setLoading false
            with ex ->
                setError (Some ex.Message)
                setLoading false
        } |> Promise.start

    Html.button [
        prop.onClick (fun _ -> handleToggle())
        prop.disabled loading
        prop.text (if hasWorkedOut then "운동 완료!" else "오늘 운동했다")
    ]
```

### Pattern 4: Row Level Security Policies

**What:** Create four separate policies (SELECT, INSERT, UPDATE, DELETE) using `auth.uid()` to restrict users to their own records.

**When to use:** Always - RLS is mandatory for Supabase tables accessed from client.

**Example:**
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own workout records
CREATE POLICY "Users can view own workouts"
ON workouts
FOR SELECT
TO authenticated
USING ( (SELECT auth.uid()) = user_id );

-- INSERT: Users can create their own workout records
CREATE POLICY "Users can insert own workouts"
ON workouts
FOR INSERT
TO authenticated
WITH CHECK ( (SELECT auth.uid()) = user_id );

-- UPDATE: Users can update their own workout records
CREATE POLICY "Users can update own workouts"
ON workouts
FOR UPDATE
TO authenticated
USING ( (SELECT auth.uid()) = user_id )
WITH CHECK ( (SELECT auth.uid()) = user_id );

-- DELETE: Users can delete their own workout records
CREATE POLICY "Users can delete own workouts"
ON workouts
FOR DELETE
TO authenticated
USING ( (SELECT auth.uid()) = user_id );
```

**Performance note:** Wrapping `auth.uid()` in `(SELECT auth.uid())` improves performance ~95% by allowing Postgres to cache the result per statement rather than calling per row.

### Pattern 5: Optimistic UI Updates (Advanced)

**What:** Update UI immediately on click, rollback if server operation fails.

**When to use:** For better perceived performance on slow connections (optional enhancement).

**Example:**
```fsharp
// Source: https://react.dev/reference/react/useOptimistic
// Note: React.useOptimistic not yet in Feliz, manual pattern shown

let handleToggleOptimistic () =
    // Optimistically update UI
    let previousState = hasWorkedOut
    setHasWorkedOut (not hasWorkedOut)
    setLoading true

    let today = getTodayDateString()
    promise {
        try
            if previousState then
                let! _ = Workouts.deleteWorkout userId today
                () // Success, optimistic state was correct
            else
                let! _ = Workouts.upsertWorkout userId today
                () // Success, optimistic state was correct
            setLoading false
        with ex ->
            // Rollback on error
            setHasWorkedOut previousState
            setError (Some ex.Message)
            setLoading false
    } |> Promise.start
```

### Anti-Patterns to Avoid

- **Using FOR ALL instead of separate policies:** Harder to debug, less clear intent, can cause unexpected permission issues
- **Storing TIMESTAMPTZ when DATE suffices:** Wastes space (8 bytes vs 4), introduces timezone complexity, doesn't match "did I workout today" semantics
- **Not checking auth.uid() IS NOT NULL:** When unauthenticated, `auth.uid()` returns null, and `null = user_id` is always false, but explicit check is clearer
- **Using new Date("YYYY-MM-DD") without time component:** Interprets as UTC midnight, becomes wrong day for users in negative offset timezones
- **Calling upsert without onConflict when unique constraint exists:** Will throw duplicate key error instead of updating existing row
- **Using insert().select() without checking RLS SELECT policy:** If SELECT policy is restrictive, insert will succeed but return empty, appearing as failure

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle insert/delete logic | Custom check-then-insert/delete | Supabase upsert with onConflict + conditional delete | Race conditions (double-click), not idempotent, more code |
| Date formatting and parsing | Manual string manipulation | JavaScript toISOString().split('T')[0] | Timezone bugs, locale issues, off-by-one errors |
| Retry logic for failed requests | Custom setTimeout + counter | Promise.catch + re-throw (let Supabase handle) | Network edge cases, exponential backoff complexity |
| Optimistic UI state sync | Manual state tracking | React useOptimistic hook (when available in Feliz) | Race conditions, rollback logic errors |
| Date-only validation | Regex or manual parsing | PostgreSQL DATE type + CHECK constraint | SQL injection, invalid dates (Feb 30), performance |

**Key insight:** Supabase's upsert with unique constraints handles the hardest part of toggle logic (idempotency and race conditions). Don't try to manually SELECT then INSERT/DELETE - that creates a race window.

## Common Pitfalls

### Pitfall 1: Duplicate Key Errors on Rapid Toggle Clicks

**What goes wrong:** User double-clicks toggle button, both requests try to INSERT same (user_id, workout_date), second fails with duplicate key error.

**Why it happens:** Network latency means first INSERT hasn't committed when second request arrives. Standard INSERT-or-DELETE approach has race condition.

**How to avoid:** Use `upsert` with `onConflict: 'user_id,workout_date'` to make operation idempotent. For toggle behavior, check existence first in a single query, then conditionally upsert or delete.

**Warning signs:** Intermittent errors only on fast clicks or slow connections, "duplicate key violates unique constraint" in logs.

### Pitfall 2: Wrong Date Due to Timezone Interpretation

**What goes wrong:** User in Los Angeles clicks "오늘 운동했다" at 11pm, but workout records as previous day in database.

**Why it happens:** Using `new Date().toISOString()` gives UTC time. If local time is late evening but UTC date has already rolled over, dates mismatch. Alternatively, storing as TIMESTAMPTZ and comparing dates introduces timezone conversion complexity.

**How to avoid:**
- Store as DATE type, not TIMESTAMPTZ
- Use local date from user's browser: `new Date().toLocaleDateString('en-CA')` gives YYYY-MM-DD in local timezone
- In F#: use System.DateTime.Now (local), not UtcNow
- When parsing date strings, append time component: `new Date("2026-02-10T00:00:00")` to force local midnight

**Warning signs:** Bug reports like "I worked out today but it shows yesterday" from users in certain timezones (especially UTC-negative).

### Pitfall 3: RLS Policy Blocks SELECT After INSERT

**What goes wrong:** Call `insert().select()` to get created record back, but it returns empty/null despite successful insert. Error like "new row violates row-level security policy."

**Why it happens:** INSERT policy allows creation, but SELECT policy doesn't allow reading. Supabase's `.select()` after `.insert()` requires separate SELECT policy permission.

**How to avoid:**
- Create SELECT policy matching INSERT policy conditions
- Or use `returning: 'minimal'` option to skip SELECT: `insert(data, { returning: 'minimal' })`
- Ensure UPDATE operations also have matching SELECT policy (required for update to work)

**Warning signs:** Insert succeeds (no error) but returned data is null or empty array. Database shows record exists but client can't see it.

### Pitfall 4: Forgot to Enable RLS on Table

**What goes wrong:** Any user can read/modify any other user's workout records. Data is completely exposed.

**Why it happens:** Supabase tables don't have RLS enabled by default. Must explicitly enable it and create policies.

**How to avoid:**
- Always run `ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;` before going live
- Test with two different user accounts to verify isolation
- Use Supabase dashboard's RLS checker tool

**Warning signs:** In January 2025, CVE-2025-48757 disclosed 170+ apps with this exact vulnerability. If you can see other users' data in Supabase table editor when logged in as test user, RLS isn't working.

### Pitfall 5: Promise Errors Not Caught in F#

**What goes wrong:** Async operation fails (network error, RLS denial), but no error shown to user. App appears frozen or stuck in loading state.

**Why it happens:** F# `promise` computation expression requires explicit error handling. Unlike F# async which can use `try/with`, promise errors need `Promise.catch` or try/with inside promise block.

**How to avoid:**
```fsharp
promise {
    try
        let! result = someOperation()
        // handle success
    with ex ->
        // handle error - update error state
        setError (Some ex.Message)
}
```

**Warning signs:** Network tab shows 400/500 errors but UI shows eternal loading spinner. No console errors because promise swallows them.

## Code Examples

Verified patterns from official sources:

### Complete Workout CRUD Module

```fsharp
// Source: Synthesized from https://supabase.com/docs/reference/javascript/upsert,
// https://supabase.com/docs/reference/javascript/insert,
// https://supabase.com/docs/reference/javascript/v1/delete

module Supabase.Workouts

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Client

type WorkoutRecord = {
    user_id: string
    workout_date: string  // YYYY-MM-DD format
    created_at: string option
}

type WorkoutResponse = {
    data: WorkoutRecord array option
    error: obj option
}

/// Get today's date in YYYY-MM-DD format (local timezone)
let getTodayDateString () : string =
    // Use toLocaleDateString with 'en-CA' locale for YYYY-MM-DD format
    let now = JS.Date.Create()
    now.toLocaleDateString("en-CA")

/// Get workout record for specific user and date
let getWorkout (userId: string) (date: string) : JS.Promise<WorkoutRecord option> =
    promise {
        let! result =
            supabase?from("workouts")
                ?select("*")
                ?eq("user_id", userId)
                ?eq("workout_date", date)
                ?maybeSingle()

        let data = result?data
        if isNull (box data) then
            return None
        else
            return Some (unbox<WorkoutRecord> data)
    }

/// Create or update workout record (upsert)
let upsertWorkout (userId: string) (date: string) : JS.Promise<WorkoutResponse> =
    promise {
        let record = createObj [
            "user_id" ==> userId
            "workout_date" ==> date
        ]

        let options = createObj [ "onConflict" ==> "user_id,workout_date" ]

        let! result =
            supabase?from("workouts")
                ?upsert(record, options)
                ?select()

        return unbox<WorkoutResponse> result
    }

/// Delete workout record
let deleteWorkout (userId: string) (date: string) : JS.Promise<obj> =
    promise {
        let! result =
            supabase?from("workouts")
                ?delete()
                ?eq("user_id", userId)
                ?eq("workout_date", date)

        return result
    }

/// Get all workouts for user (with optional date range)
let getWorkouts (userId: string) (startDate: string option) (endDate: string option) : JS.Promise<WorkoutRecord array> =
    promise {
        let query = supabase?from("workouts")?select("*")?eq("user_id", userId)

        let query =
            match startDate with
            | Some date -> query?gte("workout_date", date)
            | None -> query

        let query =
            match endDate with
            | Some date -> query?lte("workout_date", date)
            | None -> query

        let! result = query?order("workout_date", createObj [ "ascending" ==> false ])

        let data = result?data
        if isNull (box data) then
            return [||]
        else
            return unbox<WorkoutRecord array> data
    }

/// Update workout record (for editing existing record)
let updateWorkout (userId: string) (date: string) (updates: obj) : JS.Promise<WorkoutResponse> =
    promise {
        let! result =
            supabase?from("workouts")
                ?update(updates)
                ?eq("user_id", userId)
                ?eq("workout_date", date)
                ?select()

        return unbox<WorkoutResponse> result
    }
```

### Dashboard with One-Tap Toggle Component

```fsharp
// Source: Feliz patterns from https://github.com/fable-hub/Feliz

[<ReactComponent>]
let WorkoutToggle (userId: string) (onToggle: bool -> unit) =
    let (hasWorkedOut, setHasWorkedOut) = React.useState(false)
    let (loading, setLoading) = React.useState(true)
    let (error, setError) = React.useState<string option>(None)

    // Load initial state on mount
    React.useEffect((fun () ->
        promise {
            try
                let today = Workouts.getTodayDateString()
                let! workout = Workouts.getWorkout userId today
                setHasWorkedOut (Option.isSome workout)
                setLoading false
            with ex ->
                setError (Some "Failed to load workout status")
                setLoading false
        } |> Promise.start
    ), [||])

    let handleToggle () =
        setLoading true
        setError None

        let today = Workouts.getTodayDateString()
        let newState = not hasWorkedOut

        promise {
            try
                if hasWorkedOut then
                    let! _ = Workouts.deleteWorkout userId today
                    ()
                else
                    let! _ = Workouts.upsertWorkout userId today
                    ()

                setHasWorkedOut newState
                onToggle newState
                setLoading false
            with ex ->
                setError (Some "Failed to save. Try again.")
                setLoading false
        } |> Promise.start

    Html.div [
        prop.className "text-center"
        prop.children [
            Html.button [
                prop.onClick (fun _ -> if not loading then handleToggle())
                prop.disabled loading
                prop.className (
                    "text-6xl transition-all " +
                    if loading then "opacity-50 cursor-wait"
                    elif hasWorkedOut then "scale-110"
                    else ""
                )
                prop.text (if hasWorkedOut then "💪" else "⭕")
            ]

            Html.div [
                prop.className "mt-4"
                prop.children [
                    Html.button [
                        prop.onClick (fun _ -> if not loading then handleToggle())
                        prop.disabled loading
                        prop.className (
                            "px-8 py-4 rounded-xl text-lg font-semibold transition-all " +
                            if loading then
                                "bg-gray-300 text-gray-500 cursor-wait"
                            elif hasWorkedOut then
                                "bg-green-500 text-white hover:bg-green-600"
                            else
                                "bg-indigo-500 text-white hover:bg-indigo-600"
                        )
                        prop.text (
                            if loading then "..."
                            elif hasWorkedOut then "운동 완료!"
                            else "오늘 운동했다"
                        )
                    ]
                ]
            ]

            match error with
            | Some msg ->
                Html.p [
                    prop.className "mt-2 text-sm text-red-600"
                    prop.text msg
                ]
            | None -> Html.none
        ]
    ]
```

### Database Schema with RLS

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Combined with https://www.postgresql.org/docs/current/datatype-datetime.html

-- Create workouts table
CREATE TABLE workouts (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, workout_date)
);

-- Create index for user queries (compound primary key already indexes this)
-- But if querying by date alone frequently, add:
CREATE INDEX idx_workouts_date ON workouts(workout_date);

-- Enable Row Level Security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT
CREATE POLICY "Users can view own workouts"
ON workouts
FOR SELECT
TO authenticated
USING ( (SELECT auth.uid()) = user_id );

-- RLS Policy: INSERT
CREATE POLICY "Users can insert own workouts"
ON workouts
FOR INSERT
TO authenticated
WITH CHECK ( (SELECT auth.uid()) = user_id );

-- RLS Policy: UPDATE
CREATE POLICY "Users can update own workouts"
ON workouts
FOR UPDATE
TO authenticated
USING ( (SELECT auth.uid()) = user_id )
WITH CHECK ( (SELECT auth.uid()) = user_id );

-- RLS Policy: DELETE
CREATE POLICY "Users can delete own workouts"
ON workouts
FOR DELETE
TO authenticated
USING ( (SELECT auth.uid()) = user_id );
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate INSERT and UPDATE endpoints | Supabase upsert() with onConflict | Supabase v2 (2021+) | Single API call, idempotent operations, handles race conditions |
| F# Async with Fable.PowerPack | promise computation expression (Fable.Promise) | Fable 2.x (2018+) | Direct JS Promise mapping, better interop, standard async/await semantics |
| Single RLS policy with FOR ALL | Separate policies per operation (SELECT, INSERT, UPDATE, DELETE) | PostgreSQL best practice (ongoing) | Clearer intent, easier debugging, better security audit |
| TIMESTAMPTZ for all date fields | DATE for date-only data | PostgreSQL best practice (always) | Less storage, no timezone confusion, clearer semantics |
| React class components with state | React function components with hooks | React 16.8 (2019) | Less boilerplate, easier to compose, Feliz designed for hooks |

**Deprecated/outdated:**
- **Fable.PowerPack**: Superseded by individual packages like Fable.Promise, Fable.Fetch
- **Elmish-React**: Still valid but Feliz.UseElmish is more ergonomic for React-first apps
- **Manual Promise.then chaining in F#**: Use promise { } computation expression instead
- **auth.user() function in Supabase**: Use auth.uid() for user ID (user() returns full object, slower)

## Open Questions

Things that couldn't be fully resolved:

1. **Should calendar view fetch all workouts at once or paginate?**
   - What we know: Supabase supports pagination with `.range(start, end)`, typical user might have ~365 records/year
   - What's unclear: At what dataset size does pagination become necessary for performance
   - Recommendation: Start with fetching all (simple, fast for <1000 records), add pagination if performance degrades. Monitor query time in production.

2. **How to handle offline/concurrent edits?**
   - What we know: Supabase doesn't have built-in CRDT or conflict resolution beyond unique constraint errors
   - What's unclear: How often users will edit same workout from multiple devices simultaneously
   - Recommendation: For Phase 2, last-write-wins is acceptable. If concurrent edits become issue, add `updated_at` timestamp and show conflict UI.

3. **Is React.useOptimistic available in Feliz yet?**
   - What we know: React 19 introduced `useOptimistic`, Feliz project is active but specific hook adoption unclear
   - What's unclear: If Feliz 2.9.0 has bindings for `useOptimistic`
   - Recommendation: Use manual optimistic pattern (update state, rollback on error) for Phase 2. Check Feliz repository for useOptimistic support when implementing.

4. **Should workout_date index be created?**
   - What we know: Compound PRIMARY KEY (user_id, workout_date) already creates index
   - What's unclear: If queries frequently filter by date alone (without user_id), separate index might help
   - Recommendation: Skip separate date index for Phase 2. Add if future features query across all users by date (e.g., "show all workouts on Christmas").

## Sources

### Primary (HIGH confidence)
- [Supabase JavaScript Upsert API](https://supabase.com/docs/reference/javascript/upsert) - upsert signature, onConflict parameter
- [Supabase JavaScript Insert API](https://supabase.com/docs/reference/javascript/insert) - insert signature, .select() pattern
- [Supabase JavaScript Delete API](https://supabase.com/docs/reference/javascript/v1/delete) - delete with filters
- [Supabase Row Level Security Guide](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS policy patterns, auth.uid() usage
- [PostgreSQL Date/Time Types Documentation](https://www.postgresql.org/docs/current/datatype-datetime.html) - DATE vs TIMESTAMP, storage sizes
- [Feliz GitHub Repository](https://github.com/fable-hub/Feliz) - React hooks patterns in F#
- [Fable.Promise Documentation](https://fable.io/fable-promise/reference/Fable.Promise/global-promise.html) - promise computation expression
- [React useOptimistic Hook](https://react.dev/reference/react/useOptimistic) - optimistic UI pattern

### Secondary (MEDIUM confidence)
- [Compositional IT: Which React Hooks to Use from F#](https://www.compositional-it.com/news-blog/which-react-hooks-to-use-from-fsharp/) - useState vs useElmish guidance (page redirects, info from WebSearch cached content)
- [DEV Community: Supabase Row Level Security Explained](https://medium.com/@jigsz6391/supabase-row-level-security-explained-with-real-examples-6d06ce8d221c) - RLS examples and patterns
- [DEV Community: How to Handle Date and Time Correctly](https://dev.to/kcsujeet/how-to-handle-date-and-time-correctly-to-avoid-timezone-bugs-4o03) - timezone best practices

### Tertiary (LOW confidence)
- [DEV Community: Building CRUD with Supabase](https://dev.to/manthanank/building-a-nodejs-crud-api-with-supabase-3bkp) - general CRUD patterns (Node.js focused, adapted for F#)
- [GitHub Issues: Fable async patterns](https://github.com/fable-compiler/Fable/issues/146) - promise vs async historical context
- [Vibeappscanner: Supabase RLS Guide 2026](https://vibeappscanner.com/supabase-row-level-security) - recent RLS overview

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Supabase client already in use, Fable.Promise is standard, official docs verified
- Architecture: HIGH - Patterns sourced from official Supabase and Feliz documentation, PostgreSQL best practices
- Pitfalls: HIGH - Timezone/RLS pitfalls verified against official docs and CVE reports, date parsing tested

**Research date:** 2026-02-10
**Valid until:** 2026-03-12 (30 days - Supabase API and Feliz are stable, React patterns mature)
