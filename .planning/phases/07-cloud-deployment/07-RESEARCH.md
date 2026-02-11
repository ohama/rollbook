# Phase 7: Cloud Deployment - Research

**Researched:** 2026-02-11
**Domain:** Vercel Deployment + Supabase Cloud Migration
**Confidence:** HIGH

## Summary

Phase 7 transitions the application from local Supabase development to production using Vercel for frontend hosting and Supabase Cloud for backend services. The primary challenge is safely migrating 5 existing database migrations to a production Supabase project while configuring environment variables across development, staging, and production environments.

The standard approach uses the Supabase CLI for database migration (`supabase link` + `supabase db push`) and Vercel's environment variable management system for secrets. The project's existing Fable+Vite+PWA stack is compatible with Vercel's zero-configuration deployment, but offline sync adds complexity when switching to cloud-backed authentication and storage.

**Primary recommendation:** Use Supabase CLI to push migrations to Cloud, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as Vercel environment variables, test RLS policies in production environment before enabling Storage public bucket caching.

## Standard Stack

### Core Deployment Tools
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Vercel CLI | latest | Deploy frontend to Vercel | Zero-config React/Vite builds, automatic SSL, git-integrated CI/CD |
| Supabase CLI | latest | Manage Cloud project and migrations | Official tool for database migrations and project linking |
| Supabase Cloud | Production | Hosted backend (Auth, DB, Storage) | Managed Postgres with built-in Auth and real-time capabilities |

### Supporting Tools
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| @supabase/supabase-js | 2.48.1 | Supabase client library | Already in dependencies; no changes needed |
| vite-plugin-pwa | 1.2.0 | PWA service worker | Handles offline caching; production-ready |
| idb | 8.0.3 | IndexedDB for offline sync | Already in dependencies for offline queue |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Cloud | Firebase/Firestore | Would require rewriting Auth and Storage, loses Postgres schema safety |
| Vercel | Netlify | Similar feature parity; Vercel more optimized for Next.js but Vite works fine |
| CLI migrations | Manual SQL in dashboard | Less reproducible; harder to track changes; not recommended for team |

**Installation:**
```bash
npm install -g vercel
npm install -g supabase
```

## Architecture Patterns

### Recommended Deployment Flow
```
Local Development
├── .env.local (localhost:54321)
└── supabase/migrations/ (5 migration files)
       ↓
Staging Environment (optional second Supabase project)
├── supabase link → staging-project-id
└── supabase db push → applies migrations
       ↓
Production Environment
├── vercel.env.production (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
└── Supabase Cloud project (production schema)
       ↓
Custom Domain (optional)
└── DNS configuration (A record, CNAME, or nameservers)
```

### Pattern 1: Database Migration to Cloud
**What:** Push local Supabase migrations to Cloud using CLI
**When to use:** One-time setup; migrations are idempotent but only run on first push
**Example:**
```bash
# Step 1: Create Supabase Cloud project via dashboard
# Dashboard: https://supabase.com/dashboard → New Project

# Step 2: Authenticate CLI with personal access token
supabase login
# Generates token via: https://supabase.com/dashboard/account/tokens

# Step 3: Link local project to Cloud
supabase link --project-ref your-project-ref
# Fetches PostgREST config, validates migrations

# Step 4: Push all migrations to Cloud
supabase db push
# Applies: 20260210014517_initial_schema.sql
#          20260210100000_workouts_schema.sql
#          20260210140000_team_visibility_rls.sql
#          20260210150000_storage_bucket.sql
#          20260210160000_admin_rbac.sql
```

**Source:** [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)

### Pattern 2: Environment Variables for Multi-Environment Setup
**What:** Separate environment variables for development, preview (staging), and production
**When to use:** Every Vercel deployment; prevents cross-environment data leaks
**Example:**
```bash
# Local development (.env.local or .env)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local-key-from-supabase-status>

# Vercel Dashboard → Project Settings → Environment Variables
# Production environment:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<copy-from-supabase-cloud-dashboard>

# Preview environment (optional, if using staging):
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=<copy-from-staging-project>
```

