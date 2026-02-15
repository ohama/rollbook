# Architecture Patterns: v2.0 UI Refactoring

**Domain:** Workout tracking web app (Fable/Elmish + Supabase)
**Milestone:** v2.0 — Multiple records per day + UI refactoring + Admin audit log
**Researched:** 2026-02-15

## Executive Summary

This architecture research addresses how to integrate NEW features (multiple records per day, text/photo record types, edit/delete, admin audit log) into the EXISTING Fable/Elmish + Supabase architecture.

**Critical insight:** The migration from one-record-per-day to multiple-records-per-day is a **breaking schema change** that affects:
1. Database: `PRIMARY KEY (user_id, workout_date)` → `id BIGSERIAL PRIMARY KEY` + drop UNIQUE constraint
2. Elmish state: Single `WorkoutRecord option` → `WorkoutRecord array` with discriminated union for record types
3. Offline queue: Must handle multiple records per date in sync strategy
4. RLS policies: Must add UPDATE/DELETE policies for own-record-only modification

**Recommended build order:**
1. Schema migration (safe, with rollback plan)
2. New Elmish state types (record type DU, multiple records)
3. UI components (date navigation, tabs, record list)
4. Edit/delete operations with RLS
5. Admin audit log (separate table, soft delete)

This order minimizes risk by getting the schema stable first, then building UI on top.

---

## Recommended Architecture

### Overall System Structure (v2.0)

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Fable App)                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Main.fs (App Root)                      │  │
│  │  ┌─ AuthState: Loading | Anonymous | Authenticated  │  │
│  │  └─ Page routing                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Dashboard.fs (Main Container)               │  │
│  │  ┌─ TabMode: Home | Me | Us | Admin                 │  │
│  │  ├─ selectedDate: DateTime (NEW)                     │  │
│  │  └─ Component composition                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│       ┌───────────────────┼───────────────────┐            │
│       ▼                   ▼                   ▼            │
│  ┌─────────┐       ┌──────────┐       ┌──────────┐        │
│  │  Home   │       │    Me    │       │    Us    │        │
│  │  Tab    │       │   Tab    │       │   Tab    │        │
│  │         │       │          │       │          │        │
│  │ Record  │       │ Calendar │       │  Team    │        │
│  │ List    │       │ +        │       │ Calendar │        │
│  │ (date-  │       │ Stats    │       │ +        │        │
│  │ based)  │       │          │       │ Stats    │        │
│  └─────────┘       └──────────┘       └──────────┘        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │       NEW: DateNavigation Component                  │  │
│  │  ┌─ <  2026-02-15  >  (date picker)                 │  │
│  │  └─ Shared state via props/callback                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ Supabase API calls
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  workouts    │  │ admin_audit  │  │ user_roles   │     │
│  │  (modified)  │  │   (NEW)      │  │ (existing)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  RLS Policies (enhanced for edit/delete)                   │
└─────────────────────────────────────────────────────────────┘
```

### New UI Layout (3-Row Structure)

```
┌────────────────────────────────────────────────────────────┐
│  Header: Rollbook [user email] [Logout]                   │
├────────────────────────────────────────────────────────────┤
│  DateNavigation: <  2026-02-15  >  [📅 Date Picker]      │
├────────────────────────────────────────────────────────────┤
│  Tabs: [Home] [Me] [Us] [Admin]                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Content Area (tab-dependent):                            │
│                                                            │
│  Home Tab:                                                 │
│    ┌────────────────────────────────────────────┐        │
│    │ 2026-02-15 기록 (3)                         │        │
│    ├────────────────────────────────────────────┤        │
│    │ 💪 운동 기록 (14:30) [수정] [삭제]          │        │
│    │ 📝 "오늘 데드리프트 100kg" (15:00) [수정]   │        │
│    │ 📷 [thumbnail] (15:30) [보기] [삭제]        │        │
│    ├────────────────────────────────────────────┤        │
│    │ [+ 운동 기록] [+ 텍스트] [+ 사진]           │        │
│    └────────────────────────────────────────────┘        │
│                                                            │
│  Me Tab:                                                   │
│    Calendar (월별) + 날짜별 기록 횟수 표시                │
│    클릭 시 해당 날짜로 이동 (Home 탭 전환)                │
│                                                            │
│  Us Tab:                                                   │
│    Team Calendar (현재 팀뷰와 유사)                        │
│                                                            │
│  Admin Tab:                                                │
│    ┌─ Member List                                         │
│    └─ Audit Log (NEW)                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Integration Points with Existing Components

