---
created: 2026-02-15
description: 사용자 인터랙션별 UML 시퀀스 다이어그램 — 실제 코드 기반
---

# 사용자 인터랙션 시퀀스 다이어그램

각 사용자 행동이 어떤 컴포넌트를 거쳐 어떻게 처리되는지 시퀀스 다이어그램으로 정리.
모든 다이어그램은 실제 F# 소스 코드 기반.

## 1. 회원가입

`Pages/Signup.fs` → `Supabase/Auth.fs` → GoTrue → SendGrid

```mermaid
sequenceDiagram
    participant U as 사용자
    participant SP as SignupPage
    participant Auth as Supabase.Auth
    participant GT as GoTrue (인증서버)
    participant SG as SendGrid (SMTP)
    participant DB as PostgreSQL

    U->>SP: 이메일, 비밀번호 입력
    SP->>SP: validateForm()<br/>비밀번호 6자 이상, 확인 일치
    alt 유효성 실패
        SP-->>U: 에러 메시지 표시
    end
    SP->>Auth: signUp(email, password, None)
    Auth->>GT: POST /auth/v1/signup
    GT->>DB: INSERT auth.users
    DB->>DB: trigger → INSERT profiles<br/>(자동 프로필 생성)
    GT->>SG: 인증 이메일 발송 요청
    SG-->>U: 인증 이메일 수신
    GT-->>Auth: { user, session: null }
    Auth-->>SP: AuthResponse
    SP-->>U: "인증 이메일을 발송했습니다"
```

## 2. 이메일 인증

사용자가 이메일 링크를 클릭하면 Supabase가 처리 후 프론트엔드로 리다이렉트.

```mermaid
sequenceDiagram
    participant U as 사용자
    participant Email as 이메일 클라이언트
    participant GT as GoTrue
    participant App as App (Main.fs)
    participant DB as PostgreSQL

    U->>Email: 인증 이메일 열기
    Email->>GT: GET /auth/v1/verify?token=...&type=signup
    GT->>DB: UPDATE auth.users<br/>email_confirmed_at = now()
    GT-->>Email: 302 Redirect → rollbook.hariplan.com
    Email->>App: 페이지 로드 (hash에 access_token 포함)
    App->>App: onAuthStateChange 트리거
    Note over App: event = SignedIn<br/>session = { user, access_token }
    App->>App: setState { authState = Authenticated user }
    App-->>U: DashboardPage 표시
```

## 3. 로그인

`Pages/Login.fs` → `Supabase/Auth.fs` → GoTrue

```mermaid
sequenceDiagram
    participant U as 사용자
    participant LP as LoginPage
    participant Auth as Supabase.Auth
    participant GT as GoTrue
    participant App as App (Main.fs)
    participant LS as localStorage

    U->>LP: 이메일, 비밀번호 입력 → "로그인" 클릭
    LP->>Auth: signInWithPassword(email, password)
    Auth->>GT: POST /auth/v1/token?grant_type=password
    alt 인증 실패
        GT-->>Auth: { error: "Invalid credentials" }
        Auth-->>LP: AuthResponse { error }
        LP-->>U: 에러 메시지 표시
    end
    GT-->>Auth: { user, session }
    Auth-->>LP: AuthResponse { data: { user, session } }
    Note over Auth,LS: Supabase SDK가 자동으로<br/>localStorage["rollbook-auth"]에 저장
    LP->>LP: onLoginSuccess()
    App->>App: onAuthStateChange 트리거<br/>event = SignedIn
    App->>App: setState { authState = Authenticated user }
    App-->>U: DashboardPage 표시
```

## 4. 세션 복원 (새로고침)

브라우저 새로고침 시 localStorage에서 세션을 자동 복원.

```mermaid
sequenceDiagram
    participant U as 사용자
    participant App as App (Main.fs)
    participant SDK as Supabase SDK
    participant LS as localStorage
    participant GT as GoTrue

    U->>App: 브라우저 새로고침
    App->>App: setState { authState = Loading }
    App-->>U: 스피너 표시 "로딩 중..."
    App->>App: onAuthStateChange 구독
    App->>App: initializeSync()
    SDK->>LS: localStorage["rollbook-auth"] 확인
    alt 세션 존재
        SDK->>GT: POST /auth/v1/token?grant_type=refresh_token
        GT-->>SDK: 갱신된 session
        SDK->>App: onAuthStateChange(InitialSession, session)
        App->>App: setState { authState = Authenticated user }
        App-->>U: DashboardPage 표시
    else 세션 없음
        SDK->>App: onAuthStateChange(InitialSession, null)
        App->>App: setState { authState = Anonymous }
        App-->>U: LoginPage 표시
    end
```

