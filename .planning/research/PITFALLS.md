# Domain Pitfalls: v2.0 UI Refactoring (Live System Migration)

**Domain:** Workout tracking app migration - Multi-record support, audit logging, UI refactoring
**System:** Live production with ~20 users, Fable/Elmish + Supabase
**Researched:** 2026-02-15
**Critical Context:** This is a LIVE SYSTEM with real users and data

---

## Critical Pitfalls

These mistakes cause data loss, extended downtime, or require complete rewrites.

### Pitfall 1: Dropping Composite Primary Key Without Migration Strategy

**What goes wrong:** Removing `PRIMARY KEY (user_id, workout_date)` to allow multiple records per day can cause data loss or extended downtime if not properly planned.

**Why it happens:**
- The current schema uses composite primary key enforcing UNIQUE constraint
- PostgreSQL requires ACCESS EXCLUSIVE lock to drop constraints
- Lock blocks ALL reads and writes during migration
- Long-running transactions queue behind lock request, creating cascading delays

**Consequences:**
- Production downtime during migration
- User data loss if migration fails mid-operation
- Offline queue operations fail because schema has changed
- IndexedDB queue holds operations for old schema (user_id, workout_date), but new schema expects different structure

**Prevention:**
1. **Test migration on production snapshot** - Clone production database, run migration, verify data integrity
2. **Blue-green migration approach**:
   - Create new table `workouts_v2` with new schema (id SERIAL, user_id, workout_date, no UNIQUE constraint)
   - Migrate existing data: `INSERT INTO workouts_v2 (user_id, workout_date, created_at) SELECT user_id, workout_date, created_at FROM workouts`
   - Deploy frontend with dual-write support (writes to both tables during transition)
   - Switch reads to new table
   - Drop old table only after verification period
3. **Schedule migration during low-usage window** - Check analytics for lowest traffic time
4. **Terminate long-running transactions before migration** - Query `pg_stat_activity`, kill blockers
5. **Version the IndexedDB schema** - Bump `dbVersion` to 2, migrate queue operations to include new id field

**Detection:**
- Monitor migration duration: should complete in milliseconds for ~20 users
- If migration takes >1 second, investigate locks: `SELECT * FROM pg_stat_activity WHERE state = 'active'`
- Check for queued operations in IndexedDB after migration completes
- Test offline sync immediately after deployment

**Phase to address:** Phase 1 (Schema Migration) - Critical blocker, must succeed before any other v2.0 work

