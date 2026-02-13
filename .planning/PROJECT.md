# Rollbook

## What This Is

소규모 팀(~20명)을 위한 운동 기록 웹앱. 하루 운동 여부를 원탭으로 기록하고, 선택적으로 사진을 업로드하면 자동으로 해당 날짜의 운동 기록이 생성된다. 팀원들은 서로의 월별 운동 횟수만 볼 수 있다 (프라이버시 중심).

## Core Value

**원탭 운동 기록** — 앱을 열고 "오늘 운동했다" 버튼 하나로 기록 완료. 클릭 수 최소화가 핵심.

## Requirements

### Validated

- ✓ Email/password 회원가입 — v1.0 Phase 1
- ✓ 이메일 인증 — v1.0 Phase 1
- ✓ 비밀번호 재설정 (이메일) — v1.0 Phase 1
- ✓ 로그인 상태 유지 (세션) — v1.0 Phase 1
- ✓ 오늘 운동했다 원탭 토글 — v1.0 Phase 2
- ✓ 사진 업로드 → 자동 운동 기록 생성 — v1.0 Phase 5
- ✓ 내 기록: 월별 캘린더/리스트 뷰 — v1.0 Phase 3
- ✓ 내 통계: 월별 운동 횟수 — v1.0 Phase 3
- ✓ 팀 통계: 회원별 월별 운동 횟수 — v1.0 Phase 4
- ✓ 사진 저장소 (본인만 접근 가능) — v1.0 Phase 5
- ✓ Admin: 회원 삭제 기능 — v1.0 Phase 6
- ✓ PWA + 오프라인 지원 — v1.0 Phase 6
- ✓ 각 Phase별 튜토리얼 문서 — v1.0 Phases 2-6

### Active

- [ ] Cloudflare Tunnel로 Mac Mini 로컬 서비스 외부 공개
- [ ] Cloudflare Access + Google Workspace 인증 연동
- [ ] 자체 도메인 연결 (포트 노출 없이)
- [ ] 프로덕션 환경 변수 및 빌드 설정
- [ ] launchd 자동 시작 (Supabase + Frontend + Tunnel)
- [ ] 배포 튜토리얼 문서

### Out of Scope

- OAuth 로그인 (Google, GitHub) — v1은 이메일/비밀번호로 충분
- 실시간 채팅 — 핵심 가치와 무관
- 모바일 앱 — 웹 우선, 모바일은 PWA로 대응
- 운동 종류/시간 상세 입력 — v2에서 고려
- EXIF 날짜 인식 — v2에서 고려
- 알림 기능 — v2에서 고려
- 랭킹/스트릭 — v2에서 고려

## Context

- **팀 구성**: 일반 피트니스 그룹, ~20명
- **사진 용도**: 개인 기록 보관 (출석 증명이나 소셜 공유 목적 아님)
- **프라이버시**: 팀원은 서로의 월별 운동 횟수만 볼 수 있음 (날짜, 사진, 메모 비공개)
- **Admin**: 초기에는 Gmail 계정을 관리자로 사용. 회원 삭제 권한만.
- **테스트 우선**: 앱 완성 후 회원관리(가입, 비밀번호 재설정) 먼저 테스트

### 튜토리얼 요구사항

- **위치**: `tutorial/{phase}-{name}.md` (예: `tutorial/02-core-loop.md`)
- **언어**: 한글
- **대상**: 초보 개발자
- **내용**: 개념 위주 설명, 중요 코드 포함
- **다이어그램**: 흐름 설명 시 UML 다이어그램 적극 활용
- **생성 시점**: 각 Phase 마지막 Plan으로 튜토리얼 작성

### 기술 배경

- Fable (F#/Elmish/Feliz) 프론트엔드 경험 있음
- Supabase 활용 (Auth, DB, Storage, Edge Functions)
- 보안 규칙은 서버(Supabase RLS)에서 강제

## Constraints

- **Tech Stack**: Fable (F#/Elmish) + Supabase — F# 사용 의도적 선택
- **Hosting**: Mac Mini 로컬 서비스 + Cloudflare Tunnel (포트 노출 없음)
- **SMTP**: Gmail SMTP 초기 사용 (비밀번호 재설정 이메일용)
- **Mobile First**: 모바일 사용 기준 UI 설계, 클릭 수 최소화
- **Security**: 프론트 신뢰하지 않음, RLS로 데이터 보호

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fable over TypeScript | F# 타입 안전성 선호, 학습 목적 아님 | — Pending |
| Supabase over custom backend | Auth/DB/Storage 통합, 빠른 개발 | — Pending |
| 하루 1회 기록 모델 | UNIQUE(userId, date) 제약으로 단순화 | — Pending |
| 사진은 private | 본인 폴더만 접근 가능, public bucket 지양 | — Pending |
| Open signup | 초대 기반 아닌 자유 가입 | — Pending |
| Mac Mini + Cloudflare Tunnel | 포트 노출 없이 자체 도메인으로 서비스, 데이터 로컬 유지 | — Pending |
| Google Workspace 인증 | Cloudflare Access로 조직 구성원만 접근 허용 | — Pending |

## Current Milestone: v1.1 Local Deployment

**Goal:** Mac Mini에서 Cloudflare Tunnel + Google Workspace 인증으로 포트 노출 없이 프로덕션 서비스 운영

**Target features:**
- Cloudflare Tunnel 설정 (아웃바운드 전용, 인바운드 포트 불필요)
- Cloudflare Access + Google Workspace IdP 연동
- 자체 도메인 연결 (rollbook.domain.com, api-rollbook.domain.com)
- 프로덕션 환경 변수 및 빌드 최적화
- launchd 기반 자동 시작 (Mac Mini 부팅 시 전체 서비스 자동 실행)

---
*Last updated: 2026-02-12 after starting milestone v1.1*