## 5. 비밀번호 재설정

두 단계: (1) 재설정 이메일 요청, (2) 새 비밀번호 설정.

```mermaid
sequenceDiagram
    participant U as 사용자
    participant FP as ForgotPasswordPage
    participant RP as ResetPasswordPage
    participant Auth as Supabase.Auth
    participant GT as GoTrue
    participant SG as SendGrid
    participant App as App (Main.fs)

    Note over U,SG: 1단계: 재설정 이메일 요청
    U->>FP: 이메일 입력 → "재설정 링크 보내기"
    FP->>Auth: resetPasswordForEmail(email, redirectTo)
    Auth->>GT: POST /auth/v1/recover
    GT->>SG: 재설정 이메일 발송
    SG-->>U: 이메일 수신
    GT-->>Auth: success
    FP-->>U: "이메일을 발송했습니다"

    Note over U,SG: 2단계: 새 비밀번호 설정
    U->>GT: 이메일 링크 클릭<br/>GET /auth/v1/verify?type=recovery
    GT-->>App: Redirect (hash에 type=recovery)
    App->>App: hash.Contains("type=recovery")<br/>→ currentPage = ResetPasswordPage
    App->>App: onAuthStateChange(PasswordRecovery)
    App-->>U: ResetPasswordPage 표시
    U->>RP: 새 비밀번호 입력 → "비밀번호 변경"
    RP->>RP: validateForm()<br/>6자 이상, 확인 일치
    RP->>Auth: updatePassword(newPassword)
    Auth->>GT: PUT /auth/v1/user
    GT-->>Auth: AuthResponse
    RP-->>U: "비밀번호가 변경되었습니다"
```

## 6. 운동 기록 (온라인)

핵심 기능. `Dashboard.fs` → `Supabase/Workouts.fs` → PostgREST.

```mermaid
sequenceDiagram
    participant U as 사용자
    participant WT as WorkoutToggle
    participant W as Supabase.Workouts
    participant API as PostgREST
    participant DB as PostgreSQL

    Note over U,DB: 기록하기 (⭕ → 💪)
    U->>WT: "오늘 운동했다" 클릭
    WT->>WT: if not loading (중복 클릭 방지)
    WT->>WT: isOnline() → true
    WT->>W: upsertWorkout(userId, "2026-02-15")
    W->>API: POST /rest/v1/workouts<br/>{ user_id, workout_date }<br/>onConflict: user_id,workout_date
    API->>DB: INSERT ... ON CONFLICT DO UPDATE
    Note over DB: RLS: auth.uid() = user_id 확인
    DB-->>API: { data }
    API-->>W: WorkoutResponse
    W-->>WT: 성공
    WT->>WT: setHasWorkedOut(true)
    WT-->>U: 💪 "운동 완료!" 표시

    Note over U,DB: 취소하기 (💪 → ⭕)
    U->>WT: "운동 완료!" 클릭
    WT->>W: deleteWorkout(userId, "2026-02-15")
    W->>API: DELETE /rest/v1/workouts<br/>?user_id=...&workout_date=...
    API->>DB: DELETE FROM workouts WHERE ...
    DB-->>API: ok
    API-->>W: ok
    WT->>WT: setHasWorkedOut(false)
    WT-->>U: ⭕ "오늘 운동했다" 표시
```

## 7. 운동 기록 (오프라인)

오프라인일 때 IndexedDB에 큐잉, 온라인 복귀 시 자동 동기화.

