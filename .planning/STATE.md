# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-10)

**Core value:** 원탭 운동 기록 — 앱을 열고 "오늘 운동했다" 버튼 하나로 기록 완료
**Current focus:** Phase 5 - Photo Upload

## Current Position

Phase: 5 of 6 (Photo Upload)
Plan: 2 of ? (in progress)
Status: In progress
Last activity: 2026-02-10 — Completed 05-02-PLAN.md

Progress: [████████████████████░░░░░] Phase 1-4 complete, Phase 5 in progress

## Performance Metrics

**Velocity:**
- Total plans completed: 23
- Average duration: 2.5min
- Total execution time: 0.95 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan | Status |
|-------|-------|-------|----------|--------|
| 01-foundation | 6 | 19min | 3.2min | ✅ Complete |
| 02-core-loop | 5 | 12min | 2.4min | ✅ Complete |
| 03-progress-tracking | 4 | 12min | 3.0min | ✅ Complete |
| 04-team-features | 6 | 10min | 1.7min | ✅ Complete |
| 05-photo-upload | 2 | 5min | 2.5min | 🚧 In progress |

**Recent Trend:**
- Last 6 plans: 04-03 (2min), 04-04 (1min), 04-05 (X), 04-06 (4min), 05-01 (2min), 05-02 (3min)
- Trend: Phase 5 in progress; consistent execution times

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Fable over TypeScript — F# 타입 안전성 선호
- Supabase over custom backend — Auth/DB/Storage 통합, 빠른 개발
- 사진은 private — 본인 폴더만 접근 가능
- Open signup — 자유 가입 (초대 기반 아님)
- **01-01**: vite-plugin-fable unstable → switched to Fable CLI + concurrently
- **01-01**: React 18 createRoot API for modern rendering
- **01-01**: Tailwind 4.x with new Vite plugin architecture
- **01-02**: RLS enabled from day one per CVE-2025-48757 prevention
- **01-02**: Supabase local development via Docker for fast iteration
- **01-02**: Auto-profile creation via trigger on auth.users insert
- **01-03**: Promise-based async API with unbox<T> for JS interop
- **01-04**: Korean UI text throughout auth pages
- **01-05**: AuthState DU (Loading | Anonymous | Authenticated) for clear state transitions
- **01-06**: Fable 4.28.0 as local dotnet tool (4.25.0 had source file detection bug)
- **01-06**: Supabase createClient binding uses tuple-style args, not curried
- **01-06**: email confirmations enabled in config.toml
- **02-01**: DATE type for workout_date (not TIMESTAMPTZ) - matches calendar-day semantics, no timezone confusion
- **02-01**: Compound primary key (user_id, workout_date) enforces one workout per user per date at DB level
- **02-01**: Four separate RLS policies (not FOR ALL) - clearer intent, easier debugging
- **02-01**: (SELECT auth.uid()) wrapping for ~95% performance improvement via result caching
- **02-02**: workout_date as string (YYYY-MM-DD) not DateTime - matches Supabase DATE serialization
- **02-02**: getTodayDateString uses en-CA locale for consistent YYYY-MM-DD format in local timezone
- **02-02**: upsertWorkout with onConflict for idempotent toggle (handles double-clicks)
- **02-02**: getWorkouts supports optional date filtering for future calendar views
- **02-03**: WorkoutToggle as separate component with userId prop for reusability
- **02-03**: Three separate useState hooks (hasWorkedOut, loading, error) for clear state management
- **02-03**: useEffect with empty deps [||] for mount-only data loading
- **02-03**: Guard clause (if not loading) prevents concurrent toggle operations
- **02-03**: Large emoji buttons (text-8xl) for mobile-first tap targets (💪/⭕)
- **03-01**: JavaScript Date via emitJsExpr for month calculations (getDaysInMonth, getFirstDayOfMonth)
- **03-01**: JS months 0-indexed (subtract 1 when passing to Date constructor)
- **03-01**: formatDateString uses sprintf for YYYY-MM-DD (matches database DATE format)
- **03-01**: CSS Grid grid-column-start for first day positioning (CSS is 1-indexed, add 1 to JS getDay)
- **03-01**: CalendarDay record type separates calculation from rendering logic
- **03-01**: Korean UI text for day headers (일 월 화 수 목 금 토) and month format (YYYY년 M월)
- **03-02**: Array.sortByDescending for chronological ordering in WorkoutList (most recent first)
- **03-02**: prop.key uses workout_date (unique per user, no id field needed)
- **03-02**: Division by zero guard in percentage calculation for defensive programming
- **03-02**: sprintf "%.0f%%" for integer percentage display (cleaner than decimals)
- **03-02**: Placeholder div in WorkoutList for future edit/delete buttons (Phase 3+ ready)
- **03-03**: ViewMode discriminated union (Calendar | List) for type-safe view switching
- **03-03**: Separate useState hooks for each concern (viewMode, year, month, workouts, loading, error)
- **03-03**: useEffect with [| box currentYear; box currentMonth |] for month-based data fetching
- **03-03**: Month navigation handles year rollover (Dec↔Jan) with separate year/month state
- **03-03**: getWorkouts called with calculated startDate/endDate for server-side filtering
- **03-03**: MonthlyStats always visible regardless of view mode
- **03-03**: TabMode (Home | Progress) for dashboard navigation pattern
- **03-05**: Tutorial structure: 개요, 아키텍처, 핵심 개념, 중요 코드, 배운 점, 흔한 실수, 테스트, 다음 단계
- **03-05**: 839-line comprehensive Korean tutorial with 3 Mermaid diagrams
- **03-05**: 6 key concepts: date utilities, CSS Grid, workout indicators, state management, multi-view, navigation
- **03-05**: Lessons learned document real pitfalls (JS month 0-indexing, CSS Grid 1-indexing, useEffect dependencies)
- **04-01**: Team visibility pattern: permissive SELECT with USING (true), restrictive INSERT/UPDATE/DELETE
- **04-01**: Migration timestamp format with full HHMMSS (20260210140000) for proper ordering
- **04-01**: DROP POLICY IF EXISTS for idempotent migration execution
- **04-02**: WorkoutWithProfileRaw.profiles matches Supabase FK join key name
- **04-02**: TeamMemberSummary.WorkoutDates stores dates only (not full records)
- **04-02**: groupWorkoutsByUser includes zero-workout members from allProfiles
- **04-02**: Display name fallback: display_name -> email -> "Unknown"
- **04-03**: member' with apostrophe avoids F# reserved keyword "member"
- **04-03**: TeamViewPage takes no userId prop - shows all team members
- **04-03**: Arrow symbols (<, >) for month navigation (simpler than unicode triangles)
- **04-04**: Team tab positioned after Progress (내 기록) for logical flow: personal first, then team
- **04-04**: TabMode DU extension pattern: add case, import module, add button, add match case
- **04-06**: Tutorial structure follows Phase 3 pattern for consistency
- **04-06**: 1242-line Korean tutorial with 3 Mermaid diagrams
- **04-06**: 6 key concepts documented: RLS, FK joins, groupBy, Option handling, parallel fetch, zero-workout handling
- **04-06**: RLS modification pattern: DROP POLICY IF EXISTS + CREATE POLICY
- **05-01**: Private storage bucket (public = false) for user photo isolation
- **05-01**: Path pattern {user_id}/{date}.jpg enables folder-based RLS
- **05-01**: 5MB file size limit balances quality and storage costs
- **05-01**: MIME types restricted to jpeg/png/webp for security
- **05-01**: Three separate policies (INSERT/SELECT/DELETE) for storage.objects
- **05-01**: storage.foldername(name)[1] extracts user_id from path
- **05-01**: COMMENT statements fail on storage.buckets (system table permissions)
- **05-02**: browser-image-compression for client-side optimization before upload
- **05-02**: Normalize all photos to JPEG, max 1920px, 1MB for consistent storage
- **05-02**: Result types for all storage operations (F# safe handling)
- **05-02**: Progress callback in upload function for UI feedback (0-100%)
- **05-02**: PhotoUploadState DU for state machine UI integration
- **05-02**: Signed URLs for private file access (time-limited URLs)

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-10 06:27:36 UTC
Stopped at: Completed 05-02-PLAN.md (Storage Bindings)
Resume file: None
Next: Continue Phase 5 - Photo Upload (05-03 onwards)

---
*Last updated: 2026-02-10*
