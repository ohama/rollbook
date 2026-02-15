---
created: 2026-02-15
description: Rollbook 서비스 전체 아키텍처 — 부팅부터 사용자 인터랙션까지
---

# Rollbook 아키텍처 개요

Mac Mini 위에서 동작하는 Rollbook 서비스의 전체 흐름.
부팅 → 서비스 시작 → 사용자 접속 → 데이터 흐름 → 오프라인까지 한 문서로 정리.

## The Insight

Rollbook은 세 개의 독립 프로세스(Supabase, Frontend, Tunnel)가 Mac Mini 위에서 협력하는 구조다.
사용자 요청은 항상 `Cloudflare Edge → Tunnel → localhost` 경로를 거치며, 포트 노출 없이 HTTPS를 제공한다.

## Why This Matters

서비스 장애 시 어디서 문제가 생겼는지 빠르게 파악하려면 전체 흐름을 이해해야 한다.
"프론트엔드는 뜨는데 API가 안 된다" → Supabase 프로세스 확인.
"사이트 자체가 안 열린다" → Tunnel 확인.

## Recognition Pattern

- 서비스 장애 디버깅할 때
- 새 기능 추가 시 데이터 흐름 파악할 때
- 인프라 변경 (도메인, 포트 등) 시 영향 범위 파악할 때

## 전체 아키텍처

```
사용자 (브라우저/PWA)
    │
    │ HTTPS
    ▼
Cloudflare Edge (CDN + SSL)
    │
    │ Encrypted tunnel
    ▼
Mac Mini (cloudflared)
    │
    ├─ rollbook.hariplan.com → localhost:3000 (Vite Preview)
    │                              │
    │                              ▼
    │                         dist/ (정적 파일)
    │                         ├── index.html
    │                         ├── assets/*.js (F#→Fable→JS)
    │                         └── sw.js (Service Worker)
    │
    └─ supabase.hariplan.com → localhost:54321 (Supabase)
                                   │
                                   ├── /auth/   → GoTrue (인증)
                                   ├── /rest/   → PostgREST (API)
                                   └── /storage/ → Storage (파일)
                                         │
                                         ▼
                                    PostgreSQL (Docker)
```

## Step 1: 서비스 시작 (부팅 시퀀스)

Mac Mini 부팅 시 launchd가 세 서비스를 자동 시작한다.
의존성 순서: **Docker → Supabase → Frontend → Tunnel**

```
[Mac Mini 부팅]
    │
    ▼
launchd (macOS 서비스 매니저)
    │
    ├── com.rollbook.supabase
    │   └── health check: docker info 대기 → npx supabase start
    │   └── port: 54321 (API), 54322 (DB), 54323 (Studio)
    │
    ├── com.rollbook.frontend
    │   └── health check: curl localhost:54321 대기 → npx vite preview
    │   └── port: 3000 (host 0.0.0.0)
    │
    └── com.rollbook.tunnel
        └── cloudflared tunnel run jeju_rollbook
        └── 외부 → localhost 매핑
```

### 시작 순서가 중요한 이유

- Frontend가 Supabase보다 먼저 뜨면: API 호출 실패
- Tunnel이 Frontend보다 먼저 뜨면: 502 Bad Gateway

각 plist에 health check 루프가 있어 선행 서비스를 기다린다:

```bash
# com.rollbook.supabase.plist — Docker 대기
while ! docker info > /dev/null 2>&1; do sleep 5; done
npx supabase start

# com.rollbook.frontend.plist — Supabase API 대기
while ! curl -sf http://localhost:54321/rest/v1/ > /dev/null; do sleep 5; done
npx vite preview --host 0.0.0.0
```

### 서비스 관리

```bash
# 전체 서비스 상태 확인
./scripts/rollbook-services.sh status

# 개별 서비스 로그
./scripts/rollbook-services.sh logs supabase

# 재시작
./scripts/rollbook-services.sh restart
```

## Step 2: 네트워크 흐름 (사용자 → Mac Mini)

사용자가 `rollbook.hariplan.com`에 접속하면:

```
1. 브라우저 → DNS 조회
   rollbook.hariplan.com → CNAME → a6a372c3...cfargotunnel.com

2. Cloudflare Edge
   - SSL 종료 (자동 인증서)
   - 터널 연결 식별

3. cloudflared (Mac Mini)
   - 암호화된 터널로 수신
   - config.yml 규칙에 따라 라우팅:
     rollbook.hariplan.com  → http://localhost:3000
     supabase.hariplan.com  → http://localhost:54321

4. 로컬 서비스 응답
```

### 두 개의 도메인

| 도메인 | 용도 | 로컬 포트 |
|--------|------|-----------|
| `rollbook.hariplan.com` | 프론트엔드 (HTML/JS/CSS) | 3000 |
| `supabase.hariplan.com` | API + Auth + Storage | 54321 |

