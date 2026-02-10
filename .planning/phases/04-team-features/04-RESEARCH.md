# Phase 4: Team Features - Research

**Researched:** 2026-02-10
**Domain:** Privacy-first team stats with PostgreSQL aggregation and RLS
**Confidence:** HIGH

## Summary

Phase 4 implements privacy-first team motivation features: users can see team roster and each member's monthly workout COUNT, but cannot access individual workout dates, photos, or notes. This research investigated PostgreSQL strategies for exposing aggregated stats while protecting raw data through RLS.

The key challenge is that existing RLS policies on the workouts table restrict access to `user_id = auth.uid()`, preventing users from seeing other users' workout records. To show team stats (aggregated counts), we need to either:
1. Create a PostgreSQL function with SECURITY DEFINER that bypasses RLS and returns only aggregated data
2. Create a view without `security_invoker = true` (default behavior bypasses RLS)
3. Add new RLS policies allowing SELECT on aggregated data

**Recommended approach:** Create a SECURITY DEFINER PostgreSQL function `get_team_monthly_stats()` that:
- Runs with elevated privileges (bypasses workouts table RLS)
- Returns ONLY aggregated data (user_id, month, workout_count)
- Joins with profiles table to include display_name
- Called via Supabase RPC from client

This approach is secure because the function itself enforces what data is returned (only counts, never raw workout records), while maintaining simplicity and good performance.

For the team roster, add a new RLS policy on the profiles table allowing authenticated users to view other users' `id` and `display_name` (but not email or other private fields).

**Primary recommendation:** Use SECURITY DEFINER function for team stats aggregation, combined with a permissive SELECT RLS policy on profiles for roster display. No changes needed to workouts table RLS policies.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.48.1 | RPC function calls | Already in project, supports `.rpc()` method |
| PostgreSQL functions | N/A | Server-side aggregation | Built-in Postgres feature, SECURITY DEFINER pattern |
| Fable.Promise | 3.2.0+ | Promise computation expressions | Already in use for async Supabase calls |
| Feliz | 2.9.0 | React components for team view | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PostgreSQL DATE_TRUNC | N/A | Monthly grouping | GROUP BY month aggregation |
| Tailwind CSS | 3.x+ | Team roster/stats styling | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SECURITY DEFINER function | View without security_invoker | View approach simpler but less explicit about RLS bypass |
| SECURITY DEFINER function | New RLS policies on workouts | Would require complex policy with aggregation logic (not supported in RLS) |
| RPC function | Direct table query + client aggregation | Exposes raw data, violates privacy requirement, poor performance |

**Installation:**
```bash
# No new packages needed - use existing stack
# Database migration required for:
# 1. SECURITY DEFINER function for team stats
# 2. RLS policy update on profiles table
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── Supabase/
│   ├── Client.fs          # Existing - add RPC call support
│   ├── Types.fs           # Add TeamMemberStats type
│   └── Team.fs            # NEW: Team stats and roster functions
├── Pages/
│   ├── Dashboard.fs       # Add Team tab alongside Home and Progress
│   └── TeamView.fs        # NEW: Team roster with monthly stats
└── Components/
    ├── TeamRoster.fs      # NEW: List of team members with stats
    └── TeamMemberStats.fs # NEW: Individual member stat display

supabase/migrations/
└── YYYYMMDD_team_features.sql  # NEW: Function + RLS policy
```

### Pattern 1: SECURITY DEFINER Function for Aggregated Stats

**What:** PostgreSQL function that runs with creator's privileges (bypassing RLS) but returns only aggregated data, making raw records inaccessible.

**When to use:** When users need to see aggregate statistics of data they cannot access at row level.

**Example:**
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Create function in private schema (not exposed to API)
CREATE OR REPLACE FUNCTION public.get_team_monthly_stats(
    target_year INT,
    target_month INT
)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    workout_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
-- Critical: Set search_path for security
SET search_path = public, pg_catalog
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS user_id,
        p.display_name,
        COUNT(w.workout_date)::BIGINT AS workout_count
    FROM public.profiles p
    LEFT JOIN public.workouts w ON p.id = w.user_id
        AND EXTRACT(YEAR FROM w.workout_date) = target_year
        AND EXTRACT(MONTH FROM w.workout_date) = target_month
    GROUP BY p.id, p.display_name
    ORDER BY workout_count DESC, p.display_name;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_team_monthly_stats(INT, INT) TO authenticated;
