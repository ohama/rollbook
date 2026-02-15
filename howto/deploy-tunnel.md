# Cloudflare Tunnel 배포 가이드

자체 도메인 + Google Workspace 환경에서, Mac Mini의 포트를 외부에 노출하지 않고 안전하게 서비스하는 방법입니다.

## 구성 개요

```
┌─ 인터넷 ──────────────────────────────────────────────────────────┐
│                                                                    │
│  사용자 브라우저                                                    │
│       │                                                            │
│       ▼                                                            │
│  ┌─────────────────────────────────────────────┐                   │
│  │           Cloudflare Edge                    │                   │
│  │  ┌───────────────┐  ┌────────────────────┐  │                   │
│  │  │  DNS + HTTPS  │  │ Cloudflare Access  │  │                   │
│  │  │  (자동 인증서) │  │ (Google 로그인)     │  │                   │
│  │  └───────┬───────┘  └────────┬───────────┘  │                   │
│  └──────────┼───────────────────┼──────────────┘                   │
│             │  아웃바운드 전용 (포트 개방 불필요)                     │
│             ▼                                                      │
│  ┌──────────────────────────────────────────────┐                  │
│  │              Mac Mini                         │                  │
│  │  ┌──────────────┐  ┌───────────────────────┐ │                  │
│  │  │ cloudflared  │  │   Supabase (Docker)   │ │                  │
│  │  │ (터널 데몬)   │  │  API :54321           │ │                  │
│  │  └──────┬───────┘  │  DB  :54322           │ │                  │
│  │         │          │  Storage               │ │                  │
│  │         ▼          └───────────────────────┘ │                  │
│  │  ┌──────────────┐           ▲                │                  │
│  │  │ Vite Preview │───────────┘                │                  │
│  │  │   :4173      │                            │                  │
│  │  └──────────────┘                            │                  │
│  │                                               │                  │
│  │  ※ 공유기 포트 포워딩 없음                      │                  │
│  │  ※ 방화벽 인바운드 규칙 없음                    │                  │
│  └──────────────────────────────────────────────┘                  │
└────────────────────────────────────────────────────────────────────┘
```

**핵심 포인트:**
- cloudflared가 Cloudflare로 **아웃바운드** 연결을 생성 (인바운드 포트 불필요)
- Cloudflare Access로 Google Workspace 계정만 접근 허용
- HTTPS 인증서 자동 발급/갱신
- DDoS 보호 포함

## 사전 준비

| 항목 | 설명 |
|------|------|
| 도메인 | 본인 소유 도메인 (예: `example.com`) |
| Cloudflare 계정 | 무료 플랜 가능 |
| Google Workspace | 조직 도메인의 Google 계정 |
| Mac Mini | Docker + Supabase + Node.js 설치 완료 |

## 1. 도메인을 Cloudflare로 이전

### 1.1 Cloudflare에 도메인 추가

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속
2. **Add a site** → 도메인 입력 (예: `example.com`)
3. **Free** 플랜 선택
4. Cloudflare가 기존 DNS 레코드를 스캔

### 1.2 네임서버 변경

Cloudflare가 제공하는 네임서버 2개를 도메인 등록기관에서 설정:

```
예시:
  ns1.cloudflare.com → ada.ns.cloudflare.com
  ns2.cloudflare.com → bob.ns.cloudflare.com
```

도메인 등록기관(가비아, Namecheap 등)의 네임서버 설정에서 변경합니다.

> 네임서버 변경 후 전파에 최대 24시간 소요될 수 있습니다.

### 1.3 Google Workspace MX 레코드 확인

네임서버 변경 후 Google Workspace 메일이 계속 동작하도록 MX 레코드를 확인합니다.

Cloudflare DNS 설정에서 아래 레코드가 있는지 확인:

| Type | Name | Content | Priority |
|------|------|---------|----------|
| MX | @ | aspmx.l.google.com | 1 |
| MX | @ | alt1.aspmx.l.google.com | 5 |
| MX | @ | alt2.aspmx.l.google.com | 5 |
| MX | @ | alt3.aspmx.l.google.com | 10 |
| MX | @ | alt4.aspmx.l.google.com | 10 |

