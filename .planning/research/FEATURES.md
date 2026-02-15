# Feature Landscape: v2.0 UI Refactoring & Multi-Record Model

**Domain:** Small team workout tracking — UI refactoring for multiple records per day
**Researched:** 2026-02-15
**Milestone:** v2.0 UI Refactoring
**Context:** Transitioning from "one toggle per day" to "multiple records per day" with enhanced UI

## Executive Summary

This research covers the feature landscape for v2.0's major changes:
1. **Multiple workout records per day** (fundamental model change)
2. **Text notes/memos** attached to workout records
3. **Photo records** with thumbnail gallery
4. **Record edit and delete** (own records only)
5. **Calendar with record counts** per day
6. **Date-based detail view** (drill down from calendar)
7. **Admin audit log** (action tracking, undo/restore)
8. **Multiple admin role management**

**Key constraint:** Moving from UNIQUE(userId, date) to allowing multiple records per day is a fundamental database and UX shift.

## Table Stakes

Features users expect when multiple records per day are supported. Missing = product feels broken.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Add multiple records per day** | Once you remove the UNIQUE constraint, users expect to log morning run + evening weights. This is the core promise of the model change. | Medium | Remove UNIQUE(userId, date), add timestamp | DB migration is straightforward, UX needs "Add another" flow |
| **View all records for a day** | If multiple records exist, users need to see all of them. Calendar showing "3 workouts" but not letting you see them = broken UX. | Low | Day detail view component | Drill-down from calendar date is standard pattern |
| **Edit own records** | Basic CRUD expectation. Users will make mistakes (typos, wrong date). No edit = frustration. | Low | Record ownership check, edit form | Must check userId matches record owner |
| **Delete own records** | Companion to edit. Users expect to remove accidental duplicates or test entries. | Low | Record ownership check, soft delete | Soft delete recommended for audit trail |
| **Distinguish records visually** | When 3+ records exist per day, users need to tell them apart (time, type, notes preview). | Low | Display logic | Show timestamp or sequence number |
| **Text notes/memos** | Users want context: "Left knee pain" or "Personal best!". Fitness apps without notes feel incomplete in 2026. | Low | Add notes field to workout table | Optional field, not required |
| **Date navigation** | Calendar drill-down is table stakes. Users expect to navigate to specific dates, not just scroll infinitely. | Low | Date picker or prev/next controls | Mobile: swipe left/right is common |
| **Record count badge on calendar** | Visual feedback for "how many workouts on this day". Without it, calendar looks the same whether you did 1 or 5 workouts. | Low | COUNT query grouped by date | Show number indicator (badge, dot size, color intensity) |
| **Photo thumbnail gallery** | If photo upload exists, users expect to see all photos for a day/record, not just one. Thumbnail grid is standard. | Medium | Storage query, thumbnail rendering | Click to enlarge is expected behavior |
| **Admin can delete any record** | Admin cleanup duty. When user leaves team or creates spam, admin needs override. | Low | isAdmin check, delete endpoint | Requires audit log to prevent abuse |
| **Timestamp on records** | Multiple records per day means "when" matters. Show created time, not just date. | Low | Use timestamp instead of DATE | Display format: "Today 2:30pm" |

## Differentiators

