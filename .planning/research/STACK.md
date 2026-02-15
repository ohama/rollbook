# Technology Stack — v2.0 UI Refactoring

**Project:** Rollbook v2.0
**Researched:** 2026-02-15
**Confidence:** HIGH

## Executive Summary

v2.0 requires minimal stack additions. The existing Fable 4.28.0 + Feliz 2.9.0 + Supabase stack handles most features. Key additions: (1) Fable.DateFunctions for date navigation, (2) yet-another-react-lightbox for photo galleries, (3) supa_audit extension for admin audit logging. No new build tools or major dependencies needed. Schema migration via Supabase CLI's built-in migration system.

## What's NOT Changing (Validated from v1.1)

The following stack components remain unchanged and should NOT be re-researched:

| Technology | Version | Status |
|------------|---------|--------|
| Fable | 4.28.0 | No change |
| Feliz | 2.9.0 | No change |
| Vite | 6.x | No change |
| Supabase | Latest | No change |
| Tailwind CSS | 4.0 | No change |
| vite-plugin-pwa | Latest | No change |
| browser-image-compression | 2.0.2 | No change |
| React | 19.2.4 | No change |

## New Stack Additions for v2.0

### Date Navigation & Manipulation

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| date-fns | 4.1.0 | JavaScript date utility | Industry standard, lightweight (11KB gzipped), pure functions, immutable API. 200M+ weekly downloads. TypeScript support. |
| Fable.DateFunctions | 3.9.0 | F# bindings for date-fns | Wraps date-fns with 120+ extension methods for DateTime/DateTimeOffset. Supports 32 languages for formatting. Maintained by Zaid Ajaj (Feliz author). |

**Why date-fns:**
- Simpler than Moment.js (deprecated) or Day.js
- Native Date handling without parsing overhead
- Format, add/subtract days, compare dates all built-in
- Used for "previous day / next day" navigation buttons
- No manual offset calculations needed (see current DateHelpers.fs)

**Integration example:**
```fsharp
open Fable.DateFunctions

let nextDay (currentDate: DateTime) =
    currentDate.AddDays(1.0)

let formatKorean (date: DateTime) =
    date.Format("yyyy년 M월 d일") // Uses date-fns under the hood
```

**Installation:**
```bash
npm install date-fns
dotnet add package Fable.DateFunctions
```

**Confidence:** HIGH - date-fns is the 2026 standard. Fable.DateFunctions actively maintained.

### Image Thumbnail Gallery & Lightbox

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| yet-another-react-lightbox | 3.29.1 | Modern React lightbox | Better maintained than PhotoSwipe (last updated 2023). Supports React 16.8+, 17, 18, 19. Plugin architecture (thumbnails, zoom, video). TypeScript built-in. Responsive srcset/sizes for automatic resolution switching. 290K+ weekly downloads. |

**Why yet-another-react-lightbox over alternatives:**
- PhotoSwipe: Last published 2 years ago (5.4.4), low maintenance
- react-image-lightbox: Deprecated in favor of react-photoswipe-gallery
- react-photoswipe-gallery: Actively maintained but wraps PhotoSwipe v5 (stale core library)
- yet-another-react-lightbox: Modern, actively maintained (2026), native React, plugin-based

