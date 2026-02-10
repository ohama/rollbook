---
allowed-tools: Read, Write, Edit, Bash, Glob, AskUserQuestion
description: mdBook 로컬 빌드 및 정적 배포 (CI 없이 직접 커밋)
---

<role>
mdBook 로컬 빌드 도우미. 로컬에서 직접 HTML을 생성하고 docs/를 커밋하여 GitHub Pages에 배포한다.

**CI 자동 빌드가 필요하면 `/pages` 커맨드를 사용한다.**
</role>

<skills_reference>
이 커맨드는 `mdbook-utils` 스킬을 사용한다:
- mdbook 설치 확인
- book.toml 탐지
- SUMMARY.md 동기화
- 빌드 명령
- README.md Documentation 섹션 업데이트
</skills_reference>

<commands>

## 사용법

| 명령 | 설명 |
|------|------|
| `/mdbook <dir>` | 단일 디렉토리 (자동: init 또는 sync+build) |
| `/mdbook <dir1> <dir2> ...` | 다중 디렉토리 통합 (자동: init 또는 sync+build) |
| `/mdbook build [dir]` | 로컬 빌드만 |
| `/mdbook serve [dir]` | 로컬 개발 서버 |
| `/mdbook clean [dir]` | 빌드 출력 정리 |
| `/mdbook sync [dir]` | SUMMARY.md 동기화 (빌드 없이) |

**자동 모드 동작:**
- book.toml 없음 → init (초기화)
- book.toml 있음 → sync + build (업데이트)

**CI 자동 빌드가 필요하면 `/pages` 커맨드 사용:**
- `/pages <dir>` — mdBook 구성 + GitHub Actions 워크플로우 생성

</commands>

<execution>

## 공통: book.toml 탐지

모든 서브커맨드에서 사용. `mdbook-utils` 스킬의 "2. book.toml 탐지" 참조.

**인자가 있는 경우:**
```bash
[ -f "{DIR}/book.toml" ] && echo "FOUND"
```

**인자가 없는 경우:**
1. 프로젝트 루트 확인: `[ -f "book.toml" ]`
2. 하위 디렉토리 탐색: `find . -maxdepth 2 -name "book.toml"`

---

## /mdbook <dir> [dir2] ...

**자동 모드**: book.toml 유무에 따라 init 또는 update 동작.

### Step 0: 모드 결정

```
/mdbook tutorial           → 단일 모드
/mdbook tutorial youtube   → 다중 모드
```

**단일 모드:**
```bash
[ -f "{DIR}/book.toml" ] && echo "UPDATE_MODE" || echo "INIT_MODE"
```

**다중 모드:**
```bash
[ -f "book.toml" ] && echo "UPDATE_MODE" || echo "INIT_MODE"
```

- **INIT_MODE** → "Init 모드" 섹션으로 이동
- **UPDATE_MODE** → "Update 모드" 섹션으로 이동

---

## Init 모드 (book.toml 없음)

mdBook 프로젝트를 초기화한다. CI 워크플로우 없이 로컬 빌드 전용.

### Step 1: mdbook 설치 확인

`mdbook-utils` 스킬의 "1. mdbook 설치 확인" 참조.

### Step 2: 디렉토리 확인

**단일 모드:**
```bash
[ -d "{DIR}" ] || echo "NOT_FOUND"
```

**다중 모드:**
```bash
for dir in {DIRS}; do
  [ -d "$dir" ] || echo "NOT_FOUND: $dir"
done
```

- 디렉토리가 없으면 생성 여부 질문

### Step 3: 소스 파일 스캔

**단일 모드:**
```bash
ls {DIR}/*.md 2>/dev/null
```

**다중 모드:**
```bash
for dir in {DIRS}; do
  echo "=== $dir ==="
  ls "$dir"/*.md 2>/dev/null
done
```

### Step 4: 프로젝트 정보 수집

AskUserQuestion으로 수집:

- 책 제목 (기본값: 디렉토리명 또는 프로젝트명)
- 저자 이름 (기본값: `git config user.name`)
- 언어 (기본값: ko)
- 설명 (한 줄)

### Step 5: 파일 생성

#### 단일 모드

`{DIR}/` 안에 3개 파일을 생성한다.

