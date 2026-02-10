# E2E 테스트 가이드

Playwright를 사용한 End-to-End 자동화 테스트 설정 및 실행 가이드입니다.

## 개요

```
┌─────────────────────────────────────────────────────────────┐
│                      E2E 테스트 구조                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │  Playwright │────►│   Browser   │────►│  Rollbook   │   │
│  │   (Test)    │     │  (Chrome)   │     │    App      │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                 │           │
│                                                 ▼           │
│                                          ┌─────────────┐   │
│                                          │  Supabase   │   │
│                                          │  (Docker)   │   │
│                                          └─────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 1. Playwright 설치

```bash
# Playwright 설치
npm install -D @playwright/test

# 브라우저 설치
npx playwright install
```

## 2. 설정 파일 생성

### playwright.config.ts

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 테스트 전 서버 시작
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### package.json 스크립트 추가

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

## 3. 테스트 헬퍼 생성

### e2e/helpers/auth.ts

```typescript
// e2e/helpers/auth.ts
import { Page } from '@playwright/test';

export async function signUp(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByRole('link', { name: '회원가입' }).click();
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '회원가입' }).click();
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
}

export async function signOut(page: Page) {
  await page.getByRole('button', { name: '로그아웃' }).click();
}

// 테스트용 이메일 확인 (Inbucket API)
export async function confirmEmail(email: string) {
  const mailbox = email.split('@')[0];
  const response = await fetch(`http://localhost:54324/api/v1/mailbox/${mailbox}`);
  const messages = await response.json();

  if (messages.length > 0) {
    const messageId = messages[0].id;
    const msgResponse = await fetch(`http://localhost:54324/api/v1/mailbox/${mailbox}/${messageId}`);
    const message = await msgResponse.json();

    // 확인 링크 추출
    const confirmLink = message.body.text.match(/https?:\/\/[^\s]+confirm[^\s]+/);
    if (confirmLink) {
      await fetch(confirmLink[0]);
    }
  }
}
```

### e2e/helpers/db.ts

```typescript
// e2e/helpers/db.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function clearTestData() {
  // 테스트 데이터 정리
  await supabase.from('workouts').delete().like('user_id', 'test-%');
  await supabase.from('profiles').delete().like('id', 'test-%');
}

export async function createTestUser(email: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  return data;
}

export async function deleteTestUser(userId: string) {
  await supabase.auth.admin.deleteUser(userId);
}

export async function makeAdmin(userId: string) {
  await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
}
```

## 4. 테스트 작성

### e2e/auth.spec.ts

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { signUp, signIn, signOut, confirmEmail } from './helpers/auth';
import { createTestUser, deleteTestUser } from './helpers/db';

test.describe('인증', () => {
  test('회원가입 후 이메일 확인', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test1234!';

    await signUp(page, testEmail, testPassword);

    // 이메일 확인 메시지
    await expect(page.getByText('이메일을 확인해주세요')).toBeVisible();

    // 이메일 확인 (Inbucket API)
    await confirmEmail(testEmail);

    // 로그인 시도
    await signIn(page, testEmail, testPassword);
    await expect(page.getByText('환영합니다')).toBeVisible();
  });

  test('로그인 및 로그아웃', async ({ page }) => {
    // 테스트 사용자 생성
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test1234!';
    const user = await createTestUser(testEmail, testPassword);

    try {
      await signIn(page, testEmail, testPassword);
      await expect(page.getByText('환영합니다')).toBeVisible();

      await signOut(page);
      await expect(page.getByLabel('이메일')).toBeVisible();
    } finally {
      await deleteTestUser(user!.user!.id);
    }
  });

  test('세션 유지', async ({ page, context }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Test1234!';
    const user = await createTestUser(testEmail, testPassword);

    try {
      await signIn(page, testEmail, testPassword);
      await expect(page.getByText('환영합니다')).toBeVisible();

      // 새 페이지에서 세션 확인
      const newPage = await context.newPage();
      await newPage.goto('/');
      await expect(newPage.getByText('환영합니다')).toBeVisible();
    } finally {
      await deleteTestUser(user!.user!.id);
    }
  });
});
```

### e2e/workout.spec.ts

