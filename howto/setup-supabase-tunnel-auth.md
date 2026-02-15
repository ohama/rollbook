---
created: 2026-02-15
description: Supabase 로컬 인스턴스의 인증 이메일 링크가 터널 도메인을 가리키도록 설정
---

# Supabase 로컬 인스턴스를 Cloudflare Tunnel로 외부 공개

Supabase 로컬 인스턴스를 Cloudflare Tunnel로 외부에 노출할 때, 인증 이메일의 confirm 링크가 `127.0.0.1:54321`이 아닌 터널 도메인을 가리키도록 설정한다.

## The Insight

Supabase 로컬은 기본적으로 모든 URL을 `127.0.0.1`로 생성한다. 터널로 외부 접근을 열어도, 인증 이메일 속 링크는 여전히 localhost를 가리킨다. **세 가지 설정을 동시에 맞춰야** 전체 인증 흐름이 작동한다:

1. `external_url` — 이메일 confirm 링크의 base URL
2. `site_url` — 인증 후 리다이렉트 대상
3. `additional_redirect_urls` — 허용된 리다이렉트 목록

## Why This Matters

설정을 빠뜨리면:
- 사용자가 이메일 인증 링크를 클릭했을 때 `127.0.0.1:54321`로 이동 → 외부에서 접근 불가 → 회원가입 실패
- 인증은 성공하지만 프론트엔드로 돌아오지 못함

## Recognition Pattern

- Supabase 로컬 인스턴스를 터널/프록시로 외부 공개할 때
- 회원가입 후 이메일 confirm 링크가 localhost를 가리킬 때
- `ERR_CONNECTION_REFUSED` on `127.0.0.1:54321` from 외부 브라우저

## The Approach

`supabase/config.toml`에서 세 가지를 설정하고 Supabase를 재시작한다.

### Step 1: external_url 설정

`[api]` 섹션에 Supabase API의 외부 URL을 지정한다. 이 값이 이메일 confirm 링크의 base URL이 된다.

```toml
[api]
enabled = true
port = 54321
external_url = "https://supabase.yourdomain.com"
```

이 설정이 없으면 `GOTRUE_MAILER_URLPATHS_CONFIRMATION`이 `http://127.0.0.1:54321/auth/v1/verify`로 하드코딩된다.

### Step 2: site_url 및 redirect_urls 설정

`[auth]` 섹션에서 프론트엔드 URL을 지정한다.

```toml
[auth]
site_url = "https://app.yourdomain.com"
additional_redirect_urls = ["https://app.yourdomain.com", "http://127.0.0.1:3000"]
```

- `site_url`: 인증 후 기본 리다이렉트 대상
- `additional_redirect_urls`: `http://127.0.0.1:3000` 포함하면 로컬 개발도 계속 동작

### Step 3: Supabase 재시작

```bash
npx supabase stop && npx supabase start
```

설정 변경은 재시작 후에만 적용된다.

### Step 4: 확인

재시작 후 환경변수가 올바르게 설정됐는지 확인:

```bash
docker exec supabase_auth_<project> env | grep -E "API_EXTERNAL_URL|MAILER_URLPATHS|SITE_URL"
```

`API_EXTERNAL_URL`이 터널 도메인을 가리키면 성공.

## Example

```toml
# supabase/config.toml

[api]
port = 54321
external_url = "https://supabase.hariplan.com"

[auth]
site_url = "https://rollbook.hariplan.com"
additional_redirect_urls = ["https://rollbook.hariplan.com", "http://127.0.0.1:3000"]
```

이메일 인증 흐름:
```
사용자 회원가입
  → Supabase가 SendGrid로 이메일 발송
  → confirm 링크: https://supabase.hariplan.com/auth/v1/verify?token=xxx&redirect_to=https://rollbook.hariplan.com
  → 사용자 클릭 → Supabase가 토큰 검증
  → redirect_to로 리다이렉트 → 프론트엔드 로그인 완료
```

## 체크리스트

- [ ] `[api] external_url` 설정됨
- [ ] `[auth] site_url` 설정됨
- [ ] `additional_redirect_urls`에 프론트엔드 URL 포함
- [ ] `npx supabase stop && npx supabase start` 실행
- [ ] `docker exec ... env | grep API_EXTERNAL_URL` 확인

## 관련 문서

- `setup-sendgrid-smtp-supabase.md` - SMTP 설정
- `deploy-tunnel.md` - Cloudflare Tunnel 배포 가이드