**Features needed for v2.0:**
- Thumbnail plugin: Shows small previews below main image
- Zoom plugin: Pinch/scroll to zoom
- Click thumbnail to expand to full lightbox
- Keyboard/swipe navigation between photos
- Lazy loading (don't load all photos at once)

**Integration approach:**
Create F# bindings using Feliz interop pattern:

```fsharp
// Bindings/Lightbox.fs
module Bindings.Lightbox

open Fable.Core
open Fable.Core.JsInterop
open Feliz

type Slide = {| src: string; width: int; height: int |}

[<Import("Lightbox", from="yet-another-react-lightbox")>]
let private LightboxComponent: obj = jsNative

let lightbox (props: IReactProperty list) =
    Interop.reactApi.createElement(LightboxComponent, createObj !!props)

// Usage in Components/PhotoGallery.fs
let renderGallery (photos: string array) =
    let slides = photos |> Array.map (fun url -> {| src = url; width = 1280; height = 720 |})

    lightbox [
        "slides" ==> slides
        "open" ==> isOpen
        "close" ==> (fun _ -> setIsOpen false)
        "plugins" ==> [| thumbnailsPlugin |]
    ]
```

**Installation:**
```bash
npm install yet-another-react-lightbox
```

**Optional plugins (install as needed):**
```bash
npm install yet-another-react-lightbox/plugins/thumbnails
npm install yet-another-react-lightbox/plugins/zoom
```

**Confidence:** HIGH - Library actively maintained, excellent React 19 support, plugin architecture fits incremental v2.0 development.

### Database Schema Migration

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| Supabase CLI | Latest | Schema migrations | Already installed from v1.1. Uses `supabase db diff` to auto-generate SQL from local/remote schema changes. Tracks migration history in `supabase_migrations.schema_migrations` table. |

**Why use built-in migration tool:**
- No external tools needed (no Flyway, Liquibase, dbmate)
- Integrated with Supabase workflow
- Auto-generates migration SQL via schema diff
- Version control friendly (migrations in `supabase/migrations/`)
- Supports rollback/forward migrations

**Migration needed for v2.0:**
Breaking change: Remove `PRIMARY KEY (user_id, workout_date)` constraint to allow multiple records per day.

**Migration workflow:**
```bash
# Step 1: Modify schema in Supabase Dashboard or local SQL
# - Drop PRIMARY KEY constraint
# - Add auto-increment id column as new PRIMARY KEY
# - Add UNIQUE index on (user_id, workout_date, record_type) if needed

# Step 2: Generate migration
supabase db diff -f remove_unique_date_constraint

# Step 3: Review generated SQL in supabase/migrations/YYYYMMDDHHMMSS_remove_unique_date_constraint.sql
# Example:
ALTER TABLE workouts DROP CONSTRAINT workouts_pkey;
ALTER TABLE workouts ADD COLUMN id BIGSERIAL PRIMARY KEY;
CREATE INDEX idx_workouts_user_date ON workouts(user_id, workout_date);

# Step 4: Apply migration
supabase db push
```

**Alternative approach (manual migration):**
Create migration file manually in `supabase/migrations/`:

```sql
-- supabase/migrations/20260215000000_multiple_records_per_day.sql
-- Remove unique constraint, add id column, preserve existing data

BEGIN;

-- 1. Add id column (nullable initially)
ALTER TABLE workouts ADD COLUMN id BIGSERIAL;

-- 2. Populate id for existing records
UPDATE workouts SET id = nextval('workouts_id_seq');

-- 3. Drop old primary key
ALTER TABLE workouts DROP CONSTRAINT workouts_pkey;

-- 4. Set id as new primary key
ALTER TABLE workouts ADD PRIMARY KEY (id);

-- 5. Make id NOT NULL
ALTER TABLE workouts ALTER COLUMN id SET NOT NULL;

-- 6. Add index for common queries
CREATE INDEX idx_workouts_user_date ON workouts(user_id, workout_date);

-- 7. Add new columns for v2.0 features
ALTER TABLE workouts ADD COLUMN record_type VARCHAR(20) DEFAULT 'workout' NOT NULL;
ALTER TABLE workouts ADD COLUMN notes TEXT;
ALTER TABLE workouts ADD COLUMN photo_url TEXT;

COMMIT;
```

**Confidence:** HIGH - Standard PostgreSQL ALTER TABLE operations. Supabase CLI migration system is production-ready.

### Admin Audit Logging

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| supa_audit | Latest | PostgreSQL audit extension | Official Supabase extension for tracking table changes. Stores record versions with old/new JSON snapshots. Enables undo/restore for admin actions. Lightweight (one audit table, efficient queries by record_id UUID). |

**Why supa_audit:**
- Official Supabase-supported extension
- Single audit table (`audit.record_version`) for all tracked tables
- Automatic trigger-based tracking (no manual logging code)
- JSON storage for old/new record states (enables restore)
- Indexed by `table_oid` for fast queries
- Stable `record_id` UUID (survives record changes)

**Alternative: Custom audit table**
If supa_audit is overkill, create simple audit table:

```sql
CREATE TABLE admin_audit_log (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'delete_member', 'restore_member', 'grant_admin', etc.
    target_user_id UUID,
    target_table VARCHAR(100),
    target_record_id BIGINT,
    snapshot JSONB, -- Old record state for undo
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX idx_audit_target ON admin_audit_log(target_user_id);
```

**Rationale for custom table:**
- Simpler to understand (no extension needed)
- Explicit admin action logging (not automatic triggers)
- Easier to query for admin UI ("show my recent actions")
- Smaller surface area (only track admin changes, not all data changes)

**Recommendation:** Start with custom audit table. Add supa_audit later if automatic change tracking needed for all tables.

**Custom audit logging in F#:**
```fsharp
// Supabase/Admin.fs
let logAdminAction (adminUserId: string) (action: string) (targetUserId: string option) (snapshot: obj option) = promise {
    let! result = supabase.from("admin_audit_log").insert([|
        {| admin_user_id = adminUserId
           action = action
           target_user_id = targetUserId
           snapshot = snapshot
           created_at = System.DateTime.UtcNow |}
    |])
    return result
}

// Usage: Delete member with audit trail
let deleteMemberWithAudit (adminId: string) (userId: string) = promise {
    // 1. Get current member data for snapshot
    let! memberData = getMemberById userId

    // 2. Delete member
    let! deleteResult = deleteMember userId

    // 3. Log action with snapshot for undo
    do! logAdminAction adminId "delete_member" (Some userId) (Some memberData)

    return deleteResult
}
```

**Installation (if using supa_audit):**
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS supa_audit;

-- Enable auditing for specific table
SELECT audit.enable_tracking('public.profiles'::regclass);
```

**Confidence:** MEDIUM-HIGH - Custom audit table is straightforward. supa_audit is documented but adds complexity. Recommend custom approach for v2.0 scope.

## UI Component Patterns (No New Dependencies)

### Tab Navigation (나/우리)

**Approach:** Pure Tailwind CSS + Feliz state management. No component library needed.

**Pattern:**
```fsharp
type Tab = Personal | Team

let [<ReactComponent>] TabNavigation (activeTab: Tab) (onTabChange: Tab -> unit) =
    Html.div [
        prop.className "flex border-b border-gray-200"
        prop.children [
            Html.button [
                prop.className (if activeTab = Personal then "px-4 py-2 border-b-2 border-blue-500 text-blue-600 font-semibold" else "px-4 py-2 text-gray-600")
                prop.text "나"
                prop.onClick (fun _ -> onTabChange Personal)
            ]
            Html.button [
                prop.className (if activeTab = Team then "px-4 py-2 border-b-2 border-blue-500 text-blue-600 font-semibold" else "px-4 py-2 text-gray-600")
                prop.text "우리"
                prop.onClick (fun _ -> onTabChange Team)
            ]
        ]
    ]
```

**Tailwind CSS patterns from research:**
- [Flowbite Tabs](https://flowbite.com/docs/components/tabs/)
- [Material Tailwind Tabs](https://www.material-tailwind.com/docs/html/tabs)
- [daisyUI Tabs](https://daisyui.com/components/tab/)

**Why no JS library:**
- Tabs are 10 lines of F# + Tailwind classes
- No bundle bloat
- Full type safety with F# discriminated union
- Customizable styling

**Confidence:** HIGH - Standard React state + conditional CSS classes.

### Date Navigation (Prev/Next Day Buttons)

**Approach:** date-fns + Fable.DateFunctions for date arithmetic + Feliz buttons.

**Pattern:**
```fsharp
open Fable.DateFunctions

let [<ReactComponent>] DateNavigator (currentDate: System.DateTime) (onDateChange: System.DateTime -> unit) =
    Html.div [
        prop.className "flex items-center gap-4 justify-between"
        prop.children [
            Html.button [
                prop.className "px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                prop.text "← 전날"
                prop.onClick (fun _ -> onDateChange (currentDate.AddDays(-1.0)))
            ]
            Html.div [
                prop.className "text-lg font-semibold"
                prop.text (currentDate.Format("yyyy년 M월 d일"))
            ]
            Html.button [
                prop.className "px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                prop.text "다음날 →"
                prop.onClick (fun _ -> onDateChange (currentDate.AddDays(1.0)))
            ]
        ]
    ]
```

**Why no date picker library:**
- v2.0 only needs prev/next buttons (not full calendar picker)
- date-fns handles add/subtract operations
- Fable.DateFunctions provides .Format() for Korean dates
- Can add calendar picker in v2.1 if needed (use react-datepicker with bindings)

**Confidence:** HIGH - Simple date arithmetic, no complex picker UI needed for MVP.

### Record Edit/Delete Buttons

**Approach:** Inline buttons with confirmation modal (Tailwind CSS).

**Pattern:**
```fsharp
let [<ReactComponent>] RecordActions (recordId: int64) (onEdit: unit -> unit) (onDelete: unit -> unit) =
    let (showConfirm, setShowConfirm) = React.useState false

    Html.div [
        prop.className "flex gap-2"
        prop.children [
            Html.button [
                prop.className "text-blue-600 hover:underline"
                prop.text "수정"
                prop.onClick (fun _ -> onEdit())
            ]
            Html.button [
                prop.className "text-red-600 hover:underline"
                prop.text "삭제"
                prop.onClick (fun _ -> setShowConfirm true)
            ]

            if showConfirm then
                Html.div [
                    prop.className "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    prop.children [
                        Html.div [
                            prop.className "bg-white p-6 rounded shadow-lg"
                            prop.children [
                                Html.p "정말 삭제하시겠습니까?"
                                Html.div [
                                    prop.className "flex gap-2 mt-4"
                                    prop.children [
                                        Html.button [
                                            prop.className "px-4 py-2 bg-red-600 text-white rounded"
                                            prop.text "삭제"
                                            prop.onClick (fun _ ->
                                                setShowConfirm false
                                                onDelete())
                                        ]
                                        Html.button [
                                            prop.className "px-4 py-2 bg-gray-300 rounded"
                                            prop.text "취소"
                                            prop.onClick (fun _ -> setShowConfirm false)
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
        ]
    ]
```

**Why no modal library:**
- Confirmation modal is 20 lines of Tailwind CSS
- Fixed positioning + backdrop + card styling
- No HeadlessUI or Radix UI needed for this simple case

**Confidence:** HIGH - Standard React component pattern.

## What NOT to Add

| Technology | Why Avoid |
|------------|-----------|
| Moment.js | Deprecated. Use date-fns instead. |
| Day.js | Good alternative to date-fns but Fable.DateFunctions only supports date-fns. Stick with one library. |
| PhotoSwipe | Last updated 2+ years ago (v5.4.4). yet-another-react-lightbox is better maintained. |
| react-image-lightbox | Deprecated. Maintainers recommend react-photoswipe-gallery or alternatives. |
| HeadlessUI / Radix UI | Overkill for simple tabs and modals. Tailwind CSS + Feliz state management is sufficient. |
| React Router | Already using Feliz.Router (4.0.0). No need to add React Router. |
| Formik / React Hook Form | Forms in v2.0 are simple (text input, photo upload). No validation library needed. Use controlled components. |
| Zustand / Redux | Elmish state management via Feliz.UseElmish is sufficient. No external state library needed. |
| React Query | Supabase client handles caching. No need for React Query. |
| pgMemento | More complex than supa_audit. Use supa_audit or custom audit table. |
| Flyway / Liquibase | Over-engineering. Supabase CLI migration system is sufficient. |

## Version Compatibility Matrix (New Additions Only)

| Component | Version | Requires | Compatible With |
|-----------|---------|----------|-----------------|
| date-fns | 4.1.0 | - | Node.js 18+ |
| Fable.DateFunctions | 3.9.0 | Fable 4.x | date-fns 3.x - 4.x |
| yet-another-react-lightbox | 3.29.1 | React 16.8+ | React 19.2.4 (confirmed) |

## Installation Summary

### New npm packages:
```bash
npm install date-fns
npm install yet-another-react-lightbox
```

### New NuGet packages:
```bash
dotnet add src/App.fsproj package Fable.DateFunctions
```

### No other changes to package.json or App.fsproj needed.

## Integration Points with Existing Stack

### 1. Fable.DateFunctions + Existing DateHelpers.fs

**Current state:** DateHelpers.fs has manual date functions using JavaScript interop.

**v2.0 approach:** Keep DateHelpers.fs for domain-specific helpers. Add Fable.DateFunctions for general date operations.

```fsharp
// DateHelpers.fs (keep existing functions)
let formatDateString (year: int) (month: int) (day: int) : string =
    sprintf "%04d-%02d-%02d" year month day

let hasWorkout (date: string) (workouts: WorkoutRecord array) : bool =
    workouts |> Array.exists (fun w -> w.workout_date = date)

// NEW: Add Fable.DateFunctions for navigation
open Fable.DateFunctions

let addDays (date: System.DateTime) (days: int) =
    date.AddDays(float days)

let formatKoreanDate (date: System.DateTime) =
    date.Format("yyyy년 M월 d일")
```

### 2. yet-another-react-lightbox + Existing PhotoGallery.fs

**Current state:** PhotoGallery.fs renders grid of photos with click handlers.

**v2.0 approach:** Wrap existing grid with lightbox functionality.

```fsharp
// PhotoGallery.fs
module Components.PhotoGallery

open Feliz
open Bindings.Lightbox // New F# bindings

let [<ReactComponent>] PhotoGallery (photos: string array) =
    let (lightboxOpen, setLightboxOpen) = React.useState false
    let (currentIndex, setCurrentIndex) = React.useState 0

    Html.div [
        // Existing thumbnail grid
        Html.div [
            prop.className "grid grid-cols-3 gap-2"
            prop.children (
                photos |> Array.mapi (fun idx url ->
                    Html.img [
                        prop.src url
                        prop.className "w-full h-32 object-cover rounded cursor-pointer"
                        prop.onClick (fun _ ->
                            setCurrentIndex idx
                            setLightboxOpen true)
                    ]
                )
            )
        ]

        // New lightbox overlay
        if lightboxOpen then
            lightbox [
                "open" ==> lightboxOpen
                "close" ==> (fun _ -> setLightboxOpen false)
                "index" ==> currentIndex
                "slides" ==> (photos |> Array.map (fun url -> {| src = url |}))
            ]
    ]
```

### 3. Supabase Migration + Existing Workouts Table

**Current schema:**
```sql
CREATE TABLE workouts (
    user_id UUID NOT NULL,
    workout_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (user_id, workout_date) -- REMOVE THIS
);
```

**v2.0 schema (migration applied):**
```sql
CREATE TABLE workouts (
    id BIGSERIAL PRIMARY KEY, -- NEW
    user_id UUID NOT NULL,
    workout_date DATE NOT NULL,
    record_type VARCHAR(20) DEFAULT 'workout' NOT NULL, -- NEW
    notes TEXT, -- NEW
    photo_url TEXT, -- NEW (might replace separate photo_uploads table)
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_workouts_user_date ON workouts(user_id, workout_date); -- NEW
```

**Breaking change impact:**
- F# type `WorkoutRecord` must add `id` field
- API calls that assumed unique (user_id, date) must handle multiple records
- UI must display multiple records per day (list instead of single toggle)

**Migration strategy:**
1. Add id column
2. Populate existing records with sequential IDs
3. Drop PRIMARY KEY constraint
4. Add new PRIMARY KEY on id
5. Add index on (user_id, workout_date) for query performance

### 4. Admin Audit Log + Existing Admin.fs

**Current state:** Admin.fs has deleteMember, addMember functions with no audit trail.

**v2.0 approach:** Wrap admin functions with audit logging.

```fsharp
// Supabase/Admin.fs (updated)
let deleteMember (adminId: string) (userId: string) = promise {
    // 1. Fetch current member data for snapshot
    let! memberSnapshot = getMemberById userId

    // 2. Perform delete (soft delete: set deleted_at)
    let! result = supabase.from("profiles").update([|
        {| deleted_at = System.DateTime.UtcNow |}
    |]).eq("id", userId)

    // 3. Log audit trail
    do! supabase.from("admin_audit_log").insert([|
        {| admin_user_id = adminId
           action = "delete_member"
           target_user_id = userId
           snapshot = memberSnapshot |}
    |])

    return result
}

let undoDeleteMember (adminId: string) (userId: string) = promise {
    // Restore from audit log snapshot
    let! auditRecord = supabase.from("admin_audit_log")
        .select("snapshot")
        .eq("target_user_id", userId)
        .eq("action", "delete_member")
        .order("created_at", {| ascending = false |})
        .limit(1)
        .single()

    let! result = supabase.from("profiles").update([|
        {| deleted_at = None |}
    |]).eq("id", userId)

    do! supabase.from("admin_audit_log").insert([|
        {| admin_user_id = adminId
           action = "restore_member"
           target_user_id = userId |}
    |])

    return result
}
```

## Critical Decisions Summary

1. **Use date-fns 4.1.0 + Fable.DateFunctions 3.9.0** - Standard date library, F# bindings maintained
2. **Use yet-another-react-lightbox 3.29.1** - Better maintained than PhotoSwipe
3. **Use custom admin_audit_log table** - Simpler than supa_audit for v2.0 scope
4. **Use Supabase CLI migrations** - No external migration tools needed
5. **No UI component library** - Tailwind CSS + Feliz is sufficient for tabs/modals
6. **Keep DateHelpers.fs** - Domain-specific helpers stay, add Fable.DateFunctions for general operations
7. **Schema migration: Add id column, drop UNIQUE constraint** - Enables multiple records per day
8. **Soft delete pattern for admin** - Set deleted_at instead of hard delete, enables undo

## Migration Checklist

- [ ] Install date-fns (npm)
- [ ] Install yet-another-react-lightbox (npm)
- [ ] Install Fable.DateFunctions (NuGet)
- [ ] Create F# bindings for yet-another-react-lightbox
- [ ] Create Supabase migration for workouts table schema change
- [ ] Update WorkoutRecord F# type to include id field
- [ ] Create admin_audit_log table migration
- [ ] Update Admin.fs functions to log audit trail
- [ ] Add DateNavigator component using Fable.DateFunctions
- [ ] Add TabNavigation component with Tailwind CSS
- [ ] Wrap PhotoGallery with lightbox functionality

## Sources

### Date Libraries
- [date-fns npm](https://www.npmjs.com/package/date-fns)
- [Fable.DateFunctions GitHub](https://github.com/Zaid-Ajaj/Fable.DateFunctions)
- [Fable.DateFunctions Documentation](https://zaid-ajaj.github.io/Fable.DateFunctions/)
- [Fable.DateFunctions NuGet](https://www.nuget.org/packages/Fable.DateFunctions)

### Image Lightbox
- [yet-another-react-lightbox npm](https://www.npmjs.com/package/yet-another-react-lightbox)
- [yet-another-react-lightbox Documentation](https://yet-another-react-lightbox.com/documentation)
- [yet-another-react-lightbox GitHub](https://github.com/igordanchenko/yet-another-react-lightbox)
- [PhotoSwipe npm](https://www.npmjs.com/package/photoswipe)
- [react-photoswipe-gallery npm](https://www.npmjs.com/package/react-photoswipe-gallery)
- [Comparing React Lightbox Libraries - LogRocket](https://blog.logrocket.com/comparing-the-top-3-react-lightbox-libraries/)

### Supabase Audit Logging
- [Supabase Audit Logs Documentation](https://supabase.com/docs/guides/auth/audit-logs)
- [Postgres Auditing in 150 lines of SQL - Supabase Blog](https://supabase.com/blog/postgres-audit)
- [supa_audit GitHub](https://github.com/supabase/supa_audit)
- [Simple Audit Trail for Supabase - Medium](https://medium.com/@harish.siri/simpe-audit-trail-for-supabase-database-efefcce622ff)

### Database Migrations
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase CLI Migration Reference](https://supabase.com/docs/reference/cli/supabase-migration)
- [Declarative Database Schemas - Supabase](https://supabase.com/docs/guides/local-development/declarative-database-schemas)
- [Supabase SQL Drop Constraint](https://supabase-sql.vercel.app/drop-constraints)

### PostgreSQL Patterns
- [PostgreSQL Audit Trigger - Wiki](https://wiki.postgresql.org/wiki/Audit_trigger)
- [Deleted Record Audit Log with PostgreSQL](https://danschultzer.com/posts/deleted-record-audit-log-with-ecto-postgresql)
- [Soft Deletes with PostgreSQL - Medium](https://medium.com/@priyaranjanpatraa/soft-deletes-you-can-trust-row-level-archiving-with-spring-boot-jpa-postgresql-2c3544255e26)

### Tailwind CSS Components
- [Flowbite Tabs](https://flowbite.com/docs/components/tabs/)
- [Material Tailwind Tabs](https://www.material-tailwind.com/docs/html/tabs)
- [daisyUI Tabs](https://daisyui.com/components/tab/)
- [Tailwind CSS Tabs - Official](https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/tabs)

### Fable Ecosystem
- [Fable React - GitHub](https://github.com/fable-compiler/fable-react)
- [Working with React Components in F# - Compositional IT](https://www.compositional-it.com/news-blog/working-with-react-components-in-fsharp/)
- [Using Third-Party React Components - Fable](https://github.com/fable-compiler/fable-react/blob/main/docs/using-third-party-react-components.md)

---

**Last Updated:** 2026-02-15
**Confidence Level:** HIGH (all versions verified from npm/NuGet, integration patterns validated)
**Next Review:** Before starting v2.0 Phase 1 (schema migration)
