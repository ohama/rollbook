# Technology Stack

**Project:** Rollbook - Workout Tracking Web App
**Researched:** 2025-02-10
**Confidence:** HIGH

## Executive Summary

Standard 2025 stack for a Fable (F#/Elmish) + Supabase workout tracking web app combines functional frontend with serverless backend. Core: Fable 4.28.0 + Feliz 2.9.0 + Vite 6.x for frontend; Supabase (Auth, PostgreSQL, Storage, Edge Functions with Deno 2.1) for backend. Deploy static frontend to Cloudflare Pages; Edge Functions auto-deploy globally. Use JavaScript Supabase client with Fable bindings (NOT F# client - incompatible with browser runtime).

## Recommended Stack

### Frontend Core

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| Fable | 4.28.0 (stable) | F# to JavaScript compiler | Stable production version. Fable 5.0-alpha exists but alpha status too risky for production. 4.28.0 is actively maintained with .NET 8/9/10 support. |
| Feliz | 2.9.0 (stable) | React bindings for F# | Latest stable version. Feliz 3.0.0-rc.12 available but RC status means breaking changes possible. 2.9.0 provides type-safe React API optimized for happiness with zero bundle size overhead. |
| Feliz.UseElmish | 2.5.0 | Elmish integration hook | Enables seamless Elmish state machines within React components via React.useElmish hook for component-level MVU architecture. |
| Feliz.Router | 4.0.0 | Client-side routing | Type-safe routing for Fable 4+ and Feliz 2.x. Supports hash-based and path-based routing with URL pattern matching and query parameters. Provides Cmd.navigate for Elmish integration. |
| React | 18.x | UI rendering | Via Feliz bindings. React 18 provides concurrent features and automatic batching. Fable/Elmish ecosystem is React-first. |
| .NET SDK | 8.0 or 9.0 | F# compilation | Fable 4.28.0 confirmed compatible with .NET 8, 9, and 10. Use .NET 8 LTS for stability or .NET 9 for latest features. |

**Confidence:** HIGH - All versions verified from official NuGet/npm registries and GitHub releases.

### Build Tools & Bundler

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| Vite | 6.x (latest) | Frontend bundler & dev server | Modern, fast bundler with HMR. Superior to Webpack for Fable projects. 2025 standard for SPAs. |
| vite-plugin-fable | latest | Fable integration for Vite | Enables lazy transpilation of .fs files via Vite HMR. Handles .fs imports transparently. No need for separate Fable CLI watch process. Runs Fable behind the scenes automatically. |
| Node.js | 18+ LTS | JavaScript runtime | Minimum Node 18 required by Workbox v7 (used by vite-plugin-pwa). Use Node 20 LTS for production. |

**Vite Configuration:**
```javascript
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  clearScreen: false,
  server: {
    watch: {
      ignored: ["**/*.fs"] // Fable handles .fs files
    }
  }
})
```

**Confidence:** HIGH - Vite is the 2025 standard for modern web apps. vite-plugin-fable is actively maintained.

### Backend Services (Supabase)

| Service | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| Supabase | SaaS (latest) | Backend-as-a-Service | Provides Auth, PostgreSQL, Storage, Edge Functions, Realtime. Handles infrastructure, scaling, backups. Perfect for small teams (~20 users). |
| Supabase Auth | v2 | Authentication | Email/password, magic links, OAuth. Integrates with Gmail SMTP for auth emails (requires App Password, 2FA enabled). Daily sending limits apply - use Resend/SendGrid if high volume needed. |
| PostgreSQL | 15.x (Supabase managed) | Primary database | Managed by Supabase. Row Level Security (RLS) for authorization. Real-time subscriptions via Supabase Realtime. |
| Supabase Storage | latest | Image/file storage | Photo uploads for workout logs. Auto-incrementing upload IDs. Built-in image transformations for optimization. Set max upload size per bucket. |
| Supabase Edge Functions | Deno 2.1 | Serverless functions | TypeScript-first, runs on Deno runtime. Globally distributed. Deploy via CLI, Dashboard, or GitHub Actions. Auto-increments version numbers. |
| Supabase Realtime | latest | WebSocket subscriptions | Broadcast, Presence, Postgres Changes over WebSockets. For live workout updates (if needed for team features). |

**Confidence:** HIGH - Supabase is production-ready with millions of apps in 2025. Gmail SMTP setup well-documented.

### Supabase Client Library (CRITICAL)

| Library | Version | Purpose | Why NOT alternatives |
|---------|---------|---------|---------------------|
| @supabase/supabase-js | 2.x (latest) | Official JS client | **Use this, NOT supabase-fsharp.** The F# client (supabase-community/supabase-fsharp) is .NET-only, won't work in browser. Fable compiles to JavaScript, needs JS client. Create F# bindings for @supabase/supabase-js using Fable's `importAll` or manual binding. |

**Implementation approach:**
```fsharp
// Option 1: Manual bindings (recommended for type safety)
[<Import("createClient", from="@supabase/supabase-js")>]
let createClient: string -> string -> SupabaseClient = jsNative

// Option 2: Dynamic interop (faster to start)
open Fable.Core.JsInterop

let supabase =
    let createClient = importDefault "@supabase/supabase-js"
    createClient?createClient(supabaseUrl, supabaseKey)
```

**Confidence:** HIGH - This is a common pitfall. Verified that supabase-fsharp targets .NET, not Fable/browser.

### Styling & UI

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| Tailwind CSS | 4.0.0 | Utility-first CSS | Major update in 2025. Simplified setup: zero config, single CSS line `@import "tailwindcss";`. Uses CSS for config instead of JavaScript. Requires @tailwindcss/postcss plugin. |
| PostCSS | latest | CSS preprocessor | Required for Tailwind 4.0. Install @tailwindcss/postcss and add to postcss.config.mjs. |

**Installation:**
```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

**PostCSS config:**
```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
}
```

**Confidence:** HIGH - Tailwind v4.0 is the 2025 standard with excellent Vite integration.

### PWA Support

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| vite-plugin-pwa | 0.17+ | PWA generation | Zero-config PWA plugin for Vite. Uses Workbox v7 for service worker. Supports auto-update, offline mode, install prompts. Mobile-first requirement satisfied. |
| Workbox | 7.x | Service worker | Via vite-plugin-pwa. Requires Node 18+. Provides generateSW and injectManifest strategies for precaching and runtime caching. |

**Basic configuration:**
```javascript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Rollbook',
        short_name: 'Rollbook',
        theme_color: '#ffffff',
        icons: [/* ... */]
      }
    })
  ]
})
```

**Confidence:** HIGH - vite-plugin-pwa is the standard solution for Vite-based PWAs in 2025.

### Mobile Camera Capture

| API | Browser Support | Purpose | Rationale |
|-----|----------------|---------|-----------|
| HTML5 `<input capture>` | iOS 11+, Android | Simple camera access | Baseline approach: `<input type="file" accept="image/*" capture="environment">`. Works universally. On mobile shows camera option; on desktop shows file picker. |
| getUserMedia() | iOS 11+, Android | Advanced camera control | For richer in-app camera experience with preview. Use `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }})`, attach to `<video>`, capture frame to `<canvas>`, convert to Blob via `canvas.toBlob()`. Requires HTTPS. |
| ImageCapture API | Limited (Chrome, Edge) | High-res photos | For future enhancement if broader support comes. Not baseline in 2025. |

**Recommended approach:**
Start with `<input capture>` for MVP. Add getUserMedia + canvas for Phase 2 if richer UX needed. Handle HEIC/EXIF metadata. Resize images client-side before upload to reduce bandwidth.

**Confidence:** MEDIUM - Input capture is well-supported. getUserMedia on iOS Safari improving but test thoroughly.

### Static Hosting

| Platform | Free Tier | Purpose | Why Choose |
|----------|-----------|---------|------------|
| Cloudflare Pages (RECOMMENDED) | Unlimited bandwidth, unlimited requests | Static site hosting | **Best choice for 2025.** 300+ global edge locations, ultra-low latency, zero cost for static hosting. Unlimited bandwidth vs Netlify (100GB) and Vercel (100GB). Integrates with Cloudflare Workers if serverless functions needed (unlikely since using Supabase Edge Functions). Superior global performance. |
| Netlify | 100GB bandwidth, 300 build minutes | Alternative | Good DX, strong JAMstack ecosystem, deploy previews. Choose if you need advanced Netlify-specific features. |
| Vercel | 100GB bandwidth | Alternative (not recommended) | Best for Next.js. No advantage for non-Next.js SPA. Cloudflare Pages superior for pure static. |

**Deployment:**
- GitHub integration: Auto-deploy on push to main
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

**Confidence:** HIGH - Cloudflare Pages is the clear winner for static hosting in 2025 for non-Next.js apps.

### Development Tools

| Tool | Version | Purpose | Rationale |
|------|---------|---------|-----------|
| Supabase CLI | latest | Local development | Run Supabase locally with `supabase start`. Test Edge Functions with `supabase functions serve`. Deploy with `supabase functions deploy`. |
| Deno | optional | Edge Function tooling | Not required for running functions (Supabase CLI uses Edge Runtime), but installing Deno enables LSP for autocompletion, type checking, and tools like `deno fmt`, `deno lint`, `deno test`. |

**Confidence:** HIGH - Standard Supabase development workflow.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Compiler | Fable 4.28.0 | Fable 5.0-alpha | Alpha status too risky. Breaking changes likely. Use stable 4.28.0. |
| React bindings | Feliz 2.9.0 | Feliz 3.0-rc | Release candidate may have breaking changes. Wait for 3.0 stable. |
| Bundler | Vite | Webpack | Webpack is legacy. Slower dev server, more config. Vite is 2025 standard. |
| Backend | Supabase | Firebase | Firebase F# support poor. Supabase has better PostgreSQL, RLS, SQL queries. Open source alternative (self-host if needed). |
| Backend | Supabase | AWS Amplify | Amplify complex, requires more devops. Supabase simpler for small teams. |
| Backend | Supabase | Custom .NET API | Over-engineering for ~20 users. Supabase handles auth, storage, database, hosting with zero ops. F# backend adds operational burden. |
| Supabase client | @supabase/supabase-js | supabase-fsharp | supabase-fsharp is .NET-only, incompatible with browser. Fable needs JS client. |
| Styling | Tailwind CSS | CSS Modules | CSS Modules work but Tailwind faster for prototyping, better mobile-first utilities. |
| Styling | Tailwind CSS | Feliz.Bulma | Bulma less flexible, heavier. Tailwind better for custom mobile-first UX. |
| Hosting | Cloudflare Pages | Netlify/Vercel | Netlify/Vercel have bandwidth limits (100GB). Cloudflare unlimited and faster globally. |
| PWA plugin | vite-plugin-pwa | Manual service worker | Manual service worker error-prone. vite-plugin-pwa provides zero-config setup with best practices. |

## What NOT to Use

| Technology | Why Avoid |
|------------|-----------|
| Fable.Remoting | No backend to remote to. Using Supabase (managed service), not custom F# server. Fable.Remoting is for F# client ↔ F# server RPC. Not applicable here. |
| SignalR | Using Supabase Realtime instead. SignalR requires .NET server. No .NET server in this stack. |
| Azure Functions | Using Supabase Edge Functions instead. No need for Azure when Supabase provides globally distributed serverless functions. |
| Create React App (CRA) | Deprecated. Use Vite instead. |
| Parcel | Less mature than Vite for Fable projects. Vite has better plugin ecosystem. |
| Express.js backend | Over-engineering. Supabase Edge Functions handle API needs. No need for Node.js server. |
| MongoDB | Using PostgreSQL (Supabase managed) instead. Better for structured workout data with relationships. RLS for security. |

## Installation

### Frontend Setup

```bash
# Create project directory
mkdir rollbook && cd rollbook

