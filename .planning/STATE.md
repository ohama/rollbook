# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-15)

**Core value:** 원탭 운동 기록 — 앱을 열고 "오늘 운동했다" 버튼 하나로 기록 완료
**Current focus:** Phase 10 - Multi-Record CRUD Operations

## Current Position

Phase: 10 of 14 (Multi-Record CRUD Operations)
Plan: 3 of 4 complete
Status: In progress
Last activity: 2026-02-15 — Completed 10-03-PLAN.md (Dashboard Integration)

Progress: [█████████████░░░░░░░] 62% (v1.0 + v1.1 complete, v2.0 Phase 8-9 complete, Phase 10 in progress)

## Performance Metrics

**Velocity:**
- Total plans completed: 56 (Phases 1-9 complete, Phase 10 in progress)
- Average duration: ~38 min (weighted average including Phase 9-10)

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
| 10. Multi-Record CRUD | 3/4 | ~17min | ~5.7min |

**Recent Trend:**
- v1.0 + v1.1 shipped in 6 days (2026-02-10 → 2026-02-15)
- Phase 8 completed 2026-02-16 (schema migration + F# types + offline sync)
- Phase 9 completed 2026-02-16 (UI layout with date nav + view switching, 13min total)
- Phase 10 started 2026-02-15 (multi-record CRUD operations, backend foundation)

*Updated: 2026-02-15 after Phase 10 Plan 03 completion*

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

**Phase 10 (Multi-Record CRUD Operations) — IN PROGRESS:**
- ✅ Plan 01: Backend API & UI State (1 min) — RecordEditState DU + 3 CRUD functions
- ✅ Plan 02: RecordItem & RecordEditModal Components (13 min) — UI components for display and editing
- ✅ Plan 03: Dashboard integration with CRUD workflows (3 min) — PhotoUpload creates photo records, 3 action buttons, records list, modal workflow
- ⏳ Plan 04: Delete & list refresh

**Research flags:**
- Phase 14 (Admin Audit): 트리거 성능 이슈 발생 시 추가 연구 필요
- Phase 10-14 (Offline Sync): 복수 기록 충돌 해결 전략 필요 시 CRDT/OT 연구

## Session Continuity

Last session: 2026-02-15
Stopped at: Completed 10-03-PLAN.md (Dashboard Integration) — Phase 10 Plan 03 complete
Resume file: None

---

**Next step:** Phase 10 Plan 04 - Delete & list refresh (final plan in Phase 10)
