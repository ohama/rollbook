# Phase 4: Team Features - Research

**Researched:** 2026-02-10
**Domain:** Supabase RLS Policy Modification + F#/Feliz Team Data Display
**Confidence:** HIGH

## Summary

This phase implements team workout visibility, allowing authenticated users to view all team members' workout records. The implementation requires:

1. **RLS Policy Updates**: Modify existing restrictive policies to allow authenticated users to SELECT all workouts and profiles, while keeping INSERT/UPDATE/DELETE restricted to own records
2. **Data Fetching**: Query all team workouts for a month, grouped by user with profile information
3. **UI Components**: Create TeamView component displaying member workout counts and calendars

The approach is straightforward: no SECURITY DEFINER functions needed since RLS will allow direct table queries. The existing Calendar and MonthlyStats components can be reused with minor modifications.

**Primary recommendation:** Use `DROP POLICY` + `CREATE POLICY` pattern for RLS changes (ALTER POLICY cannot change the USING expression alone). Create a single migration file with all policy changes.

## Standard Stack

The phase uses existing project dependencies. No new libraries required.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | (existing) | Supabase client for data queries | Already in use, supports joins and nested selects |
| Feliz | 2.9.0 | React DSL for F# | Already in use for all components |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| F# Array module | (built-in) | Array.groupBy for client-side grouping | Group workouts by user_id |
| F# Map module | (built-in) | Fast lookup by user_id | O(1) workout lookup per user |

### No New Dependencies Needed
This phase requires no additional npm packages or NuGet packages. All functionality is achievable with existing stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── Supabase/
│   ├── Workouts.fs       # Add getAllWorkouts, getTeamProfiles
│   └── Types.fs          # Add Profile type
├── Components/
│   ├── TeamMemberCard.fs # New: displays member name + count
│   └── Calendar.fs       # Existing: reuse for member calendars
└── Pages/
    ├── TeamView.fs       # New: team roster + stats page
    └── Dashboard.fs      # Add "팀" tab
```

### Pattern 1: RLS Policy Migration
**What:** Drop existing restrictive policies and create new ones in a single migration
**When to use:** When changing RLS behavior for existing tables
**Example:**
```sql
-- Source: PostgreSQL docs + Supabase best practices
-- Migration: YYYYMMDDHHMMSS_team_visibility_rls.sql

-- Step 1: Drop existing SELECT policy for workouts
DROP POLICY IF EXISTS "Users can view own workouts" ON public.workouts;

-- Step 2: Create new permissive SELECT policy
CREATE POLICY "Authenticated users can view all workouts"
  ON public.workouts FOR SELECT
  TO authenticated
  USING (true);

-- Keep INSERT/UPDATE/DELETE restricted (existing policies remain)
```

### Pattern 2: Supabase Join Query with Foreign Key
**What:** Query workouts with user profile in single request
**When to use:** When displaying user-attributed data
**Example:**
```javascript
// Source: Supabase docs - Joins and Nesting
const { data, error } = await supabase
  .from('workouts')
  .select(`
    user_id,
    workout_date,
    profiles!workouts_user_id_fkey (
      display_name,
      email
    )
  `)
  .gte('workout_date', startDate)
  .lte('workout_date', endDate)
```

### Pattern 3: F# Array.groupBy for Client-Side Aggregation
**What:** Group workout records by user_id in F#
**When to use:** After fetching all team workouts
**Example:**
```fsharp
// Source: F# standard library
let groupedByUser =
    workouts
    |> Array.groupBy (fun w -> w.user_id)
    |> Array.map (fun (userId, userWorkouts) ->
        { UserId = userId
          WorkoutCount = userWorkouts.Length
          Workouts = userWorkouts })
