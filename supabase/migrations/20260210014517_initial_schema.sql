-- Enable UUID extension (if not already enabled)
create extension if not exists "uuid-ossp";

-- Profiles table (linked to auth.users)
-- Each user gets one profile, created on signup
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS immediately (CVE-2025-48757 prevention)
alter table public.profiles enable row level security;

-- RLS Policies for profiles
-- Users can only view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Users can insert their own profile (for trigger)
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- Performance: Index on id (already primary key, but explicit for RLS)
-- This is implicit for primary key but documenting intent

-- Trigger: Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Verify RLS is enabled
comment on table public.profiles is 'User profiles with RLS enabled. Each user sees only their own data.';
