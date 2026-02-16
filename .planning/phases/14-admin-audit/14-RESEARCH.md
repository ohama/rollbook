# Phase 14: Admin & Audit - Research

**Researched:** 2026-02-16
**Domain:** PostgreSQL Audit Logging, RBAC Admin Management, Soft Delete Recovery
**Confidence:** HIGH

## Summary

This phase implements multi-admin management with comprehensive audit logging and undo capabilities. The research focused on PostgreSQL trigger-based audit logging patterns, Supabase RBAC best practices, and soft delete recovery mechanisms.

The standard approach for admin/audit systems combines:
1. Trigger-based audit logging with JSONB storage for before/after snapshots
2. User roles table with RLS policies for admin privilege management
3. Soft delete pattern (already implemented in Phase 8) enhanced with audit trail
4. Admin UI for role management, audit log viewing, and record recovery

Key finding: PostgreSQL audit triggers with JSONB storage provide production-ready audit logging without external libraries. The existing `user_roles` table and `is_admin()` function from Phase 6 provide the RBAC foundation. Soft delete with `deleted_at` (Phase 8) enables undo functionality.

**Primary recommendation:** Use PostgreSQL AFTER triggers on workouts and profiles tables to automatically populate an `audit.record_version` table with JSONB snapshots. Add admin UI to manage roles, view audit logs, and restore soft-deleted records.

## Standard Stack

The established libraries/tools for this domain:

### Core (PostgreSQL-native)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL Triggers | Native | Automatic audit logging | Zero-overhead, runs at database level, cannot be bypassed |
| JSONB | PostgreSQL 9.4+ | Flexible before/after storage | Native type, queryable, handles schema changes gracefully |
| Row Level Security (RLS) | PostgreSQL 9.5+ | Admin access control | Built-in, declarative security at database level |
| to_jsonb() function | Native | Convert row to JSON | Standard serialization, handles all PostgreSQL types |

### Supporting (Supabase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| auth.uid() | Supabase | Track who made changes | Available in triggers via session context |
| Supabase JS client | Current | Frontend CRUD operations | Already used throughout app |
| Fable.Core.JsInterop | Current | Dynamic JS object access | Access JSONB data from F# |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Trigger-based audit | Application-level logging | Triggers cannot be bypassed, app logging can be skipped |
| JSONB storage | Separate columns per field | JSONB flexible with schema changes, typed columns require migrations |
| Built-in RLS | Application-level checks | RLS enforced at DB level, app checks can be forgotten |
| Soft delete undo | Version history table | Soft delete simpler, version history adds complexity |

**Installation:**
```bash
# No npm packages needed - all PostgreSQL native features
# Existing dependencies already cover frontend needs
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/migrations/
├── 20260216100000_admin_audit_schema.sql    # audit.record_version table
├── 20260216110000_audit_triggers.sql        # Triggers on workouts, profiles
├── 20260216120000_admin_role_policies.sql   # RLS for admin role management
└── 20260216130000_default_admins.sql        # Insert ADM-02 default admins

src/
├── Supabase/
│   ├── Admin.fs                              # Existing - add role management
│   └── Audit.fs                              # NEW - audit log queries, restore functions
├── Pages/
│   └── AdminPage.fs                          # Existing - add audit log view, role management
└── Components/
    ├── AuditLogList.fs                       # NEW - display audit entries
    ├── AdminRoleManager.fs                   # NEW - add/remove admin roles
    └── RestoreConfirmModal.fs                # NEW - undo confirmation
```

### Pattern 1: Audit Log Table with JSONB
**What:** Central audit table capturing all changes to tracked tables with before/after snapshots
**When to use:** Track all admin actions and enable undo functionality

**Example:**
```sql
-- Source: https://supabase.com/blog/postgres-audit
-- Adapted for this project

CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.record_version (
  id bigserial PRIMARY KEY,
  -- Metadata
  record_id uuid,                    -- Stable identifier for the record
  old_record_id uuid,                -- Links to previous version
  op varchar(10) NOT NULL,           -- INSERT, UPDATE, DELETE
  ts timestamptz NOT NULL DEFAULT now(),
  -- User tracking
  user_id uuid,                      -- Who made the change (from auth.uid())
  user_email text,                   -- Email for display (denormalized)
  -- Table identification
  table_oid oid NOT NULL,
  table_schema name NOT NULL,
  table_name name NOT NULL,
  -- Data snapshots
  record jsonb,                      -- Current state (after operation)
  old_record jsonb                   -- Previous state (before operation)
);

-- Indexes for efficient queries
CREATE INDEX record_version_ts ON audit.record_version USING brin(ts);
CREATE INDEX record_version_table_oid ON audit.record_version USING btree(table_oid);
CREATE INDEX record_version_record_id ON audit.record_version(record_id)
  WHERE record_id IS NOT NULL;
CREATE INDEX record_version_user_id ON audit.record_version(user_id)
  WHERE user_id IS NOT NULL;
```