Features that set the product apart for multiple-record workflow. Not expected, but provide competitive advantage.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Audit log with undo** | Rare in fitness apps. Admin accidentally deletes user's 3-month history? Restore with one click. Builds trust. | High | Audit table, soft deletes, restore logic | Differentiator: most apps lose data permanently on delete |
| **Photo + text in same record** | Many apps separate photos from workouts. Rollbook ties photo to specific workout session with notes. Contextual. | Medium | Existing photo upload + notes field | Leverage existing photo infrastructure |
| **Privacy-first multi-record** | Team sees "5 workouts this month" not "3 this morning, 2 yesterday evening". Aggregates hide timing patterns. | Low | Existing privacy model extends | Maintains v1.0's privacy-first DNA |
| **Record sequence optimization** | Smart ordering: chronological within day, but newest first on detail view. Reduces scroll to "what I just added". | Low | ORDER BY timestamp DESC | Minor UX polish with big perceived value |
| **Fast delete (no confirmation clutter)** | Swipe-to-delete or icon-tap with undo toast. Faster than "Are you sure?" dialogs. Trust + speed. | Medium | Undo buffer (5-10 sec), toast UI | Requires audit log for safety net |
| **Empty state guidance** | "No workouts yet. Tap + to add your first!" vs blank screen. Reduces confusion on new feature. | Low | Conditional rendering | Small touch, big onboarding impact |
| **Multiple admin roles** | Most small team apps: single owner. Rollbook: designate multiple admins. Reduces bus factor. | Low | isAdmin boolean in users table | Team flexibility without enterprise complexity |
| **Admin action visibility** | Audit log shows WHO deleted/restored WHAT. Transparency prevents "what happened?" confusion in teams. | Medium | Audit log with actor tracking | Builds trust in multi-admin setup |
| **Minimal tap count for add** | "+" FAB → quick add form → save. 3 taps total. Beats competitors requiring 5-7 taps. | Low | Smart defaults, inline editing | Maintains v1.0's "minimal friction" core value |

## Anti-Features

Features to deliberately NOT build. Common mistakes when adding multi-record support.

| Anti-Feature | Why Avoid | What to Do Instead | Evidence |
|--------------|-----------|-------------------|----------|
| **Workout templates/routines** | Multi-record support tempts adding "save as template" but that's scope creep. High complexity, low value for casual loggers. | Let users duplicate yesterday's workout if requested later. Keep it simple. | Power users (<10%) request templates. Don't over-engineer for minority. |
| **Detailed workout structure (sets/reps)** | Multi-record could mean "log each set separately" but that kills the "minimal friction" value prop. Too granular. | Keep records at session level. Notes field handles details if needed ("3x10 squats"). | Users want to log "I worked out", not build a spreadsheet mid-gym. |
| **Record categories/tags** | Tempting to add "cardio vs strength" tags but creates decision fatigue. Every add now requires 2 inputs. | Let notes handle context. If users write "cardio" in notes, that's their taxonomy. | Each input field reduces completion rate by ~15%. Tags kill speed. |
| **Rich text editor for notes** | Bold/italic/lists in notes is over-engineering. Adds complexity for marginal value. | Plain text only. Users can use Markdown informally if they want. | Rich text editors are heavy (40+ KB). Notes are short ("knee pain"), not essays. |
| **Photo editing/filters** | Multi-record with photos tempts adding crop/rotate/filter. Different product. | Let users edit in their camera app before upload. | Instagram-lite is massive scope. Focus on logging, not editing. |
| **Bulk operations** | "Select multiple records and delete" sounds useful but adds UI complexity. Most users never need it. | Let admin delete per-user if cleanup needed. Individual delete is sufficient. | Bulk UI = checkboxes, selection state, toolbar. Clutters mobile UI. |
| **Record versioning** | Tracking edit history sounds robust but is overkill. Audit log already tracks deletes. | Single edit overwrites. Audit log captures who/when deleted if needed. | Versioning adds 3x storage and UI complexity. Users rarely review history. |
| **Detailed permissions** | Multiple admins tempts "Admin can delete, Moderator can edit only" but that's enterprise complexity. | Binary: admin (full access) or member. Keep it simple at <20 people scale. | Role hierarchy is hard to explain. Binary is intuitive. |
| **Real-time collaboration indicators** | "User X is viewing this record" feels cool but is pure scope creep for async logging app. | None. Workout logging is not collaborative editing. | Real-time infra (websockets) is complex. No value for async use case. |
| **Export individual records** | V1.0 has full data export. Per-record export (PDF, image) is feature bloat. | Keep v1.0's "export all data" JSON/CSV. Individual export not requested. | Adds 10+ export format options. No user demand. |
| **Inline photo upload** | "Upload photo from within add workout form" sounds smooth but adds complexity. | Keep photo upload separate (existing flow). Photo auto-creates record. | Existing photo flow works. Inline upload = form complexity + slower saves. |

