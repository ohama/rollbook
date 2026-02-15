# Requirements: Rollbook

**Defined:** 2026-02-15
**Core Value:** 원탭 운동 기록 — 앱을 열고 "오늘 운동했다" 버튼 하나로 기록 완료

## v2.0 Requirements

Requirements for v2.0 UI Refactoring milestone. Each maps to roadmap phases.

### UI Layout

- [ ] **UI-01**: 사용자가 이전/다음 달 버튼으로 날짜를 탐색할 수 있다
- [ ] **UI-02**: 1줄에 날짜 네비게이션이 표시된다 (이전 달 `<|` / 년월일 / 다음 달 `|>`)
- [ ] **UI-03**: 2줄에 나/우리 탭이 표시되고, 선택된 탭이 강조색으로 변한다
- [ ] **UI-04**: 3줄 콘텐츠 영역이 운동 기록 / 달력 / 기록 내용 간 전환된다

### Records

- [ ] **REC-01**: 하루에 여러 번 운동을 기록할 수 있다 (복수 기록)
- [ ] **REC-02**: 운동 기록에 텍스트 메모를 추가할 수 있다
- [ ] **REC-03**: 운동 기록에 사진을 첨부할 수 있다
- [ ] **REC-04**: 본인의 기록을 수정할 수 있다
- [ ] **REC-05**: 본인의 기록을 삭제할 수 있다
- [ ] **REC-06**: 본인 기록에만 수정/삭제 아이콘이 표시된다
- [ ] **REC-07**: 운동 아이콘 클릭 시 이번 달 운동 횟수가 증가/감소한다

### Calendar

- [ ] **CAL-01**: 달력에 날짜별 기록 횟수가 표시된다
- [ ] **CAL-02**: "나" 선택 시 나의 달력 기록이 보인다
- [ ] **CAL-03**: "우리" 선택 시 우리의 달력 기록이 보인다
- [ ] **CAL-04**: 달력 날짜 클릭 시 해당 날의 기록 내용이 보인다
- [ ] **CAL-05**: 기록 내용에서 되돌아가기 아이콘으로 달력으로 복귀할 수 있다

### Detail View

- [ ] **DET-01**: "나" 선택 시 해당 날의 나의 기록 내용 전부가 보인다
- [ ] **DET-02**: "우리" 선택 시 해당 날의 이름(횟수) 목록이 보인다
- [ ] **DET-03**: "우리"에서 이름 클릭 시 그 사람의 해당 날 기록 내용이 보인다
- [ ] **DET-04**: 한 번 기록 시 텍스트/사진 아이콘, 여러 번 기록 시 아이콘(횟수)로 표시된다

### Photo

- [ ] **PHO-01**: 사진이 최소한의 크기(썸네일)로 보여진다
- [ ] **PHO-02**: 사진 클릭 시 원래 크기로 보여진다
- [ ] **PHO-03**: 확대된 사진 다시 클릭 시 작은 사진으로 돌아간다

### Admin

- [ ] **ADM-01**: 복수 관리자를 지원한다 (관리자 지정 기능)
- [ ] **ADM-02**: 기본 관리자는 ohama100@gmail.com, ohama100@naver.com이다
- [ ] **ADM-03**: 관리자가 다른 관리자를 추가할 수 있다
- [ ] **ADM-04**: 관리자가 회원을 삭제할 수 있다
- [ ] **ADM-05**: 관리자가 회원의 기록을 삭제할 수 있다
- [ ] **ADM-06**: 관리자 행동이 감사 로그에 기록된다
- [ ] **ADM-07**: 관리자가 수정 내용 목록을 볼 수 있다 (최근 날짜 우선)
- [ ] **ADM-08**: 관리자가 삭제한 기록을 복구할 수 있다
- [ ] **ADM-09**: 관리자 로그인 시 관리자 페이지가 나타난다 (회원 명부 + 수정 내용)

### Schema Migration

- [ ] **MIG-01**: 기존 데이터 손실 없이 DB 스키마를 마이그레이션한다
- [ ] **MIG-02**: 오프라인 큐가 새 스키마와 호환되도록 업데이트된다

## Future Requirements

### Deferred

- **우리 텍스트 탭** — 각 사람의 이름: 선택된 달의 운동 횟수 (v2.0에서 보류)
- **데이터 내보내기** — 운동 기록 CSV/JSON 내보내기
- **스트릭/랭킹** — 동기부여 기능
- **OAuth 로그인** — Google/GitHub 소셜 로그인

## Out of Scope

| Feature | Reason |
|---------|--------|
| 소셜 피드/댓글 | 프라이버시 중심 설계와 충돌 |
| 운동 라이브러리 | 복잡도 높음, 핵심 가치 아님 |
| 영양/식단 추적 | 별도 앱 영역 |
| 리더보드/게이미피케이션 | 소규모 팀에서 부정적 효과 |
| 실시간 채팅 | 핵심 가치와 무관 |
| 리치 텍스트 편집기 | 과잉 설계, 플레인 텍스트로 충분 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MIG-01 | Phase 8 | Pending |
| MIG-02 | Phase 8 | Pending |
| UI-01 | Phase 9 | Pending |
| UI-02 | Phase 9 | Pending |
| UI-03 | Phase 9 | Pending |
| UI-04 | Phase 9 | Pending |
| REC-01 | Phase 10 | Pending |
| REC-02 | Phase 10 | Pending |
| REC-03 | Phase 10 | Pending |
| REC-04 | Phase 10 | Pending |
| REC-05 | Phase 10 | Pending |
| REC-06 | Phase 10 | Pending |
| REC-07 | Phase 10 | Pending |
| CAL-01 | Phase 11 | Pending |
| CAL-02 | Phase 11 | Pending |
| CAL-03 | Phase 11 | Pending |
| CAL-04 | Phase 11 | Pending |
| CAL-05 | Phase 11 | Pending |
| DET-01 | Phase 12 | Pending |
| DET-02 | Phase 12 | Pending |
| DET-03 | Phase 12 | Pending |
| DET-04 | Phase 12 | Pending |
| PHO-01 | Phase 13 | Pending |
| PHO-02 | Phase 13 | Pending |
| PHO-03 | Phase 13 | Pending |
| ADM-01 | Phase 14 | Pending |
| ADM-02 | Phase 14 | Pending |
| ADM-03 | Phase 14 | Pending |
| ADM-04 | Phase 14 | Pending |
| ADM-05 | Phase 14 | Pending |
| ADM-06 | Phase 14 | Pending |
| ADM-07 | Phase 14 | Pending |
| ADM-08 | Phase 14 | Pending |
| ADM-09 | Phase 14 | Pending |

**Coverage:**
- v2.0 requirements: 34 total
- Mapped to phases: 34/34 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-15*
*Last updated: 2026-02-15 — All requirements mapped to phases 8-14*