기존 도메인에 SPF, DKIM, DMARC 레코드가 있다면 그대로 유지합니다.

## 2. Cloudflare Tunnel 설정

### 2.1 cloudflared 설치

```bash
brew install cloudflared
```

### 2.2 Cloudflare 로그인

```bash
cloudflared tunnel login
```

브라우저가 열리면 도메인을 선택하고 인증합니다.
인증서가 `~/.cloudflared/cert.pem`에 저장됩니다.

### 2.3 터널 생성

```bash
cloudflared tunnel create rollbook
```

출력에서 터널 ID를 확인합니다:

```
Created tunnel rollbook with id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

자격증명 파일이 `~/.cloudflared/<TUNNEL_ID>.json`에 생성됩니다.

### 2.4 터널 설정 파일 작성

```bash
vi ~/.cloudflared/config.yml
```

```yaml
tunnel: rollbook
credentials-file: /Users/<username>/.cloudflared/<TUNNEL_ID>.json

ingress:
  # 프론트엔드 앱
  - hostname: rollbook.example.com
    service: http://localhost:4173

  # Supabase API
  - hostname: api-rollbook.example.com
    service: http://localhost:54321

  # 기본 규칙 (필수)
  - service: http_status:404
```

> `<username>`과 `<TUNNEL_ID>`를 실제 값으로 변경하세요.

### 2.5 DNS 레코드 등록

```bash
cloudflared tunnel route dns rollbook rollbook.example.com
cloudflared tunnel route dns rollbook api-rollbook.example.com
```

Cloudflare DNS에 CNAME 레코드가 자동 생성됩니다.

### 2.6 터널 실행 테스트

```bash
cloudflared tunnel run rollbook
```

정상 동작 확인 후 `Ctrl+C`로 종료합니다.

## 3. Cloudflare Access 설정 (Google 로그인)

Google Workspace 사용자만 접근할 수 있도록 제한합니다.

### 3.1 Zero Trust 대시보드 접속

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com) 접속
2. 좌측 메뉴 **Settings** → **Authentication**

### 3.2 Google을 Identity Provider로 추가

1. **Add new** → **Google** 선택
2. Google Cloud Console에서 OAuth 2.0 클라이언트 생성:
   - [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
   - **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/callback`
3. Client ID와 Client Secret을 Cloudflare에 입력
4. **Test** 버튼으로 연결 확인

### 3.3 Access Application 생성

1. **Access** → **Applications** → **Add an application**
2. **Self-hosted** 선택
3. 설정:

**Application Configuration:**
| 항목 | 값 |
|------|-----|
| Application name | Rollbook |
| Session Duration | 24 hours |
| Application domain | `rollbook.example.com` |

4. **Add another domain**으로 API 도메인 추가:
   - `api-rollbook.example.com`

**Policy 설정:**

| 항목 | 값 |
|------|-----|
| Policy name | Google Workspace Users |
| Action | Allow |
| Include | Emails ending in `@example.com` |

이렇게 하면 `@example.com` Google Workspace 계정만 접근 가능합니다.

> 특정 사용자만 허용하려면 "Include"에 개별 이메일을 추가하세요.

## 4. 환경 변수 설정

### 4.1 프로덕션 환경 변수

```bash
# .env.production
VITE_SUPABASE_URL=https://api-rollbook.example.com
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

anon key는 아래 명령으로 확인:

```bash
npx supabase status
```

### 4.2 Supabase 추가 URL 설정

Supabase가 올바른 URL을 반환하도록 `supabase/config.toml`에 설정:

```toml
[api]
extra_search_path = ["public", "extensions"]

[api.external_url]
# Cloudflare Tunnel을 통한 외부 URL
# 스토리지 서명 URL 등에서 사용됨
```

> 로컬 Supabase는 기본적으로 localhost를 사용하므로, 프론트엔드에서 API 호출 시 `.env.production`의 URL을 사용하면 됩니다.

### 4.3 빌드 및 실행

```bash
# 프로덕션 빌드 (.env.production 자동 적용)
npm run build

