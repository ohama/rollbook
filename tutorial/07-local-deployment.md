# Phase 7: Local Deployment - 로컬 배포

## 개요 (Overview)

Phase 7의 핵심 가치는 **"포트 노출 없이 안전한 프로덕션 서비스 운영"**입니다.

Phase 6에서 프로덕션 준비를 완료했다면, Phase 7에서는 실제로 Mac Mini에서 Cloudflare Tunnel을 이용해 외부 사용자에게 서비스합니다. 공유기의 포트 포워딩이나 방화벽 인바운드 규칙 없이, HTTPS가 자동으로 적용된 프로덕션 환경을 구축합니다.

**이 Phase에서 구성한 것:**
- Cloudflare Tunnel 설치 및 설정 (포트 노출 없는 외부 접근)
- 커스텀 도메인 연결 (`rollbook.hariplan.com`, `supabase.hariplan.com`)
- SendGrid SMTP를 통한 이메일 인증 (회원가입 확인 이메일)
- Supabase 프로덕션 설정 (`external_url`, `site_url`, SMTP)
- Vite 호스트 허용 설정

**변경한 파일:**
- `~/.cloudflared/config.yml` - Cloudflare Tunnel 라우팅 설정
- `supabase/config.toml` - Supabase API 외부 URL, SMTP, 인증 설정
- `supabase/.env` - SendGrid API 키
- `vite.config.js` - `allowedHosts` 추가
- `.env.local` - Supabase URL을 커스텀 도메인으로 변경

## 아키텍처 (Architecture)

### 전체 시스템 구성도

```mermaid
graph TB
    subgraph "인터넷"
        A[사용자 브라우저<br/>HTTPS]
    end

    subgraph "Cloudflare Edge"
        B[DNS + HTTPS<br/>자동 인증서]
        C[Cloudflare Tunnel<br/>연결 관리]
    end

    subgraph "Mac Mini (집/사무실)"
        D[cloudflared<br/>터널 데몬]
        E[Vite Dev Server<br/>localhost:3000]
        F[Supabase API<br/>localhost:54321]
        G[Supabase DB<br/>localhost:54322]
        H[Supabase Storage<br/>S3 호환]
    end

    A -->|rollbook.hariplan.com| B
    A -->|supabase.hariplan.com| B
    B --> C
    C -->|아웃바운드 전용<br/>포트 개방 불필요| D
    D -->|rollbook.hariplan.com| E
    D -->|supabase.hariplan.com| F
    F --> G
    F --> H

    style A fill:#e0f2fe,stroke:#0284c7
    style B fill:#fef3c7,stroke:#d97706
    style C fill:#fef3c7,stroke:#d97706
    style D fill:#d1fae5,stroke:#059669
    style E fill:#ede9fe,stroke:#7c3aed
    style F fill:#ede9fe,stroke:#7c3aed
```

