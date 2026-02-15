# Phase 10: Multi-Record CRUD - Research

**Researched:** 2026-02-16
**Domain:** React CRUD operations with Fable/F#, Supabase RLS, inline editing patterns
**Confidence:** HIGH

## Summary

Phase 10 implements multi-record CRUD operations for workout records, allowing users to create multiple records per day (workout, text, photo) and edit/delete their own records. The research covers React inline editing patterns, F# discriminated unions for UI state, Supabase RLS update/delete by record ID, and permission-based conditional rendering.

The database schema is already prepared (v2.0 migration complete in Phase 8) with BIGSERIAL id primary key, record_type field, and soft delete support. The backend API functions exist (`deleteWorkoutById` already implemented). The primary challenge is frontend CRUD UI: inline editing forms, optimistic updates, and owner-only edit/delete buttons.

**Primary recommendation:** Build modal-based create/edit forms for text/photo records, use inline editing for simple text content, implement discriminated union for edit state (Idle | Editing | Saving), and conditionally render edit/delete buttons based on `record.user_id === currentUser.id`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Feliz | 2.9.0 | F# React bindings | Official Fable React library, optimized for happiness |
| React | 19.2.4 | UI framework | Already in project, hooks-based state management |
| @supabase/supabase-js | 2.48.1 | Backend API | Already integrated, handles RLS automatically |
| browser-image-compression | 2.0.2 | Client-side image compression | Already used in PhotoUpload.fs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| idb | 8.0.3 | IndexedDB wrapper | Already used for offline queue, extend for multi-record |
| React hooks | Built-in | useState, useEffect | Form state, loading states, edit mode toggling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Modal forms | Inline editing everywhere | Inline editing is complex for multi-field records (text + optional photo) |
| Custom form library | React Hook Form | Adds dependency, overkill for simple text input forms |
| Client-side validation only | Zod/Yup + validation | Database has CHECK constraints already, keep it simple |

**Installation:**
No new dependencies needed. All required libraries already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── Components/
│   ├── WorkoutList.fs         # MODIFY: Add edit/delete for multi-record
│   ├── RecordEditModal.fs     # NEW: Modal for create/edit text/photo records
│   └── RecordItem.fs          # NEW: Individual record display with edit/delete
├── Supabase/
│   ├── Workouts.fs            # MODIFY: Add updateWorkoutById, createTextRecord, createPhotoRecord
│   └── Types.fs               # MODIFY: Add EditState discriminated union
└── Pages/
    └── Dashboard.fs           # MODIFY: Integrate multi-record creation flow
```

### Pattern 1: Discriminated Union for Edit State
**What:** F# discriminated unions provide exhaustive pattern matching for UI states
**When to use:** Managing modal state, edit mode, loading states
**Example:**
```fsharp
// Source: F# official docs + existing codebase pattern (PhotoUploadState)
type RecordEditState =
    | Idle
    | Creating of recordType: string  // "text" | "photo"
    | Editing of recordId: int
    | Saving
    | Error of message: string

// In component:
let (editState, setEditState) = React.useState<RecordEditState>(Idle)

// Pattern match for conditional rendering:
match editState with
| Idle -> Html.none
| Creating recordType -> RecordEditModal recordType onSave onCancel
| Editing recordId -> RecordEditModal recordId onSave onCancel
| Saving -> Html.div [ prop.text "저장 중..." ]
| Error msg -> Html.div [ prop.className "text-red-600"; prop.text msg ]
```

### Pattern 2: Controlled Component for Text Input
**What:** React controlled components bind input value to state, update via onChange
**When to use:** Text input, textarea for record content
**Example:**
```fsharp
// Source: React official docs + Fable patterns
let (textContent, setTextContent) = React.useState("")

