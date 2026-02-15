---
created: 2026-02-15
description: Supabase 로컬에 SendGrid SMTP를 연동하여 실제 이메일 발송
---

# SendGrid SMTP를 Supabase 로컬에 연동

Supabase 로컬 인스턴스에서 Inbucket(가짜 메일 서버) 대신 SendGrid SMTP로 실제 이메일을 발송한다.

## The Insight

Supabase 로컬은 기본적으로 Inbucket을 사용해 이메일을 "캡처"만 한다. 외부 사용자에게 실제 이메일을 보내려면 SMTP 서버를 연결해야 하는데, **SendGrid의 Sender Identity 인증**을 빠뜨리면 `550 The from address does not match a verified Sender Identity` 에러가 난다.

## Why This Matters

- SMTP 설정 없이는 외부 사용자가 이메일 인증을 받을 수 없다
- Sender Identity 미인증 시 모든 이메일 발송이 거부된다
- 기본 rate limit(시간당 2통)이 테스트 중 금방 소진된다

## Recognition Pattern

- Supabase 로컬을 프로덕션으로 쓸 때
- `Error sending confirmation email` 에러 발생 시
- `email rate limit exceeded` 에러 발생 시

## The Approach

### Step 1: SendGrid 계정 생성 및 API Key 발급

1. [sendgrid.com](https://sendgrid.com) 가입
2. Settings → API Keys → Create API Key
3. **Custom Access** 선택 → **Mail Send** → **Full Access**만 활성화
4. API Key 복사 (SG.xxx... 형식)

### Step 2: Sender Identity 인증 (중요!)

SendGrid는 발신자 이메일이 인증되지 않으면 모든 발송을 거부한다.

1. Settings → Sender Authentication → Single Sender Verification
2. **Create a Sender** → `admin_email`과 동일한 이메일 입력
3. 해당 이메일 받은편지함에서 인증 메일 확인 → Verify 클릭

### Step 3: supabase/config.toml에 SMTP 설정

```toml
[auth.email.smtp]
enabled = true
host = "smtp.sendgrid.net"
port = 587
user = "apikey"
pass = "env(SENDGRID_API_KEY)"
admin_email = "your-email@gmail.com"
sender_name = "YourApp"
```

- `user`는 항상 `"apikey"` (리터럴 문자열)
- `pass`는 `env()` 구문으로 환경변수 참조
- `admin_email`은 Step 2에서 인증한 이메일과 **정확히 일치**해야 함

### Step 4: 환경변수 파일 생성

```bash
# supabase/.env
SENDGRID_API_KEY=SG.xxxxx...
```

`.gitignore`에 `.env`가 포함되어 있는지 확인한다.

### Step 5: rate limit 조정

기본값 시간당 2통은 너무 적다. 테스트 및 운영에 맞게 올린다.

```toml
[auth.rate_limit]
email_sent = 30
```

### Step 6: 재시작

```bash
npx supabase stop && npx supabase start
```

## Example

SendGrid API로 직접 테스트해서 키와 Sender Identity가 유효한지 확인:

```bash
curl -s --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer SG.xxxxx..." \
  --header "Content-Type: application/json" \
  --data '{
    "personalizations":[{"to":[{"email":"test@example.com"}]}],
    "from":{"email":"your-email@gmail.com","name":"YourApp"},
    "subject":"Test",
    "content":[{"type":"text/plain","value":"SMTP test"}]
  }' \
  -w "\n%{http_code}"
```

`202` 응답이면 성공. 이 테스트가 통과하는데 Supabase에서 실패하면 `admin_email` 불일치를 의심한다.

## 체크리스트

- [ ] SendGrid API Key 발급 (Mail Send Full Access)
- [ ] Sender Identity 인증 완료 (이메일 Verify 클릭)
- [ ] `config.toml`의 `admin_email` = Sender Identity 이메일
- [ ] `supabase/.env`에 `SENDGRID_API_KEY` 설정
- [ ] `.gitignore`에 `.env` 포함 확인
- [ ] `email_sent` rate limit 조정
- [ ] `npx supabase stop && npx supabase start`

## 관련 문서

- `setup-supabase-tunnel-auth.md` - 인증 이메일 URL 설정
- `deploy-tunnel.md` - Cloudflare Tunnel 배포 가이드