# 서비스 시작
npm run preview
```

## 5. 자동 시작 설정 (launchd)

Mac Mini 부팅 시 cloudflared 터널을 자동으로 시작합니다.

### 5.1 cloudflared 서비스 등록

```bash
# macOS 서비스로 설치
sudo cloudflared service install
```

이 명령은 `/Library/LaunchDaemons/com.cloudflare.cloudflared.plist`를 생성합니다.

또는 수동으로 LaunchAgent를 만들 수 있습니다:

```bash
cat > ~/Library/LaunchAgents/com.rollbook.tunnel.plist << 'EOF'
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
EOF

launchctl load ~/Library/LaunchAgents/com.rollbook.tunnel.plist
```

### 5.2 전체 서비스 시작 순서

Mac Mini 부팅 시 자동 시작되는 서비스:

```
1. Docker Desktop       (시스템 설정 > 로그인 항목)
2. Supabase              (com.rollbook.supabase.plist)
3. Frontend              (com.rollbook.frontend.plist)
4. Cloudflare Tunnel     (com.rollbook.tunnel.plist)
```

## 6. 운영 관리

### 상태 확인

```bash
# 터널 상태
cloudflared tunnel info rollbook

# 활성 연결 확인
cloudflared tunnel list

# 로그 확인
tail -f /tmp/rollbook-tunnel.log
```

### 터널 중지/재시작

```bash
# 수동 중지
launchctl unload ~/Library/LaunchAgents/com.rollbook.tunnel.plist

# 수동 시작
launchctl load ~/Library/LaunchAgents/com.rollbook.tunnel.plist
```

### Cloudflare Dashboard에서 모니터링

- [Cloudflare Zero Trust](https://one.dash.cloudflare.com) → **Analytics** → 접근 로그 확인
- 누가 언제 접속했는지 Google 계정 기준으로 기록됨

## 7. 보안 체크리스트

| 항목 | 상태 | 설명 |
|------|------|------|
| 포트 외부 노출 | 없음 | cloudflared 아웃바운드 전용 |
| HTTPS | 자동 | Cloudflare 엣지에서 처리 |
| 인증 | Google Workspace | Cloudflare Access 정책 |
| Supabase Studio | 비노출 | 터널에 포함하지 않음 |
| Supabase Auth | 활성 | 앱 레벨 인증 |
| DDoS 보호 | 활성 | Cloudflare 기본 제공 |
| 접근 로그 | 활성 | Zero Trust 대시보드 |

## 비용

| 서비스 | 비용 |
|--------|------|
| Cloudflare Free 플랜 | 무료 |
| Cloudflare Tunnel | 무료 |
| Cloudflare Access (50명 이하) | 무료 |
| 도메인 유지비 | 연간 약 $10~15 |

## 문제 해결

### 터널 연결 실패

```bash
# 자격증명 파일 확인
ls ~/.cloudflared/*.json

# 터널 재생성 (최후 수단)
cloudflared tunnel delete rollbook
cloudflared tunnel create rollbook
# config.yml의 credentials-file 경로 업데이트 필요
```

### Google 로그인 안 됨

- Cloudflare Access의 redirect URI와 Google Cloud Console의 설정이 일치하는지 확인
- Google Cloud Console에서 OAuth 동의 화면이 "Internal"(조직 전용)로 설정되어 있는지 확인

### API 호출 CORS 오류

Supabase API를 별도 서브도메인으로 운영하므로 CORS 설정이 필요할 수 있습니다.
`supabase/config.toml`:

```toml
[api]
extra_search_path = ["public", "extensions"]
```

프론트엔드에서 Supabase 클라이언트 생성 시 URL이 `.env.production`의 값과 일치하는지 확인하세요.

## 참고

- [Cloudflare Tunnel 공식 문서](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Cloudflare Access + Google 연동](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/google/)
- [서비스 가이드](./service-guide.md) - Mac Mini 서비스 관리
- [컴파일 가이드](./compile-guide.md) - 빌드 방법
