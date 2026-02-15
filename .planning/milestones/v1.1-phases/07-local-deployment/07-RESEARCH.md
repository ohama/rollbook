# Phase 7: Local Deployment - Research

**Researched:** 2026-02-13
**Domain:** Cloudflare Tunnel, macOS service management, local production deployment
**Confidence:** HIGH

## Summary

Phase 7 implements production-grade local deployment on Mac Mini using Cloudflare Tunnel to expose services without port forwarding. The research confirms this is the standard approach for secure self-hosted services with automatic HTTPS and zero network configuration.

The standard stack consists of cloudflared (installed via Homebrew), macOS launchd for service orchestration, Supabase local (Docker), and Vite preview mode for production builds. Cloudflare Tunnel provides automatic HTTPS certificates, DDoS protection, and can integrate with Google Workspace authentication via Cloudflare Access (already documented in existing howto/deploy-tunnel.md).

Critical findings: launchd has NO explicit service dependency ordering (unlike systemd), requiring careful use of KeepAlive with SuccessfulExit flags and strategic delays. Supabase local requires production-hardened secrets (not the default development credentials). Vite preview is acceptable for small-scale production but lacks production server features like advanced compression and security headers.

**Primary recommendation:** Follow the cloudflared → config.yml → launchd pattern with explicit environment variable configuration and logging for all services.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cloudflared | 2026.1.1+ | Cloudflare Tunnel client | Official Cloudflare tool, zero config HTTPS, free tier unlimited |
| Homebrew | latest | macOS package manager | Standard way to install cloudflared on macOS |
| launchd | Built-in macOS | Service management daemon | Native macOS init system, replaces cron/systemd |
| Supabase CLI | latest | Local Supabase orchestration | Official way to run Supabase locally via Docker |
| Docker Desktop | latest | Container runtime | Required for Supabase local services |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vite | 6.x | Production preview server | Small-scale production, already in stack |
| nginx | 1.25+ | Production static file server | Alternative to vite preview for larger scale |
| Cloudflare Access | Free tier | Authentication layer | Restrict access to Google Workspace users |
| Cloudflare DNS | Included | DNS management | Automatic CNAME creation via cloudflared CLI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cloudflare Tunnel | ngrok | ngrok free tier has random URLs, session limits, no fixed domain |
| Cloudflare Tunnel | Tailscale | Tailscale is VPN-based, requires client installation on all devices |
| Cloudflare Tunnel | Port forwarding + DDNS | Requires router access, exposes ports, no automatic HTTPS |
| Vite preview | nginx | nginx adds complexity but provides better production features (gzip, headers, caching) |
| launchd | manual startup | No auto-restart on crash, no boot persistence |

**Installation:**
```bash
# Core tools
brew install cloudflared

# Supabase CLI (if not already installed)
brew install supabase/tap/supabase

# Docker Desktop (GUI installer)
# Download from https://www.docker.com/products/docker-desktop
```

## Architecture Patterns

### Recommended Project Structure
```
rollbook/
├── .cloudflared/
│   ├── cert.pem              # Account authentication (from cloudflared login)
│   ├── <TUNNEL_ID>.json      # Tunnel credentials (from cloudflared tunnel create)
│   └── config.yml            # Tunnel routing configuration
├── .env.production           # Production environment variables
├── supabase/
│   ├── config.toml           # Supabase configuration
│   └── .env                  # Production secrets (JWT, passwords)
├── dist/                     # Vite production build output
└── launchd/                  # Service plist files (recommended location)
    ├── com.rollbook.supabase.plist
    ├── com.rollbook.frontend.plist
    └── com.rollbook.tunnel.plist
```

Actual launchd plist installation locations:
- System daemons: `/Library/LaunchDaemons/` (requires sudo)
- User agents: `~/Library/LaunchAgents/` (recommended for this project)

### Pattern 1: Cloudflare Tunnel Configuration

**What:** config.yml defines ingress rules mapping internet hostnames to local services. Rules evaluate top-to-bottom, and a catch-all rule is mandatory.

**When to use:** Always for Cloudflare Tunnel routing configuration.

**Example:**
```yaml
# Source: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/
tunnel: rollbook
credentials-file: /Users/<username>/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Frontend app
  - hostname: rollbook.example.com
    service: http://localhost:4173

  # Supabase API
  - hostname: api-rollbook.example.com
    service: http://localhost:54321

  # Catch-all rule (required - must be last)
  - service: http_status:404
```