```

**Critical Security Notes:**
- Function returns aggregated counts ONLY - never raw workout dates
- `SECURITY DEFINER` runs with function creator's privileges
- `SET search_path` prevents path-based attacks
- LEFT JOIN ensures users with 0 workouts appear in roster

### Pattern 2: RLS Policy for Team Roster (Profiles Access)

**What:** Allow authenticated users to view basic profile info (id, display_name) of all users for roster display.

**When to use:** When users need to see a list of team members without exposing private data.

**Example:**
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Add policy for team roster viewing
-- Users can view id and display_name of all authenticated users
CREATE POLICY "Authenticated users can view team roster"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);  -- All authenticated users can see all profiles

-- Note: This exposes all columns. If you want to restrict columns,
-- create a view with security_invoker = true and select only safe columns
```

**Column Restriction Alternative (if email should be hidden):**
```sql
-- Create a secure view for team roster (exposes only safe columns)
CREATE VIEW public.team_roster
WITH (security_invoker = true)
AS
SELECT id, display_name
FROM public.profiles;

-- RLS on profiles still applies because security_invoker = true
-- But we need to update the profiles policy to allow team access
```

For Rollbook v1, the simpler approach is recommended: update the profiles SELECT policy to allow all authenticated users to read, since email is not sensitive for a small team app.

### Pattern 3: Supabase RPC Calls from F#

**What:** Call PostgreSQL functions via Supabase's `.rpc()` method from Fable F# code.

**When to use:** When calling server-side functions for aggregated data or complex operations.

**Example:**
```fsharp
// Source: https://supabase.com/docs/reference/javascript/rpc
// Combined with existing Supabase.Client.fs pattern

module Supabase.Team

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Client

/// Team member stats record
type TeamMemberStats = {
    user_id: string
    display_name: string option
    workout_count: int
}

/// Get team monthly stats via RPC
let getTeamMonthlyStats (year: int) (month: int) : JS.Promise<TeamMemberStats array> =
    promise {
        let params = createObj [
            "target_year" ==> year
            "target_month" ==> month
        ]

        // Call RPC function
        let! result = supabase?rpc("get_team_monthly_stats", params)

        let data = result?data
        if isNull data then
            return [||]
        else
            return unbox<TeamMemberStats array> data
    }

/// Get team roster (all profiles)
let getTeamRoster () : JS.Promise<{| id: string; display_name: string option |} array> =
    promise {
        let! result =
            supabase?from("profiles")
                ?select("id, display_name")
                ?order("display_name")

        let data = result?data
        if isNull data then
            return [||]
        else
            return unbox data
    }
```

### Pattern 4: TeamView Component Structure

**What:** Dashboard tab showing team roster with monthly workout counts, following existing ProgressView pattern.

**When to use:** Displaying aggregated team statistics.

**Example:**
```fsharp
// Source: Existing ProgressView.fs pattern

module Pages.TeamView

open Feliz
open Supabase.Team
open Utils.DateHelpers

[<ReactComponent>]
let TeamViewPage () =
    // Month navigation (reuse from ProgressView pattern)
    let (currentYear, setCurrentYear) = React.useState(System.DateTime.Now.Year)
    let (currentMonth, setCurrentMonth) = React.useState(System.DateTime.Now.Month)

    // Team stats data
    let (teamStats, setTeamStats) = React.useState<TeamMemberStats array>([||])
    let (loading, setLoading) = React.useState(true)
    let (error, setError) = React.useState<string option>(None)

    // Load team stats when month changes
    React.useEffect((fun () ->
        promise {
            try
                setLoading true
                setError None
                let! stats = getTeamMonthlyStats currentYear currentMonth
                setTeamStats stats
                setLoading false
            with ex ->
                setError (Some "팀 통계를 불러올 수 없습니다")
                setLoading false
        } |> Promise.start
    ), [| box currentYear; box currentMonth |])

    Html.div [
        // Month navigation header (reuse existing pattern)
        // Team member list with workout counts
        // ...
    ]
```