```

### Anti-Patterns to Avoid
- **Multiple queries per user:** Don't fetch workouts for each member separately. Use single query with RLS allowing all records.
- **SECURITY DEFINER for simple visibility:** Not needed when RLS allows direct SELECT. Only use for aggregates that hide raw data.
- **Client-side filtering of own data:** RLS handles this; don't duplicate logic in app.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| User-to-user visibility control | Custom middleware/checks | Supabase RLS policies | Database-level security, no bypass possible |
| Data grouping in SQL | Complex GROUP BY queries | F# Array.groupBy | Simpler, RLS-friendly, easier to debug |
| Foreign key joins | Manual profile lookups | Supabase nested select | Automatic FK detection, single query |
| Date range filtering | Manual array filtering | Supabase .gte/.lte | Server-side, reduces data transfer |

**Key insight:** RLS provides team visibility automatically once configured. The client code just queries normally and gets the right data.

## Common Pitfalls

### Pitfall 1: Forgetting to Keep Write Policies Restricted
**What goes wrong:** After changing SELECT policy to allow all, accidentally changing INSERT/UPDATE/DELETE too
**Why it happens:** Copy-paste errors or misunderstanding RLS per-operation policies
**How to avoid:**
- Only DROP and recreate the SELECT policy
- Leave INSERT/UPDATE/DELETE policies unchanged
- Verify in migration that only SELECT is modified
**Warning signs:** Users able to modify others' workout records

### Pitfall 2: RLS on Profiles Table Blocking Join
**What goes wrong:** Workout query with profile join returns null for other users' profiles
**Why it happens:** Profiles table still has `user_id = auth.uid()` SELECT policy
**How to avoid:** Update profiles RLS in same migration to allow authenticated SELECT
**Warning signs:** display_name coming back as null for other team members

### Pitfall 3: No Index on workout_date for Team Queries
**What goes wrong:** Slow queries when fetching month of workouts for all users
**Why it happens:** Index `idx_workouts_date` exists but may not be optimal for range + all users
**How to avoid:** Verify EXPLAIN ANALYZE shows index usage; consider composite index if needed
**Warning signs:** Query time > 100ms for small team sizes

### Pitfall 4: Not Handling Empty Profile display_name
**What goes wrong:** UI shows "null" or blank for users who haven't set display name
**Why it happens:** Profile trigger only sets email, not display_name
**How to avoid:** Fallback to email in UI: `profile.display_name |> Option.defaultValue profile.email`
**Warning signs:** Team list shows empty names

### Pitfall 5: Large Payload for Many Workouts
**What goes wrong:** Slow page load when team has many members with many workouts
**Why it happens:** Fetching all workout records for all users for entire month
**How to avoid:**
- Limit to current month only
- Consider server-side aggregation if team size > 20 users
**Warning signs:** Payload > 50KB for team view

## Code Examples

### Migration: Update RLS Policies
```sql
-- Source: PostgreSQL DROP POLICY + CREATE POLICY docs
-- File: supabase/migrations/YYYYMMDDHHMMSS_team_visibility_rls.sql

-- ============================================
-- WORKOUTS TABLE: Allow team visibility for SELECT
-- ============================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own workouts" ON public.workouts;

-- Create new SELECT policy: all authenticated users can view all workouts
CREATE POLICY "Authenticated users can view all workouts"
  ON public.workouts FOR SELECT
  TO authenticated
  USING (true);

-- Note: INSERT/UPDATE/DELETE policies remain unchanged (own records only)

-- ============================================
-- PROFILES TABLE: Allow team visibility for SELECT
-- ============================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new SELECT policy: all authenticated users can view all profiles
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Note: UPDATE policy remains unchanged (own profile only)
```

### F# Type: Profile Record
```fsharp
// Source: Existing Types.fs pattern
/// Profile record from profiles table
type ProfileRecord = {
    id: string           // user_id (UUID)
    email: string
    display_name: string option
}

/// Workout with profile (for joined queries)
type WorkoutWithProfile = {
    user_id: string
    workout_date: string
    profile: ProfileRecord option
}

/// Team member summary for display
type TeamMemberSummary = {
    UserId: string
    DisplayName: string
    Email: string
    WorkoutCount: int
    Workouts: WorkoutRecord array
}
```

### F# Function: Fetch Team Workouts
```fsharp
// Source: Existing Workouts.fs pattern + Supabase join docs
/// Get all team workouts for a date range with profile info
let getTeamWorkouts (startDate: string) (endDate: string) : JS.Promise<WorkoutWithProfile array> =
    promise {
        let query =
            supabase?from("workouts")
                ?select("user_id, workout_date, profiles!workouts_user_id_fkey(id, email, display_name)")
                ?gte("workout_date", startDate)
                ?lte("workout_date", endDate)
                ?order("workout_date", createObj ["ascending" ==> false])

        let! result = query
        let data = result?data

        if isNull data then
            return [||]
        else
            return unbox<WorkoutWithProfile array> data
    }