**book.toml:**
```toml
[book]
title = "{TITLE}"
authors = ["{AUTHOR}"]
language = "{LANG}"
description = "{DESCRIPTION}"
src = "."

[build]
build-dir = "../docs"
create-missing = false

[output.html]
default-theme = "light"
preferred-dark-theme = "navy"

[output.html.search]
enable = true
limit-results = 30
```

**build-dir 계산:**
- 1단계 하위 (`tutorial/`) → `"../docs"`
- 2단계 하위 (`src/docs/`) → `"../../docs"`

**SUMMARY.md:**
```markdown
# Summary

[소개](introduction.md)

# 본문

- [Chapter 1](01-intro.md)
- [Chapter 2](02-setup.md)
```

**introduction.md:**
```markdown
# {TITLE}

{DESCRIPTION}

## 시작하기

[Chapter 1]({FIRST_CHAPTER})부터 시작하세요.
```

---

#### 다중 모드

**프로젝트 루트**에 3개 파일을 생성한다.

**book.toml:**
```toml
[book]
title = "{TITLE}"
authors = ["{AUTHOR}"]
language = "{LANG}"
description = "{DESCRIPTION}"
src = "."

[build]
build-dir = "docs"
create-missing = false

[output.html]
default-theme = "light"
preferred-dark-theme = "navy"

[output.html.search]
enable = true
limit-results = 30
```

**SUMMARY.md:**

각 디렉토리가 섹션(`#`)이 되고, 하위 .md 파일이 챕터(`-`)가 된다:

```markdown
# Summary

[소개](introduction.md)

# Tutorial

- [Overview](tutorial/01-overview.md)
- [Settings](tutorial/02-settings.md)

# YouTube

- [Episode 01](youtube/ep01.md)
- [Episode 02](youtube/ep02.md)
```

**섹션 제목 결정:**
1. 디렉토리 내 첫 번째 .md 파일의 `#` 헤더에서 추출 시도
2. 없으면 디렉토리명을 Title Case로 변환 (예: `youtube` → `YouTube`)

**introduction.md:**
```markdown
# {TITLE}

{DESCRIPTION}

## 목차

- [Tutorial](tutorial/01-overview.md)
- [YouTube](youtube/ep01.md)
```

### Step 6: README.md에 Book 링크 추가/업데이트

프로젝트 루트에 `README.md`가 있으면 로컬 docs/ 링크를 추가하거나 업데이트한다.

```bash
[ -f "README.md" ] && echo "README_EXISTS"
```

**README.md가 있는 경우:**

1. `## Documentation` 섹션이 있는지 확인한다:
   ```bash
   grep -q "^## Documentation" README.md
   ```

2. **섹션이 있는 경우 → 업데이트:**
   - `## Documentation` 다음 줄부터 다음 `##` 전까지의 내용을 새 링크로 교체
   ```markdown
   ## Documentation

   [{TITLE}](docs/index.html)
   ```

3. **섹션이 없는 경우 → 추가:**
   - README.md의 **첫 번째 `#` 헤딩(제목) 바로 다음**에 Documentation 섹션을 삽입
   - `#` 제목이 없으면 파일 맨 앞에 추가
   ```markdown
   # Project Title

   ## Documentation

   [{TITLE}](docs/index.html)

   ## Other Sections...
   ```

**README.md가 없는 경우:** 건너뛴다.

### Step 7: 빌드 실행

Init 후 자동으로 빌드한다.

```bash
mdbook build {DIR}
```

### Step 8: .nojekyll 확인

```bash
[ -f "docs/.nojekyll" ] || touch docs/.nojekyll
```

### Step 9: 결과 출력

**단일 모드:**
```
## mdBook 초기화 완료

{DIR}/ 에 추가된 파일:
- book.toml
- SUMMARY.md
- introduction.md

빌드 완료:
- docs/ ({N} HTML files)

다음 단계:
  /mdbook serve {DIR}  — 미리보기
  /commit              — 변경사항 커밋
```

**다중 모드:**
```
## mdBook 초기화 완료

프로젝트 루트에 추가된 파일:
- book.toml
- SUMMARY.md (2 sections)
- introduction.md

빌드 완료:
- docs/ ({N} HTML files)

다음 단계:
  /mdbook serve .  — 미리보기
  /commit          — 변경사항 커밋
```