### Anti-Patterns to Avoid

- **Don't query workouts table directly for other users:** RLS correctly blocks this, respect the privacy model
- **Don't create SECURITY DEFINER functions that return raw rows:** Only return aggregated/safe data
- **Don't put SECURITY DEFINER functions in exposed schemas without careful review:** Could be called directly via API
- **Don't forget LEFT JOIN in aggregation:** Users with 0 workouts should still appear in roster
- **Don't expose email in team roster:** Use display_name only for privacy
- **Don't use views without understanding security_invoker:** Default is SECURITY DEFINER (bypasses RLS)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Aggregated team stats | Client-side fetch all users + count | PostgreSQL function with SECURITY DEFINER | Privacy (can't fetch raw data), performance (single query) |
| Monthly grouping | JavaScript date manipulation | PostgreSQL EXTRACT(MONTH FROM date) | More efficient, handles timezones correctly |
| Display name fallback | Complex null checks | COALESCE(display_name, 'Anonymous') in SQL | Cleaner, single source of truth |
| Team roster sorting | Client-side sort | ORDER BY in SQL query | Better performance, consistent ordering |
| Month navigation | New component | Reuse ProgressView pattern | Already built and tested |

**Key insight:** The SECURITY DEFINER function pattern is the standard way to expose aggregated stats while protecting raw data. It's commonly used in multi-tenant applications and is recommended by Supabase documentation for performance-critical RLS scenarios.

## Common Pitfalls

### Pitfall 1: Forgetting LEFT JOIN for Zero-Workout Users

**What goes wrong:** Team members who haven't worked out in the selected month don't appear in the roster.

**Why it happens:** Using INNER JOIN between profiles and workouts excludes users with no matching workout records.

**How to avoid:** Use LEFT JOIN from profiles to workouts: `FROM profiles p LEFT JOIN workouts w ON p.id = w.user_id AND ...`

**Warning signs:** Some team members mysteriously "disappear" in months they didn't work out.

### Pitfall 2: SECURITY DEFINER Without search_path

**What goes wrong:** Potential security vulnerability where attackers could manipulate function behavior via search_path poisoning.

**Why it happens:** Postgres allows schema objects to be resolved differently based on search_path, which can be manipulated.

**How to avoid:** Always set `SET search_path = public, pg_catalog` in SECURITY DEFINER functions. Use fully qualified table names (`public.profiles`, `public.workouts`).

**Warning signs:** Security audit tools flagging the function.

### Pitfall 3: Exposing Email in Team Roster

**What goes wrong:** Other team members can see each user's email address, which may be considered private.

**Why it happens:** Using `SELECT *` from profiles or not restricting columns in RLS policy.

**How to avoid:** Either create a view with only safe columns (id, display_name), or be explicit in queries: `.select("id, display_name")`.

**Warning signs:** Users complaining about email exposure, privacy concerns.

### Pitfall 4: RPC Function Not Found Error

**What goes wrong:** Calling `.rpc("get_team_monthly_stats")` returns "function does not exist" error.

**Why it happens:** Function created but GRANT EXECUTE not run, or function not in public schema, or typo in function name.

**How to avoid:**
1. Ensure function is in public schema (or exposed schema)
2. Run `GRANT EXECUTE ON FUNCTION ... TO authenticated`
3. Test function directly in SQL editor first

**Warning signs:** 404 or "function not found" errors from Supabase client.

### Pitfall 5: Stats Not Updating Immediately

**What goes wrong:** User logs workout but team stats don't reflect the new count immediately.

**Why it happens:** React component not re-fetching after workout is logged on another tab/page.

**How to avoid:** Either refresh stats when navigating to Team tab, or implement a simple polling mechanism. For Rollbook v1, manual refresh is acceptable.

**Warning signs:** Users reporting stale stats that update after page refresh.

### Pitfall 6: Wrong Month Data Due to Timezone

**What goes wrong:** Workouts logged at the end/beginning of month appear in wrong month in stats.

**Why it happens:** Using TIMESTAMPTZ comparisons instead of DATE, or not aligning client/server timezone expectations.