# Initialize npm
npm init -y

# Install Fable & Feliz
dotnet new tool-manifest
dotnet tool install fable
dotnet add package Feliz
dotnet add package Feliz.UseElmish
dotnet add package Feliz.Router

# Install Vite & plugins
npm install -D vite vite-plugin-fable
npm install -D @vitejs/plugin-react

# Install Tailwind CSS
npm install tailwindcss @tailwindcss/postcss postcss

# Install PWA support
npm install -D vite-plugin-pwa

# Install Supabase client
npm install @supabase/supabase-js
```

### Backend Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase project
supabase init

# Start local Supabase (optional, for development)
supabase start

# Link to cloud project
supabase link --project-ref <your-project-ref>
```

### Edge Functions Setup

```bash
# Create Edge Function
supabase functions new <function-name>

# Serve locally
supabase functions serve

# Deploy
supabase functions deploy <function-name>

# Optional: Install Deno for LSP
curl -fsSL https://deno.land/install.sh | sh
```

## Configuration Files Required

1. **vite.config.js** - Vite + plugins configuration
2. **postcss.config.mjs** - Tailwind CSS PostCSS setup
3. **tailwind.config.js** - Tailwind customization (optional with v4)
4. **.env** - Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
5. **package.json** - Scripts: dev, build, preview
6. **supabase/config.toml** - Supabase project config