### Pattern 2: Generic Audit Trigger Function
**What:** Reusable trigger function that captures before/after state for any table
**When to use:** Attach to any table that needs audit logging

**Example:**
```sql
-- Source: PostgreSQL wiki https://wiki.postgresql.org/wiki/Audit_trigger
-- Simplified for this project

CREATE OR REPLACE FUNCTION audit.log_change()
RETURNS trigger AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_record_id uuid;
BEGIN
  -- Get current user from Supabase auth context
  v_user_id := auth.uid();

  -- Get email for display (query auth.users or use JWT claim)
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Generate stable record_id from primary key
  -- For workouts table: use id cast to uuid
  -- For profiles table: use id directly
  IF TG_TABLE_NAME = 'workouts' THEN
    v_record_id := gen_random_uuid(); -- Or derive from workouts.id
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    v_record_id := COALESCE(NEW.id, OLD.id);
  END IF;

  -- Insert audit record
  INSERT INTO audit.record_version (
    record_id,
    op,
    user_id,
    user_email,
    table_oid,
    table_schema,
    table_name,
    record,
    old_record
  ) VALUES (
    v_record_id,
    TG_OP,
    v_user_id,
    v_user_email,
    TG_RELID,
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END
  );

  -- Return appropriate value
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Pattern 3: Selective Trigger Attachment
**What:** Attach audit triggers only to admin-managed tables
**When to use:** Avoid overhead on tables that don't need auditing

**Example:**
```sql
-- Only audit admin actions on workouts and profiles
CREATE TRIGGER audit_workouts
  AFTER INSERT OR UPDATE OR DELETE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION audit.log_change();

CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit.log_change();

-- Do NOT audit user_roles changes (would create noise)
-- Consider auditing only when is_admin() = true (conditional trigger)
```

### Pattern 4: Admin Role Management with RLS
**What:** Allow admins to grant/revoke admin role to other users
**When to use:** Implement ADM-03 (admins can add other admins)

**Example:**
```sql
-- Add RLS policy for admins to manage roles
CREATE POLICY "Admins can insert admin roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() AND
    role IN ('admin', 'member')
  );

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Existing: Users can view own roles
-- CREATE POLICY "Users can view own roles" (already exists)
```

### Pattern 5: Soft Delete Recovery
**What:** Restore soft-deleted records by setting deleted_at back to NULL
**When to use:** Implement ADM-08 (restore deleted workouts)

**Example:**
```sql
-- F# function to restore soft-deleted workout
let restoreWorkout (workoutId: int64) : JS.Promise<Result<unit, string>> =
    promise {
        try
            // Admin-only: restore by setting deleted_at to NULL
            let! response =
                supabase
                    ?from("workouts")
                    ?update(createObj ["deleted_at" ==> null])
                    ?eq("id", workoutId)

            let error = response?error
            match box error with
            | null -> return Result.Ok ()
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }
```

### Pattern 6: Recent Changes View
**What:** Query audit log for admin dashboard showing recent modifications
**When to use:** Implement ADM-07 (view modification history)

**Example:**
```sql
-- Query recent changes (last 30 days, most recent first)
SELECT
  av.ts,
  av.op,
  av.user_email,
  av.table_name,
  av.record_id,
  av.old_record,
  av.record
