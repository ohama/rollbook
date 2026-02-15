---
created: 2026-02-15
description: ~/.cloudflared/ 디렉토리의 파일 역할과 관련 명령어 정리
---

# cloudflared 파일 구조와 명령어

`~/.cloudflared/` 디렉토리에 있는 파일들의 역할과, 각 파일을 생성·사용하는 명령어를 정리한다.

## The Insight

cloudflared는 세 가지 파일로 동작한다. 각 파일은 **별도의 명령어**로 생성되고, **별도의 상황**에서 사용된다. 파일 간 의존 관계를 이해하면 터널 문제를 빠르게 진단할 수 있다.

```
~/.cloudflared/
├── cert.pem                              ← tunnel login이 생성
├── <TUNNEL_ID>.json                      ← tunnel create가 생성 (또는 대시보드)
└── config.yml                            ← 사용자가 직접 작성
```

## Why This Matters

- 어떤 파일이 없거나 손상되면 어떤 명령어가 실패하는지 알아야 디버깅이 빠르다
- 토큰 모드 vs 로컬 모드에서 어떤 파일이 필요한지 헷갈리기 쉽다
- `cert.pem`은 터널 **관리**용이고, `<ID>.json`은 터널 **실행**용이라는 구분이 핵심

## Recognition Pattern

- `cloudflared tunnel` 명령이 인증 에러로 실패할 때
- 터널을 새로 만들거나 이전할 때
- 대시보드에서 만든 터널을 로컬 config로 전환할 때

## The Approach

### 1. cert.pem — 계정 인증서

**역할:** Cloudflare 계정에 대한 인증서. 터널을 생성/삭제/라우팅하는 **관리 작업**에 필요하다.

**생성:**

```bash
cloudflared tunnel login
```

브라우저가 열리고 도메인을 선택하면 `~/.cloudflared/cert.pem`이 저장된다.

**이 파일을 사용하는 명령어:**

| 명령어 | 설명 |
|--------|------|
| `cloudflared tunnel create <name>` | 새 터널 생성 |
| `cloudflared tunnel delete <name>` | 터널 삭제 |
| `cloudflared tunnel list` | 터널 목록 조회 |
| `cloudflared tunnel route dns <tunnel> <hostname>` | DNS CNAME 레코드 생성 |
| `cloudflared tunnel info <name>` | 터널 상세 정보 |

**이 파일이 없으면:**

```
You did not specify any valid additional argument to the login command.
Please run cloudflared tunnel login to obtain a certificate.
```

**주의:** 터널 **실행**(`tunnel run`)에는 cert.pem이 필요 없다. 실행에는 `<ID>.json`만 있으면 된다.

---

### 2. \<TUNNEL_ID\>.json — 터널 자격증명

**역할:** 특정 터널의 인증 정보. 터널을 **실행**할 때 필요하다.

**생성 방법 2가지:**

```bash
# 방법 1: CLI로 생성
cloudflared tunnel create <name>
# → ~/.cloudflared/<TUNNEL_ID>.json 자동 생성

# 방법 2: 대시보드에서 생성
# Zero Trust → Networks → Tunnels → Create a tunnel
# → 토큰이 제공됨 (base64 형식, JSON 변환 필요할 수 있음)
```

**파일 내용 (올바른 JSON 형식):**

```json
{
  "AccountTag": "4a71412ad9e5cc65aa80f65704cdb766",
  "TunnelSecret": "ZTBkMGUyYjAtYjY0MS00YzliLWE3ZjYtMTFmNzk0YWM3YzVl",
  "TunnelID": "a6a372c3-b19d-446f-9fae-0344c9f110b8"
}
```

**이 파일을 사용하는 명령어:**

| 명령어 | 설명 |
|--------|------|
| `cloudflared tunnel run <name>` | 로컬 config 모드로 터널 실행 |

**이 파일이 없거나 잘못되면:**

```
ERR The credentials file at ~/.cloudflared/<id>.json contained invalid JSON.
```

대시보드에서 만든 터널은 이 파일이 base64 토큰으로 저장될 수 있다. 이 경우 JSON으로 변환해야 한다. → `fix-cloudflared-credentials-format.md` 참고

**토큰 모드에서는 이 파일이 불필요:**