---

## Update 모드 (book.toml 있음)

기존 mdBook 프로젝트를 업데이트한다. SUMMARY.md 동기화 후 빌드.

### Step 1: SUMMARY.md 동기화

`mdbook-utils` 스킬의 "3. SUMMARY.md 동기화" 참조.

1. SUMMARY.md에서 링크된 .md 파일 추출
2. 디렉토리의 실제 .md 파일 목록과 비교
3. 차이가 있으면 표시:

```
SUMMARY.md 동기화:

  + ep08-new.md         (새 파일)
  - old-chapter.md      (파일 없음)

SUMMARY.md를 업데이트할까요? [Y/N]
```

4. Y 선택 시 SUMMARY.md 업데이트
5. N 선택 시 또는 차이 없으면 다음 단계로

### Step 2: 빌드 실행

```bash
mdbook clean {DIR}
mdbook build {DIR}
```

### Step 3: .nojekyll 확인

```bash
[ -f "docs/.nojekyll" ] || touch docs/.nojekyll
```

### Step 4: 결과 출력

**변경 있음:**
```
## mdBook 업데이트 완료

### SUMMARY.md 변경
  + ep08-new.md 추가
  - old-chapter.md 제거

### 빌드
docs/ ({N} HTML files)

다음 단계:
  /commit  — 변경사항 커밋
```

**변경 없음:**
```
## mdBook 빌드 완료

SUMMARY.md와 파일 목록이 일치합니다.

docs/ ({N} HTML files)

다음 단계:
  /commit  — 변경사항 커밋
```

---

## /mdbook build [dir]

로컬에서 HTML을 빌드하고 docs/에 저장한다.

### Step 1: mdbook 설치 확인

`mdbook-utils` 스킬의 "1. mdbook 설치 확인" 참조.

### Step 2: book.toml 탐지

공통 로직 참조.

### Step 3: 빌드 실행

`mdbook-utils` 스킬의 "4. 빌드 명령" 참조.

```bash
mdbook clean {DIR}
mdbook build {DIR}
```

### Step 4: .nojekyll 확인

`mdbook-utils` 스킬의 "5. .nojekyll 확인" 참조.

```bash
[ -f "docs/.nojekyll" ] || touch docs/.nojekyll
```

### Step 5: 결과 출력

```
## 빌드 완료

docs/ ({N} HTML files)

다음 단계:
  git add docs/
  git commit -m "docs: update mdBook site"
  git push

또는 `/commit` 으로 커밋하세요.
```

---

## /mdbook serve [dir]

로컬 개발 서버를 실행한다.

### Step 1: book.toml 탐지

공통 로직 참조.

### Step 2: 서버 실행

```bash
mdbook serve {DIR} --open
```

- `--open`: 브라우저 자동 열기
- 기본 포트: 3000
- 파일 변경 시 자동 리로드

### Step 3: 안내

```
mdbook serve 실행 중...

http://localhost:3000 에서 미리보기하세요.
Ctrl+C로 종료합니다.
```

---

## /mdbook clean [dir]

빌드 출력을 정리한다.

### Step 1: book.toml 탐지

공통 로직 참조.

### Step 2: 정리 실행

```bash
mdbook clean {DIR}
```

- book.toml의 `build-dir`에 해당하는 디렉토리를 삭제
- 챕터 삭제 후 남은 잔여 HTML 파일 정리에 유용

### Step 3: 결과 출력

```
docs/ 정리 완료.
```

---

## /mdbook sync [dir]

SUMMARY.md를 디렉토리의 .md 파일과 동기화한다. 빌드는 하지 않는다.

### Step 1: book.toml 탐지

공통 로직 참조.

### Step 2: 동기화 확인

`mdbook-utils` 스킬의 "3. SUMMARY.md 동기화" 참조.

1. SUMMARY.md에서 링크된 .md 파일 추출
2. 디렉토리의 실제 .md 파일 목록과 비교
3. 차이 표시:

```
SUMMARY.md 동기화:

  + new-chapter.md      (새 파일)
  - old-chapter.md      (파일 없음)

SUMMARY.md를 업데이트할까요? [Y/N]
```

### Step 3: 업데이트