```yaml
# ~/.cloudflared/config.yml
tunnel: a6a372c3-b19d-446f-9fae-0344c9f110b8
ingress:
  - hostname: supabase.hariplan.com
    service: http://localhost:54321
  - hostname: rollbook.hariplan.com
    service: http://localhost:3000
  - service: http_status:404
```

### 이메일 보존

hariplan.com은 Google Workspace 이메일도 사용한다.
DNS에 MX 레코드(`smtp.google.com`)가 별도로 있고, CNAME은 서브도메인에만 적용되므로 이메일에 영향 없다.

## Step 3: 앱 로딩과 인증

사용자가 접속하면 브라우저에서 이 순서로 실행된다:

```
[브라우저]
    │
    ▼
index.html 로드
    │
    ▼
assets/*.js 로드 (F# → Fable → JavaScript)
    │
    ▼
App() 컴포넌트 마운트
    │
    ├── initializeSync() — 오프라인 동기화 리스너 등록
    │
    └── onAuthStateChange() — 인증 상태 구독
            │
            ├── 세션 있음 (localStorage) → Authenticated → DashboardPage
            │
            └── 세션 없음 → Anonymous → LoginPage
```

### AuthState 상태 머신

```fsharp
type AuthState =
    | Loading        // 앱 초기 로딩 (세션 확인 중)
    | Anonymous      // 미인증 → 로그인/가입 페이지
    | Authenticated  // 인증됨 → 대시보드
```

### 세션 유지

Supabase 클라이언트가 `localStorage`에 세션을 저장한다:

```fsharp
// src/Supabase/Client.fs
let private clientOptions = createObj [
    "auth" ==> createObj [
        "persistSession" ==> true      // localStorage에 저장
        "autoRefreshToken" ==> true     // 만료 전 자동 갱신
        "storageKey" ==> "rollbook-auth"
    ]
]
```

브라우저 새로고침 시: localStorage에서 세션 복원 → `InitialSession` 이벤트 → `Authenticated` 상태.

## Step 4: 사용자 인터랙션

인증 후 4개 탭으로 구성된 대시보드:

```
[DashboardPage]
    │
    ├── [홈] 탭
    │   ├── WorkoutToggle — "오늘 운동했다" 원탭 기록
    │   ├── PhotoUpload — 사진 촬영/업로드
    │   └── PhotoGallery — 운동 사진 갤러리
    │
    ├── [내 기록] 탭
    │   ├── Calendar — 월별 캘린더 (CSS Grid)
    │   ├── WorkoutList — 리스트 뷰
    │   └── MonthlyStats — 월별 통계
    │
    ├── [팀] 탭
    │   └── TeamMemberCard[] — 팀원별 월별 운동 현황
    │
    └── [관리자] 탭
        ├── MemberList — 회원 목록
        └── MemberActions — 회원 삭제
```

### 원탭 운동 기록 흐름

핵심 기능. 버튼 한 번으로 기록이 생성된다:

```
[사용자] "오늘 운동했다" 클릭
    │
    ├── 온라인 ─────────────────────────────────┐
    │   supabase.from("workouts")               │
    │     .upsert({user_id, workout_date})      │
    │   → PostgreSQL INSERT (compound PK)       │
    │   → UI 업데이트 (⭕ → 💪)                │
    │                                           │
    └── 오프라인 ──────────────────────────────┐│
        IndexedDB "rollbook-offline" 큐에 저장  ││
        → UI 낙관적 업데이트 (⭕ → 💪)         ││
        → 온라인 복귀 시 자동 동기화            ││
                                               ▼▼
                                        PostgreSQL
                                        workouts 테이블
```

### 사진 업로드 흐름

```
[사용자] 사진 촬영/선택
    │
    ▼
browser-image-compression (클라이언트 압축)
    → JPEG 변환, max 1920px, max 1MB
    │
    ▼
Supabase Storage 업로드
    → bucket: workout-photos (private)
    → path: {user_id}/{date}.jpg
    │
    ▼
자동으로 운동 기록 생성
    → upsertWorkout(userId, today)
    │
    ▼
refreshKey 증가 → WorkoutToggle 새로고침
```

## Step 5: 데이터 흐름

### 데이터베이스 구조

```
PostgreSQL (Docker, port 54322)
    │
    ├── profiles (사용자 프로필)
    │   └── trigger: auth.users INSERT → 자동 생성
    │
    ├── workouts (운동 기록)
    │   └── PK: (user_id, workout_date)
    │   └── DATE 타입 (TIMESTAMPTZ 아님)
    │
    ├── user_roles (관리자 역할)
    │   └── PK: (user_id, role)
    │   └── is_admin() 함수 → RLS 정책에서 사용
    │
    └── storage.objects (사진 파일)
        └── bucket: workout-photos
        └── path: {user_id}/{date}.jpg
```

### RLS (Row Level Security)

모든 테이블에 RLS 활성화. 사용자는 자기 데이터만 수정 가능:

