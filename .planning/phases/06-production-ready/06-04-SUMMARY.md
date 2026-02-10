---
phase: 06-production-ready
plan: 04
subsystem: admin
status: complete
tags: [admin, rbac, member-management, ui]

# Dependency Graph
requires:
  - 06-02: Admin RBAC (RLS policies, is_admin function)
  - 01-02: Supabase Client (auth, database)
  - 01-03: Supabase bindings pattern (promise-based JS interop)
provides:
  - Admin.fs: Admin API bindings (isAdmin, getAllProfiles, deleteProfile)
  - admin/MemberList.fs: Member list UI component
  - admin/MemberActions.fs: Delete confirmation modal
  - Pages/AdminPage.fs: Admin page with role-based access control
affects:
  - Future: Can extend with admin dashboard (stats, role management)
  - Future: Can add more admin actions (edit profile, change roles)

# Tech Stack
tech-stack:
  added: []
  patterns:
    - "DeleteTarget record for modal state management"
    - "refreshKey pattern for component re-fetch after mutations"
    - "Role-based UI rendering with AdminState DU"
    - "Promise-based async with Promise.start"

# File Tracking
key-files:
  created:
    - src/Supabase/Admin.fs: Admin API bindings
    - src/admin/MemberList.fs: Member list component
    - src/admin/MemberActions.fs: Delete confirmation modal
    - src/Pages/AdminPage.fs: Admin page with access control
  modified:
    - src/App.fsproj: Added Admin.fs, admin modules, AdminPage.fs

# Decisions
decisions:
  - id: ADMN-04-01
    choice: "DeleteTarget record with userId and displayName"
    rationale: "MemberList passes userId, but modal needs display name for confirmation message"
    alternatives: "Could have passed full ProfileRecord or looked up name in modal"

  - id: ADMN-04-02
    choice: "Promise.start for fire-and-forget async operations"
    rationale: "Consistent with existing codebase pattern (Dashboard, ProgressView)"
    alternatives: "Could use Async.StartImmediate but Promise is idiomatic for JS interop"

  - id: ADMN-04-03
    choice: "Korean UI text throughout (접근 권한이 없습니다, 회원 목록, 삭제)"
    rationale: "Matches app's Korean-first UX design"
    alternatives: "Could provide i18n but out of scope for MVP"

# Metrics
duration: 4min
completed: 2026-02-10
---

# Phase 6 Plan 4: Admin UI Summary

**One-liner:** Admin UI for viewing members and deleting users with role-based access control and Korean text

## What Was Built

Implemented complete admin UI with member management features:

1. **Admin API bindings (Admin.fs):**
   - `isAdmin()`: Checks if current user has admin role via user_roles table
   - `getAllProfiles()`: Returns all profiles (RLS enforced server-side)
   - `deleteProfile(userId)`: Deletes profile (CASCADE to auth.users)
   - `getAdminCount()`: For future dashboard stats

2. **Member list component (admin/MemberList.fs):**
   - MemberListItem: Individual member card with delete button
   - MemberList: Container showing member count and list
   - Responsive layout with Tailwind (flex, shadow, rounded)
   - Korean text: "회원 목록 (N명)", "등록된 회원이 없습니다", "삭제"

3. **Delete confirmation modal (admin/MemberActions.fs):**
   - DeleteConfirmModal: Full-screen overlay with confirmation dialog
   - Shows member name in warning message
   - "취소" and "삭제" buttons with proper styling
   - Korean text: "회원 삭제", "이 작업은 되돌릴 수 없습니다"

4. **Admin page with access control (Pages/AdminPage.fs):**
   - AdminState DU: Loading | NotAdmin | Ready | Error
   - Checks admin status on mount via isAdmin()
   - Shows "접근 권한이 없습니다" for non-admin users
   - Loads and displays member list for admin users
   - Delete workflow: click → modal → confirm → delete → refresh
   - refreshKey pattern for automatic profile reload after deletion

## Architecture

### Component Hierarchy
```
AdminPage
├── Loading state → "로딩 중..."
├── NotAdmin state → "접근 권한이 없습니다"
├── Error state → Error message
└── Ready state
    ├── MemberList
    │   └── MemberListItem (for each profile)
    │       └── Delete button
    └── DeleteConfirmModal (conditional)
        ├── "취소" button
        └── "삭제" button
```

### Data Flow
```
AdminPage mount
  ↓
isAdmin() check
  ↓
├─ false → NotAdmin state
└─ true → getAllProfiles()
     ↓
     Ready state + render MemberList

Delete flow:
  Click "삭제" → handleDelete(userId)
    ↓
  Find profile → create DeleteTarget
    ↓
  Show DeleteConfirmModal
    ↓
  Click "삭제" → handleConfirmDelete()
    ↓
  deleteProfile(userId)
    ↓
  Success → setRefreshKey + 1
    ↓
  useEffect triggers → reload profiles
```

### State Management Pattern

**DeleteTarget record:**
```fsharp
type DeleteTarget = {
    userId: string
    displayName: string
}
```

This bridges the gap between:
- `MemberList` callback signature: `string -> unit` (receives userId)
- `DeleteConfirmModal` needs: display name for confirmation message

**refreshKey pattern:**
```fsharp
let refreshKey, setRefreshKey = React.useState(0)

React.useEffect((fun () ->
    // Load profiles
), [| box refreshKey |])

// After delete success:
setRefreshKey (refreshKey + 1)  // Triggers re-fetch
```

## Key Implementation Details