**Key properties:**
- `tunnel`: Tunnel name or UUID
- `credentials-file`: Absolute path to credentials JSON
- `ingress`: Array of routing rules
  - `hostname`: Domain/subdomain to match (optional, omit for wildcard)
  - `path`: Regex for URL paths (optional)
  - `service`: Protocol + destination (http://localhost:PORT)

**Service URL formats:**
- HTTP: `http://localhost:8000`
- HTTPS: `https://localhost:8000` (add `originRequest.noTLSVerify: true` for self-signed certs)
- TCP: `tcp://localhost:8000`
- Built-in: `http_status:404` (for catch-all)

### Pattern 2: DNS Record Creation

**What:** CNAME records pointing to `<TUNNEL_ID>.cfargotunnel.com` route traffic through the tunnel.

**When to use:** After tunnel creation, before first run.

**Example:**
```bash
# Source: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/
# Automatic CNAME creation
cloudflared tunnel route dns rollbook rollbook.example.com
cloudflared tunnel route dns rollbook api-rollbook.example.com

# Verification (via Cloudflare dashboard)
# Type: CNAME
# Name: rollbook
# Target: <TUNNEL_ID>.cfargotunnel.com
# Proxy: Enabled (orange cloud)
```

**Multiple hostnames:** Each hostname requires its own CNAME, but all point to the same tunnel target. Traffic routing happens in config.yml, not DNS.

**Google Workspace MX records:** MX records are independent of CNAME records. Adding tunnel CNAMEs does NOT affect email routing. Verify MX records exist:
```
Type: MX | Name: @ | Content: aspmx.l.google.com | Priority: 1
```

### Pattern 3: launchd Service Definition

**What:** Property list (plist) XML files defining service behavior, startup conditions, and environment.

**When to use:** For auto-starting services on macOS boot.

**Example:**
```xml
<!-- Source: https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html -->
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
        <string>cd /Users/username/rollbook && npm run preview -- --host 0.0.0.0</string>
    </array>

    <key>WorkingDirectory</key>
    <string>/Users/username/rollbook</string>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>

    <key>StandardOutPath</key>
    <string>/tmp/rollbook-frontend.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/rollbook-frontend.error.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
```

**Required keys:**
- `Label`: Unique reverse-DNS identifier (e.g., com.rollbook.service)
- `ProgramArguments`: Array of command + arguments

**Critical optional keys:**
- `RunAtLoad`: true = start on boot/login
- `KeepAlive`: true = always running (restart on exit), dict = conditional restart
  - `SuccessfulExit: false` = only restart on crashes (exit code != 0)
- `WorkingDirectory`: Set working directory before execution
- `EnvironmentVariables`: Dict of env vars (critical for PATH)
- `StandardOutPath`/`StandardErrorPath`: Log file paths

**Loading/unloading:**
```bash
# Load (start) service
launchctl load ~/Library/LaunchAgents/com.rollbook.frontend.plist

# Unload (stop) service
launchctl unload ~/Library/LaunchAgents/com.rollbook.frontend.plist

# Modern alternative (macOS 10.11+)
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.rollbook.frontend.plist
launchctl bootout gui/$(id -u)/com.rollbook.frontend
```

### Pattern 4: Service Dependency Ordering

**What:** launchd has NO explicit dependency mechanism (no StartAfter/Requires). Dependencies must be handled via IPC sockets or strategic delays.

**When to use:** When services depend on each other (Supabase → Frontend → Tunnel).

**Example:**
```bash
# Strategy 1: Use KeepAlive without delays - services auto-restart until dependencies ready
# Supabase plist
<key>KeepAlive</key>
<dict>
    <key>SuccessfulExit</key>
    <false/>
</dict>

# Frontend plist (will retry connecting to Supabase until ready)
<key>KeepAlive</key>
<dict>
    <key>SuccessfulExit</key>
    <false/>
</dict>

# Strategy 2: Add startup delay in ProgramArguments
<key>ProgramArguments</key>
<array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>sleep 30 && cd /Users/username/rollbook && npm run preview</string>
</array>

# Strategy 3: Build health-check loop into startup script
<string>while ! curl -s http://localhost:54321/health > /dev/null; do sleep 5; done && npm run preview</string>
```

**Recommended approach for this project:**
1. Supabase: `KeepAlive: false` (Docker handles restart), `RunAtLoad: true`
2. Frontend: `KeepAlive: true` with `SuccessfulExit: false`, startup script waits for Supabase
3. Tunnel: `KeepAlive: true`, depends on both services being available

### Pattern 5: Production Environment Configuration

**What:** Separate environment files for production secrets and URLs.

**When to use:** Always for production deployments.

**Example:**
```bash
# .env.production (frontend)
VITE_SUPABASE_URL=https://api-rollbook.example.com
VITE_SUPABASE_ANON_KEY=<anon-key-from-supabase-status>

# supabase/.env (backend - NOT committed)
# Source: https://supabase.com/docs/guides/self-hosting/docker
JWT_SECRET=<64-char-random-string>
ANON_KEY=<generated-with-jwt-secret>
SERVICE_ROLE_KEY=<generated-with-jwt-secret>
POSTGRES_PASSWORD=<strong-alphanumeric-only>
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=<strong-password-not-numbers-only>

# Generate secrets
openssl rand -base64 32
```

**Build process:**
```bash
# Vite automatically uses .env.production when building
npm run build

# Preview with production env
npm run preview -- --host 0.0.0.0
```

### Anti-Patterns to Avoid

- **Daemonizing in code:** Never call `daemon()`, `fork()`, or background the process. launchd manages this.
- **Using default Supabase secrets in production:** Default JWT secrets are publicly known. Always regenerate.
- **Exposing Supabase Studio (port 54323) via tunnel:** Studio is admin interface, should never be public.
- **KeepAlive: true without SuccessfulExit:** Restarts even on intentional shutdowns, can cause respawn throttling.
- **Relative paths in plist:** Use absolute paths for credentials-file, WorkingDirectory, executables.
- **Omitting catch-all rule in config.yml:** Tunnel validation fails without final `service: http_status:404`.
- **Using vite preview --host without allowedHosts:** Vulnerable to DNS rebinding attacks in production.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Automatic HTTPS certificates | Custom Let's Encrypt scripts | Cloudflare Tunnel | Cloudflare manages certificates automatically, renews before expiry, handles edge termination |
| Service auto-restart on crash | Custom watchdog scripts | launchd KeepAlive | Built into macOS, handles throttling, integrates with system logs |
| Reverse proxy routing | nginx config for multiple services | Cloudflare Tunnel config.yml | Ingress rules are simpler than nginx location blocks, no SSL config needed |
| DNS updates on IP change | Custom DDNS scripts | Cloudflare Tunnel CNAME | Tunnel uses fixed CNAME, works behind NAT, no IP tracking needed |
| Authentication layer | Custom auth middleware | Cloudflare Access | Zero Trust authentication, supports Google Workspace, session management included |
| Port forwarding detection | UPnP scripts | Cloudflare Tunnel | Zero configuration, outbound-only connections, works on any network |
| Log rotation | Custom logrotate scripts | macOS system logs (ASL) | Use StandardOutPath, macOS handles rotation automatically |
| Environment variable management | Custom .env loader in plist | launchd EnvironmentVariables | Native support, no shell sourcing needed |

**Key insight:** Cloudflare Tunnel eliminates entire categories of deployment complexity (port forwarding, DDNS, SSL certificates, reverse proxy). The free tier supports unlimited traffic and up to 50 users with Cloudflare Access.

## Common Pitfalls

### Pitfall 1: Tunnel Credentials File Path Issues

**What goes wrong:** Tunnel fails to start with "credentials file not found" even though file exists.

**Why it happens:** config.yml uses relative path (`~/.cloudflared/...`) but launchd doesn't expand `~`. Service runs as user but doesn't have correct HOME environment.

**How to avoid:** Always use absolute paths in config.yml:
```yaml
# Bad
credentials-file: ~/.cloudflared/abc123.json

# Good
credentials-file: /Users/username/.cloudflared/abc123.json
```

**Warning signs:**
- Tunnel works when run manually (`cloudflared tunnel run`) but fails via launchd
- Log shows "open ~/.cloudflared/xyz.json: no such file or directory"

### Pitfall 2: launchd Service Respawning Too Quickly

**What goes wrong:** Service exits immediately, launchd throttles and stops trying to restart.

**Why it happens:** Service fails startup check (e.g., Supabase not ready), exits with code 0 (success), or crashes repeatedly within 10 seconds.

**How to avoid:**
1. Use `KeepAlive: { SuccessfulExit: false }` to only restart on crashes
2. Add health check loops in startup script
3. Set exit code != 0 on failure
4. Add initial delay if dependencies not guaranteed ready

**Warning signs:**
- Console.app shows "Service exited with code 0"
- `launchctl list | grep rollbook` shows exit code and "throttled"
- Service starts but immediately stops

### Pitfall 3: Missing PATH Environment Variable

**What goes wrong:** launchd can't find `npm`, `node`, or `cloudflared` commands.

**Why it happens:** launchd has minimal default PATH (`/usr/bin:/bin:/usr/sbin:/sbin`). Homebrew binaries in `/opt/homebrew/bin` not included.

**How to avoid:** Set explicit PATH in plist EnvironmentVariables:
```xml
<key>EnvironmentVariables</key>
<dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:/Users/username/.npm-global/bin</string>
</dict>
```

**Warning signs:**
- StandardErrorPath shows "command not found: npm"
- Service works manually but fails via launchd

### Pitfall 4: Supabase Default Secrets in Production

**What goes wrong:** Production deployment uses default JWT secrets, making tokens predictable and forgeable.

**Why it happens:** Supabase local development uses hardcoded defaults for convenience. Easy to forget to change for production.

**How to avoid:**
1. Create `supabase/.env` with production secrets
2. Generate with: `openssl rand -base64 32`
3. Regenerate ANON_KEY and SERVICE_ROLE_KEY with new JWT_SECRET
4. Update `.env.production` with new ANON_KEY

**Warning signs:**
- Supabase status shows default anon key starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIi...`
- JWT_SECRET is "super-secret-jwt-token-with-at-least-32-characters-long"

### Pitfall 5: Vite Preview DNS Rebinding Vulnerability

**What goes wrong:** Vite preview blocks requests from tunnel domain with "Invalid Host header" error.

**Why it happens:** Vite preview has Host header validation to prevent DNS rebinding attacks. By default, only allows localhost.

**How to avoid:** Configure `server.allowedHosts` in vite.config.js:
```js
// vite.config.js
export default {
  server: {
    allowedHosts: [
      'rollbook.example.com',
      '.example.com', // Allow all subdomains
    ]
  },
  preview: {
    host: '0.0.0.0', // Listen on all interfaces
    allowedHosts: [
      'rollbook.example.com',
      '.example.com'
    ]
  }
}
```

**Warning signs:**
- Browser shows "Invalid Host header"
- Tunnel connected but frontend returns 400 error
- Direct localhost:4173 works, tunnel domain doesn't

### Pitfall 6: Docker Not Started Before Supabase

**What goes wrong:** `supabase start` fails with "Cannot connect to Docker daemon".

**Why it happens:** launchd starts Supabase service before Docker Desktop fully initialized.

**How to avoid:**
1. Add Docker Desktop to Login Items (GUI: System Settings > General > Login Items)
2. Add startup delay to Supabase plist: `sleep 60 && supabase start`
3. Or use health check: `while ! docker info > /dev/null 2>&1; do sleep 5; done`

**Warning signs:**
- Supabase error log shows "Cannot connect to the Docker daemon"
- Manual `supabase start` works fine
- Happens only on fresh boot

### Pitfall 7: Cloudflare Tunnel Running Multiple Instances

**What goes wrong:** Multiple cloudflared processes compete, causing connection flapping.

**Why it happens:** Both `cloudflared service install` (system daemon) and custom LaunchAgent created. Or old processes not cleaned up.

**How to avoid:**
- Choose ONE method: system daemon (`sudo cloudflared service install`) OR user agent (custom plist)
- Check running instances: `ps aux | grep cloudflared`
- Unload unused: `sudo launchctl unload /Library/LaunchDaemons/com.cloudflare.cloudflared.plist`

**Warning signs:**
- Tunnel connects/disconnects repeatedly
- Multiple cloudflared processes in Activity Monitor
- Cloudflare dashboard shows multiple connections

## Code Examples

Verified patterns from official sources:

### Complete cloudflared Setup Flow

```bash
# Source: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/create-local-tunnel/

# 1. Install
brew install cloudflared

# 2. Authenticate (opens browser)
cloudflared tunnel login
# Creates: ~/.cloudflared/cert.pem

# 3. Create tunnel
cloudflared tunnel create rollbook
# Output: Created tunnel rollbook with id abc-123-def-456
# Creates: ~/.cloudflared/abc-123-def-456.json

# 4. Create config
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: rollbook
credentials-file: /Users/username/.cloudflared/abc-123-def-456.json

ingress:
  - hostname: rollbook.example.com
    service: http://localhost:4173
  - hostname: api-rollbook.example.com
    service: http://localhost:54321
  - service: http_status:404
EOF

# 5. Create DNS records
cloudflared tunnel route dns rollbook rollbook.example.com
cloudflared tunnel route dns rollbook api-rollbook.example.com

# 6. Test tunnel
cloudflared tunnel run rollbook

# 7. Validate config
cloudflared tunnel ingress validate

# 8. Test specific URL routing
cloudflared tunnel ingress rule https://rollbook.example.com/login
```

### Supabase Production Configuration

```bash
# Source: https://supabase.com/docs/guides/self-hosting/docker

# Generate production secrets
JWT_SECRET=$(openssl rand -base64 32)
ANON_KEY=$(npx --yes supabase gen keys anon $JWT_SECRET)
SERVICE_ROLE_KEY=$(npx --yes supabase gen keys service_role $JWT_SECRET)
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)
DASHBOARD_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)

