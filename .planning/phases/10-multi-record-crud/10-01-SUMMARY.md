---
phase: 10
plan: 01
subsystem: data-layer
tags: [fable, supabase, api, crud, types]
requires: [09-03]
provides: [RecordEditState, createTextRecord, createPhotoRecord, updateWorkoutById]
affects: [10-02, 10-03, 10-04]
tech-stack:
  added: []
  patterns: [discriminated-union, api-layer]
key-files:
  created: []
  modified: [src/Supabase/Types.fs, src/Supabase/Workouts.fs]
decisions:
  - id: record-edit-state-design
    what: RecordEditState DU with 7 cases
    why: Clear state machine for CRUD modal/editing workflows
    impact: UI components can pattern match on edit states
metrics:
  duration: ~1 minute
  completed: 2026-02-15
---

# Phase 10 Plan 01: Backend API & UI State for Multi-Record CRUD Summary

**One-liner:** Added RecordEditState DU (7 cases) and 3 CRUD API functions (createTextRecord, createPhotoRecord, updateWorkoutById)

## Objective Achieved

Established the data layer foundation for multi-record CRUD operations. Added RecordEditState discriminated union for UI state management and three backend API functions that all subsequent plans depend on.

## Tasks Completed

| Task | Description | Files Modified | Commit |
|------|-------------|----------------|--------|
| 1 | Add RecordEditState DU to Types.fs | src/Supabase/Types.fs, Types.js | a799494 |
| 2 | Add CRUD API functions to Workouts.fs | src/Supabase/Workouts.fs, Workouts.js | 469ffb2 |

## Technical Implementation

### RecordEditState DU (Types.fs)

Added after PhotoUploadState (line 112), follows same pattern:

```fsharp
type RecordEditState =
    | Idle
    | CreatingText                     // Modal open for new text record
    | CreatingPhoto                    // Photo upload for new photo record
    | EditingText of recordId: int * currentText: string
    | Saving
    | Deleting of recordId: int
    | Error of message: string
```

**State machine design:**
- `Idle` → `CreatingText` → `Saving` → `Idle`
- `Idle` → `CreatingPhoto` → `Saving` → `Idle`
- `Idle` → `EditingText` → `Saving` → `Idle`
- `Idle` → `Deleting` → `Idle`
- Any state → `Error` → `Idle`

### CRUD API Functions (Workouts.fs)

Added after `deleteWorkoutById` (line 106):

**1. createTextRecord**
```fsharp
let createTextRecord (userId: string) (date: string) (textContent: string) : JS.Promise<WorkoutResponse>
```
- Creates text record with `record_type = "text"`
- Sets `text_content` field
- Returns WorkoutResponse with created record

**2. createPhotoRecord**
```fsharp
let createPhotoRecord (userId: string) (date: string) (photoUrl: string) (textContent: string option) : JS.Promise<WorkoutResponse>
```
- Creates photo record with `record_type = "photo"`
- Sets `photo_url` field
- Optional `text_content` caption via `yield!` pattern

**3. updateWorkoutById**
```fsharp
let updateWorkoutById (recordId: int) (textContent: string) : JS.Promise<WorkoutResponse>
```
- Updates specific record by `id`
- Sets `text_content` and `updated_at`
- Includes soft delete filter (`?is("deleted_at", null)`)

All functions follow existing patterns:
- Use `supabase?from("workouts")` dynamic interop
- Return `WorkoutResponse` type
- Use `promise { }` computation expression

## Decisions Made

### RecordEditState State Machine

**Decision:** 7-case discriminated union with state transitions for CRUD workflows

**Context:** UI needs to manage modal states (creating text, uploading photo, editing, saving, deleting, errors)

**Rationale:**
- Pattern matching enables compile-time exhaustiveness checks
- EditingText carries recordId + currentText for inline editing
- Deleting carries recordId for optimistic UI updates
- Error carries message for user feedback

**Impact:**
- UI components (Plan 10-03, 10-04) can safely pattern match on states
- Type safety prevents invalid state transitions
- Clear separation between creating vs. editing workflows

### API Function Signatures

**Decision:** Three separate functions instead of one polymorphic function

**Context:** Need to create text records, photo records, and update existing records

**Rationale:**
- Type safety: each function has specific parameters
- Clear intent: function name matches use case
- Composability: photo records can have optional text captions

**Impact:**
- UI components call specific functions based on user action
- No need for type discriminators or optional parameters
- Future extensibility (e.g., video records) via new functions

## Dependencies

**Requires:**
- Phase 09-03: Content Area Switching (UI layout foundation)

**Provides:**
- RecordEditState DU for UI state management
- createTextRecord API for text record creation
- createPhotoRecord API for photo record creation
- updateWorkoutById API for editing records

**Affects:**
- Plan 10-02: List view needs these APIs to display/edit records
- Plan 10-03: Create/edit modal uses RecordEditState and APIs
- Plan 10-04: Delete functionality uses deleteWorkoutById (existing)

## Key Files Modified

**src/Supabase/Types.fs**
- Added RecordEditState DU (7 cases)
- Placed after PhotoUploadState (line 112)
- No changes to existing types

**src/Supabase/Workouts.fs**
- Added createTextRecord (line 108)
- Added createPhotoRecord (line 119)
- Added updateWorkoutById (line 134)
- No changes to existing functions

**Compiled outputs:**
- src/Supabase/Types.js (auto-generated by Fable)
- src/Supabase/Workouts.js (auto-generated by Fable)

## Verification Results

All verification criteria met:

✓ Fable compilation succeeds without errors
✓ RecordEditState DU exists in Types.fs
✓ All 3 functions exist in Workouts.fs (grep count = 3)
✓ Only additions, no modifications to existing code
✓ Git diff shows +217/-51 lines (mostly compiled JS output)

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for Plan 10-02:**
- RecordEditState type available for import
- CRUD APIs ready for list view integration

**Ready for Plan 10-03:**
- RecordEditState type ready for modal state management
- createTextRecord/createPhotoRecord ready for create workflows

**Ready for Plan 10-04:**
- updateWorkoutById ready for edit workflows
- deleteWorkoutById already exists (Phase 09)

**No blockers identified.**

## Notes

- Fable auto-compilation worked smoothly (all files up-to-date after changes)
- Pattern matching on RecordEditState will provide compile-time safety in UI components
- API functions follow established patterns from Phase 09 (soft delete, dynamic interop)
- Duration: ~1 minute (simple additions, no refactoring needed)

---
*Completed 2026-02-15 - Foundation for Phase 10 multi-record CRUD operations*