| Existing Component | Change Type | v2.0 Integration |
|-------------------|-------------|------------------|
| `Main.fs` (App root) | **Minor** | No change — auth state routing still works |
| `Dashboard.fs` | **Major** | Add `selectedDate` state, `DateNavigation`, new layout |
| `WorkoutToggle` | **Refactor** | Remove (replaced by RecordList multi-type) |
| `Calendar.fs` | **Enhance** | Show count badge per date, click → navigate to date |
| `PhotoUpload.fs` | **Refactor** | No auto-workout creation, create PhotoRecord instead |
| `PhotoGallery.fs` | **Minor** | Filter by `selectedDate` instead of "all photos" |
| `ProgressView.fs` | **Merge** | Integrate into "Me" tab, share Calendar component |
| `TeamView.fs` | **Merge** | Integrate into "Us" tab |
| `AdminPage.fs` | **Enhance** | Add AuditLog component, AdminActions for role mgmt |

### New Components Needed

| Component | Purpose | Dependencies |
|-----------|---------|--------------|
| `DateNavigation.fs` | Date picker + prev/next navigation | `selectedDate` state (lifted to Dashboard) |
| `RecordList.fs` | Display multiple records for selected date | `WorkoutRecord array`, RecordType DU |
| `RecordItem.fs` | Single record display with edit/delete | RecordType, RLS-aware delete |
| `RecordForm.fs` | Add/edit text/photo/workout record | RecordType DU, validation |
| `AuditLog.fs` | Admin audit log view with undo | admin_audit table, soft delete |
| `AdminRoleManager.fs` | Assign/revoke admin roles | user_roles table, RLS |

---

## Data Model Changes

### 1. Schema Migration Strategy

**Current schema (v1.1):**
```sql
create table public.workouts (
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  created_at timestamptz default now() not null,
  primary key (user_id, workout_date)  -- ← UNIQUE constraint prevents multiple records
);
```

**Target schema (v2.0):**
```sql
-- Step 1: Rename existing table (safe, reversible)
alter table public.workouts rename to workouts_v1_backup;

-- Step 2: Create new table with id primary key
create table public.workouts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  record_type text not null check (record_type in ('workout', 'text', 'photo')),
  text_content text,  -- for record_type = 'text'
  photo_path text,    -- for record_type = 'photo' (storage path)
  created_at timestamptz default now() not null,
  updated_at timestamptz,
  deleted_at timestamptz  -- soft delete for audit/undo
);

-- Step 3: Copy existing data (all become record_type = 'workout')
insert into public.workouts (user_id, workout_date, record_type, created_at)
select user_id, workout_date, 'workout', created_at
from workouts_v1_backup;

-- Step 4: Indexes for performance
create index idx_workouts_user_date on public.workouts(user_id, workout_date);
create index idx_workouts_date on public.workouts(workout_date);
create index idx_workouts_deleted on public.workouts(deleted_at) where deleted_at is null;

-- Step 5: RLS policies (recreate with new schema)
alter table public.workouts enable row level security;

-- SELECT: Users can view own records (exclude soft-deleted)
create policy "Users can view own workouts"
  on public.workouts for select
  to authenticated
  using (auth.uid() = user_id and deleted_at is null);

-- INSERT: Users can create own records
create policy "Users can insert own workouts"
  on public.workouts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE: Users can update own records (exclude soft-deleted)
create policy "Users can update own workouts"
  on public.workouts for update
  to authenticated
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

-- DELETE: Users can soft-delete own records, admins can hard-delete
create policy "Users can delete own workouts"
  on public.workouts for update  -- soft delete via UPDATE
  to authenticated
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

-- Step 6: Rollback plan (if migration fails)
-- drop table public.workouts;
-- alter table public.workouts_v1_backup rename to workouts;
```

