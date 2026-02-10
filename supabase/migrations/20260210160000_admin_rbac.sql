-- Admin Role-Based Access Control (RBAC)
-- Implements ADMN-01 (admin view members) and ADMN-02 (admin delete members)

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Only admins can insert/update/delete roles (via API with elevated privileges)
-- No direct write policies for regular users

-- 2. Create is_admin function for efficient role checking
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Update profiles RLS policies for admin access

-- Drop existing SELECT policy to recreate with admin access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Team members can view all profiles" ON public.profiles;

-- Admin can view all profiles, regular users can view all (for team view)
-- Note: Team visibility was enabled in Phase 4, keeping it for regular users
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 4. Add admin DELETE policy for profiles
-- Only admins can delete profiles (other than their own via cascade)
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5. Create index for efficient role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 6. Add comment for documentation
COMMENT ON TABLE public.user_roles IS 'User roles for RBAC. Admin role grants view/delete access to all profiles.';
COMMENT ON FUNCTION public.is_admin() IS 'Check if current user has admin role. Used in RLS policies.';

-- Note: To assign admin role, manually run:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('user-uuid-here', 'admin');