**각 계층의 역할:**
- **사용자 브라우저**: `rollbook.hariplan.com`에 HTTPS로 접속
- **Cloudflare Edge**: DNS 해석, TLS/SSL 자동 관리, DDoS 보호
- **Cloudflare Tunnel**: Cloudflare와 Mac Mini 사이의 암호화된 터널
- **cloudflared 데몬**: Mac Mini에서 실행, 아웃바운드 연결만 사용 (인바운드 포트 불필요)
- **Vite Dev Server**: 프론트엔드 앱 (Fable/F# + React)
- **Supabase**: 로컬 Docker에서 실행 중인 백엔드 (API, DB, Auth, Storage)

**핵심 보안 원칙:**
- Mac Mini는 인바운드 포트를 열지 않음
- cloudflared가 Cloudflare로 **아웃바운드** 연결을 생성
- HTTPS 인증서는 Cloudflare Edge에서 자동 발급/갱신
- 포트 포워딩, 방화벽 설정 일절 불필요

### 요청 흐름 상세

```mermaid
sequenceDiagram
    participant User as 사용자 브라우저
    participant CF as Cloudflare Edge
    participant Tunnel as Cloudflare Tunnel
    participant CD as cloudflared<br/>(Mac Mini)
    participant Vite as Vite Dev Server<br/>:3000
    participant SB as Supabase API<br/>:54321

    Note over User,SB: 프론트엔드 페이지 요청

    User->>CF: GET https://rollbook.hariplan.com
    CF->>CF: HTTPS 종료 (자동 인증서)
    CF->>Tunnel: 터널로 요청 전달
    Tunnel->>CD: 암호화된 터널 통과
    CD->>Vite: http://localhost:3000
    Vite-->>CD: HTML + JS 반환
    CD-->>Tunnel: 응답 전달
    Tunnel-->>CF: 응답 전달
    CF-->>User: HTTPS 응답

    Note over User,SB: API 요청 (운동 기록 조회)

    User->>CF: GET https://supabase.hariplan.com/rest/v1/workouts
    CF->>Tunnel: 터널로 요청 전달
    Tunnel->>CD: 암호화된 터널 통과
    CD->>SB: http://localhost:54321/rest/v1/workouts
    SB-->>CD: JSON 데이터
    CD-->>Tunnel: 응답 전달
    Tunnel-->>CF: 응답 전달
    CF-->>User: HTTPS 응답 (JSON)
```

**요청 흐름 핵심 포인트:**

1. **사용자는 HTTPS만 사용**: Cloudflare가 자동으로 SSL 인증서를 관리
2. **Cloudflare Tunnel은 중간 프록시 역할**: 요청을 hostname에 따라 적절한 로컬 서비스로 라우팅
3. **Mac Mini는 인바운드 연결을 받지 않음**: cloudflared가 Cloudflare로 아웃바운드 연결을 유지

### 이메일 인증 흐름

```mermaid
sequenceDiagram
    participant User as 사용자
    participant App as Rollbook App<br/>rollbook.hariplan.com
    participant SB as Supabase Auth<br/>supabase.hariplan.com
    participant SG as SendGrid SMTP
    participant Email as 사용자 이메일

    User->>App: 회원가입 (이메일 입력)
    App->>SB: POST /auth/v1/signup
    SB->>SG: SMTP로 확인 이메일 전송
    SG->>Email: 확인 이메일 도착

    Note over Email: 이메일 내용:<br/>"이메일을 확인하려면<br/>아래 링크를 클릭하세요"

    Email->>User: 확인 링크 클릭
    User->>SB: GET /auth/v1/verify?token=xxx&type=signup
    SB->>SB: 이메일 인증 완료
    SB-->>User: 302 Redirect
    User->>App: https://rollbook.hariplan.com 이동
    App->>App: 로그인 완료 상태

    Note over SB: external_url 설정이<br/>확인 링크의 도메인을 결정
    Note over SB: site_url 설정이<br/>인증 후 리다이렉트 URL을 결정
```

**이메일 인증에 관여하는 설정:**

| 설정 | 값 | 역할 |
|------|-----|------|
| `[api] external_url` | `https://supabase.hariplan.com` | 확인 이메일 링크의 도메인 |
| `[auth] site_url` | `https://rollbook.hariplan.com` | 인증 완료 후 리다이렉트 URL |
| `[auth.email.smtp]` | SendGrid 설정 | 이메일 발송 서버 |

### 전체 서비스 스택

```mermaid
graph LR
    subgraph "외부 서비스"
        A[Cloudflare<br/>DNS + Tunnel + HTTPS]
        B[SendGrid<br/>SMTP 이메일 발송]
    end

    subgraph "Mac Mini 서비스"
        C[cloudflared<br/>터널 데몬]
        D[Docker Desktop]
        E[Supabase<br/>API + DB + Auth + Storage]
        F[Vite Dev Server<br/>프론트엔드]
    end

    subgraph "설정 파일"
        G["~/.cloudflared/config.yml<br/>터널 라우팅"]
        H["supabase/config.toml<br/>Supabase 설정"]
        I["supabase/.env<br/>SendGrid 키"]
        J["vite.config.js<br/>allowedHosts"]
        K[".env.local<br/>Supabase URL"]
    end

    A --> C
    C --> E
    C --> F
    E --> B
    D --> E
    G --> C
    H --> E
    I --> E
    J --> F
    K --> F

    style A fill:#fef3c7,stroke:#d97706
    style B fill:#dbeafe,stroke:#2563eb
    style D fill:#f3e8ff,stroke:#9333ea
```

## 핵심 개념 (Key Concepts)

### 1. Cloudflare Tunnel이란?

**전통적인 서버 배포 vs Cloudflare Tunnel:**

기존에 서버를 외부에 공개하려면 복잡한 네트워크 설정이 필요했습니다.

**전통적인 방법 (포트 포워딩):**

```
인터넷 → 공유기 (포트 80, 443 포워딩) → 서버 (방화벽 인바운드 허용)
```

| 단계 | 설정 내용 | 위험 요소 |
|------|----------|----------|
| 1 | 고정 IP 또는 DDNS 설정 | IP 노출 |
| 2 | 공유기 포트 포워딩 (80, 443) | 포트 스캔 공격 대상 |
| 3 | 서버 방화벽 인바운드 허용 | 직접 공격 가능 |
| 4 | SSL 인증서 설치 (Let's Encrypt) | 수동 갱신 필요 |
| 5 | DDoS 보호 설정 | 별도 서비스 필요 |

**Cloudflare Tunnel 방법:**

```
인터넷 → Cloudflare Edge → 터널 → cloudflared (아웃바운드 연결) → 서버
```

| 단계 | 설정 내용 | 위험 요소 |
|------|----------|----------|
| 1 | `brew install cloudflared` | 없음 |
| 2 | 터널 생성 + DNS 설정 | 없음 |
| 3 | (완료!) | 없음 |

**왜 "아웃바운드 전용"이 안전한가?**

cloudflared는 Cloudflare 서버로 **나가는 연결(outbound)**을 만듭니다. 마치 여러분이 웹사이트를 방문하는 것과 같은 원리입니다. 집에서 인터넷을 사용할 때 포트를 열지 않는 것처럼, cloudflared도 포트를 열지 않습니다.

```
일반 웹 사용:  내 PC → (outbound) → 웹사이트 서버
Tunnel:       cloudflared → (outbound) → Cloudflare Edge
```

외부에서 Mac Mini로 직접 접근할 수 있는 경로가 없으므로, 포트 스캔이나 직접 공격이 불가능합니다.

### 2. 터널 실행 모드: Token vs Local Config

cloudflared 터널을 실행하는 방법은 두 가지입니다.

**모드 1: Token 모드 (대시보드 관리)**

```bash
cloudflared tunnel run --token <토큰값>
```

- Cloudflare Zero Trust 대시보드에서 터널을 생성하고 관리
- 토큰 하나로 인증 + 설정이 모두 해결됨
- 라우팅 설정도 대시보드에서 관리
- 여러 서버에 같은 터널을 쉽게 배포 가능

**모드 2: Local Config 모드 (파일 관리)**

```bash
cloudflared tunnel run rollbook
```

- `~/.cloudflared/config.yml` 파일에서 라우팅 설정 관리
- `~/.cloudflared/<tunnel-id>.json` 자격증명 파일 필요
- Git으로 설정 파일을 버전 관리 가능
- 오프라인에서도 설정 변경 가능

**어떤 모드를 선택할까?**

| 기준 | Token 모드 | Local Config 모드 |
|------|-----------|------------------|
| 설정 편의성 | 대시보드 UI | 파일 편집 |
| 버전 관리 | 불가 | Git으로 관리 가능 |
| 여러 서버 배포 | 토큰 복사만 하면 됨 | 각 서버에 설정 파일 필요 |
| 인터넷 없이 설정 변경 | 불가 | 가능 |
| Rollbook에서 사용 | 초기 설정 시 | 장기 운영 시 |

Rollbook 프로젝트에서는 두 모드 모두 사용 가능합니다. 대시보드에서 터널을 만들고 토큰을 받아 시작한 뒤, 필요하면 로컬 설정 파일로 전환할 수 있습니다.

### 3. DNS CNAME 레코드와 터널 라우팅

Cloudflare Tunnel은 DNS CNAME 레코드를 사용하여 도메인 이름을 터널과 연결합니다.

**DNS 설정 과정:**

```bash
# 터널과 도메인을 연결하는 CNAME 레코드 생성
cloudflared tunnel route dns <터널이름> supabase.hariplan.com
cloudflared tunnel route dns <터널이름> rollbook.hariplan.com
```

이 명령은 Cloudflare DNS에 자동으로 CNAME 레코드를 만듭니다.

```
supabase.hariplan.com → <tunnel-id>.cfargotunnel.com
rollbook.hariplan.com → <tunnel-id>.cfargotunnel.com
```

**CNAME이란?**

CNAME(Canonical Name)은 "이 도메인 이름은 저 도메인 이름의 별칭이다"라는 DNS 레코드입니다.

```
A 레코드:    example.com → 192.168.1.1  (도메인 → IP 주소)
CNAME 레코드: blog.example.com → example.com  (도메인 → 다른 도메인)
```

Cloudflare Tunnel의 경우:

```
rollbook.hariplan.com → <tunnel-id>.cfargotunnel.com
```

이렇게 하면 `rollbook.hariplan.com`으로 접속할 때 Cloudflare가 해당 터널로 요청을 전달합니다.

**config.yml의 ingress 규칙:**

```yaml
tunnel: a6a372c3-b19d-446f-9fae-0344c9f110b8

ingress:
  - hostname: supabase.hariplan.com
    service: http://localhost:54321
  - hostname: rollbook.hariplan.com
    service: http://localhost:3000
  - service: http_status:404
```

| 항목 | 설명 |
|------|------|
| `tunnel` | 터널 고유 ID (UUID) |
| `hostname` | 외부에서 접근할 도메인 이름 |
| `service` | 요청을 전달할 로컬 서비스 주소 |
| `http_status:404` | 매칭되지 않는 요청에 대한 기본 응답 (필수) |

**마지막 규칙 `service: http_status:404`이 필수인 이유:**

Cloudflare Tunnel의 ingress 규칙은 **반드시 catch-all 규칙으로 끝나야 합니다**. hostname이 없는 마지막 규칙이 그 역할을 합니다. 이 규칙이 없으면 `cloudflared`가 시작을 거부합니다.

```yaml
# 매칭 순서 (위에서 아래로)
ingress:
  - hostname: supabase.hariplan.com  # 1순위: 매칭되면 여기로
    service: http://localhost:54321
  - hostname: rollbook.hariplan.com  # 2순위: 매칭되면 여기로
    service: http://localhost:3000
  - service: http_status:404          # 3순위: 아무것도 매칭 안 되면 404 반환
```

### 4. Supabase `external_url`의 역할

**문제: 확인 이메일 링크가 `127.0.0.1:54321`을 가리킴**

Supabase Auth가 이메일 확인 링크를 생성할 때, API 서버의 URL을 사용합니다. 기본 설정에서는 로컬 주소를 사용합니다.

```
기본 확인 링크:
https://127.0.0.1:54321/auth/v1/verify?token=xxx&type=signup
         ^^^^^^^^^^^^^^^^
         로컬 주소 → 외부에서 접근 불가!
```

사용자가 이 링크를 클릭하면, `127.0.0.1:54321`은 사용자의 로컬 주소이므로 연결할 수 없습니다.

**해결: `external_url` 설정**

`supabase/config.toml`에서 API의 외부 URL을 지정합니다.

```toml
[api]
external_url = "https://supabase.hariplan.com"
```

이제 확인 링크가 올바른 도메인을 사용합니다.

```
수정 후 확인 링크:
https://supabase.hariplan.com/auth/v1/verify?token=xxx&type=signup
         ^^^^^^^^^^^^^^^^^^^^^^^^
         Cloudflare Tunnel을 통해 접근 가능!
```

**`external_url`이 영향을 미치는 것들:**

| 기능 | external_url 사용 여부 | 설명 |
|------|----------------------|------|
| 이메일 확인 링크 | 사용 | 회원가입 확인 이메일의 링크 도메인 |
| 비밀번호 재설정 링크 | 사용 | 비밀번호 재설정 이메일의 링크 도메인 |
| Magic Link | 사용 | 이메일 로그인 링크의 도메인 |
| API 응답 헤더 | 사용 | Location 헤더 등의 URL |
| Supabase 클라이언트 | 미사용 | `.env.local`의 `VITE_SUPABASE_URL`을 사용 |

### 5. Supabase `site_url`과 리다이렉트

**`site_url`의 역할:**

사용자가 이메일 확인 링크를 클릭한 후, Supabase Auth는 사용자를 **어디로 보낼지** 결정해야 합니다. 이때 `site_url`을 사용합니다.

```toml
[auth]
site_url = "https://rollbook.hariplan.com"
additional_redirect_urls = ["https://rollbook.hariplan.com", "http://127.0.0.1:3000"]
```

**인증 후 리다이렉트 흐름:**

```
1. 사용자가 확인 링크 클릭
2. Supabase Auth가 토큰 검증
3. 검증 성공 → 302 Redirect
4. 리다이렉트 URL = site_url (https://rollbook.hariplan.com)
5. 사용자가 Rollbook 앱으로 돌아옴
```

**`additional_redirect_urls`이 필요한 이유:**

개발 환경과 프로덕션 환경에서 리다이렉트 URL이 다릅니다.

| 환경 | URL | 용도 |
|------|-----|------|
| 프로덕션 | `https://rollbook.hariplan.com` | Cloudflare Tunnel 경유 |
| 로컬 개발 | `http://127.0.0.1:3000` | Vite 개발 서버 직접 접근 |

`additional_redirect_urls`에 두 URL을 모두 등록하면, 어느 환경에서든 리다이렉트가 정상 동작합니다.

**보안 참고:** `redirect_urls`에 등록되지 않은 URL로의 리다이렉트는 거부됩니다. 이것은 오픈 리다이렉트 공격을 방지하는 보안 기능입니다.

### 6. SendGrid SMTP 설정

**왜 SMTP가 필요한가?**

Supabase의 기본 이메일 발송은 개발 용도로만 사용해야 합니다.

| 항목 | 기본 발송 | SendGrid SMTP |
|------|----------|---------------|
| 발신자 | noreply@supabase.io | 본인 이메일 (ohama100@gmail.com) |
| 발송 제한 | 시간당 2건 | 시간당 수백 건 |
| 스팸 필터링 | 스팸으로 분류될 가능성 높음 | 높은 전달률 |
| 브랜딩 | Supabase 브랜드 | Rollbook 브랜드 |
| 프로덕션 사용 | 부적합 | 적합 |

**SendGrid SMTP 설정 (`supabase/config.toml`):**

```toml
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

[auth.email.smtp]
enabled = true
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SENDGRID_API_KEY)"
admin_email = "ohama100@gmail.com"
sender_name = "Rollbook"
```

**각 설정의 의미:**

| 설정 | 값 | 설명 |
|------|-----|------|
| `enabled` | `true` | 외부 SMTP 사용 활성화 |
| `host` | `smtp.sendgrid.net` | SendGrid의 SMTP 서버 주소 |
| `port` | `587` | SMTP 포트 (STARTTLS 암호화) |
| `user` | `"apikey"` | SendGrid는 사용자 이름을 항상 `"apikey"`로 사용 |
| `pass` | `env(SENDGRID_API_KEY)` | 환경 변수에서 API 키를 읽음 |
| `admin_email` | `ohama100@gmail.com` | 발신자 이메일 주소 |
| `sender_name` | `"Rollbook"` | 이메일에 표시될 발신자 이름 |

**`env(SENDGRID_API_KEY)` 구문:**

`supabase/config.toml`에서 `env(변수명)` 구문을 사용하면, Supabase가 시작할 때 환경 변수의 값을 주입합니다. 실제 API 키는 `supabase/.env` 파일에 저장합니다.

```
supabase/.env:
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**왜 `config.toml`에 직접 키를 쓰지 않는가?**

1. **보안**: `config.toml`은 Git에 커밋될 수 있지만, `.env`는 `.gitignore`에 포함
2. **환경 분리**: 개발/프로덕션에서 다른 키를 사용 가능
3. **관례**: 시크릿은 환경 변수로 관리하는 것이 업계 표준

**SendGrid 주의사항:**

SendGrid에서 이메일을 발송하려면 **발신자 인증(Sender Identity Verification)**이 필요합니다. SendGrid 대시보드에서 `admin_email`로 설정한 이메일 주소를 인증해야 합니다. 인증하지 않으면 "Sender Identity not verified" 오류가 발생합니다.

### 7. 이메일 발송 제한 (Rate Limit)

**문제: 기본 제한이 시간당 2건**

Supabase의 기본 이메일 발송 제한은 시간당 2건입니다. 개발 중에 회원가입을 여러 번 테스트하면 금방 제한에 걸립니다.

```toml
# 기본값 (너무 낮음)
[auth]
rate_limit.email_sent = 2    # 시간당 2건
```

**해결: 제한 증가**

```toml
# 프로덕션 설정
[auth]
rate_limit.email_sent = 30   # 시간당 30건
```

**얼마로 설정해야 할까?**

| 사용자 규모 | 권장 설정 | 이유 |
|------------|----------|------|
| ~10명 (소규모 팀) | 10-30 | 회원가입 + 비밀번호 재설정 |
| ~50명 (중규모 팀) | 50-100 | 동시 가입 가능성 |
| 100명+ (대규모) | 100-300 | SendGrid 플랜 확인 필요 |

Rollbook은 ~20명 소규모 팀이므로 30으로 충분합니다.

**주의:** 이 제한은 **Supabase Auth 레벨**의 제한입니다. SendGrid 자체에도 발송 제한이 있으므로, SendGrid 플랜의 제한도 확인해야 합니다.

### 8. Vite `allowedHosts` 설정

**문제: Vite가 터널 호스트명을 차단함**

Vite 개발 서버는 보안상 `localhost` 이외의 호스트명으로 접근하는 것을 기본적으로 차단합니다.

```
사용자 → rollbook.hariplan.com → Cloudflare → localhost:3000
         ^^^^^^^^^^^^^^^^^^^^^^
         Vite: "이 호스트명은 허용되지 않습니다!" → 403 Forbidden
```

Vite가 받는 요청의 `Host` 헤더가 `rollbook.hariplan.com`인데, 이것이 허용 목록에 없으면 요청을 거부합니다.

**해결: `allowedHosts` 설정**

```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 3000,
    allowedHosts: ['localhost', '.hariplan.com'],
  },
  preview: {
    allowedHosts: ['localhost', '.hariplan.com'],
  },
});
```

**설정 분석:**

| 값 | 설명 |
|----|------|
| `'localhost'` | `localhost`로 직접 접근 허용 (로컬 개발) |
| `'.hariplan.com'` | `*.hariplan.com` 모든 서브도메인 허용 (앞의 `.`이 와일드카드) |

**왜 `server`와 `preview` 모두 설정하는가?**

| 명령 | Vite 서버 종류 | 사용 시점 |
|------|--------------|----------|
| `npm run dev` | `server` (HMR 지원 개발 서버) | 개발 중 |
| `npm run preview` | `preview` (빌드 결과물 서빙) | 프로덕션 테스트 |

두 서버 모두 터널을 통해 접근될 수 있으므로, 양쪽 모두 `allowedHosts`를 설정합니다.

### 9. 프론트엔드 환경 변수

**`.env.local` 설정:**

```env
VITE_SUPABASE_URL=https://supabase.hariplan.com
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**왜 URL을 변경해야 하는가?**

