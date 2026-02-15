# Roadmap: Rollbook

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-02-10)
- ✅ **v1.1 Local Deployment** - Phase 7 (shipped 2026-02-15)
- 🚧 **v2.0 UI Refactoring** - Phases 8-14 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-6) - SHIPPED 2026-02-10</summary>

### Phase 1: Authentication & Email
**Goal**: Users can create accounts and authenticate
**Plans**: 6 plans

Plans:
- [x] 01-01: Email/password signup with Supabase Auth
- [x] 01-02: Email verification flow
- [x] 01-03: Password reset via email
- [x] 01-04: Session persistence
- [x] 01-05: Login/logout UI
- [x] 01-06: Tutorial documentation

### Phase 2: Workout Recording
**Goal**: Users can record daily workouts with one tap
**Plans**: 6 plans

Plans:
- [x] 02-01: Workout toggle button
- [x] 02-02: Database schema for workouts
- [x] 02-03: RLS policies
- [x] 02-04: Optimistic UI updates
- [x] 02-05: Integration with Auth
- [x] 02-06: Tutorial documentation

### Phase 3: Personal Progress
**Goal**: Users can view their workout history and stats
**Plans**: 7 plans

Plans:
- [x] 03-01: Calendar view
- [x] 03-02: List view
- [x] 03-03: Monthly workout count
- [x] 03-04: Navigation between months
- [x] 03-05: Empty states
- [x] 03-06: Loading states
- [x] 03-07: Tutorial documentation

### Phase 4: Team Statistics
**Goal**: Users can see team members' workout counts
**Plans**: 7 plans

Plans:
- [x] 04-01: Team member list
- [x] 04-02: Monthly workout counts per member
- [x] 04-03: Team view UI
- [x] 04-04: Privacy-preserving RLS
- [x] 04-05: Team navigation
- [x] 04-06: Empty/loading states
- [x] 04-07: Tutorial documentation

### Phase 5: Photo Storage
**Goal**: Users can upload photos to create workout records
**Plans**: 8 plans

Plans:
- [x] 05-01: Photo upload UI
- [x] 05-02: Image compression
- [x] 05-03: Supabase Storage integration
- [x] 05-04: Auto-create workout record on upload
- [x] 05-05: Photo gallery (private)
- [x] 05-06: RLS for storage buckets
- [x] 05-07: Error handling
- [x] 05-08: Tutorial documentation

### Phase 6: Admin & Offline
**Goal**: Admin can manage members, app works offline
**Plans**: 8 plans

Plans:
- [x] 06-01: Admin role detection
- [x] 06-02: Member deletion UI
- [x] 06-03: PWA setup
- [x] 06-04: Service Worker
- [x] 06-05: IndexedDB queue
- [x] 06-06: Background Sync
- [x] 06-07: Offline indicator
- [x] 06-08: Tutorial documentation

</details>

<details>
<summary>✅ v1.1 Local Deployment (Phase 7) - SHIPPED 2026-02-15</summary>

### Phase 7: Mac Mini Deployment
**Goal**: Production deployment on Mac Mini via Cloudflare Tunnel
**Plans**: 6 plans

Plans:
- [x] 07-01: Cloudflare Tunnel setup
- [x] 07-02: Custom domain HTTPS
- [x] 07-03: launchd auto-startup
- [x] 07-04: Production environment config
- [x] 07-05: Health checks
- [x] 07-06: Deployment tutorial

</details>

## 🚧 v2.0 UI Refactoring (In Progress)

**Milestone Goal:** UI 전면 개편 — 날짜 네비게이션, 나/우리 탭, 하루 복수 기록, 텍스트/사진 기록, 관리자 확장

### Phase 8: Schema Migration
**Goal**: Database schema supports multiple records per day without data loss
**Depends on**: Phase 7 (completed)
**Requirements**: MIG-01, MIG-02
**Success Criteria** (what must be TRUE):
  1. 기존 운동 기록 전부가 손실 없이 새 스키마로 이전된다
  2. 하루에 여러 번 운동을 기록할 수 있다 (UNIQUE 제약 제거됨)
  3. 오프라인 큐가 새 스키마와 호환된다 (백그라운드 동기화 정상 작동)
  4. RLS 정책이 새 스키마에서 정상 작동한다 (본인 기록만 수정/삭제 가능)
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md — Database schema migration with blue-green pattern
- [ ] 08-02-PLAN.md — Frontend types and API updates (remove onConflict)
- [ ] 08-03-PLAN.md — Offline sync logic migration and verification

### Phase 9: UI Layout & Navigation
**Goal**: Users can navigate dates and switch between "나/우리" tabs
**Depends on**: Phase 8
**Requirements**: UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. 사용자가 이전/다음 달 버튼으로 월을 탐색할 수 있다
  2. 화면 상단에 날짜 네비게이션(< 년월일 >)이 1줄로 표시된다
  3. 나/우리 탭을 클릭하면 선택된 탭이 강조색으로 변한다
  4. 탭 선택에 따라 콘텐츠 영역이 나의 기록 / 우리 기록으로 전환된다
**Plans**: TBD