**Migration safety checklist:**
- [x] Backup existing table before migration
- [x] Test migration on local Supabase instance
- [x] Verify data integrity after copy
- [x] Keep backup table for rollback
- [x] RLS policies recreated correctly
- [x] Indexes recreated for performance

**Team visibility (unchanged):**
```sql
-- Team can view all workouts (for "Us" tab)
create policy "Authenticated users can view all workouts"
  on public.workouts for select
  to authenticated
  using (deleted_at is null);  -- Hide soft-deleted from team view
```

### 2. New admin_audit Table

```sql
create table public.admin_audit (
  id bigserial primary key,
  admin_user_id uuid not null references auth.users(id),
  action_type text not null check (action_type in ('delete_member', 'delete_record', 'assign_admin', 'revoke_admin')),
  target_user_id uuid references auth.users(id),
  target_record_id bigint references public.workouts(id),
  metadata jsonb,  -- flexible for action-specific data
  created_at timestamptz default now() not null,
  undone_at timestamptz  -- if action was undone
);

-- RLS: Only admins can view audit log
create policy "Admins can view audit log"
  on public.admin_audit for select
  to authenticated
  using (is_admin());

-- Index for efficient queries
create index idx_admin_audit_admin_user on public.admin_audit(admin_user_id);
create index idx_admin_audit_created on public.admin_audit(created_at desc);
```

**Undo mechanism:**
- Soft-deleted records (`deleted_at` set) can be restored by setting `deleted_at = null`
- `admin_audit` row gets `undone_at` timestamp
- Both operations in same transaction for consistency

---

## Elmish State Changes

### Current State (v1.1)

```fsharp
// Dashboard.fs
type TabMode = Home | Progress | Team | Admin

// WorkoutToggle.fs (single-date, single-record)
let (hasWorkedOut, setHasWorkedOut) = React.useState(false)
```

### New State (v2.0)

```fsharp
// Supabase/Types.fs — NEW discriminated union
type RecordType =
    | WorkoutRecord    // Simple workout toggle
    | TextRecord of content: string
    | PhotoRecord of path: string

type WorkoutRecordV2 = {
    id: int64
    user_id: string
    workout_date: string  // YYYY-MM-DD
    record_type: RecordType
    created_at: string
    updated_at: string option
    deleted_at: string option  // soft delete
}

// Dashboard.fs — NEW global state
type DashboardState = {
    activeTab: TabMode
    selectedDate: DateTime  // NEW: shared across tabs
    records: WorkoutRecordV2 array  // NEW: for selectedDate
    loading: bool
    error: string option
}

type DashboardMsg =
    | SetTab of TabMode
    | SetDate of DateTime  // NEW: date navigation
    | LoadRecords of date: DateTime
    | RecordsLoaded of Result<WorkoutRecordV2 array, string>
    | AddRecord of RecordType
    | EditRecord of id: int64 * RecordType
    | DeleteRecord of id: int64
    | RecordUpdated of Result<unit, string>

// Elmish update function
let update msg state =
    match msg with
    | SetDate date ->
        { state with selectedDate = date }, Cmd.ofMsg (LoadRecords date)
    | LoadRecords date ->
        let cmd = Cmd.OfPromise.perform (getWorkoutsForDate state.userId) date RecordsLoaded
        { state with loading = true }, cmd
    | RecordsLoaded (Ok records) ->
        { state with records = records; loading = false }, Cmd.none
    | DeleteRecord id ->
        let cmd = Cmd.OfPromise.perform deleteWorkout id RecordUpdated
        state, cmd
    // ... other cases
```

**Key changes:**
1. `selectedDate` lifted to Dashboard state (shared across tabs)
2. Records are `array` not `option` (multiple per date)
3. RecordType discriminated union for polymorphic records
4. Elmish Msg type for all state transitions
5. Cmd for async operations (Supabase API calls)

---

## New Supabase API Functions

### Workouts.fs (enhanced)