## Edge Cases & Multi-Record Model Considerations

### Duplicate Prevention

**Problem:** User taps "Add workout" 3 times by accident → 3 identical blank records.

**Approach:**
- **DON'T:** Add duplicate detection logic (complex, many false positives)
- **DO:** Make delete fast and obvious. Undo buffer catches accidental deletes.
- **Evidence:** Apple Health lets duplicates exist, relies on user cleanup. Fast delete > complex prevention.

### Ordering & Display

**Problem:** 5 workouts on one day. What order do you show them?

**Approach:**
- **Calendar view:** Just show count (e.g., "5"). Don't try to preview all.
- **Detail view:** Newest first (reverse chronological). Users care about recent.
- **Evidence:** FitNotes, Hevy use reverse chrono. Users scroll down to see history.

### Empty Days

**Problem:** User expects to see "today" even if no workouts logged yet.

**Approach:**
- **Show date always:** Even if 0 records. Display "No workouts yet. Tap + to add."
- **Don't auto-create:** Don't make blank records just to show something.
- **Evidence:** Calendar apps show empty dates. Blank ≠ broken.

### Photo-Only vs Text-Only Records

**Problem:** Do photos require notes? Do notes require photos?

**Approach:**
- **Both optional:** Record can have photo, text, both, or neither (timestamp-only).
- **Flexible model:** `workouts(id, userId, timestamp, notes?, photoUrl?)`
- **Evidence:** Strong app allows "notes-only" workouts. Flexibility > rigid structure.

### Multiple Admins Deleting Same Record

**Problem:** Admin A and Admin B both try to delete record X.

**Approach:**
- **Idempotent deletes:** Second delete is no-op, not error.
- **Audit log shows both:** "Admin A deleted X at 2:00pm. Admin B attempted delete (already deleted) at 2:01pm."
- **Evidence:** SaaS audit logs track all actions, even no-ops.

### Calendar Month Boundary

**Problem:** User navigates to "February 2026" but has workouts on Feb 29 (leap day) and March 1.

**Approach:**
- **Strict month bounds:** Feb view shows Feb 1-29 only. March 1 appears in March view.
- **Swipe navigation:** Easy to go prev/next month.
- **Evidence:** All calendar apps use strict month bounds. Users understand model.

### Count Badge Overload

**Problem:** 10+ workouts on one day. How do you show "10" in a small calendar cell?

**Approach:**
- **Show actual number:** "10" fits. If >99, show "99+".
- **Alternative:** Color intensity (more workouts = darker). But number is clearer.
- **Evidence:** Google Calendar shows "10", "15", etc. Numbers work.

### Audit Log Retention

**Problem:** Audit log grows forever. 1000 deletes = 1000 rows.

**Approach:**
- **Keep forever (at this scale):** 20 users * 10 actions/month = 200 rows/month. Tiny.
- **No auto-deletion:** Audit log is immutable. Storage is cheap.
- **Evidence:** EnterpriseReady pattern: audit logs never expire. Compliance requirement.

### Undo Window

**Problem:** User deletes record, then navigates away. Undo gone?

**Approach:**
- **Option 1:** Undo toast (5-10 seconds), then gone. Fast delete benefit lost if you navigate.
- **Option 2:** Soft delete for 24 hours, then hard delete. Audit log shows "deleted" but data recoverable.
- **Recommendation:** Option 2 for v2.0. Admin can restore via audit log anytime.
- **Evidence:** Gmail's "undo send" is 5-30 seconds. Slack's delete is recoverable by admin.

