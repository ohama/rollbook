# Rollbook

## What This Is

소규모 팀(~20명)을 위한 운동 기록 웹앱. 하루 운동 여부를 원탭으로 기록하고, 선택적으로 사진을 업로드하면 자동으로 해당 날짜의 운동 기록이 생성된다. 팀원들은 서로의 월별 운동 횟수만 볼 수 있다 (프라이버시 중심). Mac Mini에서 Cloudflare Tunnel로 자체 도메인 서비스 운영 중.

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
- ✓ Cloudflare Tunnel 배포 — v1.1 Phase 7
- ✓ 자체 도메인 HTTPS — v1.1 Phase 7
- ✓ launchd 자동 시작 — v1.1 Phase 7
- ✓ 배포 튜토리얼 문서 — v1.1 Phase 7

### Active

(Next milestone에서 정의)

### Out of Scope

- OAuth 로그인 (Google, GitHub) — v1은 이메일/비밀번호로 충분
- 실시간 채팅 — 핵심 가치와 무관
- 모바일 앱 — 웹 우선, 모바일은 PWA로 대응
- 운동 계획/루틴 관리 — 기록 앱이지 계획 앱이 아님
- 운동 라이브러리 — 복잡도 높음, 핵심 가치 아님
- 영양/식단 추적 — 범위 외, 별도 앱 영역
- 소셜 피드/댓글 — 프라이버시 중심 설계와 충돌
- Apple Health/Google Fit 연동 — 추후 고려

## Context

**Shipped v1.1** with 3,185 lines of F#, 8,505 lines of tutorials.
Tech stack: Fable (F#) + Feliz (React) + Supabase + Vite + Tailwind.
Deployed on Mac Mini via Cloudflare Tunnel (rollbook.hariplan.com).

- **팀 구성**: 일반 피트니스 그룹, ~20명
- **사진 용도**: 개인 기록 보관
- **프라이버시**: 팀원은 서로의 월별 운동 횟수만 볼 수 있음
- **Admin**: Gmail 계정을 관리자로 사용, 회원 삭제 권한

### 튜토리얼 요구사항

- **위치**: `tutorial/{phase}-{name}.md`
- **언어**: 한글
- **대상**: 초보 개발자
- **내용**: 개념 위주 설명, 중요 코드 포함, UML 다이어그램

### 기술 배경

- Fable (F#/Elmish/Feliz) 프론트엔드
- Supabase (Auth, DB, Storage)
- 보안: RLS로 데이터 보호

## Constraints

- **Tech Stack**: Fable (F#/Elmish) + Supabase
- **Hosting**: Mac Mini + Cloudflare Tunnel (포트 노출 없음)
- **SMTP**: SendGrid (인증/비밀번호 재설정 이메일)
- **Mobile First**: 모바일 기준 UI, 클릭 수 최소화
- **Security**: 프론트 신뢰하지 않음, RLS로 보호

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fable over TypeScript | F# 타입 안전성 선호 | ✓ Good — DU, pattern matching 활용 |
| Supabase over custom backend | Auth/DB/Storage 통합, 빠른 개발 | ✓ Good — 6일 만에 전체 구현 |
| 하루 1회 기록 모델 | UNIQUE(userId, date) 제약으로 단순화 | ✓ Good — 핵심 가치에 집중 |
| 사진은 private | 본인 폴더만 접근 가능 | ✓ Good — RLS로 강제 |
| Open signup | 초대 기반 아닌 자유 가입 | — Pending (팀 규모 확인 필요) |
| Mac Mini + Cloudflare Tunnel | 포트 노출 없이 데이터 로컬 유지 | ✓ Good — HTTPS 자동, 무료 |
| DATE 타입 workout_date | timezone 혼란 방지 | ✓ Good |
| browser-image-compression | 클라이언트 압축 (max 1MB) | ✓ Good — 서버 부하 없음 |
| IndexedDB + Background Sync | 오프라인 지원 | ✓ Good — visibility fallback 포함 |
| vite-plugin-pwa + Workbox | 자동 SW 생성 | ✓ Good — autoUpdate 패턴 |
| launchd 자동 시작 | Mac Mini 부팅 시 전체 서비스 시작 | ✓ Good — health check 의존성 |
| SendGrid SMTP | Gmail SMTP 대신 (rate limit 대응) | ✓ Good |
| Domain-agnostic workbox | path-based 매칭 (tunnel 호환) | ✓ Good |

---
*Last updated: 2026-02-15 after v1.1 milestone*
