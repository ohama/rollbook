# Project Research Summary

**Project:** Rollbook - Workout Tracking Web App
**Domain:** Small team (up to 20 people) fitness tracking with photo-based logging
**Researched:** 2026-02-10
**Confidence:** HIGH

## Executive Summary

Rollbook is a small team workout tracking app that differentiates through privacy-first team visibility and photo-based logging. The recommended approach is a Fable (F#/Elmish) + Supabase stack that balances type safety on the frontend with zero-ops backend infrastructure. This stack is well-suited for a 5-20 person team scale and aligns with 2026 standards for mobile-first PWAs.

The core technology decisions center on Fable 4.28.0 (stable, not 5.0-alpha) with Feliz 2.9.0 for React bindings, Vite 6.x for bundling, and Tailwind CSS 4.0 for styling. The backend leverages Supabase's managed PostgreSQL with Row-Level Security (RLS), authentication, storage, and Edge Functions (TypeScript/Deno). Deploy the static frontend to Cloudflare Pages for unlimited bandwidth and global CDN distribution. The critical architectural insight is that Supabase client must use JavaScript SDK (@supabase/supabase-js) with F# bindings, NOT the .NET-only supabase-fsharp library.

The primary risk is RLS misconfiguration leading to data exposure - this has affected 170+ Supabase apps in recent security audits. Mitigation requires enabling RLS on every table from day one, using migration-based schema management, and testing access control with multiple user accounts before launch. Secondary risks include Promise/Async interop complexity in Fable and Gmail SMTP configuration for auth emails (requires App Password with 2FA). Build order must follow dependencies: Database/RLS → Auth → Core Features → Storage/Edge Functions.

## Key Findings

### Recommended Stack

Standard 2026 stack for functional frontend + serverless backend combines Fable/Feliz for type-safe F# UI with Supabase for zero-ops infrastructure. Frontend compiles to JavaScript via Fable, bundles with Vite, and deploys as static SPA. Backend provides managed PostgreSQL, authentication, file storage, and serverless Edge Functions.

**Core technologies:**
- **Fable 4.28.0 + Feliz 2.9.0**: F# to JavaScript compiler with React bindings — stable production versions with .NET 8/9/10 support. NOT 5.0-alpha or 3.0-rc (too risky).
- **Vite 6.x + vite-plugin-fable**: Modern bundler with HMR — 2025 standard, superior to Webpack for dev experience and build speed.
- **Supabase (managed)**: Backend-as-a-Service with PostgreSQL 15, Auth, Storage, Edge Functions — handles infrastructure, scaling, backups for small teams.
- **@supabase/supabase-js (JavaScript SDK)**: Official client for browser — CRITICAL: use JS SDK with F# bindings, NOT supabase-fsharp which is .NET-only.
- **Tailwind CSS 4.0**: Utility-first CSS with zero config — mobile-first utilities, single CSS line import, uses PostCSS plugin.
- **Cloudflare Pages**: Static hosting with unlimited bandwidth — best global performance vs Netlify/Vercel bandwidth limits.

**Critical version decisions:**
- Use stable releases only (Fable 4.28.0, Feliz 2.9.0) — alpha/RC versions too risky for production
- Node.js 18+ required for Workbox v7 (PWA support)
- Edge Functions run on Deno 2.1 (TypeScript only, NOT F#)

### Expected Features

MVP focuses on fast logging and privacy-first team motivation. Photo-based AI logging is a major differentiator but defer to v2 due to complexity. One-tap logging and offline mode are competitive advantages over feature-heavy apps.

**Must have (table stakes):**
- Quick workout logging (manual entry) — users expect <30 seconds per exercise, core value prop
- Basic progress tracking — sets, reps, dates, trends, streaks, personal records
- Mobile-responsive design — 80%+ usage on mobile, desktop-first = DOA
- Offline functionality — gym connectivity unreliable, must work without internet and sync later
- Manual entry/editing — users expect to fix mistakes, no edit = abandonment
- User authentication — email/password baseline for team context
- Data export — users want ownership, no export = trust issue
- Clean, intuitive UI — opened 3-10x per session, cluttered UI = friction = abandonment

**Should have (differentiators):**
- One-tap logging — faster than template-based, pre-filled "Today's workout" button
- Privacy-first team visibility — team sees ONLY monthly workout count, not details (rare in fitness apps)
- Small team optimization — built for 5-20 people, not 50k (market whitespace)
- Habit streaks (team-aware) — "Team worked out 47 times this month" without individual pressure
- Workout history calendar — visual consistency feedback, low complexity, high perceived value
- Minimal app footprint — fast load (<2s), small install, works on older phones

**Defer to v2+:**
- Photo-based auto-record (OCR/AI) — highest differentiator but highest complexity, validate core hypothesis first
- Workout templates — only if users request, many won't need
- Native mobile apps — PWA first, native only if traction proves it
- Advanced analytics/graphs — wait for user requests, most won't care (<10% power users)
- Wearable integration — complex, low ROI for logging use case

**Anti-features (do NOT build):**
- Social feed/comments — creates surveillance feeling, kills motivation in workplace wellness
- Nutrition tracking — scope creep, 3x complexity, different problem domain
- Gamification/leaderboards — toxic for small teams, feels like performance reviews
- Exercise library/database — maintenance nightmare, user-generated tags work fine
- Video tutorials/form checking — different product, AI form analysis still unreliable in 2026

### Architecture Approach

Elmish MVU (Model-View-Update) architecture on frontend with Supabase backend enforcing security via Row-Level Security (RLS). All data access controlled by PostgreSQL RLS policies using JWT claims, ensuring defense-in-depth even if client is compromised. Edge Functions handle server-side validation and business logic.

**Major components:**
1. **Elmish Model/Update/View** — Immutable app state with pure update functions, async operations via Cmd.OfAsync, stateless view rendering via Feliz
2. **Supabase Client Wrapper** — F# bindings to JavaScript SDK, Promise→Async conversion, unified error handling with Result types
3. **PostgreSQL + RLS** — Database with row-level security policies (`auth.uid() = user_id`), enforces access control at database layer
4. **Storage + RLS** — S3-compatible file storage with path-based RLS (`bucket_id = 'workout-photos' AND foldername[1] = auth.uid()`), auto-incrementing upload IDs
5. **Edge Functions (TypeScript/Deno)** — Server-side image validation, auto-workout creation, business logic that client shouldn't bypass

**Key patterns:**
- Cmd.OfAsync for all side effects (never in Update function) — maintains pure MVU architecture
- JWT-based RLS enforcement — `auth.uid()` in policies, defense-in-depth security
- Loading states with AsyncState<'T> — track Idle | Loading | Success | Error per operation
- Local storage session persistence — Supabase SDK auto-persists, Elmish restores on init
- Edge Functions for server-side logic — input validation, cross-entity operations, heavy computation

**Build order dependencies:**
1. Database schema + RLS policies (foundation)
2. Auth integration (required for all subsequent features)
3. One-tap workout logging (core loop)
4. Storage + Edge Functions (depends on auth and workout table)
5. Views/Statistics (depends on workout data existing)
6. Admin features (depends on stable auth system)

### Critical Pitfalls

Research identified 15 pitfalls ranging from critical (security breaches) to minor (annoyance). Top 5 that could derail the project:

1. **RLS disabled or misconfigured** — 170+ Supabase apps exposed databases in 2025 (CVE-2025-48757), 83% involve RLS issues. Enable RLS on EVERY table from day one, create policies immediately, test with Security Advisor.
2. **Service role key exposed in client** — Service role bypasses RLS, grants full database access. Use anon key only in Fable client, service role ONLY in Edge Functions, add .env to .gitignore immediately.
3. **Manual schema changes via Studio UI** — Cannot replicate across environments. Use Supabase CLI migrations from day zero, version control ALL migrations, never use Studio for schema changes in production.
4. **Edge Functions written in F#** — Edge Functions run on Deno (TypeScript/JavaScript only), NOT .NET runtime. Write Edge Functions in TypeScript from start, or use custom Fable build pipeline to transpile.
5. **Photo upload without Storage RLS** — Users can view/delete others' photos, storage costs spiral. Implement Storage RLS before enabling uploads, validate file size/type client and server-side.

**Phase-specific warnings:**
- Phase 0 (Setup): Initialize migrations before creating any tables
- Phase 1 (Auth): Enable email verification, test Gmail SMTP with App Password
- Phase 2 (Schema): Use migrations only, normalize workout data (exercise reference table)
- Phase 3 (Upload): Storage RLS + progress feedback UI required
- Phase 4 (State): Watch for excessive re-renders, use Feliz.UseElmish for component state
- Phase 5 (Edge Functions): Validate all OCR output, store raw data for reprocessing

## Implications for Roadmap

Based on architecture dependencies and feature priorities, recommend 6-phase structure with clear validation gates.

### Phase 1: Foundation (Database + Auth)
**Rationale:** Backend must exist before frontend can interact. Auth provides user context for all RLS policies. These are foundational dependencies with zero overlap potential.
**Delivers:** Database schema with RLS enabled, email/password authentication, session persistence
**Addresses:** User authentication (table stakes), data security foundation
**Avoids:** RLS misconfiguration pitfall, service role key exposure
**Duration estimate:** 1 week
**Research flag:** Standard patterns, skip research-phase

### Phase 2: Core Loop (One-Tap Workout Logging)
**Rationale:** Primary value proposition, validates product hypothesis before investing in complex features. Requires only Auth + DB (no external dependencies).
**Delivers:** Manual workout logging, CRUD operations, today's workout detection and toggle
**Addresses:** Quick workout logging (table stakes), one-tap logging (differentiator)
**Avoids:** Scope creep into photo/AI features before validating core loop
**Duration estimate:** 1 week
**Research flag:** Standard CRUD patterns, skip research-phase

### Phase 3: Progress Tracking (Calendar + Stats)
**Rationale:** Requires existing workout data to display. Pure read operations, no complex writes. Provides immediate value feedback loop.
**Delivers:** Workout history calendar, monthly counts, personal streaks, edit/delete logs
**Addresses:** Basic progress tracking (table stakes), calendar view (differentiator)
**Avoids:** Building complex analytics before understanding user needs
**Duration estimate:** 1 week
**Research flag:** Standard data aggregation, skip research-phase

### Phase 4: Team Features (Privacy-First Visibility)
**Rationale:** Once individual value proven, layer on team motivation. Privacy is a selling point, must get right from day one.
**Delivers:** Team roster, aggregated monthly counts (no individual workout details), privacy controls
**Addresses:** Small team optimization (differentiator), privacy-first visibility (differentiator)
**Avoids:** Social feed anti-pattern, surveillance feeling
**Duration estimate:** 1 week
**Research flag:** Privacy architecture needs validation — RECOMMEND /gsd:research-phase for RLS policy design

### Phase 5: Offline Mode + PWA
**Rationale:** Expected by users (gym connectivity unreliable), complex sync logic, build after core features stable.
**Delivers:** Service worker, IndexedDB local storage, sync algorithm, PWA manifest, offline detection
**Addresses:** Offline functionality (table stakes), minimal app footprint (differentiator)
**Avoids:** Offline mode complexity derailing core feature development
**Duration estimate:** 1-2 weeks
**Research flag:** Sync conflict resolution needs research — RECOMMEND /gsd:research-phase for IndexedDB + Supabase sync patterns

### Phase 6: Production Prep (Performance + Security Audit)
**Rationale:** Address bundle size, security audit, migration testing before launch.
**Delivers:** Code splitting, bundle optimization, Security Advisor audit, CI/CD pipeline with migration tests
**Addresses:** Minimal app footprint (differentiator), clean UI (table stakes)
**Avoids:** Large bundle size pitfall, RLS misconfiguration pitfall
**Duration estimate:** 1 week
**Research flag:** Performance optimization patterns — RECOMMEND /gsd:research-phase for Fable bundle optimization techniques

### Post-MVP: Photo Upload + OCR (Defer to v2)
**Rationale:** Highest differentiator but highest complexity. Validate core hypothesis with manual logging first. Requires stable storage, Edge Functions, ML integration.
**Delivers:** Photo upload with progress UI, Storage RLS, Edge Function for image validation, OCR integration (future), auto-workout creation
**Addresses:** Photo-based auto-record (differentiator, deferred)
**Avoids:** Over-engineering v1 with unproven ML accuracy, OCR validation pitfall
**Duration estimate:** 2-3 weeks when prioritized
**Research flag:** ML/OCR integration needs deep research — RECOMMEND /gsd:research-phase for Vision API comparison, accuracy benchmarks

### Phase Ordering Rationale

- **Dependencies drive order:** Database → Auth → Core Features → Team → Offline. Each phase depends on previous phases being stable.
- **Value delivery increments:** Phase 2 (core loop) is minimum viable product for single user. Phase 3 adds progress tracking. Phase 4 adds team differentiation. Phase 5 adds competitive parity (offline). Phase 6 ensures production-ready.
- **Risk mitigation:** Address RLS security in Phase 1 before any data exists. Validate core hypothesis (manual logging) before investing in complex OCR/ML (deferred to v2).
- **Parallelization opportunity:** After Phase 2, Phases 3 and 4 can be built concurrently by different developers (read-only views vs team features).
- **Testing sequence:** Backend (SQL) → Auth (manual) → Core loop (E2E) → Team features (multi-user) → Offline (sync conflict scenarios) → Performance (Lighthouse audits)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Team Features):** Privacy-first RLS policy design for aggregated stats view. Need research on PostgreSQL views + RLS interaction, team roster permission models.
- **Phase 5 (Offline Mode):** IndexedDB + Supabase sync conflict resolution patterns. Sparse documentation on Elmish + service worker integration.
- **Phase 6 (Performance):** Fable bundle optimization techniques ([<Erase>] attributes, code splitting, tree-shaking). Need research on vite-plugin-fable optimization strategies.
- **Post-MVP (Photo OCR):** Vision API comparison (Google Cloud Vision, AWS Rekognition, Azure Computer Vision), OCR accuracy benchmarks for handwritten workout notes, Edge Function ML pipeline design.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Database schema + RLS patterns well-documented in Supabase docs. Email/password auth is baseline Supabase feature.
- **Phase 2 (Core Loop):** CRUD operations on Supabase follow standard PostgREST patterns. Elmish state management well-documented.
- **Phase 3 (Progress Tracking):** Data aggregation and calendar UI are standard web dev patterns. No novel architecture needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified from official NuGet/npm registries and GitHub releases. Fable 4.28.0 + Feliz 2.9.0 + Vite 6.x + Supabase are production-ready 2026 standards. |
| Features | HIGH | Table stakes and anti-features validated across 10+ fitness app comparison articles. Differentiators (privacy-first, photo-based) aligned with 2026 market gaps. |
| Architecture | HIGH | Elmish MVU + Supabase RLS patterns well-documented. Build order dependencies verified through Supabase docs and Fable community examples. |
| Pitfalls | HIGH | Critical pitfalls (RLS misconfiguration, service role exposure) verified through recent security incidents (CVE-2025-48757, Moltbook breach). |

**Overall confidence:** HIGH

### Gaps to Address

While research confidence is high, several areas need validation during implementation:

- **Photo OCR accuracy:** Research shows 70-90% accuracy for printed text, 40-70% for handwriting. Real-world accuracy with workout board photos unknown. Address in v2 with user testing and validation UI.
- **Offline sync conflict resolution:** Elmish + service worker + IndexedDB integration has limited examples. Need Phase 5 research to design conflict resolution strategy (last-write-wins vs manual resolution).
- **Team stats RLS design:** Aggregated views with partial privacy (show counts, hide details) requires careful RLS policy design. Validate in Phase 4 research that PostgreSQL views can enforce team-visible aggregation while protecting individual row access.
- **Fable bundle size optimization:** vite-plugin-fable is relatively new. Best practices for minimizing bundle size ([<Erase>] usage, tree-shaking, code splitting) need Phase 6 research and Lighthouse benchmarking.
- **Gmail SMTP reliability:** Gmail relay requires App Password + 2FA + SPF/DKIM/DMARC. Daily sending limits unknown for small team scale. May need fallback to Resend/SendGrid if verification emails fail at scale.

## Sources

### Primary (HIGH confidence)
All research files (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md) include comprehensive source citations. Aggregated here for reference:

**Technology stack:**
- Fable GitHub Releases, Feliz NuGet packages (official version verification)
- Supabase official documentation (Auth, Storage, Edge Functions, RLS)
- Vite documentation, vite-plugin-fable GitHub

**Feature landscape:**
- 12+ fitness app comparison articles (2026 market analysis)
- Privacy research from USENIX Security Conference, Consumer Reports
- Simple Workout Log, Alpha Progression (competitor analysis)

**Architecture patterns:**
- Elmish official documentation, Fable blog (MVU architecture)
- Supabase RLS documentation, multi-tenant application guides
- Edge Functions examples from official Supabase GitHub

**Domain pitfalls:**
- CVE-2025-48757 (170+ exposed Lovable apps), Moltbook breach analysis
- Supabase Security Advisor documentation
- Fable Promise interop GitHub issues, performance analysis

### Secondary (MEDIUM confidence)
- Community blog posts on Supabase best practices
- Stack Overflow discussions on Fable/Elmish state management
- Fitness app UX design principles from Stormotion, TopFlight Apps

### Tertiary (LOW confidence, needs validation)
- OCR accuracy estimates (need real-world testing with workout photos)
- Bundle size optimization claims (need benchmarking)
- Offline-first sync patterns (need implementation validation)

---
*Research completed: 2026-02-10*
*Ready for roadmap: yes*