## Feature Dependencies

### Core Dependency Chain

```
Multi-Record Model (DB change)
  ↓
Remove UNIQUE(userId, date)
  ↓
Add timestamp (precision: second)
  ↓
  ├→ View all records per day (list component)
  ├→ Edit own records (auth check + form)
  ├→ Delete own records (auth check + soft delete)
  └→ Admin delete any record (isAdmin check)

Calendar with Count
  ↓
GROUP BY date, COUNT(*)
  ↓
Badge UI (display count per cell)
  ↓
Drill-down to Day Detail (click handler)
  ↓
Show all records for selected date

Text Notes
  ↓
Add notes column (TEXT, nullable)
  ↓
Display in record list (preview)
  ↓
Edit form includes notes field

Photo Records
  ↓
Existing photo upload (v1.0)
  ↓
Link photoUrl to record (already exists)
  ↓
Thumbnail gallery (multiple photos per day)
  ↓
Click to enlarge (modal or new view)

Admin Audit Log
  ↓
Audit table (actor, action, target, timestamp, metadata)
  ↓
Log all delete/restore actions
  ↓
Admin view: audit log list
  ↓
Restore action (undelete from audit metadata)

Multiple Admins
  ↓
Add isAdmin boolean to users table
  ↓
Admin UI: designate other admins
  ↓
Check isAdmin before admin-only actions
```

### Independent Features (No Hard Dependencies)

- **Date navigation:** Just UI (prev/next buttons, date picker)
- **Record count badge:** Just aggregation query
- **Empty state guidance:** Just conditional rendering
- **Timestamp display:** Format existing timestamp field

## UX Patterns from Research

### Calendar Drill-Down (Industry Standard)

**Pattern:** Month view → tap date → day detail → list of records

**Examples:**
- **FitNotes:** Tap calendar date → shows full workout list for that day. Tap exercise → exercise details.
- **Hevy:** Calendar with blue dots → tap date → workout detail modal.
- **Workout Calendar app:** Month grid → tap date → list of workouts with title, weight, reps.

**Implementation for Rollbook:**
1. Calendar shows dates with badge counts ("3" on Feb 15)
2. Tap Feb 15 → navigate to day detail view
3. Day detail shows "Friday, Feb 15, 2026" header + list of all records
4. Each record shows: timestamp, notes preview (first 50 chars), photo thumbnail (if exists)
5. Tap record → expand to show full notes, full photo, edit/delete buttons

### Multiple Records Per Day (Edge Case Handling)

**Pattern:** Duplicate prevention is NOT done via complex detection. Fast delete handles user mistakes.

**Examples:**
- **Apple Health:** Allows duplicate workouts from multiple apps. User manually deletes extras.
- **Strong app:** No duplicate prevention. Relies on user to clean up if they tap "save" twice.
- **Athlytic:** Provides "merge duplicates" tool but doesn't prevent them.

**Implementation for Rollbook:**
- No duplicate prevention logic
- Fast delete: swipe-to-delete or trash icon (no confirmation dialog)
- Undo via audit log (admin can restore)
- Trust users to manage their data

### Workout Notes (Plain Text, Optional)

**Pattern:** Notes are optional text field. No rich text. Usually under 100 characters.

**Examples:**
- **Strong:** "Add notes and progress pictures to your workouts."
- **FitNotes 2:** "Add notes to workouts, sets, templates and body measurements."
- **Fitlist:** "Easily add additional comments, instructions and notes to any of your exercises."

**Common note content:**
- "Left knee pain affected squat"
- "Personal best!"
- "Felt tired, skipped last set"
- "3x10 squats, 2x8 deadlifts"

**Implementation for Rollbook:**
- Plain text input (textarea)
- Placeholder: "Add notes (optional)"
- Display preview in list (first 50 chars + "...")
- Click to expand full notes
- No character limit (Supabase TEXT column)

### Photo Thumbnail Gallery