FROM audit.record_version av
WHERE av.ts > now() - interval '30 days'
ORDER BY av.ts DESC
LIMIT 50;
```

### Anti-Patterns to Avoid

- **Auditing everything:** Don't audit high-volume tables like sessions or logs. Only audit admin-managed data (workouts, profiles).
- **Audit triggers on BEFORE:** Use AFTER triggers so audit captures final state, not intermediate values from other triggers.
- **Missing user context:** Always capture `auth.uid()` and email. Without this, audit log is useless.
- **Hard deletes without audit:** Never bypass triggers. Admin deletes of profiles should be hard deletes (CASCADE to auth.users), but workouts should be soft deletes.
- **Forgetting RLS on audit table:** Audit log must be read-only for non-admins. Use RLS to restrict access.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Track data changes | Custom change log table per entity | PostgreSQL triggers + audit.record_version | Generic solution works for all tables, handles schema changes |
| Admin permission checks | if-statements in F# code | RLS policies + is_admin() | Database enforces security, cannot be bypassed by client |
| JSON serialization of rows | Manual field-by-field object creation | to_jsonb(NEW), to_jsonb(OLD) | Native function handles all types, dates, UUIDs correctly |
| Undo deleted records | Version history with INSERT on delete | Soft delete with deleted_at | Simpler, query performance better, RLS auto-filters |
| User tracking in triggers | Application passes user_id param | auth.uid() in trigger function | Cannot be spoofed, uses Supabase JWT context |

**Key insight:** PostgreSQL triggers and JSONB make audit logging trivial. The complexity is in query design (filtering, displaying) not storage. Don't reinvent audit infrastructure when triggers + JSONB solve 90% of requirements.

## Common Pitfalls

### Pitfall 1: Trigger Recursion
**What goes wrong:** Audit trigger on table A updates table B, which has trigger updating table A → infinite loop.
**Why it happens:** Not understanding trigger execution flow and when triggers fire.
**How to avoid:**
- Use AFTER triggers for audit logging (never BEFORE).
- Audit table should have NO triggers on it.
- Use `pg_trigger_depth()` to detect recursion: `IF pg_trigger_depth() > 1 THEN RETURN; END IF;`
**Warning signs:** Database hangs, stack depth errors, transaction timeouts.

**Source:** [Trigger recursion in PostgreSQL](https://www.cybertec-postgresql.com/en/dealing-with-trigger-recursion-in-postgresql/)

### Pitfall 2: Soft Delete with RLS Conflicts
**What goes wrong:** Cannot UPDATE workouts.deleted_at = now() because SELECT policy requires deleted_at IS NULL.
**Why it happens:** RLS USING clause filters what you can see AND target for UPDATE. If soft-deleting hides record, you can't update it.
**How to avoid:**
- Admin DELETE policy should allow `WHERE is_admin() = true` without deleted_at filter.
- Or use WITH CHECK clause carefully: `USING (deleted_at IS NULL OR is_admin())`.
- Test: admin should be able to soft-delete (set deleted_at) and hard-delete (actual DELETE) profiles.
**Warning signs:** UPDATE succeeds but affects 0 rows, silent failures in admin actions.

**Source:** [Supabase soft delete RLS issue](https://github.com/orgs/supabase/discussions/2799)

### Pitfall 3: Missing User Context in Triggers
**What goes wrong:** Audit log shows user_id = NULL for all changes.
**Why it happens:** `auth.uid()` returns NULL when called outside Supabase session context (e.g., from psql, migrations).
**How to avoid:**
- Accept NULL user_id in audit table schema.
- For migrations/admin scripts, use `SET LOCAL role authenticated; SET LOCAL request.jwt.claims.sub = 'user-uuid';`.
- Document that direct database changes won't have user attribution.
**Warning signs:** Audit log shows user_id = NULL for admin actions that should be tracked.

**Source:** [Understanding PostgreSQL Triggers for Real-time Database Auditing](https://naiknotebook.medium.com/understanding-postgresql-triggers-for-real-time-database-auditing-71ed35d39906)

### Pitfall 4: JSONB Key Naming Mismatch
**What goes wrong:** Frontend expects camelCase (userId), but JSONB has snake_case (user_id) from database.
**Why it happens:** to_jsonb() preserves exact column names from PostgreSQL schema.
**How to avoid:**
- Accept snake_case in audit log display (it's raw database data).
- Or use PostgreSQL JSON functions to transform: `jsonb_set()`, key renaming.
- Don't rely on F# record deserialization from audit JSONB - it won't match types.
**Warning signs:** Cannot parse JSONB in frontend, missing fields in audit display.

**Source:** Fable and JSON serialization patterns from research.

### Pitfall 5: Forgetting to Audit Role Changes
**What goes wrong:** Admin adds another admin, but no audit trail of who granted admin role.
**Why it happens:** Only added triggers to workouts and profiles, not user_roles.
**How to avoid:**
- Add audit trigger to `user_roles` table: `CREATE TRIGGER audit_user_roles ...`.
- Admin role grants/revokes are critical security events that MUST be logged.
**Warning signs:** Cannot answer "who made this person admin?" Security compliance fails.

**Source:** Audit logging best practices from research.

### Pitfall 6: Unindexed Audit Queries
**What goes wrong:** Admin dashboard "recent changes" query takes 10+ seconds.
**Why it happens:** No index on audit.record_version.ts, full table scan on every load.
**How to avoid:**
- Use BRIN index on timestamp: `CREATE INDEX record_version_ts ON audit.record_version USING brin(ts);`
- BRIN is perfect for time-series data (audit logs), much smaller than B-tree.
- Add index on user_id for "show all changes by user X" queries.
**Warning signs:** Dashboard slow to load, audit queries in pg_stat_statements.

**Source:** [PostgreSQL Audit Logging Best Practices](https://severalnines.com/blog/postgresql-audit-logging-best-practices/)

## Code Examples

Verified patterns from official sources:

### Example 1: Query Audit Log for Admin Dashboard
```fsharp
// Source: Adapted from Supabase patterns
// Get recent changes for admin dashboard (ADM-07)
let getRecentChanges (limit: int) : JS.Promise<Result<AuditEntry array, string>> =
    promise {
        try
            // Query audit.record_version table
            // Note: Supabase exposes all schemas, can query audit schema directly
            let! response =
                supabase
                    ?from("record_version")
                    ?select("id, ts, op, user_email, table_name, record, old_record")
                    ?order("ts", createObj ["ascending" ==> false])
                    ?limit(limit)

            let error = response?error
            let data = response?data

            match box error with
            | null ->
                // Parse JSONB as dynamic objects, don't try to deserialize to F# records
                let entries = unbox<AuditEntry array> data
                return Result.Ok entries
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }

