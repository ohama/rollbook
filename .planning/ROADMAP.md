# Roadmap: Rollbook

## Overview

Rollbook delivers a privacy-first workout tracking app for small teams in 6 phases. Starting with secure foundation (database + auth), building the core one-tap logging loop, adding progress views and team stats, then enhancing with photo uploads, offline PWA capabilities, and admin tools. Each phase delivers a complete, verifiable capability that builds toward the core value: "원탭 운동 기록 — 앱을 열고 '오늘 운동했다' 버튼 하나로 기록 완료."

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Database schema, RLS security, authentication
- [x] **Phase 2: Core Loop** - One-tap workout logging (core value proposition)
- [x] **Phase 3: Progress Tracking** - Personal calendar, stats, history views
- [x] **Phase 4: Team Features** - Team workout visibility (members can view each other's records)
- [x] **Phase 5: Photo Upload** - Photo-based workout logging
- [ ] **Phase 6: Production Ready** - Offline PWA, admin tools, performance optimization

## Phase Details

### Phase 1: Foundation
**Goal**: Secure backend infrastructure with user authentication
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, TECH-01
**Success Criteria** (what must be TRUE):
  1. User can create account with email/password (AUTH-01)
  2. User receives verification email and can verify account (AUTH-02)
  3. User can reset forgotten password via email (AUTH-03)
  4. User stays logged in across browser sessions (AUTH-04)
  5. App works on mobile and desktop (responsive UI) (TECH-01)
  6. Database has RLS enabled on all tables (security foundation)
**Plans**: 6 plans

Plans:
- [x] 01-01-PLAN.md — Initialize Fable + Vite + Tailwind project structure
- [x] 01-02-PLAN.md — Initialize Supabase local development with RLS-enabled schema
- [x] 01-03-PLAN.md — Create F# bindings for Supabase Auth SDK
- [x] 01-04-PLAN.md — Create responsive auth UI components (Login, Signup, Password Reset)
- [x] 01-05-PLAN.md — Integrate auth state management and route protection in main app
- [x] 01-06-PLAN.md — Human verification of complete Phase 01 authentication flow

### Phase 2: Core Loop
**Goal**: One-tap workout logging (core value delivery)
**Depends on**: Phase 1
**Requirements**: WORK-01, WORK-02, WORK-03, WORK-05, DOCS-01
**Success Criteria** (what must be TRUE):
  1. User can toggle "오늘 운동했다" with one tap to create/delete today's record (WORK-01)
  2. User can log workout for any date (not just today) (WORK-05)
  3. User can edit existing workout records (WORK-02)
  4. User can delete workout records (WORK-03)
  5. Workout record per day is enforced (no duplicates for same user+date)
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — Create workouts table with RLS policies
- [x] 02-02-PLAN.md — Create F# bindings for Supabase workout CRUD operations
- [x] 02-03-PLAN.md — Implement one-tap workout toggle UI on Dashboard
- [x] 02-04-PLAN.md — Human verification of core loop functionality
- [x] 02-05-PLAN.md — Write Phase 2 tutorial (tutorial/02-core-loop.md)

### Phase 3: Progress Tracking
**Goal**: Personal progress views (calendar, stats, history)
**Depends on**: Phase 2
**Requirements**: PROG-01, PROG-02, PROG-03
**Success Criteria** (what must be TRUE):
  1. User can view workout history in monthly calendar format (PROG-01)
  2. User can view workout history as a list (PROG-02)
  3. User can see monthly workout count statistics (PROG-03)
  4. User can navigate between months in both views
**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md — Create DateHelpers and Calendar component with month navigation
- [x] 03-02-PLAN.md — Build WorkoutList and MonthlyStats components
- [x] 03-03-PLAN.md — Integrate ProgressView with multi-view toggle into Dashboard
- [x] 03-04-PLAN.md — Human verification of progress tracking functionality
- [x] 03-05-PLAN.md — Write Phase 3 tutorial (tutorial/03-progress-tracking.md)

### Phase 4: Team Features
**Goal**: Team workout visibility (members can view each other's workout records)
**Depends on**: Phase 3
**Requirements**: TEAM-01, DOCS-01
**Success Criteria** (what must be TRUE):
  1. User can view team roster (all members)
  2. User can see each team member's monthly workout count (TEAM-01)
  3. User can see other members' workout dates, photos, or notes (team visibility via RLS)
  4. Team stats update immediately when workouts logged
**Plans**: 6 plans

Plans:
- [x] 04-01-PLAN.md — Update RLS policies for team visibility (workouts + profiles)
- [x] 04-02-PLAN.md — Create F# bindings for team API (Types.fs + Team.fs)
- [x] 04-03-PLAN.md — Build TeamView page with month navigation and roster display
- [x] 04-04-PLAN.md — Integrate Team tab into Dashboard navigation
- [x] 04-05-PLAN.md — Human verification of team features and privacy
- [x] 04-06-PLAN.md — Write Phase 4 tutorial (tutorial/04-team-features.md)

### Phase 5: Photo Upload
**Goal**: Photo-based workout logging
**Depends on**: Phase 4
**Requirements**: WORK-04
**Success Criteria** (what must be TRUE):
  1. User can upload photo from mobile/desktop
  2. Photo upload automatically creates workout record for today (WORK-04)
  3. User can view their own uploaded photos (storage with RLS)
  4. User CANNOT access other users' photos (storage RLS enforced)
  5. Photo uploads show progress indicator
**Plans**: 7 plans

Plans:
- [x] 05-01-PLAN.md — Create storage bucket migration with RLS policies
- [x] 05-02-PLAN.md — Install browser-image-compression and create Storage.fs bindings
- [x] 05-03-PLAN.md — Create PhotoUpload component with progress indicator
- [x] 05-04-PLAN.md — Create PhotoGallery component for viewing photos
- [x] 05-05-PLAN.md — Integrate photo upload into Dashboard (auto-creates workout)
- [x] 05-06-PLAN.md — Automated verification of photo features and RLS
- [x] 05-07-PLAN.md — Write Phase 5 tutorial (tutorial/05-photo-upload.md)

### Phase 6: Production Ready
**Goal**: Offline capability, admin tools, production hardening
**Depends on**: Phase 5
**Requirements**: TECH-02, TECH-03, ADMN-01, ADMN-02
**Success Criteria** (what must be TRUE):
  1. User can log workouts while offline, syncs when online (TECH-02)
  2. User can install app to home screen (PWA) (TECH-03)
  3. App works offline with service worker
  4. Admin can view member list (ADMN-01)
  5. Admin can delete members (ADMN-02)
  6. App bundle size optimized (<500KB initial load)
  7. Security audit passed (Supabase Security Advisor)
**Plans**: TBD

Plans:
- [ ] TBD during phase planning

## Documentation Requirement

**DOCS-01**: Each phase ends with a tutorial plan
- **Location**: `tutorial/{phase}-{name}.md` (예: `tutorial/02-core-loop.md`)
- **Language**: 한글
- **Audience**: 초보 개발자
- **Content**: 개념 위주 설명, 중요 코드 포함, UML 다이어그램 활용
- **Timing**: Phase의 마지막 Plan으로 튜토리얼 작성

Each phase planning must include a final plan for writing the tutorial that covers all concepts from that phase.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 6/6 | ✅ Complete | 2026-02-10 |
| 2. Core Loop | 5/5 | ✅ Complete | 2026-02-10 |
| 3. Progress Tracking | 5/5 | ✅ Complete | 2026-02-10 |
| 4. Team Features | 6/6 | ✅ Complete | 2026-02-10 |
| 5. Photo Upload | 7/7 | ✅ Complete | 2026-02-10 |
| 6. Production Ready | 0/? | Not started | - |

---
*Roadmap created: 2026-02-10*
*Last updated: 2026-02-10 (Phase 5 complete)*