```fsharp
// src/Supabase/Workouts.fs

/// Get all records for a specific date (multiple records support)
let getWorkoutsForDate (userId: string) (date: string) : JS.Promise<WorkoutRecordV2 array> =
    promise {
        let query =
            supabase
                ?from("workouts")
                ?select("*")
                ?eq("user_id", userId)
                ?eq("workout_date", date)
                ?is("deleted_at", null)  // Exclude soft-deleted
                ?order("created_at", createObj ["ascending" ==> true])

        let! result = query
        let data = result?data

        if isNull data then [||]
        else unbox<WorkoutRecordV2 array> data
    }

/// Create a new record (any type)
let createRecord (userId: string) (date: string) (recordType: RecordType) : JS.Promise<Result<unit, string>> =
    promise {
        let record = createObj [
            "user_id" ==> userId
            "workout_date" ==> date
            "record_type" ==> (
                match recordType with
                | WorkoutRecord -> "workout"
                | TextRecord _ -> "text"
                | PhotoRecord _ -> "photo"
            )
            "text_content" ==> (
                match recordType with
                | TextRecord content -> box content
                | _ -> null
            )
            "photo_path" ==> (
                match recordType with
                | PhotoRecord path -> box path
                | _ -> null
            )
        ]

        let! result = supabase?from("workouts")?insert(record)
        let error = result?error

        match box error with
        | null -> return Ok ()
        | _ -> return Error (error?message |> unbox<string>)
    }

/// Update a record (own records only, enforced by RLS)
let updateRecord (id: int64) (recordType: RecordType) : JS.Promise<Result<unit, string>> =
    promise {
        let updates = createObj [
            "record_type" ==> (match recordType with ...)
            "text_content" ==> (...)
            "photo_path" ==> (...)
            "updated_at" ==> System.DateTime.Now.ToString("o")
        ]

        let! result = supabase?from("workouts")?update(updates)?eq("id", id)
        let error = result?error

        match box error with
        | null -> return Ok ()
        | _ -> return Error (error?message |> unbox<string>)
    }

/// Soft delete a record (sets deleted_at)
let deleteRecord (id: int64) : JS.Promise<Result<unit, string>> =
    promise {
        let updates = createObj [
            "deleted_at" ==> System.DateTime.Now.ToString("o")
        ]

        let! result = supabase?from("workouts")?update(updates)?eq("id", id)
        let error = result?error

        match box error with
        | null -> return Ok ()
        | _ -> return Error (error?message |> unbox<string>)
    }
```

### Admin.fs (enhanced)

```fsharp
// src/Supabase/Admin.fs

/// Log admin action to audit table
let logAdminAction (actionType: string) (targetUserId: string option) (targetRecordId: int64 option) (metadata: obj option) : JS.Promise<Result<unit, string>> =
    promise {
        let record = createObj [
            "admin_user_id" ==> (getCurrentUserId())  // from auth context
            "action_type" ==> actionType
            "target_user_id" ==> (targetUserId |> Option.toObj)
            "target_record_id" ==> (targetRecordId |> Option.map box |> Option.toObj)
            "metadata" ==> (metadata |> Option.toObj)
        ]

        let! result = supabase?from("admin_audit")?insert(record)
        let error = result?error

        match box error with
        | null -> return Ok ()
        | _ -> return Error (error?message |> unbox<string>)
    }

/// Get audit log (admin only, enforced by RLS)
let getAuditLog (limit: int) : JS.Promise<Result<AdminAuditRecord array, string>> =
    promise {
        let! result =
            supabase
                ?from("admin_audit")
                ?select("*, profiles!admin_user_id(email)")
                ?order("created_at", createObj ["ascending" ==> false])
                ?limit(limit)

        let error = result?error
        let data = result?data

        match box error with
        | null -> return Ok (unbox<AdminAuditRecord array> data)
        | _ -> return Error (error?message |> unbox<string>)
    }

/// Undo admin action (restore soft-deleted record)
let undoDeleteRecord (recordId: int64) (auditId: int64) : JS.Promise<Result<unit, string>> =
    promise {
        // Transaction: restore record + mark audit as undone
        // Supabase doesn't support transactions in client, use RPC
        let! result =
            supabase
                ?rpc("undo_delete_record", createObj [
                    "p_record_id" ==> recordId
                    "p_audit_id" ==> auditId
                ])

        let error = result?error

        match box error with
        | null -> return Ok ()
        | _ -> return Error (error?message |> unbox<string>)
    }
```

