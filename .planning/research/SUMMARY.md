# Project Research Summary

**Project:** Rollbook v2.0 UI Refactoring
**Domain:** Workout tracking web app (live system migration)
**Researched:** 2026-02-15
**Confidence:** HIGH

## Executive Summary

Rollbook v2.0 transforms a working one-record-per-day workout tracker into a multi-record-per-day system with enhanced UI, text/photo records, and admin audit logging. The core challenge is migrating a live production system with ~20 active users while preserving data integrity and maintaining offline-first functionality.

The recommended approach prioritizes safety through blue-green schema migration, uses existing Fable/Elmish/Supabase stack with minimal additions (date-fns, yet-another-react-lightbox), and builds in phases that stabilize the database schema before layering UI complexity. Critical stack decisions: custom admin audit table (not supa_audit extension), soft deletes for undo capability, and server-side thumbnail generation for performance.

Key risks center on the breaking schema change: dropping the `PRIMARY KEY (user_id, workout_date)` constraint requires careful offline queue versioning, RLS policy updates, and IndexedDB migration to avoid data loss or sync conflicts. Secondary risks include state management complexity with multiple UI dimensions (tabs, date navigation, filters), audit log performance if triggers are misconfigured, and mobile UX challenges with edit/delete interactions on touch devices.

## Key Findings

### Recommended Stack

v2.0 requires minimal new dependencies. The existing Fable 4.28.0 + Feliz 2.9.0 + Supabase stack handles most features. Key additions focus on date operations and photo gallery UI while avoiding bloat.

**Core technologies:**
- **date-fns 4.1.0 + Fable.DateFunctions 3.9.0**: Industry-standard date library (200M+ weekly downloads) with F# bindings for prev/next navigation and Korean date formatting. Replaces manual DateHelpers.fs calculations.
- **yet-another-react-lightbox 3.29.1**: Modern React photo gallery with thumbnail plugin. Better maintained than PhotoSwipe (last updated 2023), confirmed React 19 compatible, plugin architecture fits incremental development.
- **Custom admin_audit_log table**: PostgreSQL table with JSONB metadata for undo/restore. Simpler than supa_audit extension for v2.0 scope, allows denormalized actor information to survive user deletions.
- **Supabase CLI migrations**: Built-in `supabase db diff` generates migration SQL, tracks history, supports rollback. No external tools (Flyway, Liquibase) needed.

**What NOT to add:**
- No UI component libraries (HeadlessUI, Radix UI) — Tailwind CSS + Feliz handles tabs and modals
- No rich text editors — plain text notes sufficient
- No bulk operations UI — adds complexity without demand
- No React Query — Supabase client handles caching

### Expected Features

Research identified clear table stakes vs differentiators vs anti-features based on multi-record fitness app patterns.

**Must have (table stakes):**
- Multiple records per day (core promise of schema change)
- View all records for selected date (calendar drill-down)
- Edit and delete own records (basic CRUD expectations)
- Text notes on records (fitness apps without notes feel incomplete in 2026)
- Record count badges on calendar (visual feedback for activity)
- Timestamp display (multiple records per day means "when" matters)
- Admin can delete any record (cleanup duty)
- Photo thumbnail gallery (click to enlarge is expected behavior)

**Should have (differentiators):**
- Audit log with undo (rare in fitness apps, builds trust)
- Privacy-first multi-record (team sees aggregates, not timing patterns)
- Fast delete without confirmation (trust + speed with undo safety net)
- Multiple admin roles (reduces bus factor for small teams)
- Admin action visibility (transparency prevents confusion)

**Defer (anti-features):**
- Workout templates/routines (scope creep, high complexity)
- Detailed workout structure (sets/reps tracking kills "minimal friction" value prop)
- Record categories/tags (decision fatigue, reduces completion rate)
- Rich text notes (over-engineering for short entries)
- Photo editing/filters (different product)
- Bulk operations (clutters mobile UI)

### Architecture Approach

The architecture integrates new features into the existing Elmish MVU pattern with careful schema migration strategy. The critical insight: migrating from composite primary key to auto-increment ID is a breaking change affecting database, Elmish state, offline queue, and RLS policies simultaneously.

**Major components:**
1. **Schema migration (workouts table)** — Add `id BIGSERIAL PRIMARY KEY`, drop `UNIQUE(user_id, workout_date)` constraint, add `record_type`, `notes`, `photo_url`, `deleted_at` columns. Blue-green migration with backup table for rollback.
2. **Elmish state refactoring (Dashboard.fs)** — Lift `selectedDate` to Dashboard state (shared across tabs), change from `WorkoutRecord option` to `WorkoutRecord array`, add `RecordType` discriminated union (WorkoutRecord | TextRecord | PhotoRecord).
3. **Offline queue versioning (offline/Types.fs)** — Add version field to queued operations, track `recordId` for update/delete operations, handle old/new schema during migration window.
4. **Admin audit system (admin_audit_log table)** — Denormalized actor info (email as TEXT), JSONB metadata for undo/restore, RLS prevents deletion (append-only), table-specific triggers for performance.
5. **RLS policy updates** — Add UPDATE/DELETE policies for own-record modification, soft delete enforcement, admin override for restore operations.