```typescript
// e2e/workout.spec.ts
import { test, expect } from '@playwright/test';
import { signIn } from './helpers/auth';
import { createTestUser, deleteTestUser } from './helpers/db';

test.describe('운동 기록', () => {
  let testUserId: string;
  const testEmail = `workout-test-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';

  test.beforeAll(async () => {
    const user = await createTestUser(testEmail, testPassword);
    testUserId = user!.user!.id;
  });

  test.afterAll(async () => {
    await deleteTestUser(testUserId);
  });

  test('원탭 운동 기록 토글', async ({ page }) => {
    await signIn(page, testEmail, testPassword);

    // 초기 상태 확인
    const toggleButton = page.getByRole('button', { name: '오늘 운동했다' });
    await expect(toggleButton).toBeVisible();

    // 운동 기록
    await toggleButton.click();
    await expect(page.getByRole('button', { name: '운동 완료!' })).toBeVisible();
    await expect(page.getByText('💪')).toBeVisible();

    // 기록 취소
    await page.getByRole('button', { name: '운동 완료!' }).click();
    await expect(page.getByRole('button', { name: '오늘 운동했다' })).toBeVisible();
  });

  test('운동 기록 상태 유지', async ({ page }) => {
    await signIn(page, testEmail, testPassword);

    // 운동 기록
    await page.getByRole('button', { name: '오늘 운동했다' }).click();
    await expect(page.getByText('💪')).toBeVisible();

    // 새로고침 후 상태 확인
    await page.reload();
    await expect(page.getByText('💪')).toBeVisible();
  });
});
```

### e2e/progress.spec.ts

```typescript
// e2e/progress.spec.ts
import { test, expect } from '@playwright/test';
import { signIn } from './helpers/auth';
import { createTestUser, deleteTestUser } from './helpers/db';

