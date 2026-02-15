# Plan 07-01 Summary: Cloudflare Tunnel Setup

## Status: COMPLETE

## What Was Done

### Task 1: Domain and Subdomain Configuration
- **Domain**: hariplan.com
- **Frontend**: rollbook.hariplan.com → localhost:3000
- **Supabase API**: supabase.hariplan.com → localhost:54321

### Task 2: Tunnel Infrastructure Setup
1. cloudflared already installed via Homebrew
2. Tunnel `jeju_rollbook` (ID: `a6a372c3-b19d-446f-9fae-0344c9f110b8`) pre-existing from Cloudflare dashboard
3. Credentials file converted from base64 token to proper JSON format
4. config.yml created at `~/.cloudflared/config.yml` with ingress rules
5. DNS CNAME records created for both subdomains via `cloudflared tunnel route dns`
6. Config validated with `cloudflared tunnel ingress validate`
7. Tunnel tested and running successfully

## Deviations from Plan
- **Tunnel name**: `jeju_rollbook` instead of `rollbook` (pre-existing tunnel from dashboard)
- **Frontend port**: localhost:3000 (dev mode) instead of localhost:4173 (vite preview)
- **Credentials file**: Was base64 token from dashboard, converted to JSON (see howto/fix-cloudflared-credentials-format.md)
- **Tunnel mode**: Can run both token mode (`--token`) and local config mode (`tunnel run jeju_rollbook`)

## Key Files
- `~/.cloudflared/config.yml` — Tunnel routing config
- `~/.cloudflared/a6a372c3-b19d-446f-9fae-0344c9f110b8.json` — Tunnel credentials (JSON)
- `~/.cloudflared/cert.pem` — Account authentication certificate

## Artifacts
```yaml
# ~/.cloudflared/config.yml
tunnel: a6a372c3-b19d-446f-9fae-0344c9f110b8
ingress:
  - hostname: supabase.hariplan.com
    service: http://localhost:54321
  - hostname: rollbook.hariplan.com
    service: http://localhost:3000
  - service: http_status:404
```

## Duration
Manual setup during session (not timed)
