---
created: 2026-02-15
description: Cloudflare 대시보드에서 만든 터널의 credentials 파일을 로컬 config 모드용 JSON으로 변환
---

# cloudflared 자격증명 파일 형식 변환 (토큰→JSON)

Cloudflare Zero Trust 대시보드에서 만든 터널의 credentials 파일이 base64 토큰 형식일 때, 로컬 config.yml 모드로 실행할 수 있도록 JSON 형식으로 변환한다.

## The Insight

cloudflared 터널은 두 가지 모드로 실행된다:
- **토큰 모드** (`--token`): 대시보드가 설정 관리, 로컬 config.yml 무시
- **로컬 모드** (`tunnel run <name>`): `~/.cloudflared/config.yml` 사용

대시보드에서 터널을 만들면 credentials 파일(`<TUNNEL_ID>.json`)에 base64 토큰이 저장된다. 이 상태에서 로컬 모드를 실행하면 `Invalid JSON when parsing credentials file` 에러가 난다.

## Why This Matters

- 토큰 모드는 대시보드에서만 ingress 규칙을 수정할 수 있다
- 로컬 config.yml로 관리하고 싶으면 credentials 파일 변환이 필요하다
- 에러 메시지가 "invalid character 'e'"처럼 불명확해서 원인 파악이 어렵다

## Recognition Pattern

```
ERR The credentials file at ~/.cloudflared/<id>.json contained invalid JSON.
ERR Invalid JSON when parsing credentials file: invalid character 'e' looking for beginning of value
```

## The Approach

### Step 1: 현재 파일 확인

```bash
cat ~/.cloudflared/<TUNNEL_ID>.json
```

base64 문자열이면 변환이 필요하다:
```
eyJhIjoiNGE3MT...  ← base64 토큰 (변환 필요)
{"AccountTag":... ← 이미 JSON (변환 불필요)
```

### Step 2: base64 디코딩

```bash
cat ~/.cloudflared/<TUNNEL_ID>.json | base64 -d
```

출력 예시:
```json
{"a":"4a71412a...","s":"ZTBkMGUy...","t":"a6a372c3-b19d-446f-9fae-0344c9f110b8"}
```

### Step 3: JSON 형식으로 변환

디코딩된 필드를 cloudflared가 기대하는 키 이름으로 매핑한다:

| 토큰 키 | JSON 키 | 설명 |
|---------|---------|------|
| `a` | `AccountTag` | Cloudflare 계정 ID |
| `s` | `TunnelSecret` | 터널 인증 시크릿 |
| `t` | `TunnelID` | 터널 UUID |

```bash
# 디코딩 후 변환
TOKEN=$(cat ~/.cloudflared/<TUNNEL_ID>.json | base64 -d)
ACCOUNT=$(echo $TOKEN | python3 -c "import sys,json; print(json.load(sys.stdin)['a'])")
SECRET=$(echo $TOKEN | python3 -c "import sys,json; print(json.load(sys.stdin)['s'])")
TUNNEL_ID=$(echo $TOKEN | python3 -c "import sys,json; print(json.load(sys.stdin)['t'])")

cat > ~/.cloudflared/<TUNNEL_ID>.json << EOF
{"AccountTag":"$ACCOUNT","TunnelSecret":"$SECRET","TunnelID":"$TUNNEL_ID"}
EOF
```

### Step 4: 로컬 모드 실행

```bash
cloudflared tunnel run <tunnel-name>
```

`config.yml`의 ingress 규칙이 적용된다.

## Example

```bash
# Before (base64 토큰)
$ cat ~/.cloudflared/a6a372c3-b19d-446f-9fae-0344c9f110b8.json
eyJhIjoiNGE3MTQxMmFkOWU1Y2M2NWFhODBmNjU3MDRjZGI3NjYi...

# 디코딩
$ cat ~/.cloudflared/a6a372c3-b19d-446f-9fae-0344c9f110b8.json | base64 -d
{"a":"4a71412ad9e5cc65aa80f65704cdb766","s":"ZTBkMGUyYjAt...","t":"a6a372c3-b19d-446f-9fae-0344c9f110b8"}

# After (올바른 JSON)
$ cat ~/.cloudflared/a6a372c3-b19d-446f-9fae-0344c9f110b8.json
{"AccountTag":"4a71412ad9e5cc65aa80f65704cdb766","TunnelSecret":"ZTBkMGUyYjAt...","TunnelID":"a6a372c3-b19d-446f-9fae-0344c9f110b8"}
```

## 체크리스트

- [ ] credentials 파일이 JSON인지 base64인지 확인
- [ ] base64 디코딩 성공
- [ ] `AccountTag`, `TunnelSecret`, `TunnelID` 키로 JSON 작성
- [ ] `cloudflared tunnel run <name>` 정상 실행

## 관련 문서

- `deploy-tunnel.md` - Cloudflare Tunnel 배포 가이드
