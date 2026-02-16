-- Admin Audit Policies
-- Implements ADM-03 (admin role management), ADM-05 (view deleted records), ADM-07 (audit log viewing)
-- Phase 14 Plan 02: Enable admins to manage roles, view soft-deleted records, and access audit logs

-- 1. Add RLS policies for user_roles table (admin can INSERT/DELETE roles)
-- Allows admins to grant admin/member roles to other users (ADM-03)
CREATE POLICY "Admins can insert admin roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND role IN ('admin', 'member'));

COMMENT ON POLICY "Admins can insert admin roles" ON public.user_roles
  IS 'Allows admins to grant admin/member roles to users. Role value restricted to admin or member.';

-- Allows admins to revoke roles from users (ADM-03)
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can delete roles" ON public.user_roles
  IS 'Allows admins to revoke admin/member roles from users.';

-- 2. Update workouts SELECT RLS policy to allow admins to view ALL records (including soft-deleted)
-- This enables ADM-05: admin can see deleted records for restoration

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own workouts" ON public.workouts;

-- Create new policy with admin bypass
CREATE POLICY "Users can view own workouts or admins view all"
  ON public.workouts FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR public.is_admin()
  );

COMMENT ON POLICY "Users can view own workouts or admins view all" ON public.workouts
  IS 'Regular users see only their own workouts. Admins see ALL workouts including soft-deleted (deleted_at IS NOT NULL).';

-- 3. Add RLS policy for audit.record_version (admin read-only access to audit logs)
-- Enables ADM-07: audit log viewing for admins

-- Enable RLS on audit.record_version table
ALTER TABLE audit.record_version ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view audit log"
  ON audit.record_version FOR SELECT
  TO authenticated
  USING (public.is_admin());

COMMENT ON POLICY "Admins can view audit log" ON audit.record_version
  IS 'Audit log is read-only for admins. Triggers write, humans read. No INSERT/UPDATE/DELETE policies needed.';

-- 4. Initialize default admins (ADM-02)
-- Idempotent: ON CONFLICT DO NOTHING allows safe re-runs
-- Only inserts if users exist in auth.users (should exist from v1.0 signup)

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email IN ('ohama100@gmail.com', 'ohama100@naver.com')
ON CONFLICT (user_id, role) DO NOTHING;

COMMENT ON TABLE public.user_roles
  IS 'User roles for RBAC. Admin role grants view/delete profiles, manage roles, view deleted records, access audit logs.';

-- 5. Create index for efficient audit log queries (time-series access pattern)
-- Audit logs are queried by timestamp descending (most recent first)
CREATE INDEX IF NOT EXISTS idx_record_version_ts ON audit.record_version(ts DESC);

COMMENT ON INDEX idx_record_version_ts
  IS 'Index for efficient audit log queries ordered by timestamp descending.';
