# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-10)

**Core value:** 원탭 운동 기록 — 앱을 열고 "오늘 운동했다" 버튼 하나로 기록 완료
**Current focus:** Phase 2 - Core Loop

## Current Position

Phase: 2 of 6 (Core Loop)
Plan: 3 of ? (in progress)
Status: In progress
Last activity: 2026-02-10 — Completed 02-03-PLAN.md

Progress: [██████████░░░░░░░░░░] Phase 1 complete, Phase 2 in progress

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 2.7min
- Total execution time: 0.42 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan | Status |
|-------|-------|-------|----------|--------|
| 01-foundation | 6 | 19min | 3.2min | ✅ Complete |
| 02-core-loop | 3 | 6min | 2.0min | 🔄 In progress |

**Recent Trend:**
- Last 6 plans: 01-04 (3min), 01-05 (2min), 01-06 (manual), 02-01 (2min), 02-02 (2min), 02-03 (2min)
- Trend: Consistent 2min execution, Phase 2 maintaining excellent velocity

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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-10
Stopped at: Completed 02-03-PLAN.md
Resume file: None
Next: Continue Phase 2 Core Loop

---
*Last updated: 2026-02-10*