## Environment Variables

```bash
# .env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Production (Cloudflare Pages)
# Set via dashboard: Settings > Environment Variables
```

## Critical Decisions Summary

1. **Use Fable 4.28.0, NOT 5.0-alpha** - Stability over bleeding edge
2. **Use Feliz 2.9.0, NOT 3.0-rc** - Avoid release candidate breaking changes
3. **Use @supabase/supabase-js, NOT supabase-fsharp** - F# client won't run in browser
4. **Use Vite, NOT Webpack** - Modern standard, better DX
5. **Use Cloudflare Pages, NOT Netlify/Vercel** - Unlimited bandwidth, best global performance
6. **Use Supabase Edge Functions, NOT custom .NET server** - Zero ops for small team
7. **Use Tailwind CSS 4.0** - Mobile-first utilities, zero config
8. **Use vite-plugin-pwa for PWA** - Zero config, best practices built-in
9. **Start with `<input capture>` for camera** - Baseline, universal support
10. **Gmail SMTP requires App Password + 2FA** - Use Resend/SendGrid if high volume needed

## Version Compatibility Matrix

| Component | Requires | Compatible With |
|-----------|----------|-----------------|
| Fable 4.28.0 | .NET 8/9/10 | Node.js 18+ |
| Feliz 2.9.0 | Fable 4.x | React 18.x |
| Feliz.Router 4.0.0 | Fable 4.x, Feliz 2.x | - |
| vite-plugin-pwa 0.17+ | Vite 5+, Node 18+ | Workbox 7.x |
| Tailwind CSS 4.0.0 | PostCSS | Vite 5+ |
| Supabase Edge Functions | Deno 2.1 | TypeScript 5.x |