**Admin API bindings use Result types:**
```fsharp
let getAllProfiles () : JS.Promise<Result<ProfileRecord array, string>> =
    promise {
        try
            let! response = supabase?from("profiles")?select("...")
            let error = response?error
            match box error with
            | null -> return Result.Ok (unbox<ProfileRecord array> response?data)
            | _ -> return Result.Error (error?message |> unbox<string>)
        with exn ->
            return Result.Error exn.Message
    }
```

**Access control with AdminState DU:**
```fsharp
type AdminState =
    | Loading       // Initial check
    | NotAdmin      // isAdmin() returned false
    | Ready of profiles: ProfileRecord array
    | Error of message: string

// Rendering:
match state with
| Loading -> "로딩 중..."
| NotAdmin -> "접근 권한이 없습니다"
| Ready profiles -> MemberList profiles handleDelete
| Error msg -> Error display
```

**Promise-based async (not Async.StartImmediate):**
```fsharp
React.useEffect((fun () ->
    promise {
        let! isAdminResult = isAdmin ()
        if not isAdminResult then setState NotAdmin
        else
            let! profilesResult = getAllProfiles ()
            match profilesResult with
            | Result.Ok profiles -> setState (Ready profiles)
            | Result.Error msg -> setState (Error msg)
    } |> Promise.start
), [| box refreshKey |])
```

## Testing Notes

**Manual verification checklist:**

1. **Non-admin user:**
   - Visit /admin (need to add route)
   - Should see "접근 권한이 없습니다" (access denied)
   - No member list shown

2. **Admin user:**
   - Visit /admin
   - Should see "회원 목록 (N명)" with all members
   - Each member shows display name (or email fallback)

3. **Delete workflow:**
   - Click "삭제" on a member
   - Modal appears with name: "'user@example.com' 회원을 삭제하시겠습니까?"
   - Click "취소" → modal disappears, no deletion
   - Click "삭제" again → click "삭제" in modal
   - Member disappears from list
   - User count decreases by 1

4. **RLS enforcement:**
   - Non-admin attempting deleteProfile() via console should fail
   - Non-admin attempting getAllProfiles() should fail

**Database cascade verification:**
```sql
-- After deleting a profile via AdminPage:
SELECT * FROM profiles WHERE id = '[deleted-user-id]';  -- Empty
SELECT * FROM auth.users WHERE id = '[deleted-user-id]';  -- Empty (CASCADE)
SELECT * FROM user_roles WHERE user_id = '[deleted-user-id]';  -- Empty (CASCADE)
```

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**Requires (from Phase 6 Plan 2):**
- `user_roles` table with composite PK (user_id, role)
- `is_admin()` SECURITY DEFINER function for RLS
- RLS policies on profiles (admin can DELETE)

**To integrate into app:**
1. Add route in Main.fs or Dashboard.fs for /admin → AdminPage
2. Add navigation link (probably admin-only, check isAdmin before showing)
3. Consider adding to TabMode enum if admin features expand

**Future enhancements:**
- Admin dashboard with stats (getAdminCount already implemented)
- Edit member profiles (display name, email)
- Role management UI (promote/demote admins)
- Audit log of admin actions (who deleted whom, when)

## Lessons Learned

**1. Promise vs Async.StartImmediate:**
- Fable code uses `promise { }` computation expression + `Promise.start`
- No need to import `Fable.Promise` - Promise is in Fable.Core
- Consistent with existing codebase (Dashboard, ProgressView, TeamView)

**2. Component callback signatures matter:**
- MemberList needs `onDelete: string -> unit` (passes userId only)
- AdminPage needs display name for confirmation modal
- Solution: DeleteTarget record bridges the gap
- Alternative: Could pass full ProfileRecord but more coupling

**3. Korean UI text throughout:**
- "관리자", "접근 권한이 없습니다", "회원 목록", "삭제", "취소"
- "이 작업은 되돌릴 수 없습니다" for delete warning
- Matches app's Korean-first UX design from Phase 1

**4. refreshKey pattern for re-fetch:**
- Simple integer state that increments after mutation
- useEffect dependency triggers automatic reload
- Cleaner than manual refetch functions or complex state updates

## Files Modified

### Created:
- `src/Supabase/Admin.fs` (96 lines): Admin API bindings
- `src/admin/MemberList.fs` (56 lines): Member list component
- `src/admin/MemberActions.fs` (42 lines): Delete confirmation modal
- `src/Pages/AdminPage.fs` (133 lines): Admin page with access control

### Modified:
- `src/App.fsproj`: Added Admin.fs, admin modules, AdminPage.fs in correct order

### Generated JavaScript:
- `src/Supabase/Admin.js`
- `src/admin/MemberList.js`
- `src/admin/MemberActions.js`
- `src/Pages/AdminPage.js`

## Commits

| Hash    | Type | Message |
|---------|------|---------|
| 538fbe7 | feat | Add Admin API bindings (isAdmin, getAllProfiles, deleteProfile) |
| 6a2164d | feat | Add admin UI components (MemberList, DeleteConfirmModal) |
| 92c2f31 | feat | Add AdminPage with role-based access control |

## Next Phase Readiness

**Phase 6 Plan 4 (Admin UI) complete.**

**Next steps:**
1. Add admin route to Dashboard or Main.fs
2. Add navigation link (admin-only visibility)
3. Test with admin and non-admin users
4. Continue Phase 6: 06-03 (Offline Queue), 06-05 (Error Boundaries), etc.

**Blockers:** None

**Dependencies ready for:**
- Future admin features (dashboard, role management, audit log)
- Admin-only settings or configuration pages