# Create production .env
cat > supabase/.env << EOF
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD
EOF

# Verify Supabase reads the .env
npx supabase start
npx supabase status
# Check that anon key matches ANON_KEY above
```

### Complete launchd Service Setup

```bash
# Source: Existing howto/service-guide.md

# 1. Create plist directory
mkdir -p ~/Library/LaunchAgents

# 2. Create Supabase service
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
        <string>while ! docker info > /dev/null 2>&1; do sleep 5; done && cd /Users/username/rollbook && npx supabase start</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/username/rollbook</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/rollbook-supabase.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/rollbook-supabase.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF

# 3. Create Frontend service
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
        <string>while ! curl -s http://localhost:54321/health > /dev/null 2>&1; do sleep 5; done && cd /Users/username/rollbook && npm run preview -- --host 0.0.0.0</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/username/rollbook</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/rollbook-frontend.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/rollbook-frontend.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
EOF

# 4. Create Tunnel service
cat > ~/Library/LaunchAgents/com.rollbook.tunnel.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.rollbook.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/cloudflared</string>
        <string>tunnel</string>
        <string>run</string>
        <string>rollbook</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/rollbook-tunnel.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/rollbook-tunnel.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF

# 5. Load services
launchctl load ~/Library/LaunchAgents/com.rollbook.supabase.plist
launchctl load ~/Library/LaunchAgents/com.rollbook.frontend.plist
launchctl load ~/Library/LaunchAgents/com.rollbook.tunnel.plist