Html.textarea [
    prop.value textContent
    prop.onChange setTextContent
    prop.placeholder "운동 메모를 입력하세요"
    prop.className "w-full px-4 py-2 border rounded-lg"
]
```

### Pattern 3: Optimistic UI with Rollback
**What:** Update UI immediately, rollback on error
**When to use:** Delete operations, quick updates
**Example:**
```fsharp
// Source: React useOptimistic pattern + existing offline queue pattern
let handleDelete recordId =
    promise {
        try
            // Optimistic update: remove from local state immediately
            let optimisticRecords = records |> Array.filter (fun r -> r.id <> recordId)
            setRecords optimisticRecords

            // Attempt server delete
            let! result = deleteWorkoutById recordId

            // Server call succeeded - optimistic state is correct
            ()
        with ex ->
            // Server call failed - rollback by re-fetching
            let! freshRecords = getWorkoutsForDate userId date
            setRecords freshRecords
            setError (Some "삭제 실패. 다시 시도해주세요.")
    } |> Promise.start
```

### Pattern 4: Conditional Rendering for Owner-Only Actions
**What:** Show edit/delete buttons only if `record.user_id === currentUser.id`
**When to use:** Every record display component (REC-06 requirement)
**Example:**
```fsharp
// Source: React conditional rendering best practices
Html.div [
    prop.className "flex gap-2"
    prop.children [
        // Only show edit/delete if owner
        if record.user_id = currentUserId then
            Html.button [
                prop.onClick (fun _ -> setEditState (Editing record.id))
                prop.className "text-blue-600 hover:text-blue-800"
                prop.text "✏️"
            ]
            Html.button [
                prop.onClick (fun _ -> handleDelete record.id)
                prop.className "text-red-600 hover:text-red-800"
                prop.text "🗑️"
            ]
    ]
]
```

### Pattern 5: Multi-Record Creation Flow
**What:** "+" button opens modal, user selects record type (workout/text/photo), fills form, saves
**When to use:** REC-01, REC-02, REC-03 requirements
**Example:**
```fsharp
// Button row with record type options
Html.div [
    prop.className "flex gap-2 mb-4"
    prop.children [
        Html.button [
            prop.onClick (fun _ -> handleCreateWorkout())
            prop.text "💪 운동 기록"
        ]
        Html.button [
            prop.onClick (fun _ -> setEditState (Creating "text"))
            prop.text "📝 메모 추가"
        ]
        Html.button [
            prop.onClick (fun _ -> setEditState (Creating "photo"))
            prop.text "📷 사진 추가"
        ]
    ]
]
```

### Anti-Patterns to Avoid
- **Editing .js files directly:** NEVER edit compiled output. Always edit .fs source files.
- **Nested state in useState:** Use multiple useState calls or discriminated union, not nested objects.
- **Ignoring RLS policies:** Trust RLS to enforce permissions, but still conditionally render UI for UX.
- **Global refreshKey pattern for individual records:** Use targeted state updates, not global re-renders.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression | Custom canvas resizing | browser-image-compression | Already integrated, handles EXIF, memory, workers |
| Offline queue | Custom localStorage queue | idb library + existing Queue.fs pattern | Already handles retry, versioning, auto-increment |
| Date formatting | Custom string manipulation | System.DateTime + emitJsExpr for locale | Already used in DateHelpers.fs |
| RLS permission checks | Custom middleware | Supabase RLS policies + conditional UI | Database enforces, UI just reflects |
| Form validation | Complex client validation | Database CHECK constraints + simple client checks | record_type already has CHECK, text_content nullable |

**Key insight:** Phase 8 migration already solved the hard problems (schema, RLS, offline compat). This phase is UI work - don't rebuild backend logic.

## Common Pitfalls

### Pitfall 1: Editing Compiled .js Instead of Source .fs
**What goes wrong:** Changes to .js files get overwritten on next Fable compilation
**Why it happens:** .js files are visible, look editable, developers forget they're compiled output
**How to avoid:** ALWAYS edit .fs source files. Add .js to .gitignore? No - they're committed for deployment.
**Warning signs:** Git diff shows .js changes but no corresponding .fs changes

### Pitfall 2: Not Handling Soft Delete in Queries
**What goes wrong:** Deleted records (deleted_at IS NOT NULL) appear in UI
**Why it happens:** Forgetting `?is("deleted_at", null)` filter in queries
**How to avoid:** All workout queries MUST include soft delete filter (already done in Workouts.fs)
**Warning signs:** Deleted items reappear after page refresh

### Pitfall 3: Using Composite Key Instead of Record ID
**What goes wrong:** Can't identify individual records for edit/delete (old v1.0 schema problem)
**Why it happens:** v1.0 used (user_id, workout_date) as primary key - multiple records per day impossible
**How to avoid:** v2.0 schema uses BIGSERIAL id - ALWAYS use record.id for update/delete operations
**Warning signs:** Update/delete affects ALL records for a date instead of one record

### Pitfall 4: Forgetting Owner-Only Button Conditional
**What goes wrong:** Users see edit/delete buttons on other users' records (REC-06 violation)
**Why it happens:** Copy-pasting UI code without adding permission check
**How to avoid:** Every edit/delete button MUST check `if record.user_id = currentUserId`
**Warning signs:** Edit buttons appear on team members' records in TeamView

### Pitfall 5: Not Syncing Offline Queue with Multi-Record Operations
**What goes wrong:** Offline operations only support simple workout create/delete, not text/photo records
**Why it happens:** Queue.fs enqueue function hardcodes `recordType = "workout"`
**How to avoid:** Extend enqueue to accept recordType, textContent, photoUrl parameters
**Warning signs:** Offline text/photo creation fails, or creates wrong record type

### Pitfall 6: Mobile Camera Input Without capture="environment"
**What goes wrong:** Mobile users get front camera by default (selfie mode)
**Why it happens:** Missing `capture` attribute on file input
**How to avoid:** Already implemented in PhotoUpload.fs line 78: `prop.custom ("capture", "environment")`
**Warning signs:** User reports "wrong camera opens"

### Pitfall 7: Large Image Upload Without Compression
**What goes wrong:** 10MB+ images cause slow uploads, storage bloat, mobile memory crashes
**Why it happens:** Direct file upload without compression step
**How to avoid:** Already solved in PhotoUpload.fs - compress before upload using browser-image-compression
**Warning signs:** Upload progress stalls, mobile browser crashes on photo selection

## Code Examples

Verified patterns from official sources and existing codebase:

### Multi-Record Display with Owner Check
```fsharp
// Source: Existing WorkoutList.fs + React conditional rendering patterns
[<ReactComponent>]
let RecordItem (record: WorkoutRecord) (currentUserId: string) (onEdit: int -> unit) (onDelete: int -> unit) =
    Html.div [
        prop.className "bg-white rounded-lg p-4 shadow-sm flex items-center gap-3"
        prop.children [
            // Left: Icon based on record type
            Html.div [
                prop.className "text-2xl"
                prop.text (
                    match record.record_type with
                    | "workout" -> "💪"
                    | "text" -> "📝"
                    | "photo" -> "📷"
                    | _ -> "❓"
                )
            ]

            // Center: Content
            Html.div [
                prop.className "flex-1"
                prop.children [
                    match record.text_content with
                    | Some text -> Html.p [ prop.text text ]
                    | None -> Html.none

                    match record.photo_url with
                    | Some url -> Html.img [ prop.src url; prop.className "mt-2 rounded" ]
                    | None -> Html.none
                ]
            ]

            // Right: Edit/Delete buttons (owner only - REC-06)
            Html.div [
                prop.className "flex gap-2"
                prop.children [
                    if record.user_id = currentUserId then
                        Html.button [
                            prop.onClick (fun _ -> onEdit record.id)
                            prop.className "text-blue-600 hover:text-blue-800 text-xl"
                            prop.title "수정"
                            prop.text "✏️"
                        ]
                        Html.button [
                            prop.onClick (fun _ -> onDelete record.id)
                            prop.className "text-red-600 hover:text-red-800 text-xl"
                            prop.title "삭제"
                            prop.text "🗑️"
                        ]
                ]
            ]
        ]
    ]
