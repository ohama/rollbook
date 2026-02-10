# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-10)

**Core value:** 원탭 운동 기록 — 앱을 열고 "오늘 운동했다" 버튼 하나로 기록 완료
**Current focus:** Phase 6 - Production Ready

## Current Position

Phase: 6 of 6 (Production Ready)
Plan: 8 of 8
Status: Phase complete ✅
Last activity: 2026-02-10 — Completed 06-08-PLAN.md (Production ready tutorial)

Progress: [████████████████████████████] All phases complete! (35/35 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 35
- Average duration: 2.7min
- Total execution time: 1.68 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan | Status |
|-------|-------|-------|----------|--------|
| 01-foundation | 6 | 19min | 3.2min | ✅ Complete |
| 02-core-loop | 5 | 12min | 2.4min | ✅ Complete |
| 03-progress-tracking | 4 | 12min | 3.0min | ✅ Complete |
| 04-team-features | 6 | 10min | 1.7min | ✅ Complete |
| 05-photo-upload | 7 | 24min | 3.4min | ✅ Complete |
| 06-production-ready | 8 | 30min | 3.8min | ✅ Complete |

**Recent Trend:**
- Last 7 plans: 06-03 (2min), 06-04 (4min), 06-05 (5min), 06-06 (2min), 06-07 (4min), 06-08 (7min)
- Trend: Phase 6 complete! All 35 plans executed successfully across 6 phases

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
- **05-04**: Promise.all for parallel signed URL generation (O(1) vs O(n) time)
- **05-04**: Photo filtering by extension (.jpg, .jpeg, .png, .webp)
- **05-04**: Korean date formatting (YYYY년 M월 D일) for photo overlays
- **05-04**: Grid layout: 2 cols mobile, 3 cols desktop (grid-cols-2 md:grid-cols-3)
- **05-03**: Async computation expression with Async.AwaitPromise for JS Promise interop
- **05-03**: Qualified Result.Ok/Result.Error patterns to avoid DU name collision with PhotoUploadState.Error
- **05-03**: File input overlay pattern (hidden input with visible button) for custom styling
- **05-03**: capture="environment" attribute opens rear camera on mobile devices
- **05-03**: Empty string URL on Success state if signed URL fails (upload still succeeded)
- **05-03**: Retry button in Error state resets to Idle for easy re-attempt
- **05-05**: refreshKey pattern for component re-fetch triggering (int state + useEffect dependency)
- **05-05**: Photo upload callback increments refreshKey to trigger WorkoutToggle refresh
- **05-05**: Home tab layout: Welcome → WorkoutToggle → Photo upload → Photo gallery
- **05-06**: SQL RLS tests require BEGIN/COMMIT transactions for SET LOCAL to work
- **05-06**: Storage API enforces deletion via trigger (prevents direct SQL DELETE) for data safety
- **05-06**: RLS testing pattern: BEGIN + SET LOCAL ROLE + SET LOCAL request.jwt.claims + test query + COMMIT
- **05-07**: Tutorial structure: 개요, 아키텍처, 핵심 개념, 중요 코드, 배운 점, 흔한 실수, 테스트, 다음 단계 (consistent with Phase 3-4)
- **05-07**: Comprehensive Korean tutorials: 1633 lines with 3+ Mermaid diagrams for visual learning
- **05-07**: Documentation covers all implementation details with beginner-friendly explanations and real code examples
- **06-01**: vite-plugin-pwa with Workbox for PWA infrastructure (official plugin, auto SW generation)
- **06-01**: registerType autoUpdate for seamless PWA updates without user prompt
- **06-01**: Three-tier Workbox caching: NetworkFirst (API, 5min), NetworkOnly (auth), StaleWhileRevalidate (images, 24hr)
- **06-01**: Service worker disabled in dev mode (devOptions.enabled: false) to avoid caching issues
- **06-01**: [<Emit("navigator")>] attribute for global navigator access in F# (Browser.Dom unavailable)
- **06-01**: ImageMagick for MVP icon generation with "RB" text (placeholder, can replace with designer icons)
- **06-01**: PhotoUploadState constructor qualification (PhotoUploadState.Success) to resolve ambiguity with AdminResult.Success
- **06-02**: user_roles table with composite primary key (user_id, role) for RBAC and future multi-role support
- **06-02**: is_admin() function as SECURITY DEFINER STABLE for RLS policy optimization (~95% performance gain)
- **06-02**: Manual admin role assignment via SQL INSERT for MVP (no UI yet, per research recommendation)
- **06-02**: Separate DELETE policy for profiles (admin-only, clearer than merged policy)
- **06-02**: AdminResult<'T> DU for type-safe admin operation handling (Success | NotAdmin | Error)
- **06-03**: idb library (promise-based wrapper) over raw IndexedDB API for cleaner F# promise interop
- **06-03**: OperationType as F# DU but serialize as string for IndexedDB compatibility
- **06-03**: Auto-increment ID from IndexedDB for unique operation IDs (vs client-side ID generation)
- **06-03**: retryCount field for exponential backoff tracking in future sync operations
- **06-03**: timestamp field (JS Date.now()) enables ordering operations by queue time (FIFO sync)
- **06-04**: DeleteTarget record bridges userId callback and displayName modal need
- **06-04**: refreshKey pattern for auto-reload after mutations (int state + useEffect dependency)
- **06-04**: AdminState DU for role-based UI rendering (Loading, NotAdmin, Ready, Error)
- **06-04**: Promise.start for fire-and-forget async (consistent with Dashboard/ProgressView pattern)
- **06-05**: Background Sync API with feature detection for Chromium browsers
- **06-05**: Visibility change + online events as universal fallback (covers Safari/Firefox)
- **06-05**: Optimistic UI updates for offline operations (immediate feedback, matches online behavior)
- **06-05**: Emit attribute for navigator access (consistent with 06-01 service worker pattern)
- **06-05**: React useEffect cleanup via IDisposable (not unit -> unit)
- **06-05**: OfflineIndicator polls pending count every 2 seconds when offline
- **06-06**: Manual chunks for vendor libraries (react, supabase, idb) enable better caching
- **06-06**: Terser minification with drop_console removes debug logs from production
- **06-06**: Bundle visualizer shows gzipSize and brotliSize for realistic transfer analysis
- **06-06**: Security audit via migration review when Supabase CLI unavailable
- **06-07**: Node environment over jsdom for file-based integration tests (avoids Tailwind ESM conflicts)
- **06-07**: Test organization mirrors Phase 6 feature areas (PWA, Offline, Admin, Bundle, Security)
- **06-07**: File content validation for static configuration (vite.config.js, migrations, F# modules)
- **06-07**: 34 tests provide regression protection for all production readiness features
- **06-08**: Tutorial structure follows Phase 3-5 pattern for consistency (8 sections, Korean throughout)
- **06-08**: 2029-line comprehensive tutorial with 4 Mermaid diagrams (system, PWA lifecycle, offline flow, RBAC)
- **06-08**: 6 core concepts documented: PWA, offline-first, background sync, admin RBAC, bundle optimization, security audit
- **06-08**: Deployment guide with Vercel/Netlify options, monitoring setup, operations checklist

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-10
Stopped at: Completed 06-08-PLAN.md (Final plan)
Resume file: None
Next: All phases complete! Ready for deployment 🚀

---
*Last updated: 2026-02-10*