**Reference:**
- [PostgreSQL: ALTER TABLE Documentation](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [CommandPrompt: How to DROP UNIQUE CONSTRAINT](https://www.commandprompt.com/education/how-to-drop-unique-constraint-in-postgresql/)

---

### Pitfall 2: Offline Sync Breaking After Schema Migration

**What goes wrong:** Offline queue holds operations for old schema (upsert with `onConflict: "user_id,workout_date"`), but new schema no longer has this constraint. Queue replay fails silently or creates duplicate records.

**Why it happens:**
- Current code: `upsert(record, { onConflict: "user_id,workout_date" })`
- After migration: No composite unique constraint exists
- Supabase upsert with non-existent conflict target silently becomes INSERT
- User who logged workout offline before migration, syncs after migration → duplicate record or error

**Consequences:**
- Users lose offline changes when queue replay fails
- Duplicate workout records (same user, same date, different auto-generated IDs)
- User confusion: "I already logged this workout, why is it showing twice?"
- Silent data corruption (duplicates without error messages)

**Prevention:**
1. **Clear offline queue before migration** - Deploy notification 24h before: "Please go online to sync pending changes"
2. **Version the queue operations**:
   ```javascript
   {
     version: 2,  // Add version field
     operationType: "CreateWorkout",
     userId: "...",
     workoutDate: "...",
     recordId: null  // New field for v2 schema
   }
   ```
3. **Handle version mismatch in sync**:
   ```javascript
   if (operation.version === 1) {
     // Old schema: upsert with conflict
     client.from("workouts").upsert(...)
   } else {
     // New schema: insert (multiple records allowed)
     client.from("workouts_v2").insert(...)
   }
   ```
4. **Test offline-to-online flow** - Manually queue operation, deploy, verify sync works
5. **Monitor sync failures** - Track sync error rate, alert if >5% failure

**Detection:**
- Check IndexedDB pending count before and after migration
- Watch for duplicate workout records in database
- Monitor browser console for Supabase errors during sync
- User reports: "My workout appears twice"

**Phase to address:** Phase 1 (Schema Migration) - Must coordinate with offline sync code

**Reference:**
- [Dexie: Migrating existing DB](https://dexie.org/docs/Tutorial/Migrating-existing-DB-to-Dexie)
- [Offline-first frontend apps in 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)

---

### Pitfall 3: Admin Audit Log Circular Reference (Admin Deletes Audit Table)

**What goes wrong:** Admin deletes another admin's records → audit log records deletion → deleted admin was the one who created audit log table → circular reference or orphaned records.

**Why it happens:**
- Audit log tracks "who deleted what"
- If admin A deletes admin B's account, audit log references admin B
- If admin B's user account gets CASCADE deleted, foreign key to audit log breaks
- Audit log loses context: "deleted by [NULL]"

**Consequences:**
- Audit trail becomes useless (can't identify who performed action)
- Compliance/legal issues (cannot prove who deleted data)
- Cannot restore deleted records (no context for "who" or "why")
- Cascading deletes corrupt audit history

**Prevention:**
1. **Denormalize audit log** - Store user email/name as TEXT, not foreign key to auth.users:
   ```sql
   CREATE TABLE admin_audit_log (
     id SERIAL PRIMARY KEY,
     performed_by_id UUID,  -- Reference, but nullable
     performed_by_email TEXT NOT NULL,  -- Denormalized for history
     action TEXT NOT NULL,  -- 'delete_user', 'delete_workout', etc.
     target_user_id UUID,  -- Who was affected (nullable)
     target_user_email TEXT,  -- Denormalized
     old_values JSONB,  -- Snapshot of deleted data
     timestamp TIMESTAMPTZ DEFAULT NOW()
   );
   ```
2. **Never CASCADE delete audit log** - Audit log is append-only, immune to deletes
3. **Snapshot full context** - Store old_values JSONB with complete record before deletion
4. **Test admin-deletes-admin scenario** - Verify audit log remains intact
5. **Separate audit log from user tables** - No foreign key constraints to auth.users

**Detection:**
- Query audit log for NULL performed_by references
- Check for missing email context in audit entries
- Test: Create admin, have them delete something, delete that admin, verify audit log still shows email

**Phase to address:** Phase 3 (Audit Log Setup) - Design schema correctly from start

**Reference:**
- [Supabase Audit Log Best Practices](https://bootstrapped.app/guide/how-to-implement-audit-logs-in-supabase)
- [Postgres Auditing in 150 lines](https://supabase.com/blog/postgres-audit)

---

### Pitfall 4: RLS Policy Does Not Prevent Admin from Deleting Audit Log

**What goes wrong:** Admin with delete privileges can delete their own audit trail, covering up malicious actions.

**Why it happens:**
- Current pattern: `CREATE POLICY "Admins can delete profiles" ... USING (public.is_admin())`
- If same pattern applied to audit log, admin can delete evidence of their actions
- RLS allows admin to DELETE from audit_log WHERE performed_by_id = auth.uid()

**Consequences:**
- Malicious admin covers tracks
- Cannot investigate security incidents
- Audit log becomes untrustworthy
- Compliance violations (audit logs must be immutable)

**Prevention:**
1. **No DELETE policy on audit log** - Audit log is append-only:
   ```sql
   ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

   -- SELECT: Admins can view audit log
   CREATE POLICY "Admins can view audit log"
     ON admin_audit_log FOR SELECT
     TO authenticated
     USING (public.is_admin());

   -- INSERT: Database triggers only (no direct user insert)
   -- NO UPDATE POLICY
   -- NO DELETE POLICY
   ```
2. **Archive, don't delete** - If storage grows too large, archive to external storage (S3), never delete from Postgres
3. **Partition by month** - For performance on large tables:
   ```sql
   CREATE TABLE admin_audit_log_2026_02 PARTITION OF admin_audit_log
     FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
   ```
4. **Separate backup** - Daily backup of audit log to separate storage

**Detection:**
- Try to DELETE from audit_log as admin user → should fail with RLS error
- Monitor row count: should only increase, never decrease
- Alert if row count decreases

**Phase to address:** Phase 3 (Audit Log Setup) - RLS policies must be correct from day one

**Reference:**
- [Supabase RLS Security](https://designrevision.com/blog/supabase-row-level-security)
- [Production-Ready Audit Logs in PostgreSQL](https://medium.com/@sehban.alam/lets-build-production-ready-audit-logs-in-postgresql-7125481713d8)

---

## Moderate Pitfalls

These mistakes cause delays, performance issues, or technical debt.

### Pitfall 5: Audit Log Trigger Performance Degrades Write Operations

**What goes wrong:** Database trigger on every INSERT/UPDATE/DELETE to workouts table writes to audit log. On high volume days (team challenge, everyone logging), writes slow down due to trigger overhead.

**Why it happens:**
- Each workout operation fires AFTER INSERT/UPDATE/DELETE trigger
- Trigger writes to audit_log table
- With ~20 users, not an issue now, but scales poorly
- Generic triggers (one trigger handles all tables) slower than table-specific triggers

**Consequences:**
- Workout creation feels slow (200ms → 500ms for insert)
- Offline sync takes longer (queued operations replay slowly)
- User frustration: "App is slow today"

**Prevention:**
1. **Use table-specific triggers** - Faster than generic triggers per PostgreSQL research:
   ```sql
   CREATE TRIGGER workouts_audit_trigger
     AFTER INSERT OR UPDATE OR DELETE ON workouts
     FOR EACH ROW EXECUTE FUNCTION audit_workouts_change();
   ```
2. **Only audit admin actions** - Don't audit every user workout insert (too verbose), only admin deletions:
   ```sql
   CREATE FUNCTION audit_admin_delete() RETURNS TRIGGER AS $$
   BEGIN
     IF public.is_admin() THEN
       INSERT INTO admin_audit_log (action, target_user_id, old_values, ...)
       VALUES ('delete_workout', OLD.user_id, row_to_json(OLD), ...);
     END IF;
     RETURN OLD;
   END;
   $$ LANGUAGE plpgsql;
   ```
3. **Async audit logging** - Use NOTIFY to enqueue audit log write, process asynchronously
4. **Monitor trigger execution time**:
   ```sql
   SET track_functions = all;
   SELECT * FROM pg_stat_user_functions WHERE funcname LIKE '%audit%';
   ```
5. **Benchmark before/after** - Test 100 rapid inserts before adding trigger, compare timing

**Detection:**
- Monitor average INSERT duration in Supabase dashboard
- Enable autoexplain for slow queries: `autoexplain.log_triggers = on`
- User feedback: "Logging workouts feels slow"

**Phase to address:** Phase 3 (Audit Log Implementation) - Benchmark before deploying trigger

**Reference:**
- [PostgreSQL Triggers in 2026: Performance](https://thelinuxcode.com/postgresql-triggers-in-2026-design-performance-and-production-reality/)
- [Performance: Generic vs Table-Specific Triggers](https://www.cybertec-postgresql.com/en/performance-differences-between-normal-and-generic-audit-triggers/)

---

### Pitfall 6: Photo Thumbnail Generation Overloads Client CPU

**What goes wrong:** Generating thumbnails client-side (browser-image-compression for every photo in gallery view) causes mobile browsers to freeze or crash when viewing date with 5+ photos.

**Why it happens:**
- Current: Client compresses before upload (max 1MB)
- New feature: Gallery view shows thumbnails
- If thumbnails generated on-the-fly in browser, CPU spikes
- Mobile devices (especially older phones) can't handle 10 concurrent canvas operations

**Consequences:**
- App freezes when scrolling through photo gallery
- Mobile browser crashes ("Out of memory")
- Battery drain from constant image processing
- Poor UX: "Why is this app so slow?"

**Prevention:**
1. **Use Supabase Image Transformations** (server-side, Pro plan feature):
   ```javascript
   const { data } = supabase.storage
     .from('photos')
     .getPublicUrl(path, {
       transform: {
         width: 200,
         height: 200,
         resize: 'cover'
       }
     })
   ```
2. **Pre-generate thumbnails on upload** - Edge Function creates thumbnail, stores alongside original:
   ```
   /photos/{userId}/{date}/original.jpg  (1MB)
   /photos/{userId}/{date}/thumb.jpg     (50KB, 200x200)
   ```
3. **Lazy load thumbnails** - Only render thumbnails for visible photos (IntersectionObserver)
4. **Cache transformed URLs** - Store thumbnail URL in IndexedDB, avoid re-requesting
5. **Fallback for free tier** - If no Image Transformations, generate thumbnails once on upload, not on view

**Detection:**
- Monitor browser CPU usage when viewing gallery (Chrome DevTools → Performance)
- Test on low-end Android device (3-year-old phone)
- Check for console errors: "Maximum call stack exceeded" or memory warnings

**Phase to address:** Phase 4 (Photo Gallery UI) - Design for server-side or pre-generated thumbnails

**Reference:**
- [Supabase Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)
- [Image Manipulation with Edge Functions](https://supabase.com/docs/guides/functions/examples/image-manipulation)

---

### Pitfall 7: Optimistic UI Update Races with Offline Sync

**What goes wrong:** User deletes workout → optimistic UI removes it → offline sync replays queued CREATE for same workout → workout reappears.

**Why it happens:**
1. User offline, creates workout A → queued in IndexedDB
2. User comes online, deletes workout A → optimistic UI removes from screen
3. Sync engine replays queue → CREATE workout A fires
4. Workout A reappears (zombie record)

**Consequences:**
- User confusion: "I deleted this, why is it back?"
- Duplicate records (create, delete, create again)
- Trust issues with offline mode

**Prevention:**
1. **Sync before allowing edits** - Disable edit/delete buttons if pending queue count > 0:
   ```javascript
   const canEdit = pendingCount === 0 && isOnline
   ```
2. **Tombstone pattern** - Instead of deleting from queue, mark as deleted:
   ```javascript
   {
     operationType: "CreateWorkout",
     workoutDate: "2026-02-15",
     status: "cancelled"  // Don't replay this
   }
   ```
3. **Clear queue on successful delete** - If deleting workout that's still in queue, remove queue entry instead of syncing both operations
4. **Show sync status** - Display "Syncing X pending changes..." before allowing destructive actions
5. **Conflict resolution UI** - If conflict detected, show modal: "This workout was created offline. Delete anyway?"

**Detection:**
- Test scenario: Go offline, create workout, go online, delete workout, wait for sync
- Monitor for duplicate records with same (user_id, workout_date, created_at)
- User reports: "Deleted workouts keep coming back"

**Phase to address:** Phase 5 (Edit/Delete Implementation) - Critical for data integrity

**Reference:**
- [Optimistic UI and Conflict Resolution](https://borstch.com/snippet/optimistic-ui-updates-and-conflict-resolution)
- [Offline vs Real-Time Sync: Managing Conflicts](https://www.adalo.com/posts/offline-vs-real-time-sync-managing-data-conflicts)

---

### Pitfall 8: State Management Complexity Explosion (Tabs × Date Navigation × Filters)

**What goes wrong:** UI has 3 state dimensions: selected tab (나/우리), selected date, selected filter (all/text/photos). Managing this in Elmish Model causes update function to balloon with edge cases.

**Why it happens:**
- Tab change should preserve date
- Date change should preserve tab
- Filter applies per-tab (나 tab has different filter than 우리 tab)
- URL should reflect state (for bookmarks/sharing)
- Back button should work intuitively

**Consequences:**
- Update function becomes 200+ lines of nested pattern matching
- Bugs: Changing tab resets date to today
- URL state gets out of sync with Model
- Browser back button behaves unexpectedly
- Difficulty testing (too many state combinations)

**Prevention:**
1. **Normalize state shape** - Keep state flat, not nested:
   ```fsharp
   type Model = {
     CurrentTab: Tab  // Me | Team
     SelectedDate: DateTime
     MeFilter: Filter  // All | Text | Photos
     TeamFilter: Filter
     // NOT: TabState of MeState | TeamState (nested)
   }
   ```
2. **Derive filter from tab** - Computed property, not separate state:
   ```fsharp
   let currentFilter model =
     match model.CurrentTab with
     | Me -> model.MeFilter
     | Team -> model.TeamFilter
   ```
3. **URL as source of truth** - Parse URL on init, update URL on state change:
   ```fsharp
   /me/2026-02-15?filter=photos
   /team/2026-02-14?filter=all
   ```
4. **Test state transitions** - Matrix of all combinations (tab change × date change × filter change)
5. **Separate concerns** - Date navigation logic separate from tab logic separate from filter logic

**Detection:**
- Count lines in Update function → if >150 lines, refactor
- Test: Change tab, press back button → should go to previous page, not toggle tab
- Test: Bookmark URL, reload → state should match URL

**Phase to address:** Phase 2 (UI Architecture Planning) - Design state shape early

**Reference:**
- [React State Management 2026: What You Need](https://www.developerway.com/posts/react-state-management-2025)
- [State Management Best Practices](https://www.c-sharpcorner.com/article/state-management-in-react-2026-best-practices-tools-real-world-patterns/)

---

## Minor Pitfalls

These mistakes cause annoyance but are easily fixable.

### Pitfall 9: Audit Log Storage Growth Not Monitored

**What goes wrong:** Audit log table grows unbounded. After 6 months, reaches 100K rows, slows down queries, increases backup size.

**Why it happens:**
- Audit log is append-only (no deletes)
- Every admin action adds row
- No automatic archival or cleanup
- pgAudit can generate enormous volume if misconfigured

**Consequences:**
- Slow queries on audit log (no partitioning)
- Increased storage costs
- Slow backups (large table to dump)

**Prevention:**
1. **Partition by month** - Only recent data needs fast access:
   ```sql
   CREATE TABLE admin_audit_log (
     timestamp TIMESTAMPTZ NOT NULL,
     ...
   ) PARTITION BY RANGE (timestamp);
   ```
2. **Archive old partitions** - After 3 months, export to S3, drop partition
3. **Monitor row count** - Alert if > 50K rows (unexpected for ~20 users)
4. **Use BRIN indexes** - Efficient for append-only tables:
   ```sql
   CREATE INDEX idx_audit_timestamp ON admin_audit_log USING BRIN (timestamp);
   ```
5. **Limit audit scope** - Only log admin deletions, not every user action

**Detection:**
- Query row count monthly: `SELECT COUNT(*) FROM admin_audit_log`
- Monitor Supabase storage dashboard
- Check query performance: `EXPLAIN ANALYZE SELECT * FROM admin_audit_log WHERE ...`

**Phase to address:** Phase 3 (Audit Log Setup) - Configure partitioning from start

**Reference:**
- [Production-Ready Audit Logs](https://medium.com/@sehban.alam/lets-build-production-ready-audit-logs-in-postgresql-7125481713d8)
- [Postgres Audit Logging Guide](https://www.bytebase.com/blog/postgres-audit-logging/)

---

### Pitfall 10: IndexedDB Version Bump Breaks Existing Offline Users

**What goes wrong:** Deploy new code with `dbVersion = 2` (to add new object store). Users with open tabs on `dbVersion = 1` get blocked, can't access IndexedDB until they reload.

**Why it happens:**
- IndexedDB version upgrades require all connections to close
- If user has app open in 2 tabs, upgrade blocks
- No automatic reload mechanism
- User sees cryptic error: "VersionError: An attempt was made to open a database using a lower version than the existing version"

**Consequences:**
- Offline mode stops working until manual reload
- User confusion: "Why isn't offline mode working?"
- Data stuck in old version (can't sync)

**Prevention:**
1. **Handle version change gracefully**:
   ```javascript
   db.onversionchange = () => {
     db.close()
     alert("App updated. Please reload the page.")
     // Or auto-reload: window.location.reload()
   }
   ```
2. **Test multi-tab scenario** - Open app in 2 tabs, deploy new version, verify behavior
3. **Service Worker reload prompt** - Notify user of update:
   ```javascript
   navigator.serviceWorker.addEventListener('controllerchange', () => {
     if (confirm('New version available. Reload?')) {
       window.location.reload()
     }
   })
   ```
4. **Backward-compatible migrations** - Add new stores without removing old ones initially

**Detection:**
- Monitor browser console for "VersionError"
- Test with multiple tabs open
- User reports: "Offline mode stopped working after update"

**Phase to address:** Phase 1 (Schema Migration) - Coordinate with service worker

**Reference:**
- [Dexie: Migrating existing DB](https://dexie.org/docs/Tutorial/Migrating-existing-DB-to-Dexie)
- [IndexedDB: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

---

### Pitfall 11: Forgetting to Update Supabase RLS Policies for New Schema

**What goes wrong:** Add new `workouts_v2` table, deploy frontend, forget to add RLS policies. Users get "permission denied" errors or can see other users' data.

**Why it happens:**
- RLS policies tied to table name
- New table defaults to NO RLS POLICIES (wide open or completely locked depending on RLS enabled/disabled)
- Easy to forget during migration rush

**Consequences:**
- Data leak: Users see other users' workouts
- App broken: Users can't create workouts (RLS blocks insert)
- Security audit failure

**Prevention:**
1. **Enable RLS immediately** - First line in migration:
   ```sql
   CREATE TABLE workouts_v2 (...);
   ALTER TABLE workouts_v2 ENABLE ROW LEVEL SECURITY;
   ```
2. **Copy policies from old table** - Mirror existing policies:
   ```sql
   CREATE POLICY "Users can view own workouts" ON workouts_v2
     FOR SELECT TO authenticated
     USING ((SELECT auth.uid()) = user_id);
   -- Repeat for INSERT, UPDATE, DELETE
   ```
3. **Test RLS in dev** - Create test user, try to read other user's data → should fail
4. **Supabase Advisor** - Check Dashboard → Database → Advisors → RLS warnings

**Detection:**
- Try to SELECT from workouts_v2 as different user
- Supabase logs show RLS violations
- User reports: "I can see someone else's workouts" OR "App says permission denied"

**Phase to address:** Phase 1 (Schema Migration) - Part of migration script

**Reference:**
- [Supabase Row Level Security Guide](https://designrevision.com/blog/supabase-row-level-security)
- [RLS Best Practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)

---

### Pitfall 12: Edit/Delete Icons Not Visible on Mobile Touch Screens

**What goes wrong:** Edit/delete icons shown on hover (CSS `:hover`). On mobile (no hover), icons never appear. Users can't delete their own workouts.

**Why it happens:**
- Desktop pattern: Show icons on row hover
- Mobile has no hover state (tap = click, not hover)
- CSS `:hover` ignored or buggy on touch devices

**Consequences:**
- Feature inaccessible on mobile
- Users resort to desktop to delete records
- Poor mobile UX (defeats mobile-first design)

**Prevention:**
1. **Always-visible icons on mobile** - Use media query:
   ```css
   .edit-icon {
     opacity: 0;
   }
   .row:hover .edit-icon {
     opacity: 1;
   }
   @media (max-width: 768px) {
     .edit-icon {
       opacity: 1;  /* Always visible on mobile */
     }
   }
   ```
2. **Swipe gesture** - Left swipe reveals delete button (iOS pattern)
3. **Long press** - Hold record for 500ms → show context menu
4. **Test on real device** - iPhone Safari, Android Chrome

**Detection:**
- Test on mobile: Try to delete workout → icons should be visible
- User feedback: "How do I delete a workout on my phone?"

**Phase to address:** Phase 5 (Edit/Delete UI) - Mobile-first design requirement

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Phase 1: Schema Migration** | Dropping UNIQUE constraint locks table | Use blue-green migration, test on snapshot, schedule during low-usage |
| **Phase 1: Schema Migration** | Queue operations fail after schema change | Version queue operations, clear queue before migration |
| **Phase 1: Schema Migration** | IndexedDB version bump blocks users | Handle onversionchange, prompt reload |
| **Phase 1: Schema Migration** | Forget RLS on new table | Enable RLS immediately, copy from old table, test with different user |
| **Phase 2: UI Architecture** | State explosion with tabs/date/filters | Normalize state, URL as source of truth, derive computed values |
| **Phase 3: Audit Log Setup** | Admin can delete audit trail | No DELETE policy on audit_log, append-only design |
| **Phase 3: Audit Log Setup** | Circular reference in audit log | Denormalize user info (store email as TEXT) |
| **Phase 3: Audit Log Setup** | Trigger overhead slows writes | Only audit admin actions, use table-specific triggers |
| **Phase 3: Audit Log Setup** | Storage growth not monitored | Partition by month, archive old data, monitor row count |
| **Phase 4: Photo Gallery** | Client-side thumbnails overload CPU | Use Supabase Image Transformations or pre-generate on upload |
| **Phase 5: Edit/Delete** | Race condition with offline sync | Sync before allowing edits, tombstone cancelled operations |
| **Phase 5: Edit/Delete** | Hover-only icons don't work on touch | Always-visible on mobile, swipe gestures, test on real device |

---

## Quick Reference: Pre-Deployment Checklist

Before deploying v2.0 migration, verify:

- [ ] **Schema migration tested on production snapshot** - No data loss, completes in <1s
- [ ] **Offline queue cleared or versioned** - Users synced before migration OR queue handles old/new schema
- [ ] **Audit log RLS policies prevent deletion** - No DELETE policy on admin_audit_log
- [ ] **Audit log denormalizes user info** - Stores email as TEXT, not foreign key
- [ ] **Image thumbnails generated server-side** - Using Supabase transformations or pre-generated
- [ ] **State management tested** - Tab change preserves date, URL syncs with state, back button works
- [ ] **Edit/delete disabled during sync** - Button disabled if pendingCount > 0
- [ ] **IndexedDB version bump handled** - onversionchange prompts reload
- [ ] **RLS policies added to new tables** - workouts_v2 has same policies as workouts
- [ ] **Mobile edit/delete icons visible** - Always-on for touch devices
- [ ] **Audit log partitioned** - BRIN index, partition by month if expecting high volume
- [ ] **Trigger performance benchmarked** - Audit trigger doesn't slow writes >100ms

---

## Confidence Assessment

| Pitfall Category | Confidence | Source |
|------------------|------------|--------|
| Schema Migration | HIGH | PostgreSQL official docs, production experience with ACCESS EXCLUSIVE locks |
| Offline Sync Breakage | HIGH | Common pattern in PWA migrations, IndexedDB versioning docs |
| Audit Log Design | HIGH | Supabase audit blog, PostgreSQL trigger research |
| RLS Policy Mistakes | HIGH | Supabase RLS docs, security best practices |
| Photo Performance | MEDIUM | Supabase Image Transformations docs (Pro tier feature, may not apply) |
| State Management | MEDIUM | React patterns apply to Elmish, but F# specifics less documented |
| Race Conditions | MEDIUM | General offline-first patterns, need app-specific testing |
| Mobile UX | HIGH | Standard mobile-first patterns |

---

## Sources

**Schema Migration & Performance:**
- [PostgreSQL: Documentation: 5.5 Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [CommandPrompt: How to DROP UNIQUE CONSTRAINT in PostgreSQL](https://www.commandprompt.com/education/how-to-drop-unique-constraint-in-postgresql/)
- [PostgreSQL Triggers in 2026: Design, Performance, and Production Reality](https://thelinuxcode.com/postgresql-triggers-in-2026-design-performance-and-production-reality/)
- [Performance: Generic vs Table-Specific Triggers](https://www.cybertec-postgresql.com/en/performance-differences-between-normal-and-generic-audit-triggers/)

**Audit Logging:**
- [Supabase: Postgres Auditing in 150 lines of SQL](https://supabase.com/blog/postgres-audit)
- [Production-Ready Audit Logs in PostgreSQL](https://medium.com/@sehban.alam/lets-build-production-ready-audit-logs-in-postgresql-7125481713d8)
- [Bootstrapped: How to implement audit logs in Supabase](https://bootstrapped.app/guide/how-to-implement-audit-logs-in-supabase)
- [Postgres Audit Logging Guide](https://www.bytebase.com/blog/postgres-audit-logging/)

**Offline Sync & IndexedDB:**
- [Offline-first frontend apps in 2025: IndexedDB and SQLite](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Dexie: Migrating existing DB](https://dexie.org/docs/Tutorial/Migrating-existing-DB-to-Dexie)
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [How to Build Offline Capabilities](https://oneuptime.com/blog/post/2026-01-30-offline-capabilities/view)

**Conflict Resolution:**
- [Optimistic UI Updates and Conflict Resolution](https://borstch.com/snippet/optimistic-ui-updates-and-conflict-resolution)
- [Offline vs Real-Time Sync: Managing Data Conflicts](https://www.adalo.com/posts/offline-vs-real-time-sync-managing-data-conflicts)

**Supabase Storage & Images:**
- [Supabase Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)
- [Image Manipulation with Edge Functions](https://supabase.com/docs/guides/functions/examples/image-manipulation)
- [Dexie: Keep storing large images, just don't index binary data](https://medium.com/dexie-js/keep-storing-large-images-just-dont-index-the-binary-data-itself-10b9d9c5c5d7)

**RLS & Security:**
- [Supabase Row Level Security: Complete Guide (2026)](https://designrevision.com/blog/supabase-row-level-security)
- [Supabase RLS Best Practices: Production Patterns](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)

**State Management:**
- [React State Management in 2025: What You Actually Need](https://www.developerway.com/posts/react-state-management-2025)
- [State Management in React (2026): Best Practices, Tools & Real-World Patterns](https://www.c-sharpcorner.com/article/state-management-in-react-2026-best-practices-tools-real-world-patterns/)

**Admin Security:**
- [ManageEngine: How to detect and prevent privilege escalation attacks](https://www.manageengine.com/log-management/cyber-security/privilege-escalation-attack.html)
- [Mastering Privilege Escalation: Techniques & Prevention Strategies](https://www.adminbyrequest.com/en/blogs/mastering-privilege-escalation-techniques-prevention-strategies)
