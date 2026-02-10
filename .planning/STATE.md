# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-10)

**Core value:** 원탭 운동 기록 — 앱을 열고 "오늘 운동했다" 버튼 하나로 기록 완료
**Current focus:** Phase 3 - Progress Tracking

## Current Position

Phase: 3 of 6 (Progress Tracking)
Plan: 5 of 5 (phase complete)
Status: Phase complete
Last activity: 2026-02-10 — Completed 03-05-PLAN.md (Phase 3 tutorial)

Progress: [███████████████████░] Phase 1-3 complete

## Performance Metrics

**Velocity:**
- Total plans completed: 15
- Average duration: 2.5min
- Total execution time: 0.71 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan | Status |
|-------|-------|-------|----------|--------|
| 01-foundation | 6 | 19min | 3.2min | ✅ Complete |
| 02-core-loop | 5 | 12min | 2.4min | ✅ Complete |
| 03-progress-tracking | 4 | 12min | 3.0min | ✅ Complete |

**Recent Trend:**
- Last 6 plans: 02-05 (3min), 03-01 (2min), 03-02 (2min), 03-03 (2min), 03-05 (6min)
- Trend: Phase 3 complete with comprehensive documentation

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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-10 04:52:47 UTC
Stopped at: Completed 03-05-PLAN.md (Phase 3 tutorial documentation)
Resume file: None
Next: Begin Phase 4 (Team Features) planning

---
*Last updated: 2026-02-10*