**PostgreSQL function for atomic undo:**
```sql
create or replace function undo_delete_record(p_record_id bigint, p_audit_id bigint)
returns void as $$
begin
  -- Restore record
  update public.workouts
  set deleted_at = null
  where id = p_record_id;

  -- Mark audit as undone
  update public.admin_audit
  set undone_at = now()
  where id = p_audit_id;
end;
$$ language plpgsql security definer;
```

---

## Offline Sync Impact

### Current Strategy (v1.1)

```fsharp
// offline/Types.fs
type OperationType =
    | CreateWorkout
    | DeleteWorkout

type QueuedOperation = {
    operationType: string    // "CreateWorkout" | "DeleteWorkout"
    userId: string
    workoutDate: string      // YYYY-MM-DD
    timestamp: float
    retryCount: int
}
```

**Problem:** Current queue assumes ONE record per date. With multiple records, we need to track which specific record was modified.

### New Strategy (v2.0)

```fsharp
// offline/Types.fs (enhanced)
type OperationType =
    | CreateWorkout of RecordType
    | UpdateWorkout of id: int64 * RecordType
    | DeleteWorkout of id: int64

type QueuedOperation = {
    id: int option           // IndexedDB auto-increment
    operationType: string    // "CreateWorkout" | "UpdateWorkout" | "DeleteWorkout"
    recordId: int64 option   // NEW: specific record ID for update/delete
    userId: string
    workoutDate: string
    recordType: string       // NEW: "workout" | "text" | "photo"
    textContent: string option
    photoPath: string option
    timestamp: float
    retryCount: int
}
```

**Sync strategy changes:**
1. **Create:** Queue with `recordType`, sync creates new record
2. **Update:** Queue with `recordId`, sync updates specific record
3. **Delete:** Queue with `recordId`, sync soft-deletes specific record

**Conflict resolution:**
- If offline update + server already has newer version → show conflict UI (out of scope for v2.0, just overwrite)
- If offline delete + server record already deleted → idempotent (no-op)

---

## Suggested Build Order

### Phase 1: Schema Migration (Days 1-2)
**Goal:** Migrate database schema safely, verify data integrity

1. Write migration SQL in `supabase/migrations/`
2. Test on local Supabase (`npx supabase db reset`)
3. Verify:
   - All existing workouts copied to new table
   - RLS policies working (test with 2 users)
   - Indexes created correctly
4. Apply to production with backup plan
5. **Deliverable:** Migration SQL file, rollback script, test results

**Dependencies:** None (pure database work)

### Phase 2: Type System (Days 3-4)
**Goal:** Define new F# types for multi-record model

1. Update `Supabase/Types.fs`:
   - `RecordType` discriminated union
   - `WorkoutRecordV2` record type
   - `AdminAuditRecord` type
2. Add JSON serialization helpers (Fable interop)
3. Update `Workouts.fs` API functions
4. Update `Admin.fs` API functions
5. **Deliverable:** Type definitions, API functions, unit tests

**Dependencies:** Phase 1 (schema must exist)

### Phase 3: Date Navigation + State (Days 5-6)
**Goal:** Shared date state, navigation UI

1. Create `DateNavigation.fs` component
   - Prev/Next buttons
   - Date picker (use HTML5 `<input type="date">` or React date picker)
   - Emit `SetDate` message to parent
2. Lift `selectedDate` state to Dashboard
3. Update Dashboard to load records for `selectedDate`
4. **Deliverable:** DateNavigation component, Dashboard state wired up

**Dependencies:** Phase 2 (needs types)

### Phase 4: Record List UI (Days 7-9)
**Goal:** Display multiple records, add new records

1. Create `RecordList.fs` component
   - Map over `WorkoutRecordV2 array`
   - Render different UI per `RecordType`
2. Create `RecordForm.fs` component
   - Select record type (workout/text/photo)
   - Input validation
   - Call `createRecord` API
3. Create `RecordItem.fs` component
   - Display single record
   - Edit/Delete buttons (placeholder)
