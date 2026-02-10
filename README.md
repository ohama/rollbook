# Rollbook

**원탭 운동 기록** — 앱을 열고 "오늘 운동했다" 버튼 하나로 기록 완료

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![PWA Ready](https://img.shields.io/badge/PWA-ready-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## 주요 기능

- **원탭 기록** - 버튼 하나로 오늘 운동 기록
- **사진 업로드** - 사진 올리면 자동으로 운동 기록 생성
- **캘린더 뷰** - 월별 운동 기록 한눈에 보기
- **팀 현황** - 팀원들의 운동 현황 확인
- **오프라인 지원** - 네트워크 없이도 기록 가능, 온라인 시 자동 동기화
- **PWA** - 홈 화면에 설치하여 앱처럼 사용

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | F# (Fable) + React 19 |
| Styling | Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Build | Vite + vite-plugin-pwa |
| Offline | IndexedDB + Background Sync API |

## 빠른 시작

### 사전 요구사항

- Node.js 20+
- .NET SDK 8+
- Docker Desktop

### 설치

```bash
# 저장소 클론
git clone <repository-url> rollbook
cd rollbook

# 의존성 설치
npm install
dotnet tool restore

# Supabase 시작
npx supabase start

# 마이그레이션 적용
npx supabase db reset

# 환경 변수 설정
cp .env.example .env.local
# .env.local에 Supabase anon key 설정 (npx supabase status 에서 확인)

# 개발 서버 시작
npm run dev
```

http://localhost:5173 에서 앱 확인

### 프로덕션 빌드

```bash
npm run build
npm run preview
```

http://localhost:4173 에서 프로덕션 빌드 확인

## 문서

| 문서 | 설명 |
|------|------|
| [컴파일 가이드](docs/compile-guide.md) | Mac Mini에서 빌드하는 방법 |
| [서비스 가이드](docs/service-guide.md) | 서비스 실행 및 관리 |
| [테스트 시나리오](docs/test-scenarios.md) | 수동 테스트 체크리스트 |
| [E2E 테스트 가이드](docs/e2e-test-guide.md) | Playwright 자동화 테스트 |

## 프로젝트 구조

```
rollbook/
├── src/
│   ├── Components/        # React 컴포넌트
│   ├── Pages/             # 페이지 컴포넌트
│   ├── Supabase/          # Supabase API 바인딩
│   ├── offline/           # 오프라인 기능 (Queue, Sync)
│   ├── sw/                # Service Worker
│   └── Main.fs            # 앱 진입점
├── supabase/
│   └── migrations/        # DB 마이그레이션
├── public/                # 정적 파일 (PWA 아이콘)
├── tests/                 # 단위 테스트
├── e2e/                   # E2E 테스트
├── docs/                  # 문서
└── tutorial/              # 개발 튜토리얼 (한글)
```

## 스크립트

```bash
npm run dev        # 개발 서버 (핫 리로드)
npm run build      # 프로덕션 빌드
npm run preview    # 프로덕션 빌드 미리보기
npm run test       # 단위 테스트
npm run test:e2e   # E2E 테스트
```

## 환경 변수

```bash
# .env.local (로컬 개발)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# .env.production (프로덕션)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<production-anon-key>
```

## 개발 마일스톤

### v1.0 (현재)

- [x] 이메일 인증 회원가입/로그인
- [x] 원탭 운동 기록
- [x] 사진 업로드 (자동 운동 기록)
- [x] 캘린더/리스트 진행 기록 보기
- [x] 팀 멤버 운동 현황
- [x] 관리자 회원 관리
- [x] PWA (홈 화면 설치, 오프라인)

### v2.0 (예정)

- [ ] 운동 기록 수정
- [ ] 특정 날짜 기록
- [ ] Magic link 로그인
- [ ] 연속 운동일 (스트릭)
- [ ] 주간/월간 리포트

## 튜토리얼

각 개발 Phase별 한글 튜토리얼:

| Phase | 튜토리얼 | 주제 |
|-------|----------|------|
| 1 | [01-foundation.md](tutorial/01-foundation.md) | Fable + Supabase 기초 |
| 2 | [02-core-loop.md](tutorial/02-core-loop.md) | 원탭 운동 기록 |
| 3 | [03-progress-tracking.md](tutorial/03-progress-tracking.md) | 캘린더 뷰, 통계 |
| 4 | [04-team-features.md](tutorial/04-team-features.md) | 팀 기능, RLS |
| 5 | [05-photo-upload.md](tutorial/05-photo-upload.md) | 사진 업로드 |
| 6 | [06-production-ready.md](tutorial/06-production-ready.md) | PWA, 오프라인 |

## 라이선스

MIT License

## 기여

이슈와 PR을 환영합니다.

---

Made with F# + React + Supabase