**Build order rationale:** Schema migration first (stabilizes data model), then type system (F# types match new schema), then UI components (build on stable foundation). This minimizes risk by avoiding UI work on unstable schema.

### Critical Pitfalls

Research identified 12 pitfalls across critical/moderate/minor severity. Top 5 require immediate attention during Phase 1.

1. **Dropping composite primary key without migration strategy** — ACCESS EXCLUSIVE lock blocks all reads/writes during migration. Prevention: Blue-green migration (create workouts_v2, dual-write, switch reads, drop old), test on production snapshot, schedule during low-usage window.

2. **Offline sync breaking after schema migration** — Queue holds operations for old schema (`onConflict: "user_id,workout_date"` no longer valid). Prevention: Version queue operations, clear queue before migration OR handle version mismatch in sync logic, test offline-to-online flow.

3. **Admin audit log circular reference** — If admin deletes another admin's account, foreign key to audit_log breaks. Prevention: Denormalize actor info (store email as TEXT, not FK), snapshot full context in JSONB, never CASCADE delete audit log.

4. **RLS policy does not prevent admin from deleting audit log** — Malicious admin could cover tracks. Prevention: No DELETE policy on audit_log (append-only), archive old data instead of deleting, separate backup of audit log.

5. **Optimistic UI update races with offline sync** — User deletes workout offline, sync replays queued CREATE, workout reappears (zombie record). Prevention: Sync before allowing edits (disable buttons if pendingCount > 0), tombstone pattern for cancelled operations, conflict resolution UI.

## Implications for Roadmap

Based on research, suggested phase structure prioritizes safety and dependencies:

### Phase 1: Schema Migration & Type System (Days 1-4)
**Rationale:** Database schema must stabilize before any UI work. Breaking change affects all downstream components. Blue-green migration minimizes downtime risk.

**Delivers:**
- Migrated `workouts` table with new schema
- `admin_audit_log` table created
- `is_admin` boolean added to users
- F# types updated (RecordType DU, WorkoutRecordV2)
- Supabase API functions for new schema
- RLS policies updated

**Addresses (from FEATURES):** Foundation for multiple records per day

**Avoids (from PITFALLS):** Pitfall 1 (migration locking), Pitfall 2 (offline sync breaking), Pitfall 11 (missing RLS policies)

**Research flag:** Standard pattern, skip research-phase. Follow PostgreSQL migration best practices.

---

### Phase 2: Date Navigation & Dashboard State (Days 5-6)
**Rationale:** Shared date state is core to new UX. Lifting `selectedDate` to Dashboard enables tab switching without losing context. Dependencies ready (schema migrated, types defined).

**Delivers:**
- DateNavigation component (prev/next, date picker)
- Dashboard state refactored with `selectedDate`
- Elmish messages for date changes
- Load records for selected date

**Uses (from STACK):** date-fns + Fable.DateFunctions for date arithmetic

**Implements (from ARCHITECTURE):** DateNavigation component, Dashboard state management

**Avoids (from PITFALLS):** Pitfall 8 (state complexity explosion) by normalizing state shape early

**Research flag:** Standard Elmish pattern, skip research-phase.

---

### Phase 3: Multi-Record List & Add Operations (Days 7-9)
**Rationale:** Display is safer than edit/delete. Users can see multiple records before introducing destructive operations. Validates schema migration worked correctly.

**Delivers:**
- RecordList component (displays WorkoutRecordV2 array)
- RecordItem component (renders by RecordType)
- RecordForm component (add workout/text/photo)
- Empty state UI

**Addresses (from FEATURES):** View all records for day, distinguish records visually, timestamp display

**Implements (from ARCHITECTURE):** RecordList, RecordItem, RecordForm components

**Avoids (from PITFALLS):** Pitfall 12 (mobile touch icons) by designing mobile-first from start

**Research flag:** Standard React patterns, skip research-phase.

---

### Phase 4: Photo Gallery with Lightbox (Days 10-11)
**Rationale:** Photo feature is isolated, can be built in parallel with edit/delete. Thumbnail performance is critical for mobile UX.

**Delivers:**
- F# bindings for yet-another-react-lightbox
- PhotoGallery with thumbnail grid
- Lightbox modal on click
- Integration with existing photo upload

**Uses (from STACK):** yet-another-react-lightbox, Supabase Image Transformations (or pre-generated thumbnails)

**Addresses (from FEATURES):** Photo thumbnail gallery (table stakes)

**Avoids (from PITFALLS):** Pitfall 6 (client-side thumbnail overload) by using server-side transformations

**Research flag:** Lightbox library integration — SKIP research (clear choice from STACK.md, good documentation).

---

### Phase 5: Edit & Delete Own Records (Days 12-13)
**Rationale:** Destructive operations come after display validated. RLS must be correct before allowing deletes. Offline sync coordination is critical.

**Delivers:**
- Edit mode for RecordItem
- Delete with confirmation/undo
- RLS policy verification
- Soft delete implementation

**Addresses (from FEATURES):** Edit own records, delete own records (table stakes)

**Implements (from ARCHITECTURE):** RLS UPDATE/DELETE policies, soft delete pattern

**Avoids (from PITFALLS):** Pitfall 7 (optimistic UI race) by syncing before allowing edits

**Research flag:** Standard CRUD + RLS, skip research-phase. Test RLS thoroughly.

---

### Phase 6: Calendar Integration (Days 14-15)
**Rationale:** Calendar depends on multi-record API working correctly. Count badges require aggregation queries. Navigation ties everything together.

**Delivers:**
- Calendar shows record count badges
- Click date navigates to day detail
- Monthly batch loading (performance)
- ProgressView and TeamView updated

**Addresses (from FEATURES):** Calendar with record count (table stakes), date navigation

**Implements (from ARCHITECTURE):** Calendar batch loading, client-side grouping

**Avoids (from PITFALLS):** Anti-pattern 5 (N+1 queries) by loading month in one query

**Research flag:** Standard aggregation pattern, skip research-phase.

---

### Phase 7: Admin Audit Log & Undo (Days 16-18)
**Rationale:** Audit log is complex (triggers, RPC, UI) but isolated. Can be developed late without blocking user features. Critical for admin trust.

**Delivers:**
- Audit log triggers (admin actions only)
- AuditLog UI component
- Undo/restore RPC function
- AdminRoleManager component

**Addresses (from FEATURES):** Admin audit log, multiple admin roles

**Implements (from ARCHITECTURE):** admin_audit_log table, soft delete workflow, PostgreSQL RPC

**Avoids (from PITFALLS):** Pitfall 3 (circular reference), Pitfall 4 (admin deletes audit), Pitfall 5 (trigger performance)

**Research flag:** Audit log trigger optimization — NEEDS RESEARCH if performance issues observed during Phase 5. Otherwise use table-specific triggers from ARCHITECTURE.md.

---

### Phase 8: Offline Queue Refactor (Days 19-20)
**Rationale:** Offline sync must handle new schema (recordId, update/delete operations). Deferred until core features stable. High risk of regressions.

**Delivers:**
- Versioned queue operations
- Update/delete queue support
- Conflict resolution logic
- IndexedDB version bump handling

**Addresses (from FEATURES):** Maintains offline-first value prop

**Implements (from ARCHITECTURE):** Queue versioning, tombstone pattern

**Avoids (from PITFALLS):** Pitfall 2 (offline sync breaking), Pitfall 7 (race conditions), Pitfall 10 (IndexedDB version bump)

**Research flag:** Offline sync conflict resolution — NEEDS RESEARCH. PITFALLS.md identifies race conditions but no detailed resolution strategy. Consider researching Operational Transformation or CRDT patterns if conflicts become frequent.

---

### Phase 9: Polish & Testing (Days 21-22)
**Rationale:** Final phase for mobile responsiveness, loading states, error handling. E2E testing validates all phases integrated correctly.

**Delivers:**
- Mobile responsive tabs/navigation
- Loading states for async operations
- Error boundaries and user feedback
- Empty state refinements
- E2E test scenarios

**Addresses (from FEATURES):** All table stakes features validated

**Avoids (from PITFALLS):** All minor pitfalls caught in testing

**Research flag:** Skip research-phase. Standard QA patterns.

---

### Phase Ordering Rationale

**Schema-first approach:** Phases 1-2 stabilize data layer and state management before touching UI. Prevents building components on unstable foundation.

**Display before destroy:** Phases 3-4 (view, add) come before Phase 5 (edit, delete). Users can verify migration worked before attempting destructive operations.

**Admin features last:** Phase 7 (audit log) is isolated, doesn't block user features. Can be delayed if schedule slips.

**Offline sync deferred:** Phase 8 waits until core CRUD stable. Minimizes rework from schema/API changes during early phases.

**Dependency-aware grouping:**
- Phase 2 needs Phase 1 (types)
- Phase 3 needs Phase 2 (date state)
- Phase 5 needs Phase 3 (display working)
- Phase 6 needs Phase 5 (API stable)
- Phase 8 needs Phase 5 (CRUD operations defined)

**Pitfall mitigation alignment:**
- Critical pitfalls addressed in Phase 1 (migration, RLS, offline queue)
- Moderate pitfalls addressed in Phases 4-5 (photo performance, optimistic UI)
- Minor pitfalls caught in Phase 9 (testing)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 7 (Audit Log):** If trigger performance becomes an issue (>100ms write latency), research async audit logging patterns or LISTEN/NOTIFY approach.
- **Phase 8 (Offline Sync):** Conflict resolution strategy incomplete. If race conditions occur frequently, research CRDT (Conflict-free Replicated Data Types) or Operational Transformation patterns for offline-first apps.

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** PostgreSQL migrations, RLS policies — well-documented in Supabase docs
- **Phase 2:** Elmish state management, date libraries — standard F# patterns
- **Phase 3:** React component composition — established patterns
- **Phase 4:** Lightbox integration — clear library choice from STACK.md
- **Phase 5:** CRUD operations with RLS — standard Supabase pattern
- **Phase 6:** Calendar aggregation queries — standard SQL GROUP BY
- **Phase 9:** Testing and polish — standard QA

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified from npm/NuGet. date-fns and yet-another-react-lightbox are industry standards with active maintenance. Custom audit table approach documented in multiple production examples. |
| Features | HIGH | Table stakes validated from fitness app UX research (FitNotes, Hevy, Strong patterns). Multi-record-per-day is standard in 2026 fitness apps. Anti-features identified from scope creep analysis. |
| Architecture | HIGH | Schema migration pattern from official PostgreSQL docs. Elmish MVU is proven for complex state. RLS policies follow Supabase best practices. Soft delete + audit log is industry standard. |
| Pitfalls | HIGH | Critical pitfalls (1-4) sourced from PostgreSQL locking docs, Supabase audit blog, production outage reports. Offline sync issues (2, 7) documented in PWA migration case studies. Mobile UX pitfall (12) from standard touch interaction patterns. |

**Overall confidence:** HIGH

### Gaps to Address

Research was comprehensive, but several areas need validation during implementation:

- **Offline sync conflict resolution:** PITFALLS.md identifies race conditions but doesn't provide detailed conflict resolution strategy. Current mitigation (disable edits if pendingCount > 0) is conservative. If users demand offline edit capability, research CRDT or OT patterns in Phase 8.

- **Supabase Image Transformations availability:** STACK.md recommends server-side thumbnail generation via Supabase Image Transformations, but this is a Pro plan feature. Verify plan status before Phase 4. Fallback: Pre-generate thumbnails on upload via Edge Function.

- **Audit log trigger performance at scale:** ARCHITECTURE.md suggests table-specific triggers are faster than generic triggers, but no benchmarking data for this specific workload. Monitor write latency in Phase 7. If >100ms, consider async audit logging (LISTEN/NOTIFY pattern).

- **IndexedDB migration edge cases:** PITFALLS.md covers basic version bump handling, but multi-tab scenarios with pending queue operations need testing. Simulate: User has 2 tabs open, queued operations in both, version bump deployed. Expected: Both tabs prompt reload. Actual behavior may vary by browser.

- **Mobile calendar UX:** FEATURES.md describes count badges, but research didn't validate optimal touch target size for calendar dates with badges. Test Phase 6 on real devices (iPhone SE, older Android) to verify 44x44px minimum touch target met.

## Sources

### Primary (HIGH confidence)
- Official Supabase documentation (migrations, RLS, storage, audit logs)
- PostgreSQL official docs (ALTER TABLE, constraints, triggers)
- npm package pages (date-fns, yet-another-react-lightbox) — versions verified, weekly downloads confirmed
- Fable.DateFunctions NuGet page and GitHub (maintained by Zaid Ajaj, Feliz author)
- MDN Web Docs (IndexedDB versioning)

### Secondary (MEDIUM confidence)
- Fitness app UX research (FitNotes, Hevy, Strong) — patterns confirmed across multiple apps
- Supabase community blog (audit logging patterns, RLS best practices)
- PostgreSQL trigger performance comparison (CYBERTEC blog) — generic vs table-specific triggers
- Offline-first app patterns (LogRocket, Adalo) — conflict resolution strategies
- React state management guides (2026 best practices)

### Tertiary (LOW confidence, needs validation)
- Supabase Image Transformations (Pro plan feature, pricing not verified)
- Async audit logging performance claims (no benchmark data for this specific workload)
- CRDT/OT patterns for offline conflict resolution (not yet researched, flagged for Phase 8 if needed)

---

**Research completed:** 2026-02-15
**Ready for roadmap:** YES

**Next steps for orchestrator:**
1. Use phase structure above as starting point for roadmap creation
2. Flag Phase 7 and Phase 8 for potential deeper research during planning
3. Validate Supabase plan includes Image Transformations before Phase 4
4. Allocate testing time in Phase 9 for mobile UX validation
5. Consider buffer days between phases for integration testing