Y 선택 시:
- 새 파일: 적절한 섹션에 추가 (파일의 첫 `#` 헤더를 제목으로)
- 삭제된 파일: SUMMARY.md에서 해당 항목 제거

### Step 4: 결과 출력

**변경 있음:**
```
SUMMARY.md 업데이트 완료.

  + new-chapter.md 추가
  - old-chapter.md 제거

`/mdbook build` 로 빌드하세요.
```

**변경 없음:**
```
SUMMARY.md와 파일 목록이 일치합니다.
```

</execution>

<examples>

### 예시 1: 단일 디렉토리 초기화 (book.toml 없음)

```
User: /mdbook tutorial

Claude: book.toml 없음 → Init 모드

tutorial/ 스캔 결과:
- 01-overview.md
- 02-settings.md
- 03-commands.md

[프로젝트 정보 질문 → 답변]

mdbook build tutorial

## mdBook 초기화 완료

tutorial/ 에 추가된 파일:
- book.toml
- SUMMARY.md
- introduction.md

빌드 완료:
- docs/ (15 HTML files)

다음 단계:
  /mdbook serve tutorial  — 미리보기
  /commit                 — 변경사항 커밋
```

### 예시 2: 다중 디렉토리 초기화 (book.toml 없음)

```
User: /mdbook tutorial youtube

Claude: book.toml 없음 → Init 모드 (다중)

=== tutorial ===
- 01-overview.md
- 02-settings.md

=== youtube ===
- ep01.md
- ep02.md

[프로젝트 정보 질문 → 답변]

mdbook build .

## mdBook 초기화 완료

프로젝트 루트에 추가된 파일:
- book.toml
- SUMMARY.md (2 sections)
- introduction.md

빌드 완료:
- docs/ (25 HTML files)

다음 단계:
  /mdbook serve .  — 미리보기
  /commit          — 변경사항 커밋
```

### 예시 3: 업데이트 (book.toml 있음, 변경 있음)

```
User: /mdbook tutorial youtube

Claude: book.toml 발견 → Update 모드

SUMMARY.md 동기화:

  + youtube/ep08-new.md    (새 파일)

SUMMARY.md를 업데이트할까요? [Y/N]

User: Y

## mdBook 업데이트 완료

### SUMMARY.md 변경
  + youtube/ep08-new.md 추가

### 빌드
docs/ (25 HTML files)

다음 단계:
  /commit  — 변경사항 커밋
```

### 예시 4: 업데이트 (book.toml 있음, 변경 없음)

```
User: /mdbook tutorial youtube

Claude: book.toml 발견 → Update 모드

## mdBook 빌드 완료

SUMMARY.md와 파일 목록이 일치합니다.

docs/ (25 HTML files)

다음 단계:
  /commit  — 변경사항 커밋
```

### 예시 5: 빌드만

```
User: /mdbook build tutorial

Claude:
mdbook clean tutorial
mdbook build tutorial

## 빌드 완료

docs/ (15 HTML files)

다음 단계:
  git add docs/
  git commit -m "docs: update mdBook site"
  git push
```

### 예시 6: 자동 탐지 빌드

```
User: /mdbook build

Claude: book.toml 탐지: tutorial/book.toml

mdbook clean tutorial
mdbook build tutorial

## 빌드 완료

docs/ (15 HTML files)
```

### 예시 7: 개발 서버

```
User: /mdbook serve tutorial

Claude:
mdbook serve tutorial --open

mdbook serve 실행 중...

http://localhost:3000 에서 미리보기하세요.
Ctrl+C로 종료합니다.
```

### 예시 8: SUMMARY 동기화만

```
User: /mdbook sync tutorial

Claude:
SUMMARY.md 동기화:

  + 05-advanced.md      (새 파일)
  - old-intro.md        (파일 없음)

SUMMARY.md를 업데이트할까요? [Y/N]

User: Y

Claude:
SUMMARY.md 업데이트 완료.

  + 05-advanced.md 추가
  - old-intro.md 제거

`/mdbook build tutorial` 로 빌드하세요.
```

### 예시 9: 동기화 (변경 없음)

```
User: /mdbook sync

Claude: book.toml 탐지: tutorial/book.toml

SUMMARY.md와 파일 목록이 일치합니다.
```

</examples>