// Display type for audit entries (keep simple, match DB schema)
type AuditEntry = {
    id: int64
    ts: string  // ISO timestamp from PostgreSQL
    op: string  // "INSERT" | "UPDATE" | "DELETE"
    user_email: string option
    table_name: string
    record: obj  // Raw JSONB, access with dynamic operators
    old_record: obj option
}
```

### Example 2: Add Admin Role
```fsharp
// Source: RLS pattern from Supabase docs
// Add admin role to user (ADM-03)
let addAdminRole (userId: string) : JS.Promise<Result<unit, string>> =
    promise {
        try
            // Insert into user_roles (RLS policy checks is_admin())
            let! response =
                supabase
                    ?from("user_roles")
                    ?insert(createObj [
                        "user_id" ==> userId
                        "role" ==> "admin"
                    ])

            let error = response?error
            match box error with
            | null -> return Result.Ok ()
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }

// Remove admin role
let removeAdminRole (userId: string) : JS.Promise<Result<unit, string>> =
    promise {
        try
            let! response =
                supabase
                    ?from("user_roles")
                    ?delete()
                    ?eq("user_id", userId)
                    ?eq("role", "admin")

            let error = response?error
            match box error with
            | null -> return Result.Ok ()
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }
```

### Example 3: Restore Soft-Deleted Workout
```fsharp
// Source: Soft delete pattern from research
// Restore deleted workout (ADM-08)
let restoreWorkout (workoutId: int64) : JS.Promise<Result<unit, string>> =
    promise {
        try
            // Update deleted_at to NULL (un-delete)
            let! response =
                supabase
                    ?from("workouts")
                    ?update(createObj ["deleted_at" ==> null])
                    ?eq("id", workoutId)

            let error = response?error
            match box error with
            | null -> return Result.Ok ()
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }

// Get deleted workouts (for admin to see what can be restored)
let getDeletedWorkouts () : JS.Promise<Result<WorkoutRecord array, string>> =
    promise {
        try
            // Query workouts WHERE deleted_at IS NOT NULL
            // Note: Regular RLS policy filters these out, admin needs special policy
            let! response =
                supabase
                    ?from("workouts")
                    ?select("*")
                    ?not("deleted_at", "is", null)  // Only deleted records
                    ?order("deleted_at", createObj ["ascending" ==> false])

            let error = response?error
            let data = response?data

            match box error with
            | null ->
                let workouts = unbox<WorkoutRecord array> data
                return Result.Ok workouts
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }
```

### Example 4: Admin Delete Workout (Soft Delete)
```fsharp
// Source: Existing pattern from Phase 8
// Admin soft-delete workout (ADM-05)
let adminDeleteWorkout (workoutId: int64) : JS.Promise<Result<unit, string>> =
    promise {
        try
            // Set deleted_at to now (soft delete)
            // Audit trigger will log this action
            let! response =
                supabase
                    ?from("workouts")
                    ?update(createObj ["deleted_at" ==> System.DateTime.UtcNow.ToString("o")])
                    ?eq("id", workoutId)

            let error = response?error
            match box error with
            | null -> return Result.Ok ()
            | _ ->
                let errorMsg = error?message |> unbox<string>
                return Result.Error errorMsg
        with exn ->
            return Result.Error exn.Message
    }
```

### Example 5: Initialize Default Admins
```sql
-- Source: ADM-02 requirement
-- Insert default admin roles for ohama100@gmail.com and ohama100@naver.com

