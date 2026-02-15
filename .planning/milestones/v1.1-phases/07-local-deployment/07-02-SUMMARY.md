---
phase: 07-local-deployment
plan: 02
subsystem: infra
tags: [vite, pwa, cloudflare-tunnel, production-build, workbox]

# Dependency graph
requires:
  - phase: 07-01
    provides: Cloudflare Tunnel with hariplan.com domain routing
  - phase: 06-01
    provides: PWA infrastructure with vite-plugin-pwa and Workbox caching
provides:
  - Production environment configuration with tunnel domain URLs
  - Vite preview server configured for tunnel access (host 0.0.0.0)
  - PWA service worker with domain-agnostic URL patterns
  - Working production build pipeline
affects: [07-03, 07-04, 07-05, deployment, production]

# Tech tracking
tech-stack:
  added: []
  patterns: [domain-agnostic service worker patterns, 0.0.0.0 host binding for tunnel access]

key-files:
  created: [.env.production]
  modified: [vite.config.js, .gitignore]

key-decisions:
  - "Broadened PWA runtimeCaching patterns from *.supabase.co to generic /rest|storage|auth/ paths for tunnel compatibility"
  - "Added .env.production to .gitignore for security (contains publishable key)"
  - "preview.host set to 0.0.0.0 to accept connections from cloudflared proxy"

patterns-established:
  - "Domain-agnostic service worker URL patterns: Match API paths (rest/storage/auth) instead of specific domains"
  - "Environment-specific .env files: .env.local for dev, .env.production for tunnel deployment"

# Metrics
duration: 1min
completed: 2026-02-15
---

# Phase 07 Plan 02: Production Build Configuration Summary

**Production environment configured with tunnel domain URLs, Vite preview accepts tunnel connections via 0.0.0.0 binding, and PWA service worker caches API calls regardless of domain**

## Performance

- **Duration:** 1min
- **Started:** 2026-02-15T10:07:18Z
- **Completed:** 2026-02-15T10:09:08Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created .env.production with https://supabase.hariplan.com tunnel URLs
- Updated vite.config.js preview server to listen on 0.0.0.0 for tunnel access
- Broadened PWA service worker patterns to match both supabase.co and tunnel domain APIs
- Verified production build succeeds with 151KB gzipped bundle (consistent with Phase 6 metrics)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create .env.production and update vite.config.js** - `d675ed2` (feat)

**Note:** Task 2 (Build production bundle and verify) was verification-only with no files to commit (dist/ is gitignored).

## Files Created/Modified
- `.env.production` - Production environment with VITE_SUPABASE_URL=https://supabase.hariplan.com and anon key
- `vite.config.js` - Added preview.host: '0.0.0.0', broadened workbox runtimeCaching patterns from `*.supabase.co` to generic `/rest|storage|auth/` paths
- `.gitignore` - Added .env.production for security

## Decisions Made

**1. Broadened PWA service worker URL patterns**
- Changed from domain-specific (`*.supabase.co`) to path-based (`/rest|storage|auth/`) patterns
- Rationale: Enables PWA caching regardless of whether API is accessed via supabase.co or tunnel domain
- Impact: Service worker now works in both cloud deployment and local tunnel deployment

**2. preview.host: '0.0.0.0' for tunnel access**
- Rationale: cloudflared proxy needs to connect from external interface, not just localhost
- Pattern established: Always bind to 0.0.0.0 when serving behind a tunnel/proxy

**3. Secured .env.production in .gitignore**
- Rationale: Contains publishable key which shouldn't be in git (even though it's public-facing, best practice to exclude)
- Pattern: All .env.* files except .env.example are gitignored

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added .env.production to .gitignore**
- **Found during:** Task 1 (Create .env.production)
- **Issue:** .gitignore only had `.env` and `.env.local` patterns, not `.env.production`
- **Fix:** Added explicit `.env.production` entry to .gitignore
- **Files modified:** .gitignore
- **Verification:** `git check-ignore .env.production` returns the file path
- **Committed in:** d675ed2 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential security fix to prevent committing credentials. No scope creep.

## Issues Encountered

None - production build succeeded on first attempt with no errors.

## User Setup Required

None - no external service configuration required. The .env.production file is created automatically with values from `npx supabase status`.

## Next Phase Readiness

**Ready for:**
- Plan 07-03: systemd service setup (can use `npm run preview` as the service command)
- Plan 07-04: End-to-end tunnel verification (frontend + API both configured)

**Verified working:**
- Production build completes: 151KB gzipped (consistent with Phase 6)
- Preview server responds on localhost:4173 (tested with curl)
- Service worker generated in dist/sw.js
- Built assets contain tunnel domain (supabase.hariplan.com)

**Next steps:**
- Test actual tunnel access to preview server (07-03 or 07-04)
- Set up preview server as systemd service for persistent operation

---
*Phase: 07-local-deployment*
*Completed: 2026-02-15*