```

### F# Function: Group by User
```fsharp
// Source: F# standard library
/// Group workouts by user and create summaries
let groupWorkoutsByUser (workouts: WorkoutWithProfile array) : TeamMemberSummary array =
    workouts
    |> Array.groupBy (fun w -> w.user_id)
    |> Array.map (fun (userId, userWorkouts) ->
        let firstWorkout = userWorkouts.[0]
        let profile = firstWorkout.profile
        {
            UserId = userId
            DisplayName =
                profile
                |> Option.bind (fun p -> p.display_name)
                |> Option.defaultValue (profile |> Option.map (fun p -> p.email) |> Option.defaultValue "Unknown")
            Email = profile |> Option.map (fun p -> p.email) |> Option.defaultValue ""
            WorkoutCount = userWorkouts.Length
            Workouts = userWorkouts |> Array.map (fun w ->
                { user_id = w.user_id
                  workout_date = w.workout_date
                  created_at = None })
        }
    )
    |> Array.sortByDescending (fun m -> m.WorkoutCount)
```

### Feliz Component: Team Member Card
```fsharp
// Source: Existing component patterns in project
[<ReactComponent>]
let TeamMemberCard (member: TeamMemberSummary) (year: int) (month: int) =
    Html.div [
        prop.className "bg-white rounded-lg shadow-sm p-4"
        prop.children [
            // Header: name and count
            Html.div [
                prop.className "flex justify-between items-center mb-3"
                prop.children [
                    Html.h3 [
                        prop.className "font-semibold text-gray-800"
                        prop.text member.DisplayName
                    ]
                    Html.span [
                        prop.className "text-lg font-bold text-indigo-600"
                        prop.text (sprintf "%d회" member.WorkoutCount)
                    ]
                ]
            ]
            // Mini calendar or workout indicator
            Html.div [
                prop.className "text-sm text-gray-600"
                prop.text (sprintf "%d년 %d월" year month)
            ]
        ]
    ]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SECURITY DEFINER for team data | Direct RLS with `USING (true)` | Always preferred when visibility is simple | Simpler, auditable, no function maintenance |
| Multiple queries per user | Single query with join | Supabase PostgREST improvement | Reduced latency, single RLS check |
| Client-side auth checks | RLS at database level | Supabase best practice since CVE-2025-48757 | Security by default, no bypass |

**Current best practice:**
- RLS is the source of truth for access control
- `TO authenticated` optimizes policy evaluation
- Wrap `auth.uid()` in subselect for caching: `(SELECT auth.uid())`

## Open Questions

1. **Team Scope Definition**
   - What we know: All authenticated users see all workouts
   - What's unclear: Is this truly "one team" or will there be multiple teams later?
   - Recommendation: Proceed with simple "all authenticated = one team" for Phase 4. If multi-team needed, add `team_id` column to profiles and workouts in future phase.

2. **Performance at Scale**
   - What we know: Works fine for <20 users with monthly view
   - What's unclear: Performance with 100+ users or year view
   - Recommendation: Add server-side aggregation (SECURITY DEFINER function returning counts only) if performance degrades

3. **Profile Display Name Required?**
   - What we know: display_name is nullable, only email guaranteed
   - What's unclear: Should we require display_name for team features?
   - Recommendation: Fallback to email in UI, optionally prompt users to set display_name

## Sources

### Primary (HIGH confidence)
- [PostgreSQL DROP POLICY](https://www.postgresql.org/docs/current/sql-droppolicy.html) - Syntax for removing policies
- [PostgreSQL ALTER POLICY](https://www.postgresql.org/docs/current/sql-alterpolicy.html) - Limitations on what can be modified
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - Policy creation patterns
- [Supabase Joins and Nesting](https://supabase.com/docs/guides/database/joins-and-nesting) - Foreign key query syntax
- [Supabase JavaScript Select](https://supabase.com/docs/reference/javascript/select) - Client query patterns

### Secondary (MEDIUM confidence)
- [Supabase Migration Best Practices](https://supabase.com/docs/guides/local-development/overview) - File naming and structure
- [Feliz GitHub](https://github.com/Zaid-Ajaj/Feliz) - React component patterns for F#

### Tertiary (LOW confidence)
- F# Array.groupBy behavior in Fable - Assumed to work like standard F#; verify at implementation time

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, existing patterns
- RLS migration: HIGH - PostgreSQL docs are authoritative
- Supabase joins: HIGH - Official docs with clear examples
- F# groupBy in Fable: MEDIUM - Standard F# should work, but verify
- UI patterns: HIGH - Follows existing project conventions

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (stable patterns, 30 days)
