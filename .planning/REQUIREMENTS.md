# Requirements: Rollbook

**Defined:** 2025-02-10
**Core Value:** 원탭 운동 기록 — 앱을 열고 "오늘 운동했다" 버튼 하나로 기록 완료

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: Email/password로 회원가입 가능
- [ ] **AUTH-02**: 가입 후 이메일 인증 필요
- [ ] **AUTH-03**: 이메일로 비밀번호 재설정 가능
- [ ] **AUTH-04**: 브라우저 새로고침해도 로그인 상태 유지

### Workout Logging

- [ ] **WORK-01**: "오늘 운동했다" 원탭으로 기록 생성
- [ ] **WORK-02**: 운동 기록 수정 가능
- [ ] **WORK-03**: 운동 기록 삭제 가능
- [ ] **WORK-04**: 사진 업로드 시 자동으로 해당 날짜 운동 기록 생성
- [ ] **WORK-05**: 오늘 외 다른 날짜에도 기록 가능

### Progress Tracking

- [ ] **PROG-01**: 내 기록을 월별 캘린더로 보기
- [ ] **PROG-02**: 내 기록을 리스트로 보기
- [ ] **PROG-03**: 월별 운동 횟수 통계 확인

### Team Features

- [ ] **TEAM-01**: 팀원별 월별 운동 횟수 조회

### Admin

- [ ] **ADMN-01**: 관리자가 회원 목록 조회 가능
- [ ] **ADMN-02**: 관리자가 회원 삭제 가능

### Technical

- [ ] **TECH-01**: 모바일에서 잘 동작하는 반응형 UI
- [ ] **TECH-02**: 오프라인에서도 운동 기록 가능 (PWA)
- [ ] **TECH-03**: 홈화면에 앱으로 설치 가능 (PWA)

### Documentation

- [ ] **DOCS-01**: 각 Phase별 튜토리얼 문서 작성 (tutorial/*.md, 한글, 초보 개발자 대상, UML 다이어그램 포함)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-05**: Magic link 로그인 (비밀번호 없이 이메일 링크로 로그인)
- **AUTH-06**: OAuth 로그인 (Google)

### Workout Logging

- **WORK-06**: 운동 종류 입력 (헬스, 달리기, 수영 등)
- **WORK-07**: 운동 시간 입력
- **WORK-08**: 사진 OCR로 운동 정보 자동 추출

### Progress Tracking

- **PROG-04**: 연속 운동일 (스트릭) 표시
- **PROG-05**: 데이터 내보내기 (CSV, JSON)

### Team Features

- **TEAM-02**: 월간 랭킹
- **TEAM-03**: 실시간 팀 활동 피드

### Notifications

- **NOTF-01**: 앱 내 알림
- **NOTF-02**: 이메일 알림 (운동 리마인더)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| 실시간 채팅 | 핵심 가치(운동 기록)와 무관, 복잡도 높음 |
| 네이티브 모바일 앱 | 웹 우선, PWA로 모바일 대응 |
| 운동 계획/루틴 관리 | 기록 앱이지 계획 앱이 아님 |
| 운동 라이브러리 | 복잡도 높음, 핵심 가치 아님 |
| 영양/식단 추적 | 범위 외, 별도 앱 영역 |
| 소셜 피드/댓글 | 프라이버시 중심 설계와 충돌 |
| Apple Health/Google Fit 연동 | v1 범위 초과, 추후 고려 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| WORK-01 | Phase 2 | Pending |
| WORK-02 | Phase 2 | Pending |
| WORK-03 | Phase 2 | Pending |
| WORK-05 | Phase 2 | Pending |
| PROG-01 | Phase 3 | Pending |
| PROG-02 | Phase 3 | Pending |
| PROG-03 | Phase 3 | Pending |
| TEAM-01 | Phase 4 | Pending |
| WORK-04 | Phase 5 | Pending |
| TECH-02 | Phase 6 | Pending |
| TECH-03 | Phase 6 | Pending |
| ADMN-01 | Phase 6 | Pending |
| ADMN-02 | Phase 6 | Pending |
| TECH-01 | Phase 1 | Pending |
| DOCS-01 | All Phases | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2025-02-10*
*Last updated: 2026-02-10 after roadmap creation (traceability updated)*