로컬 개발에서는 `http://127.0.0.1:54321`로 Supabase에 직접 접근했습니다. 하지만 터널을 통해 외부에서 접근하는 사용자는 이 주소에 접근할 수 없습니다.

```
로컬 개발:
  브라우저 → http://127.0.0.1:3000 → Supabase http://127.0.0.1:54321
  (같은 기기에서 실행, 직접 접근 가능)

터널 배포:
  브라우저 → https://rollbook.hariplan.com → Supabase https://supabase.hariplan.com
  (외부에서 접근, 터널을 통해야 함)
```

**Anon Key는 변경하지 않는 이유:**

Supabase Anon Key는 Supabase 프로젝트의 공개 키입니다. 로컬 Supabase 인스턴스의 키는 어느 URL로 접근하든 동일합니다. 접근 URL이 바뀌어도 같은 Supabase 인스턴스에 접근하므로 키는 그대로 사용합니다.

```
http://127.0.0.1:54321     → 같은 Supabase → 같은 Anon Key
https://supabase.hariplan.com → 같은 Supabase → 같은 Anon Key
```

### 10. Credentials 파일 형식

**문제: Token의 base64 인코딩 vs JSON 형식**

Cloudflare 대시보드에서 토큰 모드로 터널을 생성하면, 토큰 값은 base64로 인코딩된 JSON입니다.

