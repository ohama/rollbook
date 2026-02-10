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

| 서비스 | URL | 용도 |
|--------|-----|------|
| Rollbook App | http://localhost:4173 | 메인 앱 |
| Supabase Studio | http://localhost:54323 | DB 관리 UI |
| Supabase API | http://localhost:54321 | REST API |
| Inbucket | http://localhost:54324 | 이메일 테스트 |

## 4. 외부 접근 설정 (옵션)

Mac Mini를 홈 네트워크에서 서비스할 경우:

### Mac Mini IP 확인

```bash
ipconfig getifaddr en0  # Wi-Fi
# 또는
ipconfig getifaddr en1  # Ethernet
```

### Vite 외부 접근 허용

```bash
# package.json의 preview 스크립트 수정
npm run preview -- --host 0.0.0.0
```

### 방화벽 설정

```bash
# 시스템 환경설정 > 보안 및 개인 정보 보호 > 방화벽
# 4173, 54321 포트 허용
```

### 접근 URL

```
http://<mac-mini-ip>:4173
```

## 5. 자동 시작 설정 (launchd)

Mac Mini 부팅 시 자동으로 서비스 시작:

### Supabase 자동 시작

```bash
cat > ~/Library/LaunchAgents/com.rollbook.supabase.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.rollbook.supabase</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>cd ~/rollbook && npx supabase start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>/tmp/rollbook-supabase.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/rollbook-supabase.error.log</string>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.rollbook.supabase.plist
```

### 프론트엔드 자동 시작

```bash
cat > ~/Library/LaunchAgents/com.rollbook.frontend.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.rollbook.frontend</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>cd ~/rollbook && npm run preview -- --host 0.0.0.0</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/rollbook-frontend.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/rollbook-frontend.error.log</string>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.rollbook.frontend.plist
```

## 6. 서비스 관리 명령어

### 상태 확인

```bash
# Supabase
npx supabase status

# 프론트엔드 (프로세스 확인)
lsof -i :4173
```

### 중지

```bash
# Supabase
npx supabase stop

# 프론트엔드
# Ctrl+C 또는
kill $(lsof -t -i:4173)
```

### 재시작

```bash
# Supabase
npx supabase stop && npx supabase start

# 프론트엔드
npm run build && npm run preview
```

### 로그 확인

```bash
# Supabase 로그
npx supabase logs

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
