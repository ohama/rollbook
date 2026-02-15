# 서비스 가이드

Mac Mini에서 Rollbook을 서비스하는 방법을 설명합니다.

## 서비스 구성

Rollbook은 두 개의 서비스로 구성됩니다:

```
┌─────────────────────────────────────────────────────────────┐
│                        Mac Mini                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐      ┌─────────────────────────────┐   │
│  │  Static Server  │      │       Supabase (Docker)      │   │
│  │  (Vite Preview) │      │  ┌─────┐ ┌────┐ ┌────────┐  │   │
│  │    Port: 4173   │◄────►│  │ API │ │ DB │ │ Storage│  │   │
│  └─────────────────┘      │  │54321│ │5432│ │  54321 │  │   │
│           ▲               │  └─────┘ └────┘ └────────┘  │   │
│           │               └─────────────────────────────────┘   │
│      브라우저                                                 │
└─────────────────────────────────────────────────────────────┘
```

## 1. Supabase 서비스 시작

### Docker 시작

```bash
# Docker Desktop 실행 (GUI) 또는
open -a Docker

# Docker 상태 확인
docker info
```

### Supabase 시작

```bash
cd rollbook
npx supabase start
```

첫 실행 시 Docker 이미지 다운로드로 시간이 걸릴 수 있습니다.

### 상태 확인

```bash
npx supabase status
```

출력 예시:
```
         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
  S3 Storage URL: http://localhost:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 마이그레이션 적용

```bash
npx supabase db reset
```

이 명령은:
1. 데이터베이스 초기화
2. `supabase/migrations/` 내 모든 마이그레이션 적용
3. 테이블, RLS 정책, 스토리지 버킷 생성

## 2. 프론트엔드 서비스 시작

### 개발 모드

```bash
npm run dev
```

- URL: http://localhost:5173
- 핫 리로드 지원
- Service Worker 비활성화

### 프로덕션 모드 (권장)

```bash
# 빌드
npm run build

# 서비스
npm run preview
```

- URL: http://localhost:4173
- 최적화된 번들
- Service Worker 활성화 (PWA)
- 오프라인 지원

## 3. 서비스 URL 정리

| 서비스 | 로컬 URL | 외부 URL (터널) | 용도 |
|--------|----------|----------------|------|
| Rollbook App | http://localhost:3000 (dev) / :4173 (preview) | https://rollbook.hariplan.com | 메인 앱 |
| Supabase API | http://localhost:54321 | https://supabase.hariplan.com | REST API |
| Supabase Studio | http://localhost:54323 | — (터널 비노출) | DB 관리 UI |
| Inbucket/Mailpit | http://localhost:54324 | — (터널 비노출) | 이메일 테스트 |

## 4. 외부 접근 설정

외부에서 Rollbook 서비스에 접근하는 방법을 설명합니다.

### 4.1 접근 시나리오별 설정

```
┌─────────────────────────────────────────────────────────────────────┐
│                        접근 시나리오                                  │
├─────────────────────────────────────────────────────────────────────┤
│  1. 같은 Wi-Fi/LAN     →  내부 IP 직접 접근 (192.168.x.x)            │
│  2. 외부 인터넷        →  포트 포워딩 + DDNS 또는 터널링 서비스       │
│  3. 임시 공유          →  ngrok / Cloudflare Tunnel (가장 간편)      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 같은 네트워크 (LAN) 접근

집이나 사무실의 같은 Wi-Fi/유선 네트워크에서 접근하는 경우입니다.

#### Step 1: Mac Mini IP 확인

```bash
# Wi-Fi IP
ipconfig getifaddr en0

# Ethernet IP
ipconfig getifaddr en1

# 모든 인터페이스 확인
ifconfig | grep "inet " | grep -v 127.0.0.1
```

예시 출력: `192.168.0.10`

#### Step 2: 서비스를 외부 IP에 바인딩

**프론트엔드 (Vite Preview)**

```bash
# 일회성 실행
npm run preview -- --host 0.0.0.0

# 또는 package.json 수정 (영구 적용)
```

package.json:
```json
{
  "scripts": {
    "preview": "vite preview --host 0.0.0.0"
  }
}
```

**Supabase API**

