# 컴파일 가이드

Mac Mini에서 Rollbook을 컴파일하는 방법을 설명합니다.

## 사전 요구사항

### 1. Homebrew 설치

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. 필수 도구 설치

```bash
# Node.js (v20 이상 권장)
brew install node

# .NET SDK (Fable 컴파일러용)
brew install dotnet

# Docker (Supabase 로컬 개발용)
brew install --cask docker
```

### 3. 버전 확인

```bash
node --version    # v20.x 이상
npm --version     # 10.x 이상
dotnet --version  # 8.x 이상
docker --version  # 24.x 이상
```

## 프로젝트 클론

```bash
git clone <repository-url> rollbook
cd rollbook
```

## 의존성 설치

### 1. Node.js 패키지

```bash
npm install
```

### 2. .NET 도구 (Fable)

```bash
dotnet tool restore
```

이 명령은 `dotnet-tools.json`에 정의된 Fable 컴파일러를 설치합니다.

## 환경 설정

### 로컬 개발용 (.env.local)

```bash
# .env.local 파일 생성
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
EOF
```

Supabase anon key는 `npx supabase status` 실행 후 확인:

```bash
npx supabase start
npx supabase status
# anon key 값을 .env.local에 복사
```

### 프로덕션용 (.env.production)

```bash
cat > .env.production << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
EOF
```

## 컴파일

### 개발 빌드 (핫 리로드)

```bash
npm run dev
```

이 명령은 두 프로세스를 동시에 실행:
1. `fable:watch` - F# → JavaScript 변환 (파일 변경 감지)
2. `vite:dev` - Vite 개발 서버 (HMR)

### 프로덕션 빌드

```bash
npm run build
```

빌드 결과물:
- `dist/` 디렉토리에 정적 파일 생성
- `dist/assets/` - JS, CSS 번들
- `dist/sw.js` - Service Worker (PWA)
- `dist/manifest.webmanifest` - PWA 매니페스트

### 빌드 결과 확인

```bash
ls -la dist/
# index.html, assets/, sw.js, manifest.webmanifest 등

# 번들 크기 확인
du -sh dist/assets/*
```

## 빌드 최적화

### 번들 분석

빌드 후 `dist/stats.html` 파일로 번들 구성 분석 가능:

```bash
npm run build
open dist/stats.html  # Mac에서 브라우저로 열기
```

### 예상 번들 크기

| 파일 | 크기 (gzip) |
|------|-------------|
| index.js | ~100KB |
| vendor-react.js | ~30KB |
| vendor-supabase.js | ~15KB |
| vendor-offline.js | ~5KB |
| **총합** | **~150KB** |

## 문제 해결

### Fable 컴파일 오류

```bash
# Fable 캐시 삭제 후 재시도
rm -rf src/**/*.js
dotnet fable src/App.fsproj -o src --noCache
```

### Node 모듈 문제

```bash
rm -rf node_modules package-lock.json
npm install
```

### Supabase 연결 실패

```bash
# Supabase 상태 확인
npx supabase status

# 재시작
npx supabase stop
npx supabase start
```

### PWA Service Worker 문제

개발 중에는 Service Worker가 비활성화됩니다. 프로덕션 빌드에서만 활성화:

```bash
npm run build
npm run preview  # 프로덕션 모드로 로컬 서버 실행
```

## 다음 단계

- [서비스 가이드](./service-guide.md) - 빌드된 앱 배포하기
- [테스트 시나리오](./test-scenarios.md) - 기능 테스트하기
