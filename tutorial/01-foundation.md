# Phase 1: Foundation 튜토리얼

> Fable + Supabase를 사용한 인증 시스템 구축

## 목차

1. [개요](#개요)
2. [프로젝트 구조](#프로젝트-구조)
3. [Fable과 F# 소개](#fable과-f-소개)
4. [Supabase 로컬 개발 환경](#supabase-로컬-개발-환경)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [F#에서 JavaScript 라이브러리 사용하기](#f에서-javascript-라이브러리-사용하기)
7. [인증 흐름](#인증-흐름)
8. [상태 관리](#상태-관리)

---

## 개요

Phase 1에서는 웹 애플리케이션의 기초가 되는 인증 시스템을 구축합니다.

**사용 기술:**
- **Fable**: F# 코드를 JavaScript로 컴파일
- **Vite**: 빠른 개발 서버와 빌드 도구
- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **Supabase**: 오픈소스 Firebase 대안 (Auth, DB, Storage)

**구현 기능:**
- 이메일/비밀번호 회원가입
- 이메일 인증
- 로그인/로그아웃
- 비밀번호 재설정
- 세션 유지

---

## 프로젝트 구조

```
rollbook/
├── src/
│   ├── Supabase/           # Supabase 바인딩
│   │   ├── Types.fs        # 타입 정의
│   │   ├── Client.fs       # 클라이언트 초기화
│   │   └── Auth.fs         # 인증 함수들
│   ├── Components/
│   │   └── Layout.fs       # 공통 UI 컴포넌트
│   ├── Pages/
│   │   ├── Login.fs        # 로그인 페이지
│   │   ├── Signup.fs       # 회원가입 페이지
│   │   ├── ForgotPassword.fs
│   │   ├── ResetPassword.fs
│   │   └── Dashboard.fs    # 대시보드
│   ├── Main.fs             # 앱 진입점
│   └── App.fsproj          # F# 프로젝트 파일
├── supabase/
│   ├── config.toml         # Supabase 설정
│   └── migrations/         # DB 마이그레이션
├── index.html
├── vite.config.js
└── package.json
```

**중요:** F# 프로젝트에서 파일 순서가 중요합니다. `App.fsproj`에서 의존성 순서대로 파일을 나열해야 합니다:

```xml
<ItemGroup>
  <!-- 먼저 정의되어야 하는 것들 -->
  <Compile Include="Supabase/Types.fs" />
  <Compile Include="Supabase/Client.fs" />
  <Compile Include="Supabase/Auth.fs" />
  <!-- 이것들에 의존하는 것들 -->
  <Compile Include="Components/Layout.fs" />
  <Compile Include="Pages/Login.fs" />
  <!-- 마지막: 진입점 -->
  <Compile Include="Main.fs" />
</ItemGroup>
```

---

## Fable과 F# 소개

### Fable이란?

Fable은 F# 코드를 JavaScript로 컴파일하는 도구입니다. F#의 강력한 타입 시스템을 웹 개발에 활용할 수 있습니다.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   F# 코드   │ ──► │    Fable    │ ──► │ JavaScript  │
│  (.fs 파일) │     │  (컴파일러)  │     │  (.js 파일) │
└─────────────┘     └─────────────┘     └─────────────┘
```

### F# 기초 문법

**레코드 타입 (데이터 구조):**
```fsharp
type User = {
    id: string
    email: string option  // null 가능
}
```

**판별 공용체 (Discriminated Union):**
```fsharp
type AuthState =
    | Loading           // 로딩 중
    | Anonymous         // 비로그인
    | Authenticated of User  // 로그인됨 (User 데이터 포함)
```

**패턴 매칭:**
```fsharp
match authState with
| Loading -> Html.div [ prop.text "로딩 중..." ]
| Anonymous -> LoginPage()
| Authenticated user -> Dashboard user
```

### Feliz: React를 F#로

Feliz는 React를 F#에서 사용하기 위한 라이브러리입니다.

```fsharp
// React 컴포넌트 정의
[<ReactComponent>]
let Button (text: string) (onClick: unit -> unit) =
    Html.button [
        prop.className "bg-blue-500 text-white px-4 py-2 rounded"
        prop.onClick (fun _ -> onClick())
        prop.text text
    ]
```

---

## Supabase 로컬 개발 환경

### 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
├─────────────┬─────────────┬─────────────┬───────────────┤
│  PostgreSQL │   GoTrue    │   Mailpit   │    Studio     │
│   (DB)      │   (Auth)    │   (Email)   │    (UI)       │
│  :54322     │   :54321    │   :54324    │   :54323      │
└─────────────┴─────────────┴─────────────┴───────────────┘
         ▲           ▲
         │           │
    ┌────┴───────────┴────┐
    │   Supabase Client   │
    │   (JavaScript SDK)  │
    └─────────────────────┘
              ▲
              │
    ┌─────────────────────┐
    │    Rollbook App     │
    │   (Fable + React)   │
    └─────────────────────┘
```

### 주요 포트

| 서비스 | 포트 | 용도 |
|--------|------|------|
| API | 54321 | Supabase REST API |
| DB | 54322 | PostgreSQL 직접 접속 |
| Studio | 54323 | 웹 기반 관리 UI |
| Mailpit | 54324 | 이메일 테스트 (개발용) |

### 시작 명령어

```bash
# Supabase 시작
npx supabase start

# 상태 확인
npx supabase status

# 개발 서버 시작 (Fable + Vite 동시 실행)
npm run dev
```

---

## Row Level Security (RLS)

### RLS란?

RLS는 데이터베이스 수준에서 행(row) 단위로 접근을 제어하는 보안 기능입니다.

**왜 중요한가?**
- API가 노출되어도 다른 사용자 데이터 접근 불가
- 백엔드 코드 없이 보안 구현
- CVE-2025-48757: RLS 미설정 시 데이터 유출 위험

### RLS 정책 예시

```sql
-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 정책: 본인 프로필만 조회 가능
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 정책: 본인 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

### RLS 동작 원리

```
┌─────────────────────────────────────────────────────────┐
│                      클라이언트 요청                      │
│  SELECT * FROM profiles WHERE id = 'user-123'           │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL + RLS                      │
│  1. JWT에서 auth.uid() 추출                              │
│  2. RLS 정책 확인: auth.uid() = id ?                     │
│  3. 일치하면 데이터 반환, 아니면 빈 결과                   │
└─────────────────────────────────────────────────────────┘
```

---

## F#에서 JavaScript 라이브러리 사용하기

### Fable.Core.JsInterop

JavaScript 라이브러리를 F#에서 사용하려면 바인딩을 작성해야 합니다.

**1. 함수 Import:**
```fsharp
// JavaScript: import { createClient } from "@supabase/supabase-js"
[<ImportMember("@supabase/supabase-js")>]
let private createClient (url: string, key: string, options: obj): SupabaseClient = jsNative
```

**중요:** 튜플 스타일 `(a, b, c)`를 사용해야 JavaScript 함수가 올바르게 호출됩니다.

**2. 환경 변수 접근:**
```fsharp
// Vite 환경 변수
[<Emit("import.meta.env.VITE_SUPABASE_URL")>]
let private supabaseUrl: string = jsNative
```

**3. JavaScript 객체 생성:**
```fsharp
open Fable.Core.JsInterop

let options = createObj [
    "auth" ==> createObj [
        "persistSession" ==> true
        "storageKey" ==> "rollbook-auth"
    ]
]
```

### Promise 처리

F#에서 JavaScript Promise를 다루는 방법:

```fsharp
open Fable.Core
open Fable.Promise

// Promise 기반 함수 정의
let signIn (email: string) (password: string) =
    promise {
        // JavaScript Promise 호출
        let! result = supabase.auth.signInWithPassword({|
            email = email
            password = password
        |})
        return result
    }

// 사용
signIn "user@example.com" "password123"
|> Promise.map (fun result ->
    match result.error with
    | Some err -> printfn "Error: %s" err.message
    | None -> printfn "Success!"
)
|> Promise.start
```

---

## 인증 흐름

### 회원가입 시퀀스

```
┌──────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ User │     │   App   │     │Supabase │     │ Mailpit │
└──┬───┘     └────┬────┘     └────┬────┘     └────┬────┘
   │              │               │               │
   │ 이메일/비번 입력│               │               │
   │─────────────►│               │               │
   │              │  signUp()     │               │
   │              │──────────────►│               │
   │              │               │  인증 이메일   │
   │              │               │──────────────►│
   │              │  성공 응답    │               │
   │◄─────────────│◄──────────────│               │
   │              │               │               │
   │      Mailpit에서 이메일 확인  │               │
   │─────────────────────────────────────────────►│
   │              │               │               │
   │              │  인증 링크 클릭│               │
   │──────────────────────────────►               │
   │              │               │               │
   │              │  세션 생성    │               │
   │              │◄──────────────│               │
   │              │               │               │
```

### 로그인 상태 관리

```fsharp
// 인증 상태 변화 구독
React.useEffectOnce(fun () ->
    let unsubscribe = onAuthStateChange (fun event session ->
        match event with
        | SignedIn | InitialSession ->
            match session with
            | Some s -> setAuthState (Authenticated s.user)
            | None -> setAuthState Anonymous
        | SignedOut ->
            setAuthState Anonymous
    )

    // 컴포넌트 언마운트 시 구독 해제
    { new IDisposable with
        member _.Dispose() = unsubscribe() }
)
```

---

## 상태 관리

### AuthState 패턴

앱의 인증 상태를 명확하게 표현하는 판별 공용체:

```fsharp
type AuthState =
    | Loading           // 초기 로딩 (세션 확인 중)
    | Anonymous         // 비로그인 상태
    | Authenticated of User  // 로그인 상태
```

### 상태 전이 다이어그램

```
                    ┌─────────────┐
                    │   Loading   │
                    └──────┬──────┘
                           │
            onAuthStateChange (InitialSession)
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌─────────────────┐       ┌─────────────────┐
    │    Anonymous    │       │  Authenticated  │
    └────────┬────────┘       └────────┬────────┘
             │                         │
             │    signIn() 성공        │
             │────────────────────────►│
             │                         │
             │◄────────────────────────│
             │    signOut() 호출       │
             │                         │
```

### 조건부 렌더링

```fsharp
match state.authState with
| Loading ->
    Html.div [
        prop.className "min-h-screen flex items-center justify-center"
        prop.children [
            Html.div [ prop.className "animate-spin ..." ]
            Html.p [ prop.text "로딩 중..." ]
        ]
    ]

| Anonymous ->
    match state.currentPage with
    | LoginPage -> LoginPage navigateTo onLoginSuccess
    | SignupPage -> SignupPage navigateTo
    | ForgotPasswordPage -> ForgotPasswordPage navigateTo
    | ResetPasswordPage -> ResetPasswordPage navigateTo

| Authenticated user ->
    DashboardPage user onLogout
```

---

## 핵심 코드 정리

### 1. Supabase 클라이언트 초기화

```fsharp
// src/Supabase/Client.fs
module Supabase.Client

open Fable.Core.JsInterop

[<ImportMember("@supabase/supabase-js")>]
let private createClient (url: string, key: string, options: obj): SupabaseClient = jsNative

let supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    createObj [
        "auth" ==> createObj [
            "persistSession" ==> true
            "storageKey" ==> "rollbook-auth"
        ]
    ]
)
```

### 2. 인증 함수

```fsharp
// src/Supabase/Auth.fs
let signInWithPassword (email: string) (password: string) =
    promise {
        let! result = supabase.auth.signInWithPassword({|
            email = email
            password = password
        |})
        return result
    }

let onAuthStateChange (callback: AuthEvent -> Session option -> unit) =
    let subscription = supabase.auth.onAuthStateChange(fun event session ->
        callback event (Option.ofObj session)
    )
    fun () -> subscription.data.subscription.unsubscribe()
```

### 3. React 컴포넌트

```fsharp
// src/Pages/Login.fs
[<ReactComponent>]
let LoginPage (onNavigate: string -> unit) (onSuccess: unit -> unit) =
    let email, setEmail = React.useState("")
    let password, setPassword = React.useState("")
    let loading, setLoading = React.useState(false)
    let error, setError = React.useState<string option>(None)

    let handleSubmit (e: Browser.Types.Event) =
        e.preventDefault()
        setLoading true
        setError None

        promise {
            let! result = signInWithPassword email password
            match result.error with
            | Some err -> setError (Some err.message)
            | None -> onSuccess()
        }
        |> Promise.catch (fun _ -> setError (Some "로그인 실패"))
        |> Promise.finally (fun () -> setLoading false)
        |> Promise.start

    Html.form [
        prop.onSubmit handleSubmit
        prop.children [
            FormInput "이메일" "email" email setEmail
            FormInput "비밀번호" "password" password setPassword
            PrimaryButton "로그인" loading
        ]
    ]
```

---

## 다음 단계

Phase 1에서 인증 시스템을 구축했습니다. Phase 2에서는 핵심 기능인 **원탭 운동 기록**을 구현합니다:

- 운동 기록 데이터베이스 테이블
- "오늘 운동했다" 토글 버튼
- 날짜별 운동 기록 CRUD

---

*Phase 1 튜토리얼 끝*