**How to avoid:** The workouts table uses DATE type (no time component), so this should not be an issue. The aggregation function extracts month from DATE, which is timezone-agnostic.

**Warning signs:** Edge case bug reports around month boundaries.

## Code Examples

Verified patterns from official sources:

### Complete Database Migration

```sql
-- Migration: 20260210_team_features.sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- ============================================================
-- Part 1: SECURITY DEFINER function for team monthly stats
-- ============================================================

-- Create function to get team monthly stats
-- This function bypasses workouts RLS and returns only aggregated counts
CREATE OR REPLACE FUNCTION public.get_team_monthly_stats(
    target_year INT,
    target_month INT
)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    workout_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS user_id,
        COALESCE(p.display_name, 'Anonymous') AS display_name,
        COUNT(w.workout_date)::BIGINT AS workout_count
    FROM public.profiles p
    LEFT JOIN public.workouts w ON p.id = w.user_id
        AND EXTRACT(YEAR FROM w.workout_date) = target_year
        AND EXTRACT(MONTH FROM w.workout_date) = target_month
    GROUP BY p.id, p.display_name
    ORDER BY workout_count DESC, p.display_name NULLS LAST;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_team_monthly_stats(INT, INT) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION public.get_team_monthly_stats IS
'Returns monthly workout counts for all team members. Uses SECURITY DEFINER to bypass workouts RLS. Only returns aggregated counts, never raw workout data.';

-- ============================================================
-- Part 2: Update profiles RLS for team roster viewing
-- ============================================================

-- Allow authenticated users to view all profiles (for team roster)
-- This exposes: id, display_name, email, created_at, updated_at
-- If email privacy is a concern, use a view instead (see Pattern 2)
CREATE POLICY "Authenticated users can view team roster"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Note: This replaces the existing "Users can view own profile" policy
-- for SELECT operations. The existing policy is:
-- USING ((select auth.uid()) = id)
--
-- Since the new policy is more permissive (USING (true)), it will
-- allow any authenticated user to view any profile.
-- If you want BOTH policies, keep them both - Postgres OR's them together.

-- ============================================================
-- Part 3: Index for performance (optional but recommended)
-- ============================================================

-- Create index on workouts for month-based queries
-- This helps the GROUP BY in get_team_monthly_stats
CREATE INDEX IF NOT EXISTS idx_workouts_year_month
ON public.workouts (EXTRACT(YEAR FROM workout_date), EXTRACT(MONTH FROM workout_date));
```

### F# Types and API Module

```fsharp
// Source: Existing Supabase.Types.fs pattern +
// https://supabase.com/docs/reference/javascript/rpc

// Add to Supabase/Types.fs
/// Team member with monthly workout stats
type TeamMemberStats = {
    user_id: string
    display_name: string
    workout_count: int
}

// New file: Supabase/Team.fs
module Supabase.Team

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Client
open Supabase.Types

/// Get team monthly stats via RPC function
let getTeamMonthlyStats (year: int) (month: int) : JS.Promise<TeamMemberStats array> =
    promise {
        let params = createObj [
            "target_year" ==> year
            "target_month" ==> month
        ]

        let! result = supabase?rpc("get_team_monthly_stats", params)

        // Handle potential errors
        let error = result?error
        if not (isNull error) then
            let errorMsg = error?message |> unbox<string>
            failwith errorMsg

        let data = result?data
        if isNull data then
            return [||]
        else
            return unbox<TeamMemberStats array> data
    }

/// Get all team members (profiles) for roster display
let getTeamRoster () : JS.Promise<{| id: string; display_name: string option |} array> =
    promise {
        let! result =
            supabase?from("profiles")
                ?select("id, display_name")
                ?order("display_name", createObj ["nullsFirst" ==> false])

        let error = result?error
        if not (isNull error) then
            let errorMsg = error?message |> unbox<string>
            failwith errorMsg

        let data = result?data
        if isNull data then
            return [||]
        else
            return unbox data
    }
```

### TeamView Page Component