```

### Create Text Record API Call
```fsharp
// Source: Existing Workouts.fs pattern (upsertWorkout) adapted for text records
/// Create a text record for a specific date
let createTextRecord (userId: string) (date: string) (textContent: string) : JS.Promise<WorkoutResponse> =
    promise {
        let record = createObj [
            "user_id" ==> userId
            "workout_date" ==> date
            "record_type" ==> "text"
            "text_content" ==> textContent
        ]
        let query = supabase?from("workouts")?insert(record)?select()
        let! result = query
        return unbox<WorkoutResponse> result
    }
```

### Update Record by ID
```fsharp
// Source: Supabase JS client docs + existing updateWorkout pattern
/// Update a specific workout record by id (for editing text content)
let updateWorkoutById (recordId: int) (updates: obj) : JS.Promise<WorkoutResponse> =
    promise {
        let nowIso : string = emitJsExpr () "new Date().toISOString()"
        let updatesWithTimestamp = createObj [
            yield! (updates :?> obj [])
            "updated_at" ==> nowIso
        ]
        let query =
            supabase
                ?from("workouts")
                ?update(updatesWithTimestamp)
                ?eq("id", recordId)
                ?is("deleted_at", null)  // Only update non-deleted records
                ?select()
        let! result = query
        return unbox<WorkoutResponse> result
    }
