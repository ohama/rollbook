-- ============================================================================
-- Audit Logging Infrastructure
-- ============================================================================
-- Purpose: Trigger-based audit trail for all admin actions (ADM-06)
-- Foundation: Enables undo functionality (ADM-08) in future phases
-- Pattern: Generic log_change() trigger function + per-table triggers
-- Research: Based on 14-RESEARCH.md Pattern 1 (JSONB) and Pattern 2 (AFTER)
-- ============================================================================

-- ============================================================================
-- 1. Create audit schema
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS audit;

COMMENT ON SCHEMA audit IS 'Audit logging infrastructure for admin actions and undo functionality';

-- ============================================================================
-- 2. Create audit.record_version table
-- ============================================================================

CREATE TABLE audit.record_version (
  -- Primary key
  id            BIGSERIAL PRIMARY KEY,

  -- Record identification
  record_id     UUID,           -- For UUID-based PKs (profiles, user_roles)
  old_record_id UUID,           -- For UPDATE operations that change PK

  -- Operation metadata
  op            VARCHAR(10) NOT NULL,  -- INSERT, UPDATE, DELETE
  ts            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- User context (captured from Supabase auth.uid())
  user_id       UUID,           -- NULL for system operations
  user_email    TEXT,           -- Denormalized for convenience

  -- Table identification
  table_oid     OID NOT NULL,          -- pg_class.oid
  table_schema  NAME NOT NULL,         -- e.g., 'public'
  table_name    NAME NOT NULL,         -- e.g., 'workouts'

  -- JSONB snapshots
  record        JSONB,          -- After state (INSERT/UPDATE)
  old_record    JSONB           -- Before state (UPDATE/DELETE)
);

COMMENT ON TABLE audit.record_version IS 'Audit trail for admin actions. Captures before/after JSONB snapshots.';
COMMENT ON COLUMN audit.record_version.record_id IS 'UUID identifier for profiles/user_roles. NULL for workouts (BIGSERIAL id).';
COMMENT ON COLUMN audit.record_version.op IS 'Operation type: INSERT, UPDATE, DELETE';
COMMENT ON COLUMN audit.record_version.ts IS 'Timestamp of operation (server timezone)';
COMMENT ON COLUMN audit.record_version.user_id IS 'Captured from auth.uid(). NULL for system operations.';
COMMENT ON COLUMN audit.record_version.table_oid IS 'PostgreSQL table OID (TG_RELID)';
COMMENT ON COLUMN audit.record_version.record IS 'After-state JSONB snapshot (to_jsonb(NEW))';
COMMENT ON COLUMN audit.record_version.old_record IS 'Before-state JSONB snapshot (to_jsonb(OLD))';

-- ============================================================================
-- 3. Create indexes
-- ============================================================================

-- BRIN index on timestamp for time-series efficiency (Research Pitfall 6)
-- Much smaller than B-tree for monotonically increasing values
CREATE INDEX record_version_ts_idx ON audit.record_version USING brin(ts);

-- B-tree indexes for common query patterns
CREATE INDEX record_version_table_oid_idx ON audit.record_version(table_oid);
CREATE INDEX record_version_record_id_idx ON audit.record_version(record_id) WHERE record_id IS NOT NULL;
CREATE INDEX record_version_user_id_idx ON audit.record_version(user_id) WHERE user_id IS NOT NULL;

-- ============================================================================
-- 4. Create generic audit.log_change() trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION audit.log_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with function owner's privileges (access to auth.users)
SET search_path = public, audit, pg_temp
AS $$
DECLARE
  v_user_id       UUID;
  v_user_email    TEXT;
  v_record_id     UUID;
  v_old_record_id UUID;
  v_record        JSONB;
  v_old_record    JSONB;