## Sources

### Fable & F# Ecosystem
- [Fable GitHub Releases](https://github.com/fable-compiler/Fable/releases)
- [Feliz 2.9.0 on NuGet](https://www.nuget.org/packages/Feliz/)
- [Feliz 3.0.0-rc.12 on NuGet](https://www.nuget.org/packages/Feliz/3.0.0-rc.12)
- [Feliz.Router GitHub](https://github.com/Zaid-Ajaj/Feliz.Router)
- [Fable .NET Compatibility](https://fable.io/docs/dotnet/compatibility.html)
- [F# 9 Release Notes](https://learn.microsoft.com/en-us/dotnet/fsharp/whats-new/fsharp-9)

### Build Tools
- [Vite + Fable Documentation](https://fable.io/docs/javascript/build-and-run.html)
- [vite-plugin-fable GitHub](https://github.com/mrtz-j/fable-vite)
- [vite-plugin-fable Getting Started](https://fable.io/vite-plugin-fable/getting-started.html)

### Supabase
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Supabase Edge Functions with Deno 2.1](https://supabase.com/blog/supabase-edge-functions-deploy-dashboard-deno-2-1)
- [Supabase Auth SMTP Setup](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Gmail SMTP Troubleshooting](https://supabase.com/docs/guides/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y)
- [Supabase Storage Best Practices](https://supabase.com/docs/guides/storage/uploads/standard-uploads)
- [Supabase Realtime Protocol](https://supabase.com/docs/guides/realtime/protocol)
- [supabase-fsharp GitHub](https://github.com/supabase-community/supabase-fsharp)

### PWA & Mobile
- [vite-plugin-pwa GitHub](https://github.com/vite-pwa/vite-plugin-pwa)
- [Vite PWA Workbox Guide](https://vite-pwa-org.netlify.app/workbox/)
- [HTML5 Camera Capture - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos)
- [HTML capture attribute - MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)

### Styling & UI
- [Tailwind CSS v4.0 Documentation](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS PostCSS Installation](https://tailwindcss.com/docs/installation/using-postcss)

### Hosting
- [Cloudflare Pages vs Netlify vs Vercel 2025 Comparison](https://www.ai-infra-link.com/vercel-vs-netlify-vs-cloudflare-pages-2025-comparison-for-developers/)
- [Cloudflare Pages Performance Analysis](https://dev.to/dataformathub/cloudflare-vs-vercel-vs-netlify-the-truth-about-edge-performance-2026-50h0)

### Fitness App Research
- [Fitness App Development 2025](https://topflightapps.com/ideas/how-to-build-a-fitness-tracker-app-like-peloton/)
- [One-tap Workout Logging UX Patterns](https://stormotion.io/blog/fitness-app-ux/)
- [Simple Workout App Guide 2025](https://setgraph.app/ai-blog/simple-workout-app-guide)

---

**Last Updated:** 2025-02-10
**Confidence Level:** HIGH (all versions verified from official sources)
**Next Review:** Before Phase 1 implementation (verify no breaking releases)