test.describe('진행 기록', () => {
  let testUserId: string;
  const testEmail = `progress-test-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';

  test.beforeAll(async () => {
    const user = await createTestUser(testEmail, testPassword);
    testUserId = user!.user!.id;
  });

  test.afterAll(async () => {
    await deleteTestUser(testUserId);
  });

  test('캘린더 뷰', async ({ page }) => {
    await signIn(page, testEmail, testPassword);

    // 내 기록 탭 클릭
    await page.getByRole('button', { name: '내 기록' }).click();

    // 캘린더 확인
    await expect(page.getByText('일')).toBeVisible();
    await expect(page.getByText('월')).toBeVisible();
    await expect(page.getByText('토')).toBeVisible();

    // 월 이동
    await page.getByRole('button', { name: '<' }).click();
    await page.getByRole('button', { name: '>' }).click();
  });

  test('리스트 뷰', async ({ page }) => {
    await signIn(page, testEmail, testPassword);

    await page.getByRole('button', { name: '내 기록' }).click();
    await page.getByRole('button', { name: '리스트' }).click();

    // 리스트 뷰 확인
    await expect(page.getByText('운동 기록')).toBeVisible();
  });

  test('월별 통계', async ({ page }) => {
    await signIn(page, testEmail, testPassword);

    // 운동 기록 후 통계 확인
    await page.getByRole('button', { name: '오늘 운동했다' }).click();
    await page.getByRole('button', { name: '내 기록' }).click();

    // 통계 확인
    await expect(page.getByText(/1회/)).toBeVisible();
  });
});
```

### e2e/offline.spec.ts

```typescript
// e2e/offline.spec.ts
import { test, expect } from '@playwright/test';
import { signIn } from './helpers/auth';
import { createTestUser, deleteTestUser } from './helpers/db';

test.describe('오프라인 기능', () => {
  let testUserId: string;
  const testEmail = `offline-test-${Date.now()}@example.com`;
  const testPassword = 'Test1234!';

  test.beforeAll(async () => {
    const user = await createTestUser(testEmail, testPassword);
    testUserId = user!.user!.id;
  });

  test.afterAll(async () => {
    await deleteTestUser(testUserId);
  });

  test('오프라인 상태 표시', async ({ page, context }) => {
    await signIn(page, testEmail, testPassword);

    // 오프라인 모드
    await context.setOffline(true);

    // 오프라인 배너 확인
    await expect(page.getByText('오프라인')).toBeVisible({ timeout: 5000 });

    // 온라인 복귀
    await context.setOffline(false);
  });

  test('오프라인 운동 기록 후 동기화', async ({ page, context }) => {
    await signIn(page, testEmail, testPassword);

    // 오프라인 모드
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // 운동 기록 (오프라인)
    await page.getByRole('button', { name: '오늘 운동했다' }).click();
    await expect(page.getByText('💪')).toBeVisible();

    // 대기 중 표시 확인
    await expect(page.getByText(/대기 중/)).toBeVisible();

    // 온라인 복귀
    await context.setOffline(false);

    // 동기화 완료 대기
    await page.waitForTimeout(3000);

    // 새로고침 후 상태 확인
    await page.reload();
    await expect(page.getByText('💪')).toBeVisible();
  });
});
```

### e2e/pwa.spec.ts

```typescript
// e2e/pwa.spec.ts
import { test, expect } from '@playwright/test';

test.describe('PWA', () => {
  test('매니페스트 로드', async ({ page }) => {
    await page.goto('/');

    // 매니페스트 링크 확인
    const manifest = await page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', '/manifest.webmanifest');
  });

  test('Service Worker 등록', async ({ page }) => {
    await page.goto('/');

    // Service Worker 등록 확인
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });

    expect(swRegistered).toBe(true);
  });

  test('오프라인 페이지 로드', async ({ page, context }) => {
    // 먼저 온라인 상태로 페이지 로드 (캐싱)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 오프라인 모드
    await context.setOffline(true);

    // 페이지 새로고침
    await page.reload();

    // 앱이 여전히 로드되는지 확인
    await expect(page.getByRole('heading', { name: 'Rollbook' })).toBeVisible();
  });
});
```

### e2e/admin.spec.ts

```typescript
// e2e/admin.spec.ts
import { test, expect } from '@playwright/test';
import { signIn } from './helpers/auth';
import { createTestUser, deleteTestUser, makeAdmin } from './helpers/db';

test.describe('관리자', () => {
  test('비관리자 접근 거부', async ({ page }) => {
    const testEmail = `non-admin-${Date.now()}@example.com`;
    const user = await createTestUser(testEmail, 'Test1234!');

    try {
      await signIn(page, testEmail, 'Test1234!');
      await page.getByRole('button', { name: '관리자' }).click();

      await expect(page.getByText('접근 권한이 없습니다')).toBeVisible();
    } finally {
      await deleteTestUser(user!.user!.id);
    }
  });

  test('관리자 회원 목록 조회', async ({ page }) => {
    const testEmail = `admin-${Date.now()}@example.com`;
    const user = await createTestUser(testEmail, 'Test1234!');
    await makeAdmin(user!.user!.id);

    try {
      await signIn(page, testEmail, 'Test1234!');
      await page.getByRole('button', { name: '관리자' }).click();

      // 회원 목록 표시
      await expect(page.getByText('회원 목록')).toBeVisible();
    } finally {
      await deleteTestUser(user!.user!.id);
    }
  });
});
```

## 5. 테스트 실행

### 모든 테스트 실행

```bash
# Supabase 시작
npx supabase start

# 빌드
npm run build

# E2E 테스트 실행
npm run test:e2e
```

### 특정 테스트만 실행

```bash
# 인증 테스트만
npx playwright test auth.spec.ts

# 오프라인 테스트만
npx playwright test offline.spec.ts
```

### UI 모드로 실행

```bash
npm run test:e2e:ui
```

### 브라우저 표시하며 실행

```bash
npm run test:e2e:headed
```

### 특정 브라우저로 실행

```bash
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"
```

## 6. 테스트 리포트

### HTML 리포트 확인

```bash
npm run test:e2e:report
```

### 스크린샷 확인

실패한 테스트의 스크린샷은 `test-results/` 디렉토리에 저장됩니다.

## 7. CI 통합 (GitHub Actions)

### .github/workflows/e2e.yml

```yaml
name: E2E Tests

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start Supabase
        run: npx supabase start

      - name: Build
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## 8. 디버깅 팁

### 테스트 일시 정지

```typescript
await page.pause();  // 브라우저 일시 정지
```

### 상세 로그

```bash
DEBUG=pw:api npx playwright test
```

### 느린 모드

```bash
npx playwright test --headed --slow-mo=500
```

### 특정 줄에서 실패

```typescript
test('example', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'debug.png' });  // 디버그용 스크린샷
  // ...
});
```

## 디렉토리 구조

```
e2e/
├── helpers/
│   ├── auth.ts        # 인증 헬퍼
│   └── db.ts          # DB 헬퍼
├── auth.spec.ts       # 인증 테스트
├── workout.spec.ts    # 운동 기록 테스트
├── progress.spec.ts   # 진행 기록 테스트
├── team.spec.ts       # 팀 기능 테스트
├── admin.spec.ts      # 관리자 테스트
├── offline.spec.ts    # 오프라인 테스트
├── pwa.spec.ts        # PWA 테스트
└── mobile.spec.ts     # 모바일 반응형 테스트
```

---

## 다음 단계

- [테스트 시나리오](./test-scenarios.md) - 수동 테스트 참조
- [컴파일 가이드](./compile-guide.md) - 환경 설정