```mermaid
sequenceDiagram
    participant U as 사용자
    participant WT as WorkoutToggle
    participant Q as Offline.Queue
    participant IDB as IndexedDB
    participant Sync as Offline.Sync
    participant API as PostgREST
    participant DB as PostgreSQL

    Note over U,DB: 오프라인 기록
    U->>WT: "오늘 운동했다" 클릭
    WT->>WT: isOnline() → false
    WT->>Q: enqueue(CreateWorkout, userId, date)
    Q->>IDB: put("queue", {<br/>  operationType: "CreateWorkout",<br/>  userId, workoutDate,<br/>  timestamp, retryCount: 0<br/>})
    IDB-->>Q: { id: auto-increment }
    Q-->>WT: Queued(id)
    WT->>WT: setHasWorkedOut(true) — 낙관적 업데이트
    WT-->>U: 💪 표시 (실제 DB 반영 전)
    WT->>Sync: registerBackgroundSync()
    Sync->>Sync: navigator.serviceWorker.ready<br/>.sync.register("sync-workouts")

    Note over U,DB: 온라인 복귀 시 동기화
    Note over Sync: visibilitychange 또는<br/>online 이벤트 감지
    Sync->>Q: getAllPending()
    Q->>IDB: getAll("queue")
    IDB-->>Q: [operation1, ...]
    loop 각 operation
        Sync->>API: POST/DELETE /rest/v1/workouts
        API->>DB: SQL 실행
        DB-->>API: ok
        API-->>Sync: 성공
        Sync->>Q: dequeue(id)
        Q->>IDB: delete("queue", id)
    end
```

## 8. 사진 업로드

`Components/PhotoUpload.fs` → 압축 → Storage → 운동 기록 자동 생성.

```mermaid
sequenceDiagram
    participant U as 사용자
    participant PU as PhotoUploadButton
    participant IC as browser-image-compression
    participant S as Supabase.Storage
    participant W as Supabase.Workouts
    participant Stor as Storage 서비스
    participant API as PostgREST
    participant DB as PostgreSQL
    participant D as DashboardPage

    U->>PU: 📷 "사진 올리기" → 카메라/파일 선택
    PU->>PU: state → Compressing
    PU-->>U: "압축 중..." 표시
    PU->>IC: compressImage(file)<br/>maxSizeMB: 1, maxWidth: 1920,<br/>fileType: jpeg
    IC-->>PU: compressed File

    PU->>PU: state → Uploading(0%)
    PU->>S: upload("workout-photos",<br/>"{userId}/{date}.jpg",<br/>compressed, onProgress)
    loop 업로드 진행
        S-->>PU: onProgress(30%)
        PU-->>U: 프로그레스바 30%
        S-->>PU: onProgress(70%)
        PU-->>U: 프로그레스바 70%
    end
    S->>Stor: POST /storage/v1/object/workout-photos/{path}
    Note over Stor: RLS: foldername[1] = auth.uid()
    Stor-->>S: { path }
    S-->>PU: Ok(path)

    PU->>W: upsertWorkout(userId, today)
    W->>API: POST /rest/v1/workouts (upsert)
    API->>DB: INSERT ON CONFLICT UPDATE
    DB-->>API: ok

    PU->>S: createSignedUrl("workout-photos", path, 3600)
    S->>Stor: POST /storage/v1/object/sign/...
    Stor-->>S: { signedUrl }
    S-->>PU: Ok(url)

    PU->>PU: state → Success(url)
    PU-->>U: "업로드 완료! 운동 기록됨"
    PU->>D: onUploadComplete()
    D->>D: setRefreshKey(+1)
    Note over D: WorkoutToggle useEffect 재실행<br/>→ ⭕가 💪로 업데이트
```

## 9. 사진 갤러리 조회

`Components/PhotoGallery.fs` → Storage 목록 → signed URL 생성.

```mermaid
sequenceDiagram
    participant U as 사용자
    participant PG as PhotoGallery
    participant S as Supabase.Storage
    participant Stor as Storage 서비스

    U->>PG: 홈 탭 진입 (마운트)
    PG->>S: listFiles("workout-photos", userId)
    S->>Stor: GET /storage/v1/object/list/workout-photos/{userId}
    Stor-->>S: [{ name: "2026-02-15.jpg" }, ...]
    S-->>PG: Ok(["2026-02-15.jpg", ...])

    PG->>PG: filter: .jpg/.jpeg/.png/.webp만

    par 각 파일에 대해 병렬 처리 (Promise.all)
        PG->>S: createSignedUrl(bucket, "{userId}/2026-02-15.jpg", 3600)
        S->>Stor: POST /storage/v1/object/sign/...
        Stor-->>S: { signedUrl }
        S-->>PG: Ok(signedUrl)
    end

    PG->>PG: sortByDescending date (최신순)
    PG-->>U: 그리드 표시 (2열 모바일, 3열 데스크탑)<br/>각 사진에 날짜 오버레이 (YYYY년 M월 D일)
```

## 10. 내 기록 조회 (캘린더/리스트)

`Pages/ProgressView.fs` → `Supabase/Workouts.fs` → 월별 데이터.