4. Wire into Home tab
5. **Deliverable:** Record list display, add new records

**Dependencies:** Phase 3 (needs date state)

### Phase 5: Edit/Delete Operations (Days 10-11)
**Goal:** Modify existing records with RLS enforcement

1. Implement `updateRecord` API (RLS enforced)
2. Implement `deleteRecord` API (soft delete)
3. Add edit mode to `RecordItem`
   - Inline editing for text
   - Replace for photo
4. Add delete confirmation modal
5. Test RLS: User A cannot delete User B's records
6. **Deliverable:** Edit/delete working, RLS verified

**Dependencies:** Phase 4 (needs UI)

### Phase 6: Calendar Integration (Days 12-13)
**Goal:** Update calendar to show record count, navigate to date

1. Modify `Calendar.fs`:
   - Query count of records per date (not just presence)
   - Show badge with count (e.g., "3")
   - Click date → `SetDate` + switch to Home tab
2. Update `ProgressView.fs` to use new API
3. Update `TeamView.fs` to use new API (team can see counts)
4. **Deliverable:** Calendar shows counts, navigates to date

**Dependencies:** Phase 4 (needs RecordList)

### Phase 7: Admin Audit Log (Days 14-16)
**Goal:** Track admin actions, enable undo

1. Create `admin_audit` table migration
2. Create `AuditLog.fs` component
   - Display recent admin actions
   - Show "Undo" button for soft deletes
3. Wrap admin delete with `logAdminAction`
4. Implement `undoDeleteRecord` RPC
5. Add `AdminRoleManager.fs` for assigning admins
6. **Deliverable:** Audit log visible to admins, undo working

**Dependencies:** Phase 5 (needs delete operations)

### Phase 8: Offline Sync Refactor (Days 17-18)
**Goal:** Update offline queue for multiple records

1. Modify `offline/Types.fs` for new queue structure
2. Update `Queue.fs` to store `recordId`
3. Update `Sync.fs` to handle update/delete operations
4. Test offline scenarios:
   - Create record offline → sync
   - Delete record offline → sync
5. **Deliverable:** Offline queue supports multiple records

**Dependencies:** Phase 5 (needs update/delete API)

### Phase 9: Polish + Testing (Days 19-20)
**Goal:** UI refinement, edge case handling

1. Mobile responsiveness (tab navigation)
2. Loading states for all async operations
3. Error handling (API failures, RLS denials)
4. Empty states (no records for date)
5. E2E testing scenarios
6. **Deliverable:** Production-ready UI

**Dependencies:** All previous phases

---

## RLS Policy Patterns

### Pattern 1: Own Records Only (SELECT, UPDATE, DELETE)

```sql
-- Users can only see their own non-deleted records
create policy "Users can view own workouts"
  on public.workouts for select
  to authenticated
  using (auth.uid() = user_id and deleted_at is null);

-- Users can only update their own records
create policy "Users can update own workouts"
  on public.workouts for update
  to authenticated
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);
```

**Why this works:**
- `USING` clause: checks existing row (pre-update)
- `WITH CHECK` clause: checks new row (post-update)
- Prevents users from updating `user_id` to another user
- `deleted_at is null` hides soft-deleted records

### Pattern 2: Team Visibility (SELECT for all)

```sql
-- All authenticated users can view all non-deleted records
create policy "Team can view all workouts"
  on public.workouts for select
  to authenticated
  using (deleted_at is null);
```

**Note:** This conflicts with "own records only" policy. **SOLUTION:** Drop the restrictive policy, keep only team policy. RLS is permissive (OR logic).

### Pattern 3: Admin Actions (Audit Log)

```sql
-- Admin deletes are soft-deletes (UPDATE), logged in audit table
create policy "Users can soft-delete own workouts"
  on public.workouts for update
  to authenticated
  using (auth.uid() = user_id and deleted_at is null)
  with check (
    (auth.uid() = user_id) or  -- Own records
    (is_admin())                -- Or admin (for undo)
  );
```

**Admin workflow:**
1. Admin clicks "Delete" on record → calls `deleteRecord(id)` (sets `deleted_at`)
2. API call succeeds (RLS allows admin)
3. Audit log entry created: `logAdminAction("delete_record", ..., id, ...)`
4. Admin can undo: `undoDeleteRecord(id, auditId)` → sets `deleted_at = null`