# 6. Verify
launchctl list | grep rollbook
tail -f /tmp/rollbook-*.log
```

### Vite Configuration for Tunnel

```js
// Source: https://vite.dev/config/preview-options
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0', // Listen on all interfaces for LAN access
    allowedHosts: [
      'localhost',
      '192.168.0.10', // Mac Mini LAN IP
      'rollbook.example.com',
      '.example.com' // Allow all subdomains
    ]
  },

  preview: {
    host: '0.0.0.0', // Required for Cloudflare Tunnel
    port: 4173,
    allowedHosts: [
      'rollbook.example.com',
      '.example.com'
    ]
  }
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Port forwarding + static IP | Cloudflare Tunnel | 2021 | Zero network config, works on any network including CGNAT |
| Let's Encrypt + certbot cron | Cloudflare automatic HTTPS | 2020 | No manual certificate management |
| nginx reverse proxy config | Cloudflare Tunnel config.yml | 2021 | Simpler routing rules, no SSL config |
| launchctl load/unload | launchctl bootstrap/bootout | macOS 10.11 (2015) | Better error messages, explicit domain specification |
| Vite dev server in production | Vite preview mode | Vite 2.0 (2021) | Production-optimized, but still not recommended for high-scale |
| Supabase Cloud | Supabase Local (self-hosted) | 2022 | Data sovereignty, no cloud costs, full control |