```
토큰 값 (base64):
eyJhIjoiMTIzNDU2Nzg5MCIsInQiOiJhYmNkZWYiLCJzIjoiZ2hpamtsbW5vcA==...
```

이것을 base64 디코딩하면:

```json
{
  "a": "1234567890",      // AccountTag
  "t": "abcdef-1234-...", // TunnelID
  "s": "ghijklmnop..."    // TunnelSecret (base64)
}
```

**credentials 파일은 다른 형식을 요구:**

로컬 config 모드로 전환하려면 `~/.cloudflared/<tunnel-id>.json` 파일이 필요한데, 이 파일은 토큰과 다른 JSON 구조를 사용합니다.

```json
{
  "AccountTag": "1234567890",
  "TunnelSecret": "ghijklmnop...",
  "TunnelID": "abcdef-1234-..."
}
```

**변환 과정:**

```bash
# 1. 토큰을 base64 디코딩
echo "<토큰값>" | base64 -d

# 2. 출력된 JSON에서 키 매핑
#    "a" → "AccountTag"
#    "s" → "TunnelSecret"
#    "t" → "TunnelID"

# 3. 새 JSON 파일로 저장
# ~/.cloudflared/<tunnel-id>.json
```

이 변환을 하지 않으면 로컬 config 모드에서 "invalid credentials file" 오류가 발생합니다.

## 중요 코드 (Key Code)

### 1. Cloudflare Tunnel 설정 (`~/.cloudflared/config.yml`)

**전체 설정:**

```yaml
tunnel: a6a372c3-b19d-446f-9fae-0344c9f110b8

ingress:
  # Supabase API - 인증, 데이터베이스 API, Storage
  - hostname: supabase.hariplan.com
    service: http://localhost:54321

  # Rollbook 프론트엔드 - Vite 개발 서버
  - hostname: rollbook.hariplan.com
    service: http://localhost:3000

  # Catch-all 규칙 (필수)
  - service: http_status:404
```

**설정 해설:**

| 줄 | 설명 |
|----|------|
| `tunnel: a6a372c3-...` | 터널의 고유 ID. 터널 생성 시 부여됨 |
| `hostname: supabase.hariplan.com` | 이 호스트로 들어오는 요청을... |
| `service: http://localhost:54321` | ...Supabase API로 전달 |
| `hostname: rollbook.hariplan.com` | 이 호스트로 들어오는 요청을... |
| `service: http://localhost:3000` | ...Vite 개발 서버로 전달 |
| `service: http_status:404` | 그 외 모든 요청에 404 응답 |

**ingress 규칙 순서가 중요한 이유:**

규칙은 위에서 아래로 순서대로 평가됩니다. 첫 번째로 매칭되는 규칙이 적용됩니다. 마지막 catch-all 규칙은 항상 매칭되므로, 나머지 규칙보다 위에 있으면 모든 요청이 404가 됩니다.

```yaml
# 잘못된 순서 (모든 요청이 404)
ingress:
  - service: http_status:404            # 이것이 먼저 매칭됨!
  - hostname: rollbook.hariplan.com     # 도달하지 않음
    service: http://localhost:3000
```

### 2. Supabase 프로덕션 설정 (`supabase/config.toml`)

**외부 URL 설정:**

```toml
[api]
# 기본 설정 (포트, 스키마 등은 기존과 동일)
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

# 외부 URL - 이메일 확인 링크 등에서 사용
external_url = "https://supabase.hariplan.com"
```

**인증 설정:**

```toml
[auth]
enabled = true
site_url = "https://rollbook.hariplan.com"
additional_redirect_urls = ["https://rollbook.hariplan.com", "http://127.0.0.1:3000"]

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true

# 이메일 발송 속도 제한
[auth]
rate_limit.email_sent = 30
```

**SMTP 설정:**

```toml
[auth.email.smtp]
enabled = true
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SENDGRID_API_KEY)"
admin_email = "ohama100@gmail.com"
sender_name = "Rollbook"
```

**환경 변수 파일 (`supabase/.env`):**

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