```

### Modal Component Pattern
```fsharp
// Source: React modal patterns + Feliz component structure
[<ReactComponent>]
let RecordEditModal (recordId: int option) (recordType: string) (initialText: string) (onSave: string -> unit) (onCancel: unit -> unit) =
    let (textContent, setTextContent) = React.useState(initialText)
    let (saving, setSaving) = React.useState(false)

    let handleSave () =
        setSaving true
        promise {
            try
                onSave textContent
                setSaving false
            with ex ->
                setSaving false
        } |> Promise.start

    Html.div [
        // Modal overlay
        prop.className "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        prop.onClick (fun _ -> if not saving then onCancel())
        prop.children [
            // Modal content
            Html.div [
                prop.className "bg-white rounded-lg p-6 max-w-md w-full mx-4"
                prop.onClick (fun e -> e.stopPropagation())  // Prevent overlay click
                prop.children [
                    Html.h3 [
                        prop.className "text-lg font-semibold mb-4"
                        prop.text (if recordId.IsSome then "메모 수정" else "메모 추가")
                    ]

                    Html.textarea [
                        prop.value textContent
                        prop.onChange setTextContent
                        prop.placeholder "운동 메모를 입력하세요"
                        prop.className "w-full px-4 py-2 border rounded-lg mb-4 min-h-[100px]"
                        prop.autoFocus true
                    ]

                    Html.div [
                        prop.className "flex gap-2 justify-end"
                        prop.children [
                            Html.button [
                                prop.onClick (fun _ -> onCancel())
                                prop.disabled saving
                                prop.className "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                prop.text "취소"
                            ]
                            Html.button [
                                prop.onClick (fun _ -> handleSave())
                                prop.disabled (saving || textContent.Trim() = "")
                                prop.className "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                prop.text (if saving then "저장 중..." else "저장")
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
```

### Fetch All Records for Date
```fsharp
// Source: Existing getWorkoutsForDate in Workouts.fs (line 37)
// Already implemented - use as-is for multi-record display
let records = getWorkoutsForDate userId date
// Returns WorkoutRecord array, ordered by created_at ascending
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single record per day | Multiple records per day | Phase 8 (v2.0 schema) | Enables REC-01, REC-02, REC-03 |
| Composite PK (user_id, date) | BIGSERIAL id PK | Phase 8 migration | Individual record edit/delete possible |
| Hard delete (DELETE FROM) | Soft delete (UPDATE deleted_at) | Phase 8 | Enables undo, admin recovery (ADM-08) |
| upsertWorkout with onConflict | Simple insert, no conflict | Phase 8 | Multi-record support, simpler API |
| Fable.React | Feliz | Project start | Better DX, type-safe React bindings |
| React 18 | React 19 | Package upgrade | useOptimistic hook available (if needed) |

**Deprecated/outdated:**
- **onConflict in insert:** Removed in Phase 8 - use simple insert for multi-record. Old code: `?onConflict("user_id,workout_date")` - NO LONGER VALID.
- **WorkoutToggle pattern for everything:** Keep for simple workout icon, but use modal forms for text/photo records.
- **refreshKey prop drilling:** Use targeted state updates, not global re-renders.

## Open Questions

Things that couldn't be fully resolved:

1. **Should photo records also support text captions?**
   - What we know: DB schema has both text_content and photo_url columns (can coexist)
   - What's unclear: UI design decision - single record with both, or separate records?
   - Recommendation: Allow both in same record for Phase 10. User adds photo -> optional text caption field appears.

2. **How to handle offline queue for text/photo records?**
   - What we know: Current Queue.fs only supports CreateWorkout/DeleteWorkout, hardcodes recordType="workout"
   - What's unclear: Should Phase 10 extend offline support or defer to online-only?
   - Recommendation: Defer offline text/photo to future phase. Disable text/photo buttons when offline (check `isOnline()` before opening modal). Document in task notes.

3. **Photo record creation flow: separate from PhotoUpload.fs or integrate?**
   - What we know: PhotoUpload.fs auto-creates workout record (line 48). New flow should create photo record.
   - What's unclear: Modify existing PhotoUpload or create new PhotoRecordUpload component?
   - Recommendation: Modify existing PhotoUpload.fs to accept optional `recordType` param. Default "workout" (backward compat), pass "photo" for explicit photo records.

4. **Month count update (REC-07): count all records or just workout type?**
   - What we know: Requirement says "운동 아이콘 클릭 시 이번 달 운동 횟수가 증가/감소한다"
   - What's unclear: Does "운동 횟수" mean record count or workout-type count?
   - Recommendation: Count ALL non-deleted records for the month (workout + text + photo). User activity = any record type. Update MonthlyStats.fs to use `getWorkouts` with date range, count array length.

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns: `/Users/ohama/vibe-coding/rollbook/src/Supabase/Workouts.fs` - getWorkoutsForDate, deleteWorkoutById, soft delete pattern
- Existing codebase patterns: `/Users/ohama/vibe-coding/rollbook/src/Components/PhotoUpload.fs` - discriminated union state (PhotoUploadState), modal pattern
- Existing codebase patterns: `/Users/ohama/vibe-coding/rollbook/src/offline/Queue.fs` - IndexedDB queue, retry pattern
- Database schema: `/Users/ohama/vibe-coding/rollbook/supabase/migrations/20260216000000_multiple_records_per_day.sql` - v2.0 schema with BIGSERIAL id, record_type CHECK, soft delete
- [Supabase Row Level Security Complete Guide](https://designrevision.com/blog/supabase-row-level-security) - RLS policy patterns for update/delete by ID
- [React textarea controlled component](https://react.dev/reference/react-dom/components/textarea) - Official React docs for controlled textarea

### Secondary (MEDIUM confidence)
- [F# Discriminated Unions for State Management](https://peerdh.com/blogs/programming-insights/using-f-discriminated-unions-for-state-management-in-functional-programming) - Pattern matching for UI state
- [React Optimistic UI with useOptimistic Hook](https://medium.com/@vdsnini/implementing-optimistic-ui-updates-with-the-useoptimistic-hook-in-react-51173b86c202) - Rollback error handling
- [How to Build Inline Edit Component in React](https://www.emgoto.com/react-inline-edit/) - Edit mode toggling patterns
- [Supabase Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) - Image optimization
- [Client-side Image Compression with Supabase](https://mikeesto.com/posts/supabaseimagecompression/) - browser-image-compression usage
- [Managing User Permissions in React](https://medium.com/dailyjs/managing-user-permissions-in-your-react-app-a93a94ff9b40) - Conditional rendering for owner-only actions
- [HTML5 Mobile Camera Access](https://www.freecodecamp.org/news/how-to-use-input-element-to-access-camera-on-mobile/) - capture attribute best practices

### Tertiary (LOW confidence)
- [Feliz GitHub Repository](https://github.com/fable-hub/Feliz) - Component examples (not specific to CRUD)
- [React-admin CRUD Pages](https://marmelab.com/react-admin/CRUD.html) - General CRUD patterns (not F#/Fable specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already integrated, no new libraries needed
- Architecture: HIGH - Existing patterns (discriminated unions, modal, controlled components) proven in codebase
- Pitfalls: HIGH - Based on actual v1.0 → v2.0 migration learnings, MEMORY.md project notes
- Code examples: HIGH - Adapted from existing working code (Workouts.fs, PhotoUpload.fs)

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days - stable patterns, mature tech stack)