-- This migration runs AFTER user signup
-- Idempotent: ON CONFLICT DO NOTHING ensures safe re-runs

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email IN ('ohama100@gmail.com', 'ohama100@naver.com')
ON CONFLICT (user_id, role) DO NOTHING;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pgAudit extension | Trigger-based audit with JSONB | 2020+ | Simpler, no extension needed, full control over schema |
| Separate audit table per entity | Single audit.record_version table | 2018+ | Less schema bloat, easier queries across tables |
| Application-level audit logging | Database triggers | Always best | Cannot be bypassed, works for all clients (web, scripts, etc.) |
| Hard delete everything | Soft delete for user data | 2015+ | Enables undo, better UX, regulatory compliance (GDPR, etc.) |
| Store changed fields as text | Store full JSONB snapshots | PostgreSQL 9.4+ (2014) | JSONB queryable, handles schema changes, easier to restore |

**Deprecated/outdated:**
- **pgAudit extension:** Overkill for app-level auditing. Use triggers instead. pgAudit is for DBA-level auditing (compliance, security events).
- **Audit columns on tables (created_by, updated_by):** Doesn't track history or before/after state. Use audit table instead.
- **Storing audit as text/varchar:** JSONB is native, queryable, and indexable. No reason to use text anymore.

## Open Questions

Things that couldn't be fully resolved:

1. **How to handle admin viewing deleted records in admin UI?**
   - What we know: RLS policy `deleted_at IS NULL` filters out deleted records from SELECT
   - What's unclear: Can admin bypass this with special RLS policy, or use service_role key?
   - Recommendation: Add admin-only SELECT policy: `USING (deleted_at IS NULL OR is_admin())`

2. **Should profile deletes be hard or soft?**
   - What we know: profiles CASCADE to auth.users, ADM-04 says "admin can delete members"
   - What's unclear: Does "delete members" mean hard delete (removes login) or soft delete (hide but keep)?
   - Recommendation: Hard delete (CASCADE to auth.users) because member accounts should be fully removed. Only soft-delete workouts data.

3. **Should audit log have retention policy?**
   - What we know: audit.record_version will grow indefinitely
   - What's unclear: Should old audit entries be deleted? How long to keep?
   - Recommendation: Start without retention, add partitioning + cleanup later if table grows too large (> 100k rows)

4. **How to display JSONB in Korean UI?**
   - What we know: JSONB has snake_case keys (workout_date, text_content)
   - What's unclear: Should we translate keys to Korean labels in UI?
   - Recommendation: Map common keys to Korean: workout_date → "운동 날짜", text_content → "내용"

## Sources

### Primary (HIGH confidence)
- [Supabase Blog: Postgres Auditing in 150 lines of SQL](https://supabase.com/blog/postgres-audit) - Audit table schema and trigger pattern
- [PostgreSQL wiki: Audit trigger](https://wiki.postgresql.org/wiki/Audit_trigger) - Generic trigger function implementation
- [Supabase Docs: Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) - Admin role management pattern
- [How to Implement Soft Deletes in PostgreSQL](https://oneuptime.com/blog/post/2026-01-21-postgresql-soft-deletes/view) - Soft delete best practices (2026)

### Secondary (MEDIUM confidence)
- [Let's Build Production-Ready Audit Logs in PostgreSQL](https://medium.com/@sehban.alam/lets-build-production-ready-audit-logs-in-postgresql-7125481713d8) - JSONB storage patterns
- [Trigger recursion in PostgreSQL](https://www.cybertec-postgresql.com/en/dealing-with-trigger-recursion-in-postgresql/) - Avoiding trigger pitfalls
- [How to implement soft delete (Supabase Discussion)](https://github.com/orgs/supabase/discussions/2799) - RLS with soft delete
- [PostgreSQL Audit Logging Best Practices | Severalnines](https://severalnines.com/blog/postgresql-audit-logging-best-practices/) - Indexing and performance

### Tertiary (LOW confidence)
- [How to Implement RBAC in Supabase | Permit.io](https://www.permit.io/blog/how-to-implement-rbac-in-supabase) - General RBAC patterns
- [Fable.SimpleJson GitHub](https://github.com/Zaid-Ajaj/Fable.SimpleJson) - F# JSONB parsing options

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - PostgreSQL triggers and JSONB are proven, stable, widely-used patterns
- Architecture: HIGH - Supabase blog and PostgreSQL wiki provide production-ready implementations
- Pitfalls: HIGH - Multiple sources confirm soft delete RLS issues, trigger recursion, user context problems

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days - stable PostgreSQL patterns, unlikely to change)