**설정 간의 관계:**

```
config.toml의 pass = "env(SENDGRID_API_KEY)"
                              ↓
                    supabase/.env에서 값을 읽음
                              ↓
                    SENDGRID_API_KEY=SG.xxx...
                              ↓
                    Supabase가 SMTP 인증에 사용
```

### 3. Vite 설정 (`vite.config.js`)

**Phase 7에서 추가된 부분:**

```javascript
export default defineConfig({
  // ... 기존 plugins 설정 ...

  server: {
    port: 3000,
    allowedHosts: ['localhost', '.hariplan.com'],  // Phase 7에서 추가
  },
  preview: {
    allowedHosts: ['localhost', '.hariplan.com'],  // Phase 7에서 추가
  },

  // ... 기존 build 설정 ...
});
```

**Phase 6에서 이미 있던 설정과의 차이:**

```javascript
// Phase 6 (로컬 개발만)
server: {
  port: 3000,
  // allowedHosts 없음 → localhost만 허용
}

// Phase 7 (터널 배포 추가)
server: {
  port: 3000,
  allowedHosts: ['localhost', '.hariplan.com'],
  // → localhost + *.hariplan.com 모두 허용
}
```

### 4. 프론트엔드 환경 변수 (`.env.local`)

**Phase 7 설정:**

```env
VITE_SUPABASE_URL=https://supabase.hariplan.com
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

**URL 변경 전후 비교:**

```env
# Phase 1-6 (로컬 개발)
VITE_SUPABASE_URL=http://127.0.0.1:54321

# Phase 7 (터널 배포)
VITE_SUPABASE_URL=https://supabase.hariplan.com
```

**F#에서의 사용 (`src/Supabase/Client.fs`):**

```fsharp
module Supabase.Client

open Fable.Core.JsInterop

/// 환경 변수에서 Supabase 설정 읽기
let private supabaseUrl: string =
    importMember "import.meta.env.VITE_SUPABASE_URL"

let private supabaseAnonKey: string =
    importMember "import.meta.env.VITE_SUPABASE_ANON_KEY"

/// Supabase 클라이언트 생성
let supabase =
    let createClient = importMember "@supabase/supabase-js"
    createClient supabaseUrl supabaseAnonKey
```

`.env.local`의 값이 변경되면 Supabase 클라이언트가 자동으로 새 URL을 사용합니다. 코드 변경 없이 환경 변수만 바꾸면 됩니다.

### 5. 터널 실행 명령어

**Token 모드 (대시보드 관리):**

```bash
# Cloudflare Zero Trust 대시보드에서 발급받은 토큰으로 실행
cloudflared tunnel run --token eyJhIjoiMTIzNDU2Nzg5MCIs...
```

**Local Config 모드 (파일 관리):**

```bash
# config.yml + credentials 파일 사용
cloudflared tunnel run rollbook
```

**상태 확인:**

```bash
# 터널 목록 확인
cloudflared tunnel list

# 특정 터널 정보
cloudflared tunnel info rollbook

# DNS 라우팅 확인
cloudflared tunnel route dns rollbook rollbook.hariplan.com
cloudflared tunnel route dns rollbook supabase.hariplan.com
```

## 배운 점 (Lessons Learned)

### 1. 포트 포워딩 없는 배포가 가능하다

**처음 생각:**
"집에서 서버를 운영하려면 공유기 포트 포워딩, 고정 IP, 방화벽 설정이 필수다."

**실제:**
Cloudflare Tunnel을 사용하면 이 모든 과정이 불필요합니다.

```
전통적 방법: 고정 IP + 포트 포워딩 + 방화벽 + SSL 인증서 + DDoS 보호
Tunnel 방법: brew install cloudflared + 설정 파일 하나
```

**교훈:** 개인 프로젝트나 소규모 팀 서비스에서 Cloudflare Tunnel은 비용(무료)과 보안 면에서 최적의 선택입니다. 클라우드 서버를 빌리지 않아도 집에 있는 Mac Mini로 충분한 서비스를 운영할 수 있습니다.

### 2. 이메일 설정은 생각보다 복잡하다

**처음 생각:**
"SMTP 서버 주소만 넣으면 이메일이 전송되겠지?"

**실제로 필요한 것들:**

1. SendGrid 계정 생성 + API 키 발급
2. 발신자 이메일 인증 (Sender Identity Verification)
3. `config.toml`에 SMTP 설정
4. `external_url`로 확인 링크 도메인 설정
5. `site_url`로 리다이렉트 URL 설정
6. `additional_redirect_urls`로 개발 환경 URL 추가
7. 이메일 발송 제한(rate limit) 조정

**교훈:** 이메일 인증은 단순히 SMTP 설정만이 아니라, URL 설정, 보안 정책, 발송 제한 등 여러 요소가 연결되어 있습니다. 하나라도 빠지면 "이메일이 안 온다" 또는 "링크가 안 된다" 같은 문제가 발생합니다.

### 3. 설정 파일 간의 의존 관계를 파악하라

**Phase 7에서 변경한 파일들과 의존 관계:**

```
.env.local (VITE_SUPABASE_URL)
   ↓ 프론트엔드 API 호출 대상
supabase/config.toml (external_url, site_url)
   ↓ 이메일 링크 도메인, 리다이렉트
supabase/.env (SENDGRID_API_KEY)
   ↓ 이메일 발송 인증
~/.cloudflared/config.yml (ingress 규칙)
   ↓ 터널 라우팅
vite.config.js (allowedHosts)
   ↓ 호스트 허용
```

**하나라도 빠지면 발생하는 문제:**

| 빠진 설정 | 증상 |
|----------|------|
| `.env.local` URL 미변경 | 프론트엔드가 `127.0.0.1:54321`에 API 호출 → 외부 사용자 접속 불가 |
| `external_url` 미설정 | 확인 이메일 링크가 `127.0.0.1:54321` → 클릭 불가 |
| `site_url` 미설정 | 인증 후 리다이렉트가 `localhost` → 외부에서 접근 불가 |
| SMTP 미설정 | 이메일 발송 실패 → 회원가입 불가 |
| `allowedHosts` 미설정 | Vite가 터널 요청 거부 → 403 Forbidden |
| ingress 규칙 누락 | 터널이 요청을 전달할 곳을 모름 → 404 |

**교훈:** 분산된 설정 파일들이 서로 어떻게 연결되는지 이해하는 것이 중요합니다. "전체 그림"을 먼저 파악하고 각 설정을 변경하세요.

### 4. 에러 메시지를 꼼꼼히 읽어라

**Phase 7에서 만난 에러들과 해결:**

**에러 1: "Sender Identity not verified"**

```
SendGrid: The from address does not match a verified Sender Identity.
```

- 원인: SendGrid에서 발신자 이메일을 인증하지 않음
- 해결: SendGrid 대시보드 → Settings → Sender Authentication → 이메일 인증

**에러 2: 확인 링크가 `127.0.0.1:54321`**

```
이메일 내 링크: https://127.0.0.1:54321/auth/v1/verify?token=xxx
```

- 원인: `external_url` 미설정
- 해결: `supabase/config.toml`에 `external_url = "https://supabase.hariplan.com"` 추가

**에러 3: "Rate limit exceeded"**

```
Supabase: over_email_send_rate_limit
```

- 원인: 기본 이메일 발송 제한 (시간당 2건) 초과
- 해결: `rate_limit.email_sent = 30`으로 증가

**에러 4: Vite 403 Forbidden**

```
브라우저: 403 Forbidden - rollbook.hariplan.com is not allowed
```

- 원인: Vite의 `allowedHosts`에 터널 호스트명 미등록
- 해결: `allowedHosts: ['localhost', '.hariplan.com']` 추가

**교훈:** 에러 메시지에 해결의 단서가 있습니다. "verified", "rate limit", "not allowed" 같은 키워드가 문제의 원인을 직접적으로 알려줍니다.

### 5. 개발 환경과 프로덕션 환경을 동시에 유지하라

**Phase 7의 환경 구성:**

```
개발 (로컬):
  브라우저 → http://127.0.0.1:3000
  Supabase → http://127.0.0.1:54321
  이메일 → Supabase 기본 (Inbucket)

