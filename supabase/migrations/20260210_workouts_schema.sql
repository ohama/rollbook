-- Enable UUID extension (if not already enabled)
create extension if not exists "uuid-ossp";

-- Workouts table
-- Tracks daily workout records with one entry per user per date
create table public.workouts (
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  created_at timestamptz default now() not null,
  primary key (user_id, workout_date)
);

-- Index for date-range queries
create index idx_workouts_date on public.workouts(workout_date);

-- Enable RLS immediately (CVE-2025-48757 prevention)
alter table public.workouts enable row level security;

-- RLS Policy: SELECT
-- Users can view their own workout records
create policy "Users can view own workouts"
  on public.workouts for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- RLS Policy: INSERT
-- Users can create their own workout records
create policy "Users can insert own workouts"
  on public.workouts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- RLS Policy: UPDATE
-- Users can update their own workout records
create policy "Users can update own workouts"
  on public.workouts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- RLS Policy: DELETE
-- Users can delete their own workout records
create policy "Users can delete own workouts"
  on public.workouts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Table comment documenting RLS enabled
comment on table public.workouts is 'Daily workout records with RLS enabled. One workout per user per date. Users see only their own data.';