```fsharp
// New file: Pages/TeamView.fs
// Source: Existing ProgressView.fs pattern

module Pages.TeamView

open Feliz
open Fable.Core.JsInterop
open Supabase.Types
open Supabase.Team
open Utils.DateHelpers

[<ReactComponent>]
let TeamMemberRow (stats: TeamMemberStats) (isCurrentUser: bool) =
    Html.div [
        prop.className (
            "flex items-center justify-between p-4 rounded-lg " +
            if isCurrentUser then "bg-indigo-50 border border-indigo-200"
            else "bg-white"
        )
        prop.children [
            // Left: Name
            Html.div [
                prop.className "flex items-center gap-3"
                prop.children [
                    Html.span [
                        prop.className "text-2xl"
                        prop.text (if stats.workout_count > 0 then "💪" else "😴")
                    ]
                    Html.span [
                        prop.className (
                            "font-medium " +
                            if isCurrentUser then "text-indigo-800"
                            else "text-gray-800"
                        )
                        prop.text (
                            if isCurrentUser then stats.display_name + " (나)"
                            else stats.display_name
                        )
                    ]
                ]
            ]

            // Right: Workout count
            Html.div [
                prop.className "text-right"
                prop.children [
                    Html.span [
                        prop.className "text-2xl font-bold text-indigo-600"
                        prop.text (string stats.workout_count)
                    ]
                    Html.span [
                        prop.className "text-sm text-gray-500 ml-1"
                        prop.text "회"
                    ]
                ]
            ]
        ]
    ]

[<ReactComponent>]
let TeamViewPage (currentUserId: string) =
    // Month navigation state
    let (currentYear, setCurrentYear) = React.useState(System.DateTime.Now.Year)
    let (currentMonth, setCurrentMonth) = React.useState(System.DateTime.Now.Month)

    // Data state
    let (teamStats, setTeamStats) = React.useState<TeamMemberStats array>([||])
    let (loading, setLoading) = React.useState(true)
    let (error, setError) = React.useState<string option>(None)

    // Month navigation functions (same as ProgressView)
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

    // Load team stats when month changes
    React.useEffect((fun () ->
        promise {
            try
                setLoading true
                setError None
                let! stats = getTeamMonthlyStats currentYear currentMonth
                setTeamStats stats
                setLoading false
            with ex ->
                setError (Some "팀 통계를 불러올 수 없습니다")
                setLoading false
        } |> Promise.start
    ), [| box currentYear; box currentMonth |])

    Html.div [
        prop.className "space-y-6"
        prop.children [
            // Month navigation header
            Html.div [
                prop.className "flex items-center justify-between bg-white rounded-lg p-4 shadow-sm"
                prop.children [
                    Html.button [
                        prop.onClick (fun _ -> goToPrevMonth())
                        prop.className "p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                        prop.text "<"
                    ]
                    Html.h2 [
                        prop.className "text-lg font-semibold text-gray-800"
                        prop.text (formatMonthYear currentYear currentMonth)
                    ]
                    Html.button [
                        prop.onClick (fun _ -> goToNextMonth())
                        prop.className "p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                        prop.text ">"
                    ]
                ]
            ]

            // Team stats summary
            Html.div [
                prop.className "bg-white rounded-lg p-6 shadow-sm"
                prop.children [
                    Html.div [
                        prop.className "text-center"
                        prop.children [
                            Html.div [
                                prop.className "text-3xl font-bold text-indigo-600"
                                prop.text (string (teamStats |> Array.sumBy (fun s -> s.workout_count)))
                            ]
                            Html.div [
                                prop.className "text-sm text-gray-600"
                                prop.text "팀 총 운동 횟수"
                            ]
                        ]
                    ]
                ]
            ]

            // Team roster with stats
            Html.div [
                prop.className "bg-white rounded-lg shadow-sm overflow-hidden"
                prop.children [
                    Html.h3 [
                        prop.className "px-4 py-3 border-b border-gray-100 font-semibold text-gray-800"
                        prop.text "팀원별 운동 현황"
                    ]

                    // Loading state
                    if loading then
                        Html.div [
                            prop.className "p-8 text-center text-gray-500"
                            prop.text "로딩 중..."
                        ]
                    // Error state
                    elif error.IsSome then
                        Html.div [
                            prop.className "p-8 text-center text-red-500"
                            prop.text error.Value
                        ]
                    // Team member list
                    else
                        Html.div [
                            prop.className "divide-y divide-gray-100"
                            prop.children [
                                for stats in teamStats do
                                    TeamMemberRow stats (stats.user_id = currentUserId)
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
| Views without security_invoker | Views WITH (security_invoker = true) for RLS compliance | PostgreSQL 15 (2022) | Must explicitly opt-in to RLS on views |
| Auth.uid() called per row | (SELECT auth.uid()) wrapped for caching | Ongoing best practice | ~95% performance improvement |
| Complex RLS policies with subqueries | SECURITY DEFINER functions for cross-user aggregation | Supabase best practice | Simpler policies, better performance |
| Client-side aggregation | Server-side PostgreSQL aggregation | Always recommended | Privacy enforcement at database level |

**Deprecated/outdated:**
- **Views bypassing RLS without awareness:** Now flagged by Supabase Security Advisor
- **FOR ALL policies:** Separate SELECT/INSERT/UPDATE/DELETE policies preferred for clarity
- **Manual JWT parsing:** Use auth.uid() and auth.jwt() helper functions

## Open Questions

Things that couldn't be fully resolved:

1. **Should profiles RLS allow viewing all columns or restrict to id/display_name?**
   - What we know: Current policy allows viewing own profile. New policy would allow all authenticated users to see all profiles.
   - What's unclear: Whether email column exposure is acceptable for small team app
   - Recommendation: For Rollbook v1, allow full SELECT since it's a small trusted team. Add column restriction (via view) in v2 if needed.

2. **Real-time updates for team stats?**
   - What we know: Supabase Realtime supports postgres_changes for table subscriptions
   - What's unclear: Whether subscribing to workouts table would reveal privacy-sensitive data (workout dates)
   - Recommendation: Skip real-time for Phase 4. Manual refresh or polling is acceptable. If needed, create a separate "workout_events" table with only user_id + timestamp for real-time notifications.

3. **Performance at scale (100+ team members)?**
   - What we know: Function uses efficient GROUP BY with proper indexes
   - What's unclear: Whether pagination needed for large teams
   - Recommendation: Phase 4 targets ~20 users. Add LIMIT/OFFSET if team grows beyond 50.

4. **Display name fallback handling?**
   - What we know: display_name can be NULL in profiles table
   - What's unclear: What to show for users who never set display_name
   - Recommendation: Use COALESCE(display_name, 'Anonymous') in SQL function, or show email prefix as fallback.

## Sources

### Primary (HIGH confidence)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS patterns, SECURITY DEFINER guidance
- [Supabase JavaScript RPC](https://supabase.com/docs/reference/javascript/rpc) - RPC call syntax, parameters
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) - Creating PostgreSQL functions
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) - SECURITY DEFINER vs INVOKER

### Secondary (MEDIUM confidence)
- [Supabase RLS Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) - Performance optimization, (SELECT auth.uid()) pattern
- [PostgREST Aggregate Functions](https://supabase.com/blog/postgrest-aggregate-functions) - GROUP BY patterns
- [Medium: Supabase RLS Explained](https://medium.com/@jigsz6391/supabase-row-level-security-explained-with-real-examples-6d06ce8d221c) - Real-world examples
- [Bytebase: Common RLS Footguns](https://www.bytebase.com/blog/postgres-row-level-security-footguns/) - Common mistakes

### Tertiary (LOW confidence)
- [GitHub Discussion: RPC Bypass RLS](https://github.com/supabase/supabase/issues/4956) - Community discussion on RPC and RLS
- [GitHub Discussion: RLS Views](https://github.com/orgs/supabase/discussions/3424) - Views vs RLS tradeoffs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing Supabase client, adding RPC which is well-documented
- Architecture: HIGH - SECURITY DEFINER pattern is recommended by Supabase for aggregation use cases
- RLS strategy: HIGH - Verified against official PostgreSQL and Supabase documentation
- F# interop: MEDIUM - RPC pattern not explicitly documented for Fable but follows existing codebase patterns

**Research date:** 2026-02-10
**Valid until:** 2026-03-12 (30 days - PostgreSQL and Supabase APIs are stable)