**Deprecated/outdated:**
- **Argo Tunnel**: Renamed to Cloudflare Tunnel in 2021, CLI commands updated
- **launchctl load**: Still works but deprecated in favor of `bootstrap` for new scripts
- **cloudflared cert.pem for tunnel run**: Cert.pem only needed for tunnel creation/DNS management, not runtime (use credentials JSON)
- **RunAtLoad in system daemons**: Should use bootstrap in modern macOS

## Open Questions

Things that couldn't be fully resolved:

1. **Supabase local production vs Docker Compose self-hosted**
   - What we know: Supabase CLI uses Docker Compose under the hood, config.toml can override defaults
   - What's unclear: Whether `npx supabase start` is production-grade or if we should use standalone docker-compose.yml
   - Recommendation: Start with `supabase start` + production .env. If need more control (external S3, custom ports, non-Docker networking), migrate to standalone docker-compose.yml from https://github.com/supabase/supabase/tree/master/docker

2. **Vite preview vs nginx for small-scale production**
   - What we know: Vite preview is designed for testing builds, not production. nginx adds compression, caching headers, security headers
   - What's unclear: At what scale Vite preview becomes inadequate (concurrent users? request rate?)
   - Recommendation: Use Vite preview initially, monitor performance. Add nginx if need: gzip compression, custom cache-control headers, rate limiting, or serving > 100 concurrent users

