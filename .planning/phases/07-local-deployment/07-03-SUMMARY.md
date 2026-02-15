---
phase: 07-local-deployment
plan: 03
subsystem: infra
tags: [launchd, macos, cloudflared, vite, supabase, auto-startup]

# Dependency graph
requires:
  - phase: 07-01
    provides: Cloudflare Tunnel configured with jeju_rollbook tunnel name
  - phase: 07-02
    provides: Production build configuration with vite preview server
provides:
  - Three launchd plist files for auto-startup of all services
  - Health check ordering: Docker → Supabase → Frontend
  - Service management script for install/start/stop/restart/status/logs
  - Services installed in ~/Library/LaunchAgents/ ready to start
affects: [07-04-e2e-verification, operations]

# Tech tracking
tech-stack:
  added: []
  patterns: [launchd-health-checks, service-dependency-ordering]

key-files:
  created:
    - launchd/com.rollbook.supabase.plist
    - launchd/com.rollbook.frontend.plist
    - launchd/com.rollbook.tunnel.plist
    - scripts/rollbook-services.sh
  modified: []

key-decisions:
  - "Supabase service waits for Docker daemon via health check loop"
  - "Frontend service waits for Supabase API on port 54321 before starting"
  - "Tunnel uses jeju_rollbook tunnel name (not rollbook)"
  - "Frontend uses port 4173 (vite preview) not 3000 (dev mode)"
  - "KeepAlive with SuccessfulExit=false for Supabase, KeepAlive=true for Frontend/Tunnel"
  - "All plists use absolute paths and include /opt/homebrew/bin in PATH"

patterns-established:
  - "Health check pattern: while ! [check] do sleep 5 done && actual_command"
  - "XML escaping in plist: &amp; for &, &gt; for >, proper XML encoding"
  - "Service manager script provides unified interface for all three services"

# Metrics
duration: 1min 20s
completed: 2026-02-15
---

# Phase 7 Plan 3: launchd Auto-Startup Summary

**Three launchd services with health check ordering (Docker → Supabase → Frontend) and management script for Mac Mini production operation**

## Performance

- **Duration:** 1 min 20 sec
- **Started:** 2026-02-15T10:07:35Z
- **Completed:** 2026-02-15T10:08:55Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Supabase Docker service with Docker daemon health check
- Frontend Vite preview service with Supabase API health check
- Cloudflare Tunnel service using jeju_rollbook tunnel name
- Service management script with install/start/stop/restart/status/logs commands

## Task Commits

Each task was committed atomically:

1. **Task 1: Create launchd plist files for all three services** - `cb4dd60` (feat)
2. **Task 2: Create service management script and install services** - `480f5b6` (feat)

**Plan metadata:** (pending - will be added in final commit)

## Files Created/Modified
- `launchd/com.rollbook.supabase.plist` - Supabase service with Docker health check, KeepAlive on crash only
- `launchd/com.rollbook.frontend.plist` - Frontend service with Supabase API health check, always KeepAlive
- `launchd/com.rollbook.tunnel.plist` - Cloudflare Tunnel service using jeju_rollbook tunnel, always KeepAlive
- `scripts/rollbook-services.sh` - Unified management script for all three services

## Decisions Made

1. **Supabase waits for Docker daemon** - Health check loop (`while ! docker info`) prevents Supabase from starting before Docker is ready, avoiding startup failures
2. **Frontend waits for Supabase API** - Health check on port 54321 ensures frontend doesn't start before backend is available
3. **Correct tunnel name: jeju_rollbook** - Used actual tunnel name from system context, not template placeholder "rollbook"
4. **Frontend uses port 4173** - Vite preview server (production build) not dev mode port 3000
5. **XML escaping in bash commands** - Proper XML encoding (&amp; for &&, &gt; for >) in ProgramArguments strings
6. **Absolute paths throughout** - No ~ expansion, all paths use /Users/ohama for launchd compatibility
7. **PATH includes /opt/homebrew/bin** - Ensures Homebrew-installed binaries (npm, node, cloudflared) are found
8. **KeepAlive strategy** - Supabase restarts only on crashes (SuccessfulExit=false), Frontend/Tunnel always restart (KeepAlive=true)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all plists validated successfully, management script works as expected, services installed correctly.

## User Setup Required

None - no external service configuration required.

Services are installed in `~/Library/LaunchAgents/` but NOT started. Plan 07-04 will start services and verify end-to-end operation.

## Next Phase Readiness

- All three services ready to start via `./scripts/rollbook-services.sh start`
- Health check ordering ensures proper startup sequence
- Management script provides status monitoring and log viewing
- Ready for Plan 07-04 end-to-end verification

---
*Phase: 07-local-deployment*
*Completed: 2026-02-15*
