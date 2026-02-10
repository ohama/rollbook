-- ============================================
-- Phase 4: Team Visibility RLS Updates
-- Allow authenticated users to view all workouts and profiles
-- Keep INSERT/UPDATE/DELETE restricted to own records
-- ============================================

-- WORKOUTS TABLE: Allow team visibility for SELECT
-- (Keep INSERT/UPDATE/DELETE policies unchanged)

-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own workouts" ON public.workouts;

-- Create new permissive SELECT policy: all authenticated users can view all workouts
CREATE POLICY "Authenticated users can view all workouts"
  ON public.workouts FOR SELECT
  TO authenticated
  USING (true);

-- PROFILES TABLE: Allow team visibility for SELECT
-- (Keep UPDATE policy unchanged)

-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new permissive SELECT policy: all authenticated users can view all profiles
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Update table comments to reflect new policy
COMMENT ON TABLE public.workouts IS 'Daily workout records with RLS enabled. One workout per user per date. All authenticated users can view all workouts; users can only modify their own.';
COMMENT ON TABLE public.profiles IS 'User profiles with RLS enabled. All authenticated users can view all profiles; users can only update their own.';