Supabase는 기본적으로 `0.0.0.0`에 바인딩되어 있어 추가 설정 불필요합니다.

#### Step 3: 환경 변수 수정

`.env` 파일에서 Supabase URL을 Mac Mini IP로 변경:

```bash
# 기존 (localhost)
VITE_SUPABASE_URL=http://localhost:54321

# 변경 (Mac Mini IP)
VITE_SUPABASE_URL=http://192.168.0.10:54321
```

**중요:** 앱을 다시 빌드해야 합니다:
```bash
npm run build
npm run preview -- --host 0.0.0.0
```

#### Step 4: macOS 방화벽 설정

```bash
# 방화벽 상태 확인
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# 방화벽 비활성화 (테스트용, 비권장)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# 또는 GUI에서 설정
# 시스템 설정 > 네트워크 > 방화벽 > 옵션 > 들어오는 연결 허용
```

#### Step 5: 다른 기기에서 접근

```
앱:       http://192.168.0.10:4173
Studio:   http://192.168.0.10:54323
API:      http://192.168.0.10:54321
```

---

### 4.3 외부 인터넷 접근 (포트 포워딩)

집 밖에서 인터넷을 통해 접근하는 경우입니다.

#### 필요 조건

- 공유기 관리자 접근 권한
- ISP가 포트 포워딩 허용 (일부 ISP는 차단)
- 고정 IP 또는 DDNS 서비스

#### Step 1: 공유기 포트 포워딩 설정

공유기 관리 페이지 접속 (보통 `192.168.0.1` 또는 `192.168.1.1`):

```
┌─────────────────────────────────────────────────────────────────┐
│                    포트 포워딩 규칙                               │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ 서비스 이름   │ 외부 포트     │ 내부 IP       │ 내부 포트         │
├──────────────┼──────────────┼──────────────┼───────────────────┤
│ Rollbook-App │ 4173         │ 192.168.0.10 │ 4173              │
│ Rollbook-API │ 54321        │ 192.168.0.10 │ 54321             │
└──────────────┴──────────────┴──────────────┴───────────────────┘
```

#### Step 2: 공인 IP 확인

```bash
curl -s ifconfig.me
# 또는
curl -s ipinfo.io/ip
```

예시: `123.456.78.90`

#### Step 3: DDNS 설정 (권장)

가정용 인터넷은 IP가 변경될 수 있으므로 DDNS 사용을 권장합니다.