```mermaid
sequenceDiagram
    participant U as 사용자
    participant PV as ProgressViewPage
    participant W as Supabase.Workouts
    participant API as PostgREST
    participant DB as PostgreSQL
    participant Cal as CalendarGrid
    participant WL as WorkoutListView
    participant MS as MonthlyStatsView

    U->>PV: "내 기록" 탭 클릭
    PV->>PV: useEffect([year, month]) 트리거
    PV->>PV: startDate = "2026-02-01"<br/>endDate = "2026-02-28"
    PV->>W: getWorkouts(userId, Some start, Some end)
    W->>API: GET /rest/v1/workouts<br/>?user_id=...&workout_date=gte.2026-02-01<br/>&workout_date=lte.2026-02-28<br/>&order=workout_date.desc
    API->>DB: SELECT * FROM workouts<br/>WHERE user_id = ... AND ...<br/>RLS 적용
    DB-->>API: rows
    API-->>W: WorkoutRecord[]
    W-->>PV: workouts

    PV->>MS: MonthlyStatsView(workouts, year, month)
    MS-->>U: "N회 / M일 (X%)" 표시

    alt viewMode = Calendar
        PV->>Cal: CalendarGrid(userId, year, month, workouts, ...)
        Cal->>Cal: getDaysInMonth, getFirstDayOfMonth<br/>CalendarDay[] 계산
        Cal-->>U: CSS Grid 캘린더<br/>운동한 날: 💪 표시
    else viewMode = List
        PV->>WL: WorkoutListView(workouts)
        WL-->>U: 날짜 목록 (최신순)
    end

    Note over U,PV: 월 이동
    U->>PV: "<" 또는 ">" 클릭
    PV->>PV: goToPrevMonth() / goToNextMonth()<br/>12월↔1월 시 연도 변경
    PV->>PV: useEffect 재실행 → 새 월 데이터 로드
```

## 11. 팀 조회

`Pages/TeamView.fs` → `Supabase/Team.fs` → FK 조인 쿼리.

```mermaid
sequenceDiagram
    participant U as 사용자
    participant TV as TeamViewPage
    participant T as Supabase.Team
    participant API as PostgREST
    participant DB as PostgreSQL
    participant TMC as TeamMemberCard

    U->>TV: "팀" 탭 클릭
    TV->>TV: useEffect([year, month]) 트리거

    par 병렬 요청
        TV->>T: getTeamWorkouts(startDate, endDate)
        T->>API: GET /rest/v1/workouts<br/>?select=user_id,workout_date,<br/>profiles!workouts_user_id_fkey(id,email,display_name)<br/>&workout_date=gte...&workout_date=lte...
        API->>DB: SELECT with FK JOIN
        Note over DB: RLS: SELECT USING (true)<br/>팀 전체 조회 허용
        DB-->>API: rows + profiles
        API-->>T: WorkoutWithProfileRaw[]
    and
        TV->>T: getTeamProfiles()
        T->>API: GET /rest/v1/profiles?select=id,email,display_name
        API->>DB: SELECT FROM profiles
        DB-->>API: rows
        API-->>T: ProfileRecord[]
    end

    T-->>TV: workouts, profiles
    TV->>T: groupWorkoutsByUser(workouts, profiles)
    Note over T: 1. workouts를 user_id로 groupBy<br/>2. 운동 0회 회원도 포함<br/>3. sortByDescending WorkoutCount
    T-->>TV: TeamMemberSummary[]

    loop 각 팀원
        TV->>TMC: TeamMemberCard(member)
        TMC-->>U: 이름, 이메일, 운동 N회 표시
    end
    TV-->>U: "팀원 N명 | 총 M회 운동" 요약
```

## 12. 관리자 — 회원 삭제

`Pages/AdminPage.fs` → `Supabase/Admin.fs` → RLS + is_admin() 확인.