```bash
# 토큰 모드 — <ID>.json 사용 안 함, config.yml도 무시
cloudflared tunnel run --token eyJhIjoiNGE3...
```

---

### 3. config.yml — 터널 라우팅 설정

**역할:** 어떤 hostname을 어떤 로컬 서비스로 연결할지 정의한다.

**생성:** 사용자가 직접 작성한다.

```yaml
# ~/.cloudflared/config.yml
tunnel: a6a372c3-b19d-446f-9fae-0344c9f110b8

ingress:
  - hostname: supabase.hariplan.com
    service: http://localhost:54321
  - hostname: rollbook.hariplan.com
    service: http://localhost:3000
  - service: http_status:404    # catch-all (필수)
```

**필수 규칙:**
- `tunnel`: 터널 ID (UUID) 또는 터널 이름
- `ingress`: hostname → service 매핑 목록
- 마지막 항목은 반드시 hostname 없는 catch-all 규칙

**이 파일을 사용하는 명령어:**

| 명령어 | 설명 |
|--------|------|
| `cloudflared tunnel run <name>` | config.yml의 ingress 규칙 적용 |
| `cloudflared tunnel ingress validate` | config.yml 문법 검증 |
| `cloudflared tunnel ingress rule <url>` | 특정 URL이 어떤 규칙에 매칭되는지 확인 |

**이 파일이 없으면:**

```
No ingress rules specified in config file
```

**토큰 모드에서는 이 파일이 무시된다.** 토큰 모드는 대시보드의 Public Hostname 설정을 사용한다.

---

## 실행 모드 비교

| | 로컬 모드 | 토큰 모드 |
|---|-----------|-----------|
| **명령어** | `cloudflared tunnel run <name>` | `cloudflared tunnel run --token <token>` |
| **설정 관리** | `config.yml` (로컬) | Cloudflare 대시보드 |
| **필요 파일** | `<ID>.json` + `config.yml` | 없음 (토큰에 내장) |
| **cert.pem** | 관리 명령에만 필요 | 관리 명령에만 필요 |
| **ingress 변경** | config.yml 수정 → 재시작 | 대시보드에서 변경 → 자동 반영 |
| **장점** | Git으로 버전 관리 가능 | 설정 변경 시 재시작 불필요 |

---

## 명령어 전체 정리

### 초기 설정

```bash
# 1. Cloudflare 계정 인증 → cert.pem 생성
cloudflared tunnel login

# 2. 터널 생성 → <ID>.json 생성
cloudflared tunnel create <name>

# 3. DNS 레코드 등록 (cert.pem 필요)
cloudflared tunnel route dns <name> <hostname>
```

### 터널 실행

```bash
# 로컬 config 모드 (<ID>.json + config.yml 필요)
cloudflared tunnel run <name>

# 토큰 모드 (파일 불필요, 대시보드 설정 사용)
cloudflared tunnel run --token <token>
```

### 관리

```bash
# 터널 목록 (cert.pem 필요)
cloudflared tunnel list

# 터널 상세 정보
cloudflared tunnel info <name>

# 터널 삭제 (cert.pem 필요, 연결 해제 후)
cloudflared tunnel cleanup <name>
cloudflared tunnel delete <name>
```

### 디버깅

```bash
# config.yml 문법 검증
cloudflared tunnel ingress validate

# URL이 어떤 ingress 규칙에 매칭되는지 확인
cloudflared tunnel ingress rule https://rollbook.hariplan.com

# 연결 상태 확인
cloudflared tunnel info <name>
```

## 체크리스트

- [ ] `cert.pem` 존재 확인: `ls ~/.cloudflared/cert.pem`
- [ ] credentials JSON 존재 확인: `ls ~/.cloudflared/*.json`
- [ ] credentials 형식 확인: `cat ~/.cloudflared/<ID>.json` (JSON인지 base64인지)
- [ ] config.yml catch-all 규칙 있는지 확인
- [ ] config.yml의 tunnel ID가 실제 터널과 일치하는지 확인
- [ ] ingress 검증: `cloudflared tunnel ingress validate`

## 관련 문서

- `fix-cloudflared-credentials-format.md` - base64 토큰 → JSON 변환
- `deploy-tunnel.md` - Cloudflare Tunnel 배포 가이드
- `setup-supabase-tunnel-auth.md` - Supabase 인증 이메일 URL 설정