**무료 DDNS 서비스:**
- [No-IP](https://www.noip.com/) - 무료 플랜 제공
- [DuckDNS](https://www.duckdns.org/) - 완전 무료
- [FreeDNS](https://freedns.afraid.org/) - 완전 무료

**DuckDNS 설정 예시:**

1. https://www.duckdns.org 에서 가입
2. 도메인 생성 (예: `my-rollbook.duckdns.org`)
3. Mac Mini에서 자동 업데이트 설정:

```bash
# crontab에 추가 (5분마다 IP 업데이트)
crontab -e

# 아래 줄 추가 (토큰은 DuckDNS에서 확인)
*/5 * * * * curl -s "https://www.duckdns.org/update?domains=my-rollbook&token=YOUR_TOKEN&ip="
```

#### Step 4: 환경 변수 수정

```bash
# .env
VITE_SUPABASE_URL=http://my-rollbook.duckdns.org:54321
```

빌드 후 재시작:
```bash
npm run build && npm run preview -- --host 0.0.0.0
```

#### Step 5: 외부에서 접근

```
앱: http://my-rollbook.duckdns.org:4173
API: http://my-rollbook.duckdns.org:54321
```

---

### 4.4 터널링 서비스 (가장 간편)

포트 포워딩 없이 외부 접근을 설정하는 방법입니다. 테스트나 데모에 적합합니다.

#### 옵션 A: ngrok (권장)

```bash
# 설치
brew install ngrok

# 계정 설정 (https://ngrok.com 에서 가입)
ngrok config add-authtoken YOUR_AUTH_TOKEN

# 프론트엔드 터널 (별도 터미널)
ngrok http 4173

# Supabase API 터널 (별도 터미널)
ngrok http 54321
```

출력 예시:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:4173
```

**환경 변수 수정:**
```bash
# .env (ngrok API URL로 변경)
VITE_SUPABASE_URL=https://xyz789.ngrok.io
```

빌드 후 ngrok 앱 URL로 접근합니다.

**장점:** 설정 간편, HTTPS 자동 제공
**단점:** 무료 플랜은 URL이 매번 변경됨, 세션 제한

#### 옵션 B: Cloudflare Tunnel (무료, 고정 URL)

```bash
# 설치
brew install cloudflared

# 로그인 (Cloudflare 계정 필요)
cloudflared tunnel login

# 터널 생성
cloudflared tunnel create rollbook

# 설정 파일 생성
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: rollbook
credentials-file: ~/.cloudflared/jeju_rollbook.json

ingress:
  - hostname: rollbook.yourdomain.com
    service: http://localhost:4173
  - hostname: api.rollbook.yourdomain.com
    service: http://localhost:54321
  - service: http_status:404
EOF

# DNS 레코드 생성 (Cloudflare DNS 필요)
cloudflared tunnel route dns rollbook rollbook.yourdomain.com
cloudflared tunnel route dns rollbook api.rollbook.yourdomain.com

# 터널 실행
cloudflared tunnel run rollbook
```

**장점:** 무료, 고정 URL, HTTPS 자동, DDoS 보호
**단점:** 자체 도메인 필요, 설정이 ngrok보다 복잡

#### 옵션 C: Tailscale (VPN 기반)

개인 VPN 네트워크를 구성하여 안전하게 접근합니다.

```bash
# 설치 (Mac Mini와 접속 기기 모두)
brew install tailscale

# 로그인
tailscale up

# Tailscale IP 확인
tailscale ip -4
# 예: 100.100.100.10
```

Tailscale 네트워크 내에서 접근:
```
http://100.100.100.10:4173
```

**장점:** 암호화된 연결, 외부 노출 없음, 무료 (개인 사용)
**단점:** 모든 기기에 Tailscale 설치 필요

---

### 4.5 보안 고려사항

⚠️ **외부 접근 시 주의사항:**

| 위험 | 대응 |
|------|------|
| 인증 없는 접근 | Rollbook은 Supabase Auth로 보호됨 ✓ |
| 데이터 전송 암호화 | HTTPS 사용 권장 (ngrok/Cloudflare) |
| Supabase Studio 노출 | 54323 포트는 포워딩하지 말 것! |
| 서비스 키 노출 | `.env`에 service_role key 없음 ✓ |
| 무차별 대입 공격 | Supabase Auth rate limiting ✓ |

**권장 설정:**

```bash
# 포트 포워딩 시 최소한의 포트만 열기
4173   ✓ 프론트엔드 (필수)
54321  ✓ Supabase API (필수)
54323  ✗ Studio (열지 말 것 - 관리 도구)
54324  ✗ Inbucket (열지 말 것 - 테스트 도구)
```

---

### 4.6 접근 방법 비교

| 방법 | 난이도 | 비용 | HTTPS | 고정 URL | 적합한 용도 |
|------|--------|------|-------|----------|-------------|
| LAN 직접 접근 | ⭐ | 무료 | ✗ | ✓ | 집/사무실 내부 |
| 포트 포워딩 + DDNS | ⭐⭐ | 무료 | ✗ | ✓ | 24/7 서비스 |
| ngrok | ⭐ | 무료/유료 | ✓ | ✗/✓ | 테스트/데모 |
| Cloudflare Tunnel | ⭐⭐⭐ | 무료 | ✓ | ✓ | 프로덕션 서비스 |
| Tailscale | ⭐⭐ | 무료 | ✓ | ✓ | 개인/팀 전용 |

**추천:**
- 집에서만 사용 → LAN 직접 접근
- 친구/팀원과 공유 → Tailscale
- 임시 데모 → ngrok
- 정식 서비스 → Cloudflare Tunnel + 자체 도메인

## 5. 자동 시작 설정 (launchd)

Mac Mini 부팅 시 자동으로 서비스 시작. 프로젝트 `launchd/` 디렉토리에 세 개의 plist 파일이 있습니다.

### 서비스 관리 스크립트 (권장)

```bash
# 설치 (plist를 ~/Library/LaunchAgents/로 복사)
./scripts/rollbook-services.sh install

# 시작/중지/재시작/상태/로그
./scripts/rollbook-services.sh start
./scripts/rollbook-services.sh stop
./scripts/rollbook-services.sh restart
./scripts/rollbook-services.sh status
./scripts/rollbook-services.sh logs

# 제거
./scripts/rollbook-services.sh uninstall
```

### plist 파일 설계

**핵심 원칙:**
- 절대 경로 필수 (launchd는 `~` 미확장)
- PATH 환경 변수에 `/opt/homebrew/bin` 포함 (Homebrew 바이너리)
- 헬스 체크 루프로 의존성 순서 보장 (launchd에는 `After=` 없음)

**Supabase** (`launchd/com.rollbook.supabase.plist`):
- Docker 대기: `while ! docker info; do sleep 5; done`
- 실행: `npx supabase start`
- KeepAlive: `SuccessfulExit: false` (크래시만 재시작)

**Frontend** (`launchd/com.rollbook.frontend.plist`):
- Supabase API 대기: `while ! curl -sf http://localhost:54321/rest/v1/; do sleep 5; done`
- 실행: `npx vite preview --host 0.0.0.0` (포트 4173)
- KeepAlive: `true` (항상 재시작)
- NODE_ENV: `production`

**Tunnel** (`launchd/com.rollbook.tunnel.plist`):
- 실행: `/opt/homebrew/bin/cloudflared tunnel run jeju_rollbook`
- KeepAlive: `true` (항상 재시작)
- 헬스 체크 불필요 (cloudflared가 자체 재연결)

## 6. 서비스 관리 명령어

### launchd 서비스 관리 (프로덕션)

```bash
# 전체 상태 확인 (launchd + 포트 헬스 체크)
./scripts/rollbook-services.sh status

# 전체 시작/중지/재시작
./scripts/rollbook-services.sh start
./scripts/rollbook-services.sh stop
./scripts/rollbook-services.sh restart

# 로그 보기
./scripts/rollbook-services.sh logs
```

### 수동 관리

```bash
# Supabase 상태
npx supabase status

# 프론트엔드 프로세스 확인
lsof -i :4173

# 터널 상태
cloudflared tunnel info jeju_rollbook
```

### 중지 (수동)

```bash
# Supabase
npx supabase stop

# 프론트엔드
kill $(lsof -t -i:4173)

# 터널
kill $(lsof -t -i:cloudflared 2>/dev/null)
```

### 로그 확인

```bash
# launchd 서비스 로그
tail -f /tmp/rollbook-supabase.log
tail -f /tmp/rollbook-frontend.log
tail -f /tmp/rollbook-tunnel.log

# Docker 컨테이너 로그
docker logs supabase_db_rollbook
docker logs supabase_kong_rollbook
```

## 7. 데이터 백업

### 데이터베이스 백업

```bash
# 덤프 생성
pg_dump -h localhost -p 54322 -U postgres -d postgres > backup.sql

# 복원
psql -h localhost -p 54322 -U postgres -d postgres < backup.sql
```

### 스토리지 백업

```bash
# 스토리지 볼륨 위치
docker volume inspect supabase_storage_rollbook

# 백업 (Docker 볼륨)
docker run --rm -v supabase_storage_rollbook:/data -v $(pwd):/backup \
  alpine tar czf /backup/storage-backup.tar.gz /data
```

## 문제 해결

### Docker 컨테이너가 시작되지 않음

```bash
# Docker 재시작
killall Docker && open -a Docker

# 모든 Supabase 컨테이너 삭제 후 재시작
docker rm -f $(docker ps -aq --filter "name=supabase")
npx supabase start
```

### 포트 충돌

```bash
# 사용 중인 포트 확인
lsof -i :4173
lsof -i :54321

# 프로세스 종료
kill -9 <PID>
```

### 마이그레이션 실패

```bash
# 마이그레이션 상태 확인
npx supabase migration list

# 강제 리셋
npx supabase db reset --force
```

## 다음 단계

- [테스트 시나리오](./test-scenarios.md) - 기능 테스트하기
- [E2E 테스트 가이드](./e2e-test-guide.md) - 자동화 테스트