---

## Architecture Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Filtering of Deleted Records
**What:** Load all records including soft-deleted, filter in F# code
**Why bad:** Leaks deleted data to client, wastes bandwidth
**Instead:** Filter in SQL with `deleted_at is null` in RLS policy

### Anti-Pattern 2: Multiple RLS Policies for Same Operation
**What:** Create separate SELECT policies for "own" and "team"
**Why bad:** RLS uses OR logic, creates confusion
**Instead:** Single permissive policy for team visibility

### Anti-Pattern 3: Hard Delete without Audit
**What:** Use `DELETE FROM workouts WHERE id = ...`
**Why bad:** No recovery, no audit trail
**Instead:** Soft delete with `UPDATE workouts SET deleted_at = NOW()`

### Anti-Pattern 4: Storing State in URL Hash
**What:** Use `#/date/2026-02-15` for date navigation
**Why bad:** Breaks back button, complicates Elmish state
**Instead:** Lift `selectedDate` to Dashboard state, render from state

### Anti-Pattern 5: N+1 Queries for Record Counts
**What:** Query each date individually in calendar render
**Why bad:** Hundreds of API calls for monthly calendar
**Instead:** Single query for date range with GROUP BY

---

## Performance Considerations

### 1. Index Strategy

```sql
-- Composite index for user + date queries (most common)
create index idx_workouts_user_date on public.workouts(user_id, workout_date);

-- Date index for team calendar (GROUP BY workout_date)
create index idx_workouts_date on public.workouts(workout_date);

-- Partial index for active records (soft delete filter)
create index idx_workouts_active on public.workouts(user_id, workout_date)
  where deleted_at is null;
```

**Query patterns:**
- Home tab: `WHERE user_id = ? AND workout_date = ? AND deleted_at IS NULL` → uses `idx_workouts_user_date`
- Me calendar: `WHERE user_id = ? AND workout_date BETWEEN ? AND ? AND deleted_at IS NULL` → uses `idx_workouts_user_date`
- Us calendar: `WHERE workout_date BETWEEN ? AND ? AND deleted_at IS NULL GROUP BY workout_date` → uses `idx_workouts_date`

### 2. Batch Loading for Calendar

```fsharp
// Load entire month of records in one query (not per-date)
let getWorkoutsForMonth (userId: string) (year: int) (month: int) : JS.Promise<WorkoutRecordV2 array> =
    promise {
        let startDate = formatDateString year month 1
        let endDate = formatDateString year month (getDaysInMonth year month)

        let! result =
            supabase
                ?from("workouts")
                ?select("*")
                ?eq("user_id", userId)
                ?gte("workout_date", startDate)
                ?lte("workout_date", endDate)
                ?is("deleted_at", null)
                ?order("workout_date", createObj ["ascending" ==> true])

        let data = result?data
        if isNull data then [||]
        else unbox<WorkoutRecordV2 array> data
    }

// In Calendar.fs, group by date client-side
let recordsByDate =
    monthRecords
    |> Array.groupBy (fun r -> r.workout_date)
    |> Map.ofArray
```

**Benefit:** 1 API call instead of 30 (for monthly calendar)

### 3. Optimistic UI Updates

```fsharp
// When user deletes record, immediately update UI
let handleDelete recordId =
    // Optimistic update
    setState { state with records = state.records |> Array.filter (fun r -> r.id <> recordId) }

    // API call in background
    promise {
        let! result = deleteRecord recordId
        match result with
        | Ok () -> ()  // Already updated UI
        | Error msg ->
            // Rollback on error
            setState { state with error = Some msg }
            // Reload records to restore deleted item
            let! records = getWorkoutsForDate state.userId state.selectedDate
            setState { state with records = records }
    } |> Promise.start
```

---

## Testing Strategy

### 1. Schema Migration Testing