3. **Cloudflare Access free tier limits**
   - What we know: Free tier supports up to 50 users
   - What's unclear: What happens at 51 users (hard limit? upgrade prompt?)
   - Recommendation: Track user count in Cloudflare Access dashboard. At ~45 users, evaluate upgrade to Teams plan ($7/user/month)

4. **launchd service startup time on Mac Mini boot**
   - What we know: Docker Desktop takes 30-60s to start, Supabase containers take additional time
   - What's unclear: Total time from power-on to services fully available
   - Recommendation: Add monitoring script that timestamps each service ready state. Log to file for analysis.

## Sources

### Primary (HIGH confidence)
- [Cloudflare Tunnel Configuration File](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/) - config.yml structure and ingress rules
- [Cloudflare Tunnel DNS Records](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/) - CNAME creation and routing
- [Cloudflare Tunnel macOS Service](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/as-a-service/macos/) - launchd integration
- [Apple Developer: Creating Launch Daemons and Agents](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html) - Official plist documentation
- [Supabase Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker) - Production environment variables
- [Vite Preview Options](https://vite.dev/config/preview-options) - allowedHosts configuration
- Existing howto/deploy-tunnel.md - Project-specific deployment guide
- Existing howto/service-guide.md - Project-specific service management

### Secondary (MEDIUM confidence)
- [Cloudflare Tunnel Homebrew Formula](https://formulae.brew.sh/formula/cloudflared) - Installation method
- [Many services, one cloudflared](https://blog.cloudflare.com/many-services-one-cloudflared/) - Multi-service routing patterns
- [Cloudflare Tunnel HTTPS automatic](https://blog.cloudflare.com/introducing-automatic-ssl-tls-securing-and-simplifying-origin-connectivity/) - Certificate management
- [launchd.info Tutorial](https://www.launchd.info/) - Community launchd guide
- [GitHub: launchd overview gist](https://gist.github.com/johndturn/09a5c055e6a56ab61212204607940fa0) - Practical examples
- [Medium: How to Use launchd](https://medium.com/swlh/how-to-use-launchd-to-run-services-in-macos-b972ed1e352) - Community guide

### Tertiary (LOW confidence)
- [Vite preview production discussion](https://github.com/vitejs/vite/discussions/16607) - Community opinions on preview in production
- [Google Workspace MX Records Guide 2026](https://www.smartlead.ai/blog/a-complete-guide-for-google-workspace-mx-records-in-2026) - DNS configuration patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools are industry standard, officially documented, actively maintained
- Architecture: HIGH - Patterns verified from official Cloudflare docs and existing project documentation
- Pitfalls: HIGH - Common issues documented in official troubleshooting and community forums
- Production configuration: MEDIUM - Supabase local production usage less documented than cloud, Vite preview production edge cases unclear

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days - stable infrastructure tools, slow-moving APIs)

**Note for planner:** Existing howto/deploy-tunnel.md contains complete step-by-step deployment guide. Plans should reference and enhance this documentation rather than duplicate. Focus tasks on automation (launchd setup, environment generation) and verification (end-to-end flow testing).