```
workouts:
  SELECT → auth.uid() = user_id (본인) 또는 USING(true) (팀 조회)
  INSERT → auth.uid() = user_id
  UPDATE → auth.uid() = user_id
  DELETE → auth.uid() = user_id 또는 is_admin()

storage (workout-photos):
  INSERT → storage.foldername(name)[1] = auth.uid()
  SELECT → storage.foldername(name)[1] = auth.uid()
  DELETE → storage.foldername(name)[1] = auth.uid()
```

### API 호출 경로

```
F# 코드 (src/Supabase/*.fs)
    │
    ▼
@supabase/supabase-js (JS 라이브러리)
    │
    ▼
HTTPS fetch → supabase.hariplan.com
    │
    ▼
cloudflared tunnel → localhost:54321
    │
    ├── /auth/v1/*    → GoTrue 서비스 (인증)
    ├── /rest/v1/*    → PostgREST (데이터 API)
    └── /storage/v1/* → Storage 서비스 (파일)
         │
         ▼
    PostgreSQL
```

## Step 6: 이메일 흐름

인증 이메일(가입 확인, 비밀번호 재설정)은 SendGrid를 통해 발송:

```
Supabase GoTrue
    │
    ▼
SendGrid SMTP (smtp.sendgrid.net:587)
    │
    ▼
사용자 이메일 수신
    │
    ▼
인증 링크 클릭
    → https://supabase.hariplan.com/auth/v1/verify?...
    → Supabase가 처리 후 프론트엔드로 리다이렉트
    → https://rollbook.hariplan.com (site_url)
```

설정 위치: `supabase/config.toml`의 `[auth.email]` 섹션.

## Step 7: 오프라인 동작 (PWA)

Rollbook은 PWA로 설치 가능하고, 오프라인에서도 운동 기록이 가능하다.

### Service Worker 캐싱 전략

```
요청 종류              전략                    이유
─────────────────────────────────────────────────
정적 자산 (JS/CSS)    precache               빌드 시 미리 캐시
API (/rest/, /graphql/) NetworkFirst (5분)    최신 데이터 우선
Auth (/auth/)          NetworkOnly            보안 — 캐시 금지
Storage (/storage/)    StaleWhileRevalidate   이미지, 24시간
```

### 오프라인 큐 메커니즘

```
[오프라인 상태에서 운동 기록]
    │
    ▼
IndexedDB "rollbook-offline"
    └── queue store (auto-increment)
        └── { operationType, userId, workoutDate, timestamp, retryCount }
    │
    ▼
[온라인 복귀 감지]
    ├── Background Sync API (Chromium)
    └── visibilitychange + online 이벤트 (Safari/Firefox)
    │
    ▼
replayQueue()
    └── 각 operation을 순서대로 Supabase API 호출
    └── 성공 → dequeue, 실패 → incrementRetry
```

### PWA 설치

`vite-plugin-pwa`가 manifest와 service worker를 자동 생성:

- `registerType: 'autoUpdate'` — 새 버전 자동 적용 (사용자 확인 불필요)
- `display: 'standalone'` — 브라우저 UI 없이 앱처럼 실행
- 아이콘: 192x192, 512x512, apple-touch-icon

## Step 8: 빌드와 배포

### 빌드 파이프라인

```
F# 소스 (src/**/*.fs)
    │
    ▼
Fable CLI (dotnet fable)
    → F# → JavaScript 변환
    │
    ▼
Vite (번들링)
    ├── Tailwind CSS 처리
    ├── Terser 압축 (console.log 제거)
    ├── 수동 청크 분리:
    │   ├── vendor-react (React)
    │   ├── vendor-supabase (Supabase)
    │   └── vendor-offline (idb)
    └── PWA 에셋 생성 (manifest, sw.js)
    │
    ▼
dist/ (정적 파일)
    → Vite Preview로 서빙 (port 3000)
```

### 환경 변수

| 파일 | 용도 | VITE_SUPABASE_URL |
|------|------|-------------------|
| `.env.local` | 로컬 개발 | `http://localhost:54321` |
| `.env.production` | 프로덕션 빌드 | `https://supabase.hariplan.com` |

`import.meta.env.VITE_*`로 빌드 시 주입 (런타임 아님).

## 체크리스트

서비스 정상 동작 확인:

- [ ] `curl -sf http://localhost:54321/rest/v1/` → 200
- [ ] `curl -sf http://localhost:3000` → 200
- [ ] `curl -sf https://rollbook.hariplan.com` → 200
- [ ] `curl -sf https://supabase.hariplan.com/rest/v1/` → 200
- [ ] `dig MX hariplan.com` → smtp.google.com (이메일 보존)
- [ ] `./scripts/rollbook-services.sh status` → 3 services running

## 관련 문서

- `service-guide.md` — 서비스 관리 명령어 상세
- `deploy-tunnel.md` — Cloudflare Tunnel 설정 가이드
- `manage-cloudflared-files.md` — ~/.cloudflared/ 파일 관리
- `setup-supabase-tunnel-auth.md` — 인증 이메일 도메인 설정
- `setup-sendgrid-smtp-supabase.md` — SMTP 설정