Plans:
- [ ] 09-01: [To be planned]

### Phase 10: Multi-Record CRUD
**Goal**: Users can create, edit, and delete multiple workout records per day
**Depends on**: Phase 9
**Requirements**: REC-01, REC-02, REC-03, REC-04, REC-05, REC-06, REC-07
**Success Criteria** (what must be TRUE):
  1. 하루에 여러 번 운동을 기록할 수 있다 (버튼 클릭 시 기록 추가)
  2. 운동 기록에 텍스트 메모를 입력할 수 있다
  3. 운동 기록에 사진을 첨부할 수 있다
  4. 본인의 기록에만 수정/삭제 아이콘이 표시된다
  5. 수정/삭제 아이콘 클릭 시 해당 기록을 수정하거나 삭제할 수 있다
**Plans**: TBD

Plans:
- [ ] 10-01: [To be planned]

### Phase 11: Calendar Integration
**Goal**: Calendar displays record counts and navigates to daily detail view
**Depends on**: Phase 10
**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05
**Success Criteria** (what must be TRUE):
  1. 달력 각 날짜에 운동 기록 횟수가 표시된다
  2. "나" 탭에서 나의 달력이 보이고, "우리" 탭에서 팀 전체 달력이 보인다
  3. 달력 날짜를 클릭하면 해당 날의 기록 상세 내용이 표시된다
  4. 상세 화면에서 되돌아가기 아이콘으로 달력으로 복귀할 수 있다
**Plans**: TBD

Plans:
- [ ] 11-01: [To be planned]

### Phase 12: Detail Views
**Goal**: Users can drill down into daily records for themselves and team members
**Depends on**: Phase 11
**Requirements**: DET-01, DET-02, DET-03, DET-04
**Success Criteria** (what must be TRUE):
  1. "나" 선택 시 해당 날의 나의 모든 기록(텍스트/사진 포함)이 보인다
  2. "우리" 선택 시 해당 날의 이름(횟수) 목록이 보인다
  3. "우리"에서 이름 클릭 시 그 사람의 해당 날 기록 내용이 보인다
  4. 기록이 1개면 텍스트/사진 아이콘, 여러 개면 아이콘(횟수)로 표시된다
**Plans**: TBD

Plans:
- [ ] 12-01: [To be planned]

### Phase 13: Photo Gallery
**Goal**: Photos display as thumbnails and expand to full size on click
**Depends on**: Phase 10 (can be parallel with Phases 11-12)
**Requirements**: PHO-01, PHO-02, PHO-03
**Success Criteria** (what must be TRUE):
  1. 사진이 썸네일 크기로 보여진다 (로딩 성능 최적화)
  2. 사진 클릭 시 원래 크기로 확대되어 보인다
  3. 확대된 사진을 다시 클릭하면 썸네일로 돌아간다
**Plans**: TBD

Plans:
- [ ] 13-01: [To be planned]

### Phase 14: Admin & Audit
**Goal**: Multiple admins can manage members/records with audit logging and undo
**Depends on**: Phase 12
**Requirements**: ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06, ADM-07, ADM-08, ADM-09
**Success Criteria** (what must be TRUE):
  1. 관리자가 다른 사람을 관리자로 지정할 수 있다
  2. 관리자가 회원을 삭제할 수 있다
  3. 관리자가 회원의 기록을 삭제할 수 있다
  4. 관리자의 모든 행동이 감사 로그에 기록된다
  5. 관리자 페이지에서 최근 수정 내용 목록을 볼 수 있다
  6. 관리자가 삭제한 기록을 복구할 수 있다
**Plans**: TBD

Plans:
- [ ] 14-01: [To be planned]

## Progress

**Execution Order:**
Phases execute in numeric order: 8 → 9 → 10 → 11 → 12 → 13 → 14

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Authentication & Email | v1.0 | 6/6 | Complete | 2026-02-10 |
| 2. Workout Recording | v1.0 | 6/6 | Complete | 2026-02-10 |
| 3. Personal Progress | v1.0 | 7/7 | Complete | 2026-02-10 |
| 4. Team Statistics | v1.0 | 7/7 | Complete | 2026-02-10 |
| 5. Photo Storage | v1.0 | 8/8 | Complete | 2026-02-10 |
| 6. Admin & Offline | v1.0 | 8/8 | Complete | 2026-02-10 |
| 7. Mac Mini Deployment | v1.1 | 6/6 | Complete | 2026-02-15 |
| 8. Schema Migration | v2.0 | 0/3 | Ready to execute | - |
| 9. UI Layout & Navigation | v2.0 | 0/TBD | Not started | - |
| 10. Multi-Record CRUD | v2.0 | 0/TBD | Not started | - |
| 11. Calendar Integration | v2.0 | 0/TBD | Not started | - |
| 12. Detail Views | v2.0 | 0/TBD | Not started | - |
| 13. Photo Gallery | v2.0 | 0/TBD | Not started | - |
| 14. Admin & Audit | v2.0 | 0/TBD | Not started | - |

---
*Last updated: 2026-02-15 — v2.0 roadmap created*