**Pattern:** Grid of thumbnails. Click to enlarge. Simple, no editing.

**Examples:**
- **FitSW:** "Take and store fitness progress pictures... compare two individual photos side by side."
- **Fitness Camera:** "Create albums for different body parts... take periodic photos to track changes."
- **Gain Checker:** "Powerfully managed photo gallery... compare gain or losses of muscles or fat."

**Implementation for Rollbook:**
- Day detail view: show all photos for that day as thumbnail grid (2-3 columns on mobile)
- Thumbnail: max 150px square, maintain aspect ratio
- Click thumbnail → modal with full-size image
- Existing v1.0 photo upload flow creates new record with photo
- Edit record: can't change photo (only notes). Delete record deletes photo link.

### Edit/Delete Own Records

**Pattern:** Ownership check via userId. Edit in-place or modal. Delete with undo buffer.

**Examples:**
- **MapMyFitness:** "Edit or Delete a Workout" from workout detail page.
- **Fitbit:** Tap exercise → pencil icon to edit, trash icon to delete.
- **TrainingPeaks:** Edit workout data fields individually (duration, distance, calories).

**Common pain points:**
- **Delete ambiguity:** "Delete Workout Only" vs "Delete Workout & Data" confusion (Apple Health issue).
- **Data persistence:** Deleting from one app doesn't remove from Health app (sync issue).

**Implementation for Rollbook:**
- Edit: pencil icon on record → opens edit modal → save updates timestamp + notes
- Delete: trash icon → soft delete (mark deleted_at timestamp)
- Ownership: WHERE userId = currentUser.id (enforced by RLS)
- No delete confirmation dialog (fast delete) → admin can restore via audit log

### Admin Audit Log (SaaS Pattern)

**Pattern:** Immutable log of who did what when. Essential fields: actor, action, target, timestamp.

**Examples from SaaS research:**
- **EnterpriseReady:** "Audit logs are immutable, time-synced, and accessible by admins. Fully exportable and searchable."
- **Essential fields:** Actor (username), Group (org/team), Where (IP, device), When (server time), Target (resource ID), Action (verb).
- **Use case:** "Remediate a problem, such as restoring a corrupted file to its original state by examining what changes were made."

**Implementation for Rollbook:**
```sql
audit_log (
  id UUID PRIMARY KEY,
  actor_id UUID NOT NULL,  -- admin who performed action
  action TEXT NOT NULL,     -- 'delete_record', 'restore_record', 'delete_user', 'make_admin'
  target_id UUID,           -- workout record ID or user ID
  metadata JSONB,           -- { userId, date, notes, photoUrl } for restore
  timestamp TIMESTAMPTZ DEFAULT NOW()
)
```

**Actions to log:**
- Admin deletes any record → log with full record metadata (for restore)
- Admin restores record → log restore action
- Admin deletes user → log user ID
- Admin designates another admin → log new admin ID

**Restore flow:**
1. Admin views audit log
2. Finds "Admin A deleted workout X (userId: B, date: 2026-02-10, notes: 'morning run') at 2:30pm"
3. Clicks "Restore" → creates new record with metadata from audit log
4. Logs "Admin C restored workout X at 3:00pm"

### Multiple Admins

**Pattern:** Boolean flag. No hierarchy. All admins have full access.

**Examples:**
- **Clerk Organizations:** "Create custom Roles and fine-grained Permissions."
- **Rippling:** "Role-based permissions let you 'set and forget' your policies for admin access."

**For small teams (<20 people):**
- Complex role hierarchy is overkill
- Binary is intuitive: admin or member
- All admins can designate other admins (trust model)

**Implementation for Rollbook:**
```sql
users (
  ...
  is_admin BOOLEAN DEFAULT FALSE
)
```

**Admin actions:**
- Delete any record (with audit log)
- Restore deleted records
- Delete users (existing v1.0 feature)
- Designate other admins (new)
- View audit log

