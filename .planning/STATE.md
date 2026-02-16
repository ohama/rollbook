# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-15)

**Core value:** 원탭 운동 기록 — 앱을 열고 "오늘 운동했다" 버튼 하나로 기록 완료
**Current focus:** Phase 14 - Admin & Audit

## Current Position

Phase: 14 of 14 (Admin & Audit)
Plan: 1 of 4 complete
Status: In progress
Last activity: 2026-02-16 — Completed 14-01-PLAN.md (Audit Infrastructure)

Progress: [██████████████████░░] 94% (v1.0 + v1.1 complete, v2.0 Phase 8-13 complete, Phase 14: 1/4 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 66 (Phases 1-13 complete, Phase 14: 1/4)
- Average duration: ~30 min (weighted average including Phase 9-14)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Authentication | 6 | ~4.5h | ~45min |
| 2. Workout Recording | 6 | ~4.5h | ~45min |
| 3. Personal Progress | 7 | ~5.3h | ~45min |
| 4. Team Statistics | 7 | ~5.3h | ~45min |
| 5. Photo Storage | 8 | ~6.0h | ~45min |
| 6. Admin & Offline | 8 | ~6.0h | ~45min |
| 7. Mac Mini Deployment | 6 | ~4.5h | ~45min |
| 8. Schema Migration | 3 | ~1.0h | ~20min |
| 9. UI Layout & Navigation | 3 | ~13min | ~4.3min |
| 10. Multi-Record CRUD | 3 | ~17min | ~5.7min |
| 11. Calendar Integration | 3 | ~6min | ~2min |
| 12. Detail Views | 2 | ~7min | ~3.5min |
| 13. Photo Gallery | 2 | ~6min | ~3min |
| 14. Admin & Audit | 1/4 | ~2min | ~2min |

**Recent Trend:**
- v1.0 + v1.1 shipped in 6 days (2026-02-10 → 2026-02-15)
- Phase 8 completed 2026-02-16 (schema migration + F# types + offline sync)
- Phase 9 completed 2026-02-16 (UI layout with date nav + view switching, 13min total)
- Phase 10 completed 2026-02-16 (multi-record CRUD, 17min total, 18/18 must-haves verified)
- Phase 11 completed 2026-02-16 (calendar integration, 6min total, 4/4 must-haves verified)
- Phase 12 completed 2026-02-16 (detail views, 7min total, 8/8 must-haves verified)
- Phase 13 completed 2026-02-16 (photo gallery, 6min total, 7/7 must-haves verified)
- Phase 14 started 2026-02-16 (admin & audit, plan 01: 2min, 1/1 tasks complete)

*Updated: 2026-02-16 after Phase 14 Plan 01 completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **DATE 타입 workout_date**: timezone 혼란 방지 (v1.0)
- **browser-image-compression**: 클라이언트 압축 max 1MB (v1.0)
- **IndexedDB + Background Sync**: 오프라인 지원 (v1.0)
- **launchd 자동 시작**: Mac Mini 부팅 시 서비스 시작 (v1.1)
- **Blue-green schema migration**: workouts → workouts_v1_backup, 7-day retention (v2.0 Phase 8)
- **BIGSERIAL id PRIMARY KEY**: Replaces composite (user_id, workout_date) for multiple records per day (v2.0 Phase 8)
- **record_type CHECK constraint**: Enforces workout/text/photo values at database level (v2.0 Phase 8)
- **Soft delete with deleted_at**: Enables undo functionality in v2.0 UI (v2.0 Phase 8)
- **Remove onConflict pattern**: Simple insert replaces upsert for multi-record support (v2.0 Phase 8)
- **IndexedDB queue v2**: Clear v1 queue on upgrade (safe for ~20 beta users) (v2.0 Phase 8)
- **Fable F#→JS**: Always edit .fs source files, never .js compiled output (v2.0 Phase 8)
- **Cloudflare Tunnel config mode**: Use local config.yml instead of --token for ingress rules (v2.0 Phase 8)
- **Date navigation pattern**: Reuse proven ProgressView/TeamView pattern for year rollover (v2.0 Phase 9)
- **Mobile-first layout**: Single-row flexbox with short button text to prevent wrapping on 375px screens (v2.0 Phase 9)
- **ViewScope discriminated union**: Personal | TeamView for type-safe view selection (avoids collision with TabMode's Team) (v2.0 Phase 9)
- **Default to Personal view**: 나 tab selected by default — matches user expectation for personal-first (v2.0 Phase 9)
- **Props lifting for date state**: Dashboard owns currentYear/currentMonth, passes as read-only props to ProgressView/TeamView (v2.0 Phase 9)
- **No setter props pattern**: Child components receive state as props but NOT setters — parent controls all mutations (v2.0 Phase 9)
- **RecordEditState state machine**: 7-case DU for CRUD modal workflows — pattern matching enables compile-time exhaustiveness (v2.0 Phase 10)
- **Separate CRUD API functions**: createTextRecord, createPhotoRecord, updateWorkoutById — type safety over polymorphism (v2.0 Phase 10)
- **Owner-only edit/delete UI**: Edit/Delete buttons only visible when record.user_id = currentUserId (REC-06 requirement) (v2.0 Phase 10)
- **Modal delegation pattern**: Modal handles UI, parent handles API calls via callbacks — separation of concerns (v2.0 Phase 10)
- **Text labels for record types**: Use 운동/메모/사진 instead of emoji icons for mobile compatibility (v2.0 Phase 10)
- **PhotoUpload URL fetch order**: Fetch signed URL before creating record (finalUrl stored in photo_url field) (v2.0 Phase 10)
- **Modal rendering location**: Modal match block added after tab content, inside Html.main children for global z-index (v2.0 Phase 10)
- **Optimistic delete with rollback**: Update local state immediately, delete on server, rollback if error (v2.0 Phase 10)
- **CalendarViewState DU pattern**: CalendarView | DailyDetailView for drill-down navigation (v2.0 Phase 11)
- **Module-qualified component calls**: Components.Module.Component avoids DU case name collision (v2.0 Phase 11)
- **Empty userId for team views**: Team calendar uses userId="" to hide owner-specific edit/delete buttons (v2.0 Phase 11)
- **Reset view state on month change**: Prevents stale detail view when navigating calendar months (v2.0 Phase 11)
- **Team day grouping by user**: UserRecordGroup type aggregates records with profile lookup fallback chain (v2.0 Phase 12)
- **Record type badge colors**: workout=green, text=blue, photo=purple for visual consistency (v2.0 Phase 12)
- **Count multiplier cap**: Display ×99+ for counts ≥ 100 to prevent UI overflow (v2.0 Phase 12)
- **Three-level CalendarViewState**: CalendarView | DailyDetailView | UserDetailView for nested team navigation (v2.0 Phase 12)
- **Client-side user record filtering**: Array.filter on selectedDateRecords avoids extra API call for drill-down (v2.0 Phase 12)
- **Dynamic property access for DOM**: Use `?` operator for Fable JS interop when Browser.Dom types don't expose properties (v2.0 Phase 13)
- **stopPropagation pattern**: Prevent event bubbling for nested click handlers (modal overlay vs image) (v2.0 Phase 13)
- **Curried callback pattern**: Pass photo URL handler to child components for state lifting (v2.0 Phase 13)
- **AFTER triggers for audit logging**: Capture final state after all trigger chains execute (v2.0 Phase 14)
- **JSONB for audit snapshots**: Schema-flexible change tracking, queryable with -> operators (v2.0 Phase 14)
- **BRIN index for time-series**: 90% smaller than B-tree for monotonically increasing timestamp (v2.0 Phase 14)
- **SECURITY DEFINER for auth.users lookup**: Enable email capture without granting direct table access (v2.0 Phase 14)
- **pg_trigger_depth() recursion guard**: Prevent infinite loop if triggers added to audit table (v2.0 Phase 14)
- **gen_random_uuid() for workouts audit**: workouts.id is BIGSERIAL, audit.record_id is UUID for consistency (v2.0 Phase 14)

### Pending Todos

None.

### Blockers/Concerns

**Phase 8 (Schema Migration) — COMPLETE:**
- ✅ Blue-green migration applied to production (1 row migrated)
- ✅ RLS 정책 업데이트 완료 (3 policies)
- ✅ F# types updated (WorkoutRecord 9 fields, QueuedOperation 10 fields)
- ✅ Frontend API updated (onConflict removed, soft-delete support)
- ✅ IndexedDB queue v2 with upgrade handler
- ✅ Offline sync updated (simple insert, soft delete)
- ✅ Build succeeds, online flow verified

**Phase 9 (UI Layout & Navigation) — COMPLETE:**
- ✅ Plan 01: Date navigation with year rollover (4 min)
- ✅ Plan 02: View scope tab switcher 나/우리 (3 min)
- ✅ Plan 03: Content area switching with lifted date state (6 min)
- **Total:** 13 minutes, 3 plans

**Phase 10 (Multi-Record CRUD Operations) — COMPLETE:**
- ✅ Plan 01: Backend API & UI State (1 min) — RecordEditState DU + 3 CRUD functions
- ✅ Plan 02: RecordItem & RecordEditModal Components (13 min) — UI components for display and editing
- ✅ Plan 03: Dashboard integration with CRUD workflows (3 min) — PhotoUpload creates photo records, 3 action buttons, records list, modal workflow
- **Total:** 17 minutes, 3 plans, 18/18 must-haves verified

**Phase 11 (Calendar Integration) — COMPLETE:**
- ✅ Plan 01: Count badges + DailyDetailView component (3 min)
- ✅ Plan 02: ProgressView/TeamView calendar drill-down (3.3 min)
- ✅ Plan 03: Human verification checkpoint (approved)
- **Total:** 6 minutes, 3 plans, 4/4 must-haves verified

**Phase 12 (Detail Views) — COMPLETE:**
- ✅ Plan 01: TeamDayDetailView with user grouping and type badges (4 min)
- ✅ Plan 02: TeamView three-level navigation + human verification (3 min)
- **Total:** 7 minutes, 2 plans, 8/8 must-haves verified

**Phase 13 (Photo Gallery) — COMPLETE:**
- ✅ Plan 01: PhotoModal component + RecordItem onPhotoClick (3 min)
- ✅ Plan 02: Wire PhotoModal to DailyDetailView, TeamView, Dashboard (3 min)
- **Total:** 6 minutes, 2 plans, 7/7 must-haves verified

**Phase 14 (Admin & Audit) — IN PROGRESS:**
- ✅ Plan 01: Audit Infrastructure (2 min) — audit.record_version table, log_change() trigger function, 3 table triggers
- **Total so far:** 2 minutes, 1/4 plans complete

**Research flags:**
- Phase 14 (Admin Audit): 트리거 성능 이슈 발생 시 추가 연구 필요
- Phase 10-14 (Offline Sync): 복수 기록 충돌 해결 전략 필요 시 CRDT/OT 연구

## Session Continuity

Last session: 2026-02-16
Stopped at: Completed 14-01-PLAN.md (Audit Infrastructure)
Resume file: None

---

**Next step:** Execute 14-02-PLAN.md (Admin UI for role management and audit viewing)