```mermaid
sequenceDiagram
    participant U as 관리자
    participant AP as AdminPage
    participant A as Supabase.Admin
    participant API as PostgREST
    participant DB as PostgreSQL

    Note over U,DB: 관리자 페이지 진입
    U->>AP: "관리자" 탭 클릭
    AP->>AP: state = Loading
    AP->>A: isAdmin()
    A->>API: GET /rest/v1/user_roles<br/>?role=eq.admin
    API->>DB: SELECT FROM user_roles<br/>WHERE user_id = auth.uid()<br/>AND role = 'admin'
    DB-->>API: row (있으면)
    API-->>A: response
    alt 관리자 아님
        A-->>AP: false
        AP->>AP: state = NotAdmin
        AP-->>U: "접근 권한이 없습니다"
    end
    A-->>AP: true
    AP->>A: getAllProfiles()
    A->>API: GET /rest/v1/profiles<br/>?order=created_at.desc
    API->>DB: SELECT FROM profiles
    DB-->>API: ProfileRecord[]
    AP->>AP: state = Ready(profiles)
    AP-->>U: 회원 목록 표시

    Note over U,DB: 회원 삭제
    U->>AP: 회원 "삭제" 클릭
    AP->>AP: setDeleteTarget(Some { userId, displayName })
    AP-->>U: 삭제 확인 모달<br/>"정말 삭제하시겠습니까?"

    alt 취소
        U->>AP: "취소" 클릭
        AP->>AP: setDeleteTarget(None)
    end

    U->>AP: "삭제" 확인
    AP->>A: deleteProfile(userId)
    A->>API: DELETE /rest/v1/profiles?id=eq.{userId}
    API->>DB: DELETE FROM profiles WHERE id = ...<br/>RLS: is_admin() 확인
    Note over DB: CASCADE → user_roles도 삭제
    DB-->>API: ok
    API-->>A: ok
    A-->>AP: Ok()
    AP->>AP: setRefreshKey(+1) → 목록 새로고침
    AP-->>U: 업데이트된 회원 목록
```

## 13. 로그아웃

`Dashboard.fs` → `Supabase/Auth.fs` → 세션 정리.

```mermaid
sequenceDiagram
    participant U as 사용자
    participant D as DashboardPage
    participant Auth as Supabase.Auth
    participant SDK as Supabase SDK
    participant GT as GoTrue
    participant LS as localStorage
    participant App as App (Main.fs)

    U->>D: "로그아웃" 클릭
    D->>D: setLoading(true)
    D->>Auth: signOut()
    Auth->>GT: POST /auth/v1/logout
    GT-->>Auth: ok
    SDK->>LS: localStorage.removeItem("rollbook-auth")
    Auth-->>D: ok
    D->>D: onLogout()
    App->>App: onAuthStateChange(SignedOut, null)
    App->>App: setState {<br/>  authState = Anonymous<br/>  currentPage = LoginPage<br/>}
    App-->>U: LoginPage 표시
```

## 14. PWA 설치

브라우저의 "홈 화면에 추가" 또는 설치 배너.

```mermaid
sequenceDiagram
    participant U as 사용자
    participant B as 브라우저
    participant SW as Service Worker
    participant Cache as Cache Storage

    U->>B: rollbook.hariplan.com 접속
    B->>SW: sw.js 로드 및 등록<br/>(registerType: autoUpdate)
    SW->>Cache: precache: *.js, *.css,<br/>*.html, *.png, *.ico
    B->>B: manifest.json 확인<br/>display: standalone<br/>name: "Rollbook - 운동 기록"
    B-->>U: 설치 배너 또는<br/>"홈 화면에 추가" 가능

    U->>B: "설치" / "홈 화면에 추가"
    B->>B: PWA로 설치
    B-->>U: 독립 앱 아이콘 생성

    Note over U,Cache: 이후 앱 실행
    U->>B: PWA 아이콘 탭
    B->>SW: fetch 요청 가로채기
    alt 정적 자산
        SW->>Cache: precache에서 응답
        Cache-->>SW: cached response
    else API 요청 (/rest/)
        SW->>SW: NetworkFirst (10초 타임아웃)
        alt 네트워크 성공
            SW-->>B: 서버 응답
        else 네트워크 실패
            SW->>Cache: 캐시 응답 (5분 내)
            Cache-->>SW: cached response
        end
    else Auth 요청 (/auth/)
        SW->>SW: NetworkOnly (캐시 안 함)
    else Storage 요청 (/storage/)
        SW->>SW: StaleWhileRevalidate
        SW->>Cache: 캐시 응답 즉시 반환
        SW->>SW: 백그라운드에서 네트워크 갱신
    end
    SW-->>B: response
    B-->>U: 화면 표시
```

## 관련 문서

- `architecture-overview.md` — 전체 아키텍처 개요
- `service-guide.md` — 서비스 관리 명령어
- `deploy-tunnel.md` — Cloudflare Tunnel 설정