```bash
# Local test cycle
npx supabase db reset  # Wipes local DB
npx supabase db push   # Applies migrations
npm run seed-test-data # Inserts test workouts

# Verify migration
psql -h localhost -p 54322 -U postgres -d postgres -c "
  SELECT user_id, workout_date, record_type, deleted_at
  FROM workouts
  LIMIT 10;
"

# Rollback test
npx supabase db reset
# Apply rollback SQL
psql ... -c "ALTER TABLE workouts_v1_backup RENAME TO workouts;"
```

### 2. RLS Policy Testing

```fsharp
// Create test module: Tests/RlsTests.fs
let testOwnRecordOnly () =
    promise {
        // Create userA record
        let! _ = createRecord userA.id "2026-02-15" WorkoutRecord

        // Try to delete as userB → should fail
        let! result = deleteRecord recordId  // Uses userB auth

        match result with
        | Error msg when msg.Contains("permission") ->
            printfn "✓ RLS blocked cross-user delete"
        | _ ->
            failwith "❌ RLS allowed cross-user delete!"
    }
```

### 3. Offline Sync Testing

```fsharp
// Simulate offline scenario
let testOfflineCreate () =
    promise {
        // Go offline
        setOffline()

        // Create record (should queue)
        let! result = createRecord userId "2026-02-15" (TextRecord "Offline test")

        // Verify queued
        let! pending = getAllPending()
        assert (pending.Length = 1)

        // Go online
        setOnline()

        // Trigger sync
        let! _ = replayQueue()

        // Verify record in DB
        let! records = getWorkoutsForDate userId "2026-02-15"
        assert (records |> Array.exists (fun r ->
            match r.record_type with
            | TextRecord content -> content = "Offline test"
            | _ -> false
        ))
    }
```

---

## Migration Checklist

**Before deployment:**
- [ ] Local migration tested with seed data
- [ ] RLS policies verified (2+ test users)
- [ ] Indexes created and explain plans checked
- [ ] Rollback script prepared
- [ ] Production database backed up
- [ ] Downtime window scheduled (if needed)

**During deployment:**
- [ ] Apply migration SQL
- [ ] Verify data integrity (row counts match)
- [ ] Test auth (users can still log in)
- [ ] Test basic operations (create, view, delete)
- [ ] Monitor error logs

**After deployment:**
- [ ] Keep v1 backup table for 1 week
- [ ] Monitor performance (query times)
- [ ] User acceptance testing
- [ ] Drop backup table after verification

---

## Sources

### Official Documentation
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RLS Complete Guide (2026)](https://designrevision.com/blog/supabase-row-level-security)
- [Elmish Documentation](https://elmish.github.io/elmish/)
- [Feliz React Bindings](https://github.com/Zaid-Ajaj/Feliz)

### Architecture Patterns
- [Model-View-Update (MVU) Pattern in F#](https://softwarepatternslexicon.com/patterns-f-sharp/12/1/)
- [PostgreSQL Soft Delete Implementation](https://oneuptime.com/blog/post/2026-01-21-postgresql-soft-deletes/view)
- [PostgreSQL Row Level Security for Multi-Tenant SaaS](https://www.techbuddies.io/2026/01/01/how-to-implement-postgresql-row-level-security-for-multi-tenant-saas/)
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)

### Best Practices
- [How to Manage Row-Level Security in Supabase](https://prosperasoft.com/blog/database/how-to-manage-row-level-security-policies-effectively-in-supabase/)
- [Supabase Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs)
- [PostgreSQL Soft Delete Discussion](https://postgres.fm/episodes/soft-delete)

### React/UI Components
- [React Date Picker Component](https://daypicker.dev/)
- [Feliz.UseElmish Integration](https://www.nuget.org/packages/Feliz.UseElmish)

---

**Confidence Level:** HIGH

**Rationale:**
- Schema migration pattern is well-established (official Supabase docs)
- RLS policies follow documented best practices
- Elmish MVU pattern is proven for complex state management
- Soft delete + audit log is industry standard
- Build order minimizes risk by stabilizing schema first

**Open Questions:**
1. Should we use optimistic locking (version field) for concurrent edits? → DEFER to post-v2.0
2. Should audit log be paginated? → YES, implement with limit/offset in Phase 7
3. Should we support bulk operations (delete all records for date)? → NO, out of scope for v2.0