BEGIN
  -- Guard against recursion (Research Pitfall 1)
  -- If we're already inside a trigger (depth > 1), skip audit logging
  IF pg_trigger_depth() > 1 THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Capture user context from Supabase session
  v_user_id := auth.uid();

  -- Lookup user email (NULL if system operation or auth.uid() is NULL)
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;
  END IF;

  -- Determine record_id based on table structure
  -- workouts: BIGSERIAL id (not UUID) → generate UUID for audit.record_id
  -- profiles: UUID id → use directly
  -- user_roles: composite PK (user_id, role) → use user_id as record_id
  CASE TG_TABLE_NAME
    WHEN 'workouts' THEN
      -- workouts.id is BIGSERIAL, not UUID
      -- Generate UUID for audit.record_id field
      v_record_id := gen_random_uuid();
      v_old_record_id := NULL;  -- workouts.id doesn't change (no UPDATE on PK)

    WHEN 'profiles' THEN
      -- profiles.id is UUID
      v_record_id := COALESCE(NEW.id, OLD.id);
      v_old_record_id := NULL;  -- profiles.id doesn't change (no UPDATE on PK)

    WHEN 'user_roles' THEN
      -- user_roles has composite PK (user_id, role)
      -- Use user_id as record_id
      v_record_id := COALESCE(NEW.user_id, OLD.user_id);
      v_old_record_id := NULL;  -- user_id doesn't change (DELETE/INSERT for role change)

    ELSE
      -- Future tables: try to extract 'id' field if exists
      IF TG_OP = 'DELETE' THEN
        v_record_id := (OLD.id)::UUID;
      ELSE
        v_record_id := (NEW.id)::UUID;
      END IF;
      v_old_record_id := NULL;
  END CASE;

  -- Capture JSONB snapshots based on operation
  CASE TG_OP
    WHEN 'INSERT' THEN
      v_record := to_jsonb(NEW);
      v_old_record := NULL;

    WHEN 'UPDATE' THEN
      v_record := to_jsonb(NEW);
      v_old_record := to_jsonb(OLD);

    WHEN 'DELETE' THEN
      v_record := NULL;
      v_old_record := to_jsonb(OLD);

    ELSE
      RAISE EXCEPTION 'Unexpected TG_OP: %', TG_OP;
  END CASE;

  -- Insert audit log entry
  INSERT INTO audit.record_version (
    record_id,
    old_record_id,
    op,
    ts,
    user_id,
    user_email,
    table_oid,
    table_schema,
    table_name,
    record,
    old_record
  ) VALUES (
    v_record_id,
    v_old_record_id,
    TG_OP,
    NOW(),
    v_user_id,
    v_user_email,
    TG_RELID,       -- OID of the table
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    v_record,
    v_old_record
  );

  -- Return appropriate record for trigger chain
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION audit.log_change() IS 'Generic audit trigger. Logs INSERT/UPDATE/DELETE to audit.record_version with JSONB snapshots.';

-- ============================================================================
-- 5. Attach triggers to tables
-- ============================================================================

-- workouts table: Core data for audit trail
CREATE TRIGGER audit_workouts
  AFTER INSERT OR UPDATE OR DELETE ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION audit.log_change();

COMMENT ON TRIGGER audit_workouts ON public.workouts IS 'Audit trigger for workouts table. Logs all changes to audit.record_version.';

-- profiles table: User profile changes
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit.log_change();

COMMENT ON TRIGGER audit_profiles ON public.profiles IS 'Audit trigger for profiles table. Logs all changes to audit.record_version.';

-- user_roles table: Admin role changes (critical for security)
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION audit.log_change();

COMMENT ON TRIGGER audit_user_roles ON public.user_roles IS 'Audit trigger for user_roles table. Logs all changes to audit.record_version.';

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Verify installation
DO $$
DECLARE
  v_table_count INT;
  v_function_count INT;
  v_trigger_count INT;
BEGIN
  -- Count audit tables
  SELECT COUNT(*) INTO v_table_count
  FROM pg_tables
  WHERE schemaname = 'audit';

  -- Count audit functions
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'audit'
    AND p.proname = 'log_change';

  -- Count audit triggers
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger
  WHERE tgname LIKE 'audit_%';

  -- Report results
  RAISE NOTICE 'Audit infrastructure installed:';
  RAISE NOTICE '  Tables: % (expected: 1)', v_table_count;
  RAISE NOTICE '  Functions: % (expected: 1)', v_function_count;
  RAISE NOTICE '  Triggers: % (expected: 3)', v_trigger_count;

  -- Validate installation
  IF v_table_count < 1 THEN
    RAISE EXCEPTION 'Audit table not created';
  END IF;

  IF v_function_count < 1 THEN
    RAISE EXCEPTION 'Audit function not created';
  END IF;

  IF v_trigger_count < 3 THEN
    RAISE EXCEPTION 'Audit triggers not attached (found %, expected 3)', v_trigger_count;
  END IF;

  RAISE NOTICE 'Audit infrastructure validation: PASSED';
END;
$$;