**Source:** [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

### Pattern 3: Custom Domain Configuration
**What:** Add custom domain to Vercel and configure DNS
**When to use:** Optional but recommended for production (improves trust, enables email integration)
**Example:**
```
1. Vercel Dashboard → Project Settings → Domains
2. Add domain: rollbook.example.com
3. Choose DNS method:
   - CNAME: Add CNAME record to existing DNS provider
   - A record: For apex domains (example.com)
   - Nameservers: Use Vercel's ns1/ns2 (recommended, all-in-one)
4. Wait 1-2 hours for propagation
```

**Source:** [Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

### Pattern 4: RLS Policies Verification in Production
**What:** Test Row Level Security policies with actual production JWT tokens
**When to use:** Before enabling any public-facing features; after RLS policy changes
**Example:**
```typescript
// CORRECT: Test from client SDK, not SQL editor (SQL editor bypasses RLS)
import { createClient } from '@supabase/supabase-js';

const client = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

// Sign in as test user
const { data: { user } } = await client.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password'
});

// This query respects RLS policies
const { data, error } = await client.from('workouts').select('*');
// Expects: only workouts where user_id matches auth.uid()
```

**Source:** [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Anti-Patterns to Avoid
- **Hardcoded secrets in code:** Never commit VITE_SUPABASE_ANON_KEY to git; always use Vercel environment variables
- **Service role key in frontend:** Never expose service_role_key (bypasses RLS) to browser; keep only on server
- **Skipping RLS testing:** Don't test policies in SQL editor; always use client SDK to verify auth context works
- **Public bucket without restrictions:** Don't enable public bucket caching without explicit RLS policies on storage.objects table
- **Single Supabase project for staging+production:** Always use separate projects; applying migrations twice breaks idempotency

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Environment variable management | Custom config loader | Vercel environment variables | Vercel handles encryption, secrets rotation, multiple environment support; custom loader is insecure and unmaintainable |
| Database schema versioning | Manual SQL tracking | Supabase migrations (/migrations/*.sql) | Migrations are idempotent, version-tracked, reversible; manual SQL leads to schema drift and failed deployments |
| Auth token storage | Custom localStorage wrapper | Supabase client with persistSession:true | Supabase handles refresh tokens, expiry, session restoration; custom storage risks XSS vulnerabilities |
| Offline sync conflict resolution | Custom last-write-wins logic | IDB queue + Supabase sync pattern | Conflicts in financial data (workouts) require careful handling; custom logic loses data on concurrent edits |

**Key insight:** Cloud deployment introduces new categories of risk (exposed secrets, RLS bypasses, data conflicts) that can't be solved by simple code; use battle-tested solutions.

## Common Pitfalls

### Pitfall 1: Pushing Migrations When Database Already Modified
**What goes wrong:** `supabase db push` fails or partially applies when migrations were already applied manually
**Why it happens:** Migrations are tracked by `supabase_migrations_list` table; if someone manually applied the schema in Cloud, the migrations can't be replayed
**How to avoid:**
  1. Never manually edit Cloud database schema via dashboard (except for emergency hotfixes)
  2. Always push migrations from CLI to canonical source
  3. For first push to new Cloud project, ensure it's empty (no prior manual changes)
**Warning signs:** Error "Migration X already exists in remote database" when running `supabase db push`

### Pitfall 2: RLS Policies Not Tested Against Production JWT
**What goes wrong:** Policy works in development (where SQL editor bypasses RLS) but fails in production when real JWT tokens are validated
**Why it happens:** SQL editor runs as superuser; real client SDK runs with user's JWT claims
**How to avoid:**
  1. Test all RLS policies using client SDK, not SQL editor
  2. Create test users in production and verify they can't access other users' data
  3. Use `auth.uid()` and `auth.jwt()` functions; understand they return NULL for unauthenticated requests
  4. Always include `auth.uid() IS NOT NULL` check when comparing user IDs
**Warning signs:** "Permission denied" errors after deployment; policy works in SQL editor but not in app

### Pitfall 3: Offline Queue Conflicts When Switching to Cloud Auth
**What goes wrong:** Offline queue has old auth tokens; after switching to Cloud, tokens don't validate against production RLS
**Why it happens:** Local Supabase and Cloud Supabase have different JWT secrets; queued operations signed for local environment fail in production
**How to avoid:**
  1. Clear offline queue before production migration (`localStorage.removeItem('rollbook-offline-queue')`)
  2. Clear auth session (`localStorage.removeItem('rollbook-auth')`)
  3. Force users to re-authenticate on first visit after deployment
  4. Document in tutorial that users should log out before deploying to production
**Warning signs:** Sync errors after deployment; operations fail with 403 Unauthorized

### Pitfall 4: Storage Public Bucket Without RLS Policies
**What goes wrong:** Enabling public bucket caching without RLS policies means photo URLs are guessable; anyone can enumerate and download private photos
**Why it happens:** Public bucket improves performance (CDN caching) but requires explicit security review
**How to avoid:**
  1. Keep storage bucket private (default)
  2. Use signed URLs for time-limited access: `client.storage.from('photos').createSignedUrl(path, 3600)`
  3. Only if photos are non-sensitive, add RLS policy: `USING (bucket_id = 'photos' AND auth.role() = 'authenticated')`
  4. Never rely on obscure filenames for security
**Warning signs:** Photos visible to unauthenticated users; simple URL enumeration works

### Pitfall 5: Environment Variables Not Synced Between Environments
**What goes wrong:** Feature works in preview but fails in production; hard to debug because environments have different config
**Why it happens:** Developer only set env vars for production, forgot preview environment
**How to avoid:**
  1. Set variables for ALL environments (Production + Preview + Development)
  2. Use Vercel dashboard: Environment Variables → select checkboxes for all three
  3. Run `vercel env pull` locally to download development variables
  4. Test on preview deployments before merging to main
**Warning signs:** "Supabase URL is undefined" errors on preview deployments

## Code Examples

Verified patterns from official sources:

### Creating Supabase Client (unchanged from local)
```typescript
// src/Supabase/Client.js
// Source: @supabase/supabase-js v2.48.1
import { createClient } from "@supabase/supabase-js";

const clientOptions = {
    auth: {
        persistSession: true,  // Maintains session across page reloads
        autoRefreshToken: true,  // Automatically refresh expired tokens
        storageKey: "rollbook-auth",
    },
};

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,  // Points to Cloud URL in production
    import.meta.env.VITE_SUPABASE_ANON_KEY,  // Uses Cloud anon key
    clientOptions
);
```

### Verifying RLS Policy in Production
```typescript
// Test script to verify RLS before enabling public features
// Source: Supabase RLS Guide
import { supabase } from './Supabase/Client.js';

async function testRLSPolicy() {
  // Sign in as user A
  const { data: user1 } = await supabase.auth.signInWithPassword({
    email: 'user1@example.com',
    password: 'password'
  });

  // User A should only see their workouts
  const { data: workouts } = await supabase
    .from('workouts')
    .select('*');

  console.log('User A can see:', workouts.length, 'workouts');

  // Sign out and sign in as user B
  await supabase.auth.signOut();
  const { data: user2 } = await supabase.auth.signInWithPassword({
    email: 'user2@example.com',
    password: 'password'
  });

  // User B should NOT see User A's workouts
  const { data: workouts2 } = await supabase
    .from('workouts')
    .select('*');

  console.log('User B can see:', workouts2.length, 'workouts');
  console.assert(
    workouts2.every(w => w.user_id === user2.user.id),
    'User B should not see other users\' workouts'
  );
}
```

### Setting Environment Variables in Vercel
```bash
# Via Vercel CLI (recommended for automation)
vercel env add VITE_SUPABASE_URL
# Prompts for value, then asks which environments:
# [✓] Production
# [✓] Preview
# [✓] Development

vercel env add VITE_SUPABASE_ANON_KEY
# Same process

# Download development vars for local use
vercel env pull

# Via Vercel Dashboard (if preferred):
# 1. Settings → Environment Variables
# 2. Add variable name: VITE_SUPABASE_URL
# 3. Enter value from Supabase Cloud dashboard
# 4. Check: Production, Preview, Development
# 5. Save
```

**Source:** [Vercel Environment Variables Documentation](https://vercel.com/docs/environment-variables)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual database dumps for migration | Declarative migrations with CLI | Supabase 2021+ | Reproducible schema, easier rollback, team-friendly |
| Service key in frontend .env | Anon key in .env, service key server-only | Supabase best practices 2022+ | Prevents RLS bypass, secure by default |
| `.env` committed to git | Vercel environment variables (encrypted) | Vercel adoption 2020+ | Secrets never in version control, auto-rotation support |
| Localhost auth for offline | Cloud JWT tokens with offline queue | PWA offline-first 2023+ | Better security, conflict-aware queuing |
| Public storage without signed URLs | Private storage + signed URLs by default | Supabase security advisory 2024 | Photos protected, enumeration attack prevented |

**Deprecated/outdated:**
- Manual Postgres backups: Use Supabase automated backups (included in Cloud)
- .env files in .gitignore: Use Vercel environment variables (encrypted, team-accessible)
- localStorage for sensitive tokens: Use Supabase persistent session (automatic refresh)

## Open Questions

Things that couldn't be fully resolved:

1. **Offline Queue Conflict Resolution in Production**
   - What we know: App uses IDB-based queue; queue stores operations with user ID
   - What's unclear: Exact handling when same record is edited offline + online concurrently
   - Recommendation: Document in tutorial that offline edits may conflict; implement last-write-wins for initial launch; plan conflict UI for future phase

2. **Custom Domain Email Integration**
   - What we know: DNS can be managed via Vercel or external registrar
   - What's unclear: Whether tutorial should cover email setup (beyond DNS)
   - Recommendation: Mark custom domain as "optional" in phase; document DNS setup only; email config deferred to Phase 8

3. **Staging vs. Direct-to-Production**
   - What we know: Supabase recommends separate staging/production projects
   - What's unclear: Whether rollbook project scope requires staging, or if direct production is acceptable
   - Recommendation: Phase 7 goes direct to production; staging setup deferred to Phase 8

## Sources

### Primary (HIGH confidence)
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations) - Verified CLI workflow (`supabase link`, `supabase db push`)
- [Supabase Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments) - Multi-project setup patterns
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables) - Environment variable scope and encryption
- [Vercel Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain) - Domain setup options
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS policy patterns and pitfalls
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) - Storage security and signed URLs
- @supabase/supabase-js v2.48.1 - Client options for production auth

### Secondary (MEDIUM confidence)
- [Vite PWA Deployment](https://vite-pwa-org.netlify.app/deployment/) - Service worker and cache control for production
- [Vite Building for Production](https://vite.dev/guide/build) - Build optimization and asset handling
- Vercel-Supabase integration articles (2026-01 blog posts) - Environment variable synchronization patterns

### Tertiary (LOW confidence)
- Offline-first sync architecture blogs - Conflict resolution patterns (not specific to this project's queue implementation)
- Storage public vs. private bucket discussions - Performance tradeoffs (need validation against actual traffic)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vercel + Supabase official docs current as of Feb 2026
- Architecture: HIGH - CLI migration patterns verified in official Supabase guides
- Pitfalls: HIGH - RLS and offline sync issues documented in official sources and GitHub discussions
- Deployment verification: MEDIUM - PWA + Vite specifics verified; offline sync conflict handling needs custom testing

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days; Supabase and Vercel update docs regularly but these are stable patterns)