**Security:**
- RLS check: `is_admin = true` for admin-only tables/actions
- Frontend: show admin UI only if `user.isAdmin`
- First user (from v1.0 setup) remains admin by default

### Calendar Badge Count

**Pattern:** Visual indicator of "how many" without showing detail. Number or dot intensity.

**Examples:**
- **Material Design:** "Badges show notifications, counts, or status information... can include labels or numbers."
- **Oracle Alta:** "Do not send multiple badges for the same event—increment the count instead."
- **Calendar apps:** Show number of events on each date (e.g., "3 meetings").

**Design approaches:**
- **Number badge:** Small circle with count ("3", "10"). Clear, direct.
- **Dot size:** Bigger dot = more records. Less precise, more visual.
- **Color intensity:** Darker = more records. Subtle, harder to read exact count.

**Implementation for Rollbook:**
- Number badge (most explicit)
- Position: bottom-right of calendar cell
- Style: small circle, background color (primary), white text
- Only show if count > 0
- Query: `SELECT date, COUNT(*) FROM workouts WHERE userId = X AND date >= 'month-start' GROUP BY date`

## Complexity Analysis

### Low Complexity (1-2 days each)

- Remove UNIQUE constraint, add timestamp
- Display all records for a day (list component)
- Edit own record (form + auth check)
- Delete own record (soft delete + auth check)
- Text notes field (add column, input, display)
- Record count badge (aggregation query + badge UI)
- Date navigation (prev/next buttons)
- Empty state guidance (conditional rendering)
- Multiple admin boolean (add column, UI toggle)
- Admin delete any record (isAdmin check)

### Medium Complexity (3-5 days each)

- Calendar drill-down (date picker + routing + day detail view)
- Photo thumbnail gallery (grid layout, click-to-enlarge modal)
- Timestamp display logic ("Today 2:30pm", "Yesterday", "Feb 10")
- Fast delete with undo toast (undo buffer, toast UI)
- Admin designate admin (UI + RLS update)

### High Complexity (5-10 days)

- Audit log full implementation (table, logging all actions, metadata capture)
- Restore from audit log (parse metadata, recreate record, handle edge cases)
- Admin audit log UI (list view, filter by action/actor, restore buttons)

## Migration Considerations

### Database Schema Changes

**Current (v1.0):**
```sql
workouts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  workout_date DATE NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workout_date)  -- ONE RECORD PER DAY
)
```

**New (v2.0):**
```sql
workouts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  workout_date DATE NOT NULL,  -- Keep for backward compat, queries
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- Actual record time
  notes TEXT,
  photo_url TEXT,
  deleted_at TIMESTAMPTZ,  -- Soft delete
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- REMOVED: UNIQUE(user_id, workout_date)
)

audit_log (
  id UUID PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_id UUID,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
)

users (
  ...existing columns...
  is_admin BOOLEAN DEFAULT FALSE
)
```

**Migration steps:**
1. Add `timestamp` column (default to `created_at` for existing records)
2. Add `notes` column (nullable)
3. Add `deleted_at` column (nullable)
4. Drop UNIQUE constraint on (user_id, workout_date)
5. Add `is_admin` to users (set first user to TRUE)
6. Create `audit_log` table

**Backward compatibility:**
- Keep `workout_date` for existing queries (team stats, calendar aggregation)
- `timestamp` provides precision within day
- Existing records have `notes = NULL` (display as empty)

### UI Migration