프로덕션 (터널):
  브라우저 → https://rollbook.hariplan.com
  Supabase → https://supabase.hariplan.com
  이메일 → SendGrid SMTP
```

**두 환경을 동시에 사용 가능하게 한 설정:**

1. `additional_redirect_urls`에 개발 URL 포함 (`http://127.0.0.1:3000`)
2. `allowedHosts`에 `localhost` 포함
3. Supabase Anon Key는 동일 (같은 인스턴스)

**교훈:** 프로덕션 설정을 할 때 개발 환경이 깨지지 않도록 주의하세요. `additional_redirect_urls`와 `allowedHosts`에 개발 URL도 함께 등록하면 환경 전환 없이 양쪽 모두 사용할 수 있습니다.

### 6. Supabase의 설정 반영에는 재시작이 필요하다

**처음 실수:**
`config.toml`을 수정한 후 서비스가 변경을 반영하지 않아 당황함.

**올바른 절차:**

```bash
# 1. config.toml 수정
vi supabase/config.toml

# 2. Supabase 재시작 (필수!)
supabase stop && supabase start

# 3. 변경 확인
supabase status
```

**교훈:** `config.toml`이나 `.env` 변경 후에는 반드시 `supabase stop && supabase start`로 재시작해야 합니다. 핫 리로드가 되지 않습니다.

## 흔한 실수 (Common Mistakes)

### 1. `external_url` 미설정

**증상:**
회원가입 확인 이메일의 링크가 `127.0.0.1:54321`을 가리켜서 외부 사용자가 클릭해도 접속 안 됨.

**원인:**

```toml
# config.toml에 external_url이 없으면
# Supabase가 기본 URL (localhost)을 사용
[api]
port = 54321
# external_url = ??? (설정 안 함)
```

**해결:**

```toml
[api]
port = 54321
external_url = "https://supabase.hariplan.com"
```

**디버깅 방법:**

1. 회원가입 시도
2. 이메일 확인 (SendGrid Activity 또는 받은 메일함)
3. 확인 링크의 URL 확인
4. `127.0.0.1`이 포함되어 있다면 `external_url` 미설정

### 2. SendGrid 발신자 미인증

**증상:**
회원가입 시 "Error sending confirmation email" 또는 이메일이 오지 않음.

**원인:**
SendGrid에서 발신자 이메일(`admin_email`)을 인증하지 않았음.

**해결:**

1. [SendGrid 대시보드](https://app.sendgrid.com) 접속
2. Settings → Sender Authentication
3. Single Sender Verification → Create New Sender
4. `admin_email`에 설정한 이메일 주소 입력
5. 인증 이메일 확인 후 클릭

**주의:** 인증이 완료될 때까지 SendGrid를 통한 모든 이메일 발송이 실패합니다.

### 3. config.toml 변경 후 재시작 미실행

**증상:**
`config.toml`을 수정했는데 변경 사항이 반영되지 않음.

**원인:**
Supabase는 시작 시 `config.toml`을 읽습니다. 실행 중에는 변경을 감지하지 않습니다.

**잘못된 방법:**

```bash
vi supabase/config.toml   # 설정 변경
# → 아무 것도 안 함 → 변경 미반영!
```

**올바른 방법:**

```bash
vi supabase/config.toml   # 설정 변경
supabase stop             # Supabase 중지
supabase start            # Supabase 재시작 → 새 설정 적용
```

### 4. catch-all ingress 규칙 누락

**증상:**
`cloudflared` 실행 시 바로 종료되며 에러 출력.

```
Error: The last ingress rule must match all hostnames
```

**원인:**

```yaml
# 잘못된 config.yml (catch-all 규칙 없음)
ingress:
  - hostname: rollbook.hariplan.com
    service: http://localhost:3000
  - hostname: supabase.hariplan.com
    service: http://localhost:54321
  # catch-all 규칙이 없음!
```

**해결:**

```yaml
# 올바른 config.yml
ingress:
  - hostname: rollbook.hariplan.com
    service: http://localhost:3000
  - hostname: supabase.hariplan.com
    service: http://localhost:54321
  - service: http_status:404     # 반드시 마지막에 추가!
```

### 5. VITE_SUPABASE_URL 미변경

**증상:**
터널을 통해 접속하면 프론트엔드는 보이지만, 로그인이나 데이터 조회가 안 됨.

**원인:**
`.env.local`의 `VITE_SUPABASE_URL`이 여전히 `http://127.0.0.1:54321`로 설정됨.

```
사용자 브라우저 (외부):
  프론트엔드 로드 성공 (rollbook.hariplan.com → localhost:3000)
  API 호출 실패 (127.0.0.1:54321 → 사용자 PC의 로컬 주소!)
```

**해결:**

```env
# .env.local
VITE_SUPABASE_URL=https://supabase.hariplan.com
```

**디버깅 방법:**

브라우저 개발자 도구 → Network 탭에서 API 호출 URL 확인.
`127.0.0.1`로 요청이 가고 있다면 `.env.local` 확인 필요.

### 6. Credentials 파일 형식 오류

**증상:**
`cloudflared tunnel run` 실행 시 "invalid credentials" 에러.

**원인:**
토큰 모드에서 받은 base64 값을 그대로 credentials 파일에 넣었음.

```json
// 잘못된 형식 (base64 그대로)
"eyJhIjoiMTIzNDU2Nzg5MCIs..."

// 올바른 형식 (디코딩된 JSON)
{
  "AccountTag": "1234567890",
  "TunnelSecret": "ghijklmnop...",
  "TunnelID": "abcdef-1234-..."
}
```

**해결:**

```bash
# base64 디코딩
echo "eyJhIjoiMTIzNDU2Nzg5MCIs..." | base64 -d

# 출력된 JSON을 올바른 형식으로 변환
# "a" → "AccountTag"
# "s" → "TunnelSecret"
# "t" → "TunnelID"
```

### 7. allowedHosts에 와일드카드 점(.) 누락

**증상:**
`rollbook.hariplan.com`으로 접속 시 Vite가 403 Forbidden 반환.

**원인:**

```javascript
// 잘못된 설정 (정확한 도메인만 허용)
allowedHosts: ['localhost', 'hariplan.com']
// → rollbook.hariplan.com은 'hariplan.com'과 다른 도메인!

// 올바른 설정 (서브도메인 와일드카드)
allowedHosts: ['localhost', '.hariplan.com']
// → .으로 시작하면 *.hariplan.com 전체 허용
```

**차이:**

| 설정 | 허용하는 도메인 |
|------|--------------|
| `'hariplan.com'` | `hariplan.com`만 (서브도메인 불가) |
| `'.hariplan.com'` | `*.hariplan.com` 모든 서브도메인 |

### 8. Supabase와 Vite 서버가 실행 중이 아님

**증상:**
터널은 정상인데 사이트에 접속하면 502 Bad Gateway 또는 빈 페이지.

**원인:**
cloudflared가 `localhost:3000`이나 `localhost:54321`로 요청을 전달하는데, 해당 포트에서 서버가 실행 중이 아님.

**해결 (서비스 실행 순서):**

```bash
# 1. Supabase 시작 (Docker 필요)
supabase start

# 2. Vite 개발 서버 시작
npm run dev

# 3. Cloudflare Tunnel 시작
cloudflared tunnel run --token <토큰>
# 또는
cloudflared tunnel run rollbook
```

**확인 방법:**

```bash
# Supabase 상태 확인
supabase status
# API URL: http://127.0.0.1:54321 이 출력되어야 함

# Vite 서버 확인
curl http://localhost:3000
# HTML이 반환되어야 함

# 터널 상태 확인
cloudflared tunnel list
# 터널이 ACTIVE 상태여야 함
```

## 테스트 (Verification)

### 1. 터널 연결 테스트

**터널 상태 확인:**

```bash
# 터널이 실행 중인지 확인
cloudflared tunnel list

# 기대 출력:
# ID                                   NAME      CREATED               CONNECTIONS
# a6a372c3-b19d-446f-9fae-...          rollbook  2026-02-XX            2xLAX, 2xSJC
```

**Connections 열이 중요합니다.** Cloudflare 터널은 여러 리전에 연결을 유지합니다. "2xLAX, 2xSJC" 같은 출력은 Los Angeles와 San Jose의 Cloudflare 엣지에 각각 2개씩 연결되어 있다는 의미입니다.

**DNS 확인:**

```bash
# CNAME 레코드 확인
dig rollbook.hariplan.com CNAME

# 기대 출력:
# rollbook.hariplan.com. CNAME a6a372c3-...cfargotunnel.com.

dig supabase.hariplan.com CNAME

# 기대 출력:
# supabase.hariplan.com. CNAME a6a372c3-...cfargotunnel.com.
```

### 2. 프론트엔드 접근 테스트

**브라우저에서 확인:**

1. `https://rollbook.hariplan.com` 접속
2. Rollbook 앱이 정상 표시되는지 확인
3. HTTPS 자물쇠 아이콘 확인 (Cloudflare 인증서)

**curl로 확인:**

```bash
# 프론트엔드 접근
curl -I https://rollbook.hariplan.com

# 기대 출력:
# HTTP/2 200
# content-type: text/html
# server: cloudflare
# cf-ray: xxxx-LAX
```

`server: cloudflare`가 표시되면 Cloudflare를 통해 정상 라우팅되고 있는 것입니다.

### 3. Supabase API 테스트

**API 건강 확인:**

```bash
# Supabase 건강 체크
curl https://supabase.hariplan.com/rest/v1/

# 기대 출력:
# {"message":"...","hint":"..."}
```

**인증이 필요한 API 호출:**

```bash
# workouts 테이블 조회 (Anon Key 필요)
curl -H "apikey: <ANON_KEY>" \
     -H "Authorization: Bearer <ANON_KEY>" \
     https://supabase.hariplan.com/rest/v1/workouts?select=*&limit=1

# 기대 출력: JSON 배열 (빈 배열이라도 200 OK)
```

### 4. 이메일 인증 테스트

**전체 흐름 테스트:**

1. `https://rollbook.hariplan.com`에서 회원가입
2. 입력한 이메일로 확인 이메일 도착 확인
3. 이메일 내 확인 링크의 도메인이 `supabase.hariplan.com`인지 확인
4. 확인 링크 클릭
5. `https://rollbook.hariplan.com`으로 리다이렉트되는지 확인
6. 로그인 상태인지 확인

**확인 체크리스트:**

| 단계 | 확인 항목 | 예상 결과 |
|------|----------|----------|
| 1 | 회원가입 요청 | 200 OK |
| 2 | 이메일 도착 | 발신자: "Rollbook <ohama100@gmail.com>" |
| 3 | 확인 링크 URL | `https://supabase.hariplan.com/auth/v1/verify?...` |
| 4 | 링크 클릭 | 302 Redirect |
| 5 | 리다이렉트 대상 | `https://rollbook.hariplan.com` |
| 6 | 앱 상태 | 로그인 완료 |

### 5. SendGrid 활동 로그 확인

SendGrid 대시보드에서 이메일 발송 상태를 확인할 수 있습니다.

1. [SendGrid 대시보드](https://app.sendgrid.com) → Activity
2. 최근 이메일 발송 내역 확인
3. Status가 "Delivered"인지 확인

| Status | 의미 | 조치 |
|--------|------|------|
| Delivered | 수신 서버에 전달 완료 | 정상 |
| Processed | 발송 처리 중 | 잠시 대기 |
| Bounced | 수신 거부됨 | 이메일 주소 확인 |
| Blocked | 발송 차단됨 | 발신자 인증 확인 |
| Deferred | 지연됨 | 수신 서버 문제, 재시도 |

### 6. 개발 환경 정상 동작 확인

프로덕션 설정 후 로컬 개발도 여전히 작동하는지 확인합니다.

```bash
# 1. .env.local을 로컬 URL로 변경 (개발 시)
# VITE_SUPABASE_URL=http://127.0.0.1:54321

# 2. Vite 개발 서버 시작
npm run dev

# 3. http://127.0.0.1:3000 접속
# 앱이 정상 동작하는지 확인

# 4. 로그인/회원가입 테스트
# Supabase Inbucket (http://127.0.0.1:54324) 에서 이메일 확인
```

**주의:** 개발과 프로덕션을 오갈 때 `.env.local`의 `VITE_SUPABASE_URL`을 변경해야 합니다. 또는 `.env.local`(개발)과 `.env.production`(프로덕션)을 분리하여 사용할 수 있습니다.

### 7. 보안 점검

| 항목 | 확인 방법 | 기대 결과 |
|------|----------|----------|
| HTTPS | 브라우저 주소창 자물쇠 | 유효한 인증서 |
| 포트 비노출 | 외부에서 `nmap <Mac Mini IP>` | 열린 포트 없음 |
| Supabase Studio | `https://supabase.hariplan.com:54323` | 접근 불가 (터널 미등록) |
| API 인증 | Anon Key 없이 API 호출 | 401 Unauthorized |
| RLS 동작 | 다른 사용자 데이터 수정 시도 | 실패 |

**Supabase Studio를 터널에 노출하지 않는 이유:**

Supabase Studio (`localhost:54323`)는 데이터베이스 관리 UI입니다. SQL 편집기, 테이블 직접 수정 등 강력한 기능을 제공합니다. 이것을 외부에 노출하면 보안 위험이 커집니다.

```yaml
# config.yml - Studio는 의도적으로 제외
ingress:
  - hostname: supabase.hariplan.com
    service: http://localhost:54321    # API만 노출
  # Studio (54323)는 노출하지 않음!
  # DB (54322)도 노출하지 않음!
```

Studio는 Mac Mini에 직접 접속해서만 사용합니다 (`http://localhost:54323`).

## 다음 단계 (Next Steps)

### 1. 자동 시작 설정 (launchd)

현재는 Mac Mini를 재시작할 때마다 서비스를 수동으로 시작해야 합니다. `launchd`를 사용하면 부팅 시 자동 시작할 수 있습니다.

**cloudflared 자동 시작:**

```bash
# macOS 서비스로 등록
sudo cloudflared service install
```

또는 수동으로 LaunchAgent를 만들 수 있습니다.

```xml
<!-- ~/Library/LaunchAgents/com.rollbook.tunnel.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.rollbook.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/cloudflared</string>
        <string>tunnel</string>
        <string>run</string>
        <string>rollbook</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/rollbook-tunnel.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/rollbook-tunnel.error.log</string>
</dict>
</plist>
```

```bash
# 서비스 등록
launchctl load ~/Library/LaunchAgents/com.rollbook.tunnel.plist

# 서비스 해제
launchctl unload ~/Library/LaunchAgents/com.rollbook.tunnel.plist
```

**전체 서비스 자동 시작 순서:**

```
Mac Mini 부팅
  ↓
1. Docker Desktop (시스템 설정 > 로그인 항목)
  ↓
2. Supabase (com.rollbook.supabase.plist)
  ↓
3. Vite 서버 (com.rollbook.frontend.plist)
  ↓
4. Cloudflare Tunnel (com.rollbook.tunnel.plist)
```

### 2. Cloudflare Access (접근 제어)

현재 `rollbook.hariplan.com`은 URL을 아는 누구나 접근할 수 있습니다. Cloudflare Access를 사용하면 특정 사용자만 접근하도록 제한할 수 있습니다.

**Google Workspace 로그인 연동:**

1. Cloudflare Zero Trust 대시보드에서 Identity Provider 추가 (Google)
2. Access Application 생성 (rollbook.hariplan.com)
3. Policy: "Allow if email ends with @hariplan.com"

이렇게 하면 `@hariplan.com` Google Workspace 계정으로 로그인해야만 앱에 접근할 수 있습니다.

### 3. Vite Build + Preview 모드

현재는 Vite 개발 서버(`npm run dev`)를 프로덕션에서 사용하고 있습니다. 성능과 안정성을 위해 빌드 후 프리뷰 모드를 사용할 수 있습니다.

```bash
# 프로덕션 빌드
npm run build

# 프리뷰 서버 시작 (빌드 결과물 서빙)
npm run preview
# → http://localhost:4173
```

config.yml도 변경해야 합니다.

```yaml
ingress:
  - hostname: rollbook.hariplan.com
    service: http://localhost:4173    # 3000 → 4173
```

**dev vs preview 비교:**

| 항목 | `npm run dev` | `npm run preview` |
|------|-------------|-------------------|
| 포트 | 3000 | 4173 |
| HMR | 지원 (코드 변경 즉시 반영) | 미지원 |
| 빌드 최적화 | 미적용 | Terser 압축, Manual Chunks |
| Console.log | 표시 | 제거 (drop_console) |
| 용도 | 개발 중 | 프로덕션 서비스 |

### 4. 모니터링

**Cloudflare Analytics:**

Cloudflare 대시보드에서 기본적인 트래픽 모니터링을 제공합니다.

- 요청 수, 대역폭
- 국가별 접속 통계
- 위협 차단 내역

**Supabase 대시보드:**

로컬 Supabase Studio (`http://localhost:54323`)에서:

- 테이블 데이터 확인
- 실행된 쿼리 로그
- Auth 사용자 목록

**향후 추가 가능한 모니터링:**

- Sentry: 프론트엔드 에러 추적
- UptimeRobot: 서비스 가용성 모니터링 (무료)
- Cloudflare Zero Trust 로그: 접근 기록

### 5. 백업 전략

Mac Mini에서 로컬 서비스를 운영하므로, 데이터 백업이 중요합니다.

**Supabase 데이터 백업:**

```bash
# PostgreSQL 덤프
pg_dump -h localhost -p 54322 -U postgres > backup_$(date +%Y%m%d).sql
```

**Storage 파일 백업:**

```bash
# Supabase Storage 볼륨은 Docker 볼륨에 저장됨
# Docker 볼륨 백업
docker run --rm -v supabase_storage:/data -v $(pwd):/backup \
  alpine tar czf /backup/storage_backup_$(date +%Y%m%d).tar.gz /data
```

**자동 백업 스크립트 (cron):**

```bash
# crontab -e
# 매일 새벽 3시에 백업
0 3 * * * /Users/<username>/scripts/backup-rollbook.sh
```

### 6. 학습 리소스

**Cloudflare Tunnel:**
- [Cloudflare Tunnel 공식 문서](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Cloudflare Zero Trust](https://developers.cloudflare.com/cloudflare-one/)

**SendGrid:**
- [SendGrid SMTP 가이드](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Sender Authentication](https://docs.sendgrid.com/ui/account-and-settings/sender-verification)

**Supabase Self-Hosting:**
- [Supabase CLI 설정 문서](https://supabase.com/docs/guides/cli/config)
- [Supabase Auth SMTP 설정](https://supabase.com/docs/guides/auth/auth-smtp)

**Vite:**
- [Vite 서버 옵션](https://vitejs.dev/config/server-options.html)

---

## 마치며

Phase 7에서 Rollbook 앱을 실제 프로덕션 환경으로 배포했습니다.

**완성한 것:**
- Cloudflare Tunnel로 포트 노출 없는 안전한 서비스 배포
- 커스텀 도메인 (`rollbook.hariplan.com`, `supabase.hariplan.com`)
- SendGrid SMTP를 통한 프로덕션 이메일 인증
- Supabase 프로덕션 설정 (external_url, site_url, SMTP)
- 개발 환경과 프로덕션 환경의 공존

**핵심 기술:**
- **Cloudflare Tunnel**: 포트 포워딩 없는 안전한 외부 접근
- **DNS CNAME + ingress 규칙**: hostname 기반 서비스 라우팅
- **external_url / site_url**: 이메일 확인 링크와 리다이렉트 URL 관리
- **SendGrid SMTP**: 안정적인 이메일 발송
- **allowedHosts**: Vite 호스트 검증 설정

**배포 전후 비교:**

| 항목 | Phase 6 이전 (로컬만) | Phase 7 (프로덕션) |
|------|---------------------|-------------------|
| 접속 URL | http://127.0.0.1:3000 | https://rollbook.hariplan.com |
| HTTPS | 없음 | Cloudflare 자동 |
| 외부 접근 | 불가 | 가능 |
| 이메일 | Inbucket (개발용) | SendGrid (프로덕션) |
| 보안 | 로컬만 | 포트 비노출 + HTTPS |
| 비용 | 무료 | 무료 (Cloudflare Free + SendGrid Free) |

**다음 단계:**
Phase 7을 기반으로 launchd 자동 시작, Cloudflare Access 접근 제어, 모니터링, 백업 등을 추가하면 완전한 프로덕션 운영 환경이 됩니다.

---

*작성일: 2026-02-15*
*대상 독자: 초보 개발자*
*언어: 한글*