**Current (v1.0):**
- Dashboard: "Today I worked out" toggle (creates/deletes today's record)
- Calendar: shows dots on workout days
- Stats: "This month: 12 workouts"

**New (v2.0):**
- Dashboard: "+" FAB → add workout form (timestamp, notes, optional photo)
- Calendar: shows count badge on workout days ("3")
- Day detail: list of all records for selected date
- Stats: unchanged (still counts total workouts per month)

**Transition:**
- Toggle removed (breaking change, but necessary for multi-record model)
- Add onboarding tooltip: "New: Add multiple workouts per day!"
- Tutorial update: "02-workout-logging.md" needs v2.0 rewrite

## Testing Considerations

### Edge Cases to Test

1. **0 records on date:** Empty state displays correctly
2. **1 record on date:** Badge shows "1", drill-down shows single record
3. **10+ records on date:** Badge shows "10", all records visible in detail view
4. **Same-second records:** Two records at same timestamp (unlikely but possible)
5. **Delete last record for day:** Badge disappears, day detail shows empty state
6. **Admin deletes user with 100 records:** All records soft-deleted, audit log created
7. **Restore deleted record:** Record reappears in calendar, count updates
8. **Non-admin tries admin action:** Blocked by RLS, no data leaked
9. **Photo without notes:** Displays correctly (notes field empty)
10. **Notes without photo:** Displays correctly (no thumbnail)

### Performance Considerations

**Queries to optimize:**
- Calendar month view: `COUNT(*) GROUP BY date WHERE date BETWEEN month_start AND month_end` → Index on (user_id, workout_date)
- Day detail: `SELECT * WHERE user_id = X AND date = Y ORDER BY timestamp DESC` → Same index
- Audit log: `SELECT * WHERE actor_id = X ORDER BY timestamp DESC LIMIT 100` → Index on (actor_id, timestamp)

**At scale (unlikely but plan for it):**
- 20 users * 5 records/day * 30 days = 3,000 records/month
- 12 months = 36,000 records/year
- Supabase handles this trivially (millions of rows)

## Sources

### Multiple Records Per Day Patterns
- [Fitness App UI Design: Key Principles for Engaging Workout Apps](https://stormotion.io/blog/fitness-app-ux/)
- [How to Design a Fitness App: UX/UI Best Practices for Engagement and Retention](https://www.zfort.com/blog/How-to-Design-a-Fitness-App-UX-UI-Best-Practices-for-Engagement-and-Retention)
- [Best Fitness Tracker App 2026: Free Mobile & Watch Compatible](https://www.fitbudd.com/post/the-best-fitness-tracking-apps-for-2026-free-mobile-wearable-compatible)

### Workout Notes Best Practices
- [Simple Workout Log - The best minimalist workout tracker available](https://www.simpleworkoutlog.com/)
- [The Workout Journal: 3 Simple Steps to Effectively Track Your Workouts Today](https://www.mayooshin.com/workout-journal)
- [Hacking the Workout Journal: How to Track Your Workouts in the Simplest, Most Effective Way Possible](https://jamesclear.com/workout-journal)
- [How to Track Workouts and What Metrics to Log (2025 Guide)](https://www.hevyapp.com/how-to-track-workouts/)

### Calendar Drill-Down Patterns
- [7 Best Workout Calendar Apps](https://calendartricks.com/7-best-workout-calendar-apps/)
- [Calendar - FitNotes](http://www.fitnotesapp.com/calendar/)
- [Track Your Gym Consistency & Streak With the Hevy Calendar](https://www.hevyapp.com/features/gym-consistency/)
- [Calendar UI Examples: 33 Inspiring Designs [+ UX Tips]](https://www.eleken.co/blog-posts/calendar-ui)

### Edit/Delete Own Records
- [How do I edit or delete an exercise I created? – MyFitnessPal Help](https://support.myfitnesspal.com/hc/en-us/articles/360032272552-How-do-I-edit-or-delete-an-exercise-I-created)
- [How to add, edit, or delete Fitbit data & activities](https://support.google.com/fitbit/answer/14236402?hl=en&co=GENIE.Platform%3DAndroid)
- [Edit or Delete a Workout – MapMyFitness](https://support.mapmyfitness.com/hc/en-us/articles/1500009118702-Edit-or-Delete-a-Workout)

### Duplicate Prevention & Edge Cases
- [How to Fix Duplicate Workouts in Apple Health & Athlytic](https://athlyticapp.helpscoutdocs.com/article/45-duplicate-workouts)
- [How to fix Apple Watch duplicate workouts](https://www.cultofmac.com/how-to/how-to-fix-apple-watch-duplicate-workouts)
- [Strong for Apple Watch is creating Duplicate Workouts (Troubleshooting)](https://help.strongapp.io/article/219-apple-watch-duplicate-workouts)

### Photo Thumbnail Gallery
- [Take and Store Fitness Progress Pictures in App](https://www.fitsw.com/blog/take-and-store-fitness-progress-pictures/)
- [Create Before and After Fitness Photos Easily - New Feature](https://www.fitsw.com/blog/create-before-and-after-fitness-photos-easily/)
- [Gain Checker: Fitness Photo App for Body Gain and Loss Tracking](https://www.appschopper.com/portfolio/gain-checker-body-checking-photo-app)

### Calendar Badge Counts
- [Badge – Material Design 3](https://m3.material.io/components/badges/guidelines)
- [Alta Mobile | Badge](https://www.oracle.com/webfolder/ux/mobile/pattern/badge.html)
- [Icon Badges: Improving User Experience with Subtle Notifications](https://www.nashpush.com/blogs/beyond-traditional-pushes-using-icon-badges-to-power-up-the-ui)

### Admin Audit Log Patterns
- [Enterprise Ready SaaS App Guide to Audit Logging](https://www.enterpriseready.io/features/audit-log/)
- [Best practices for audit logging in a SAAS business/application](https://chrisdermody.com/best-practices-for-audit-logging-in-a-saas-business-app/)
- [Guide to Building Audit Logs for Application Software](https://medium.com/@tony.infisical/guide-to-building-audit-logs-for-application-software-b0083bb58604)
- [The Developer's Guide to Audit Logs / SIEM — WorkOS](https://workos.com/blog/the-developers-guide-to-audit-logs-siem)

### Multiple Admin Role Management
- [Introducing role-based permissions: Get complete control over the data and apps that your team can manage](https://www.rippling.com/blog/introducing-role-based-permissions-get-complete-control-over-the-data-and-apps-that-your-team-can-manage)
- [B2B/B2C Roles and Permissions with Clerk Organizations](https://clerk.com/docs/organizations/roles-permissions)
- [User Permissions - Understanding User Roles - Gym Insight Knowledge Base](https://help.gyminsight.com/article/137-user-permissions-based-on-user-types)

### Privacy-First Team Tracking
- [Analysis of Privacy Protections in Fitness Tracking Social Networks](https://www.usenix.org/system/files/conference/usenixsecurity18/sec18-hassan_0.pdf)
- [Fitness Tracker Information and Privacy Management: Empirical Study](https://pmc.ncbi.nlm.nih.gov/articles/PMC8663694/)
- [Best Privacy Practices For Employer-Issued Fitness Trackers](https://www.fisherphillips.com/en/news-insights/best-privacy-practices-for-employer-issued-fitness-trackers.html)

### Minimal Friction Logging
- [Create Mobile App: Minimalist Personal Logs](https://koder.ai/blog/create-mobile-app-minimalist-personal-logs)
- [Best App to Log Workouts in 2024: 7 Top Trackers Compared](https://setgraph.app/ai-blog/best-app-to-log-workouts)
- [Best App to Log Workout (2025): 12 Apps Tested by Lifters](https://setgraph.app/ai-blog/best-app-to-log-workout-tested-by-lifters)

---

**Confidence Level:**
- **Table Stakes:** HIGH (industry patterns well-established)
- **Differentiators:** MEDIUM (audit log + restore is rare, competitive advantage unclear)
- **Edge Cases:** HIGH (duplicate prevention, ordering, empty states well-researched)
- **Migration:** MEDIUM (DB changes straightforward, but UI transition requires testing)
