# Architecture Patterns

**Project:** Rollbook (Workout Tracking Web App)
**Stack:** Fable (F#/Elmish/Feliz) + Supabase
**Researched:** 2026-02-10

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (SPA)                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Fable/Elmish (F#) - Client Application               │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Model     │  │   Update     │  │     View     │  │  │
│  │  │ (AppState)  │←─│  (Messages)  │──│   (Feliz)    │  │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘  │  │
│  │         │                │                  ▲          │  │
│  │         │                │                  │          │  │
│  │         ▼                ▼                  │          │  │
│  │  ┌─────────────────────────────────────────┘          │  │
│  │  │    Supabase Client (JS Interop)                    │  │
│  │  │  - Auth.signIn/signUp/signOut                      │  │
│  │  │  - from('workouts').select/insert/update           │  │
│  │  │  - storage.upload/download                         │  │
│  │  │  - functions.invoke('process-image')               │  │
│  │  └────────────────────────────────────────────────────┘  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (JWT in headers)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Platform                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  GoTrue Auth Service                                  │  │
│  │  - Email/password authentication                      │  │
│  │  - Email verification                                 │  │
│  │  - Password reset flows                               │  │
│  │  - JWT token issuance (auth.uid() in claims)         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PostgREST API (Auto-generated)                       │  │
│  │  - /rest/v1/workouts (GET/POST/PATCH/DELETE)          │  │
│  │  - /rest/v1/profiles (GET/PATCH)                      │  │
│  │  - /rest/v1/workout_stats (GET, view)                 │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database (with RLS)                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  profiles   │  │  workouts    │  │ workout_stats│  │  │
│  │  │  (users)    │  │  (records)   │  │   (view)     │  │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘  │  │
│  │  RLS Policies:                                         │  │
│  │  • profiles: user_id = auth.uid()                     │  │
│  │  • workouts: user_id = auth.uid()                     │  │
│  │  • workout_stats: aggregated, team-visible            │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Storage (S3-compatible)                              │  │
│  │  Buckets:                                             │  │
│  │  • workout-photos/ (private, RLS on paths)            │  │
│  │    Structure: {user_id}/{date}/{filename}             │  │
│  │  RLS: SELECT/INSERT only WHERE bucket_id =            │  │
│  │       'workout-photos' AND (storage.foldername(name)   │  │
│  │       [1] = auth.uid()::text)                          │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Edge Functions (Deno runtime)                        │  │
│  │  • process-image (invoked after photo upload)         │  │
│  │    1. Validates image (format, size)                  │  │
│  │    2. Extracts metadata (width, height)               │  │
│  │    3. Creates workout record if not exists            │  │
│  │    4. Returns { workout_id, status }                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | State Management |
|-----------|---------------|-------------------|------------------|
| **Elmish Model** | Immutable application state (user, workouts, UI state) | Update function only | Single source of truth |
| **Elmish Update** | Pure function processing Messages → new Model + Commands | Model, View (via messages), Supabase Client (via Cmd.OfAsync) | Stateless |
| **Feliz View** | Rendering UI from Model, dispatching Messages | Update (via dispatch), Model (read-only) | Stateless |
| **Supabase Client Wrapper** | F# bindings to Supabase JS SDK, Promise→Async conversion | Elmish Update (via Cmd), Supabase Platform (HTTPS) | Connection state only |
| **Supabase Auth** | User authentication, JWT issuance, email verification | Client (via SDK), Database (via auth schema) | Session state |
| **PostgREST API** | Auto-generated REST endpoints from DB schema | Client (HTTPS), Database (Postgres) | Stateless |
| **PostgreSQL + RLS** | Data persistence, row-level security enforcement | PostgREST, Storage (via triggers), Auth (via JWT claims) | Persistent |
| **Storage Service** | File upload/download, path-based RLS | Client (via SDK), Edge Functions, Database (metadata) | Persistent |
| **Edge Functions** | Server-side image processing, business logic | Client (invoke), Storage (read/write), Database (insert) | Stateless |

## Data Flow

### 1. One-Tap Workout Logging (Primary Flow)

```
User clicks "오늘 운동했다"
  │
  ▼
View dispatches WorkoutToggled message
  │
  ▼
Update function processes message
  │
  ├─▶ Check Model: does today's workout exist?
  │   │
  │   ├─ YES → Cmd.OfAsync.perform (delete workout)
  │   │         │
  │   │         ▼
  │   │    Supabase.from("workouts").delete() with RLS check
  │   │         │
  │   │         ▼
  │   │    Database: DELETE FROM workouts WHERE user_id = auth.uid() AND date = today
  │   │         │
  │   │         ▼
  │   │    Update receives WorkoutDeleted → Model updated
  │   │
  │   └─ NO  → Cmd.OfAsync.perform (insert workout)
  │             │
  │             ▼
  │        Supabase.from("workouts").insert({ date: today }) with RLS check
  │             │
  │             ▼
  │        Database: INSERT INTO workouts (user_id, date) VALUES (auth.uid(), today)
  │             │
  │             ▼
  │        Update receives WorkoutAdded → Model updated
  │
  ▼
View re-renders with new state (toggle button reflects change)
```

**Critical Pattern:** Optimistic updates NOT recommended here due to potential RLS rejection. Use loading state while async operation completes.

### 2. Photo Upload → Auto Workout Record (Secondary Flow)

```
User selects photo from gallery/camera
  │
  ▼
View dispatches PhotoSelected message with File object
  │
  ▼
Update function: Model.uploadState ← Uploading (show progress)
  │
  ▼
Cmd.OfAsync.perform: Upload to Storage
  │
  ├─▶ Supabase.storage.from("workout-photos")
  │      .upload("{user_id}/{date}/{uuid}.jpg", file)
  │   │
  │   ├─ RLS checks: user owns this path ({user_id} = auth.uid())
  │   │
  │   ▼
  │   Storage Service: Writes file to S3-compatible storage
  │   │
  │   ▼
  │   Returns { path, fullPath }
  │
  ▼
Update receives PhotoUploaded(path)
  │
  ▼
Cmd.OfAsync.perform: Invoke Edge Function
  │
  ├─▶ Supabase.functions.invoke("process-image", { photo_path: path })
  │   │
  │   ▼
  │   Edge Function Runtime (Deno)
  │   │
  │   ├─ Download image from Storage (verify ownership via auth header)
  │   ├─ Validate: format (jpg/png), size (<5MB), dimensions
  │   ├─ Extract metadata
  │   │
  │   ├─ Database check: SELECT FROM workouts WHERE user_id = auth.uid() AND date = today
  │   │   │
  │   │   ├─ EXISTS → Update with photo_path
  │   │   └─ NOT EXISTS → INSERT workout with photo_path
  │   │
  │   ▼
  │   Returns { workout_id, created: bool }
  │
  ▼
Update receives ImageProcessed(workout_id)
  │
  ▼
Model.uploadState ← Success, Model.workouts updated
  │
  ▼
View shows success message, calendar updates
```

**Critical Pattern:** Photo upload triggers async chain: Upload → Edge Function → DB Insert. Each step has failure points requiring error handling in Model.

### 3. Authentication Flow

```
User enters email/password, clicks "가입"
  │
  ▼
View dispatches SignUpRequested(email, password)
  │
  ▼
Update: Cmd.OfAsync.perform Supabase.auth.signUp
  │
  ▼
Supabase Auth Service (GoTrue)
  │
  ├─ Validate email format, password strength
  ├─ Hash password (bcrypt)
  ├─ INSERT INTO auth.users
  ├─ Send verification email (via configured SMTP)
  ├─ Generate JWT with { sub: user_id, role: "authenticated" }
  │
  ▼
Returns { user, session } OR { error }
  │
  ▼
Update receives SignUpCompleted(result)
  │
  ├─ Success → Model.user ← Some user, store session in localStorage
  │             Cmd.navigate to /verify-email
  │
  └─ Error → Model.authError ← Some error, View shows error message
  │
  ▼
View: Shows "이메일 인증 필요" screen

──────────────────────────────────────────────

User clicks verification link in email
  │
  ▼
Browser redirects to /auth/verify?token=xxx
  │
  ▼
Supabase Auth: Validates token, marks email_confirmed = true
  │
  ▼
Redirects to app with session
  │
  ▼
Elmish Update receives SessionRestored(session)
  │
  ▼
Model.user ← verified user, Cmd.navigate to /dashboard
```

**Critical Pattern:** Auth state persisted in localStorage by Supabase SDK, Elmish Model syncs on init and auth events.

### 4. Team Statistics View (Read-Only Aggregation)

```
User navigates to /team
  │
  ▼
View dispatches LoadTeamStats message
  │
  ▼
Update: Cmd.OfAsync.perform load team stats
  │
  ▼
Supabase.from("workout_stats").select("*")
  │
  ▼
PostgREST queries workout_stats view
  │
  ▼
PostgreSQL executes view query:
  SELECT user_id, month, COUNT(*) as count
  FROM workouts
  GROUP BY user_id, month
  (No RLS on view = team-visible)
  │
  ▼
Returns aggregated data (no individual dates/photos)
  │
  ▼
Update receives TeamStatsLoaded(stats)
  │
  ▼
Model.teamStats ← stats
  │
  ▼
View renders table: 회원별 월별 운동 횟수
```

**Critical Pattern:** Privacy preserved via aggregation view. Individual workout rows protected by RLS, but aggregated counts are team-visible.

## Patterns to Follow

### Pattern 1: Elmish Command Pattern for Async Operations

**What:** All side effects (API calls, storage) go through Cmd.OfAsync, never directly in Update function.

**When:** Every Supabase operation (auth, database, storage, functions)

**Why:** Maintains pure Update function, enables testability, follows MVU architecture

**Example:**
```fsharp
type Msg =
    | WorkoutToggled
    | WorkoutAdded of Result<Workout, string>
    | WorkoutDeleted of Result<unit, string>

let update msg model =
    match msg with
    | WorkoutToggled ->
        let cmd =
            match model.todayWorkout with
            | Some workout ->
                Cmd.OfAsync.perform
                    deleteWorkout
                    workout.id
                    (Ok >> WorkoutDeleted)
            | None ->
                Cmd.OfAsync.perform
                    insertWorkout
                    { date = DateTime.Today }
                    (Ok >> WorkoutAdded)
        { model with isLoading = true }, cmd

    | WorkoutAdded (Ok workout) ->
        { model with
            todayWorkout = Some workout
            isLoading = false }, Cmd.none

    | WorkoutAdded (Error err) ->
        { model with
            error = Some err
            isLoading = false }, Cmd.none
```

### Pattern 2: JWT-Based RLS Enforcement

**What:** All data access controlled by PostgreSQL RLS policies using auth.uid() from JWT claims.

**When:** Every table that contains user-specific data

**Why:** Defense-in-depth security, client code cannot bypass, works even if client is compromised

**Example SQL:**
```sql
-- workouts table RLS policy
CREATE POLICY "Users can only access their own workouts"
ON workouts
FOR ALL
USING (auth.uid() = user_id);

-- Storage bucket RLS policy
CREATE POLICY "Users can only access their own photos"
ON storage.objects
FOR ALL
USING (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Client impact:** Supabase client automatically sends JWT in Authorization header. F# code just calls API, RLS handles security transparently.

### Pattern 3: Edge Functions for Server-Side Logic

**What:** Move complex business logic (image validation, auto-record creation) to Edge Functions instead of client.

**When:**
- Input validation that client shouldn't bypass
- Cross-entity operations (upload photo + create workout)
- Heavy computation (image processing)

**Why:**
- Client can be compromised, server logic cannot
- Reduces bundle size
- Leverages server-side resources

**Example (TypeScript in Edge Function):**
```typescript
// supabase/functions/process-image/index.ts
Deno.serve(async (req) => {
  const { photo_path } = await req.json()
  const jwt = req.headers.get('Authorization')

  // Download image from Storage (RLS applies via JWT)
  const { data: imageBlob } = await supabaseAdmin
    .storage
    .from('workout-photos')
    .download(photo_path)

  // Validate format and size
  if (imageBlob.size > 5 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'File too large' }), { status: 400 })
  }

  // Extract date from path: {user_id}/{YYYY-MM-DD}/{filename}
  const date = photo_path.split('/')[1]

  // Upsert workout record (RLS applies via JWT)
  const { data: workout } = await supabaseClient
    .from('workouts')
    .upsert({ date, photo_path }, { onConflict: 'user_id,date' })
    .select()
    .single()

  return new Response(JSON.stringify({ workout_id: workout.id }))
})
```

**Client integration:**
```fsharp
let processImage photoPath = async {
    let! response =
        supabase.Functions
            .Invoke("process-image", {| photo_path = photoPath |})
    return response.Data
}
```

### Pattern 4: Loading States with Error Boundaries

**What:** Model tracks async operation states (Idle | Loading | Success | Error) per operation.

**When:** Every async operation that affects UI (auth, CRUD, uploads)

**Why:** Prevents race conditions, provides UX feedback, handles partial failures

**Example:**
```fsharp
type AsyncState<'T> =
    | Idle
    | Loading
    | Success of 'T
    | Error of string

type Model = {
    user: User option
    authState: AsyncState<unit>
    todayWorkout: Workout option
    workoutState: AsyncState<unit>
    uploadState: AsyncState<string> // Success = photo URL
    teamStats: TeamStat list
    statsState: AsyncState<unit>
}

// In View
let renderWorkoutButton model dispatch =
    match model.workoutState with
    | Loading ->
        Html.button [
            prop.disabled true
            prop.text "기록 중..."
        ]
    | Error err ->
        Html.div [
            Html.button [
                prop.onClick (fun _ -> dispatch WorkoutToggled)
                prop.text "오늘 운동했다"
            ]
            Html.span [
                prop.className "error"
                prop.text err
            ]
        ]
    | _ ->
        Html.button [
            prop.onClick (fun _ -> dispatch WorkoutToggled)
            prop.text (if model.todayWorkout.IsSome then "✓ 완료" else "오늘 운동했다")
        ]
```

### Pattern 5: Local Storage Session Persistence

**What:** Supabase SDK automatically persists session to localStorage, Elmish restores on init.

**When:** App initialization, auth operations

**Why:** Maintains login state across page refreshes, reduces unnecessary re-authentication

**Example:**
```fsharp
let init () =
    let model = { /* initial state */ }
    let cmd = Cmd.OfAsync.perform restoreSession () SessionRestored
    model, cmd

let restoreSession () = async {
    let! session = supabase.Auth.GetSession() // Reads from localStorage
    return session
}

type Msg =
    | SessionRestored of Session option
    // ...

let update msg model =
    match msg with
    | SessionRestored (Some session) ->
        let cmd = Cmd.batch [
            Cmd.OfAsync.perform loadTodayWorkout session.User.Id WorkoutLoaded
            Cmd.navigate "/dashboard"
        ]
        { model with user = Some session.User }, cmd

    | SessionRestored None ->
        { model with user = None }, Cmd.navigate "/login"
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Sensitive Logic in Client

**What:** Client-side validation without server-side enforcement (e.g., checking file size only in browser)

**Why bad:** Client code is untrusted. Users can modify JS, bypass checks, send malicious data.

**Consequences:** Security vulnerabilities, data corruption, storage abuse

**Instead:**
- Always validate in Edge Functions or RLS policies
- Client validation is UX optimization only, not security
- Example: File size check in client for fast feedback, but Edge Function rejects >5MB

### Anti-Pattern 2: Direct Mutation of Model

**What:** Modifying Model object in place instead of returning new immutable Model

**Why bad:** Breaks Elmish architecture, prevents time-travel debugging, causes re-render bugs

**Consequences:** Unpredictable UI state, difficult debugging, violates F# immutability

**Instead:**
```fsharp
// BAD
let update msg model =
    model.isLoading <- true  // MUTATION!
    model, Cmd.none

// GOOD
let update msg model =
    { model with isLoading = true }, Cmd.none
```

### Anti-Pattern 3: Using Service Role Key in Client

**What:** Embedding `SUPABASE_SERVICE_ROLE_KEY` in client bundle for "convenience"

**Why bad:** Service role bypasses ALL RLS policies, grants full database access to anyone who inspects client code

**Consequences:** Complete data breach, unauthorized deletions, privacy violations

**Instead:**
- ONLY use `SUPABASE_ANON_KEY` in client (public, rate-limited, RLS-enforced)
- Use service role key ONLY in Edge Functions server-side
- Never commit service role key to git

### Anti-Pattern 4: N+1 Query Pattern in Views

**What:** Loading related data in separate queries for each item (e.g., fetching user profile for each workout in a loop)

**Why bad:** Causes excessive API calls, slow page loads, Supabase rate limit hits

**Consequences:** Poor performance, unnecessary costs, bad UX

**Instead:**
```fsharp
// BAD
let loadWorkouts () = async {
    let! workouts = supabase.From("workouts").Select("*").Execute()
    // N+1: Load user for each workout
    let! workoutsWithUsers =
        workouts
        |> Array.map (fun w -> async {
            let! user = supabase.From("profiles").Select("*").Eq("id", w.user_id).Single()
            return w, user
        })
        |> Async.Parallel
    return workoutsWithUsers
}

// GOOD
let loadWorkouts () = async {
    // Single query with JOIN
    let! workouts =
        supabase
            .From("workouts")
            .Select("*, profiles!inner(*)")
            .Execute()
    return workouts
}
```

### Anti-Pattern 5: Mixing Promises and Async

**What:** Not properly converting JS Promise to F# Async, leading to unhandled promise rejections

**Why bad:** F# async workflows and JS Promises have different semantics. Mixing causes runtime errors.

**Consequences:** Silent failures, uncaught exceptions, broken error handling

**Instead:**
```fsharp
// BAD
let loadWorkouts () =
    supabase.From("workouts").Select("*").Execute() // Returns Promise<T>
    // F# expects Async<T>

// GOOD
let loadWorkouts () = async {
    let! result =
        supabase.From("workouts").Select("*").Execute()
        |> Async.AwaitPromise // Convert Promise to Async
    return result
}
```

## Build Order and Dependencies

Based on component dependencies and data flow, recommended build order:

### Phase 1: Foundation (No dependencies)
**Build first:** Database schema + RLS policies
- Create tables: `profiles`, `workouts`
- Set up RLS policies
- Test with SQL client

**Rationale:** Backend must exist before frontend can interact. RLS policies are security-critical.

**Validation:** Insert/select data via Supabase Dashboard, verify RLS blocks unauthorized access

---

### Phase 2: Authentication (Depends on: Database)
**Build second:** Auth integration in Elmish app
- Supabase client initialization
- F# bindings for auth SDK
- Sign up, login, logout flows
- Session persistence

**Rationale:** All subsequent features require authenticated user context (auth.uid() in RLS)

**Validation:** Manual test signup, verify email, login, logout. Check JWT in localStorage.

---

### Phase 3: One-Tap Workout (Depends on: Auth)
**Build third:** Core feature - workout toggle
- Workout CRUD operations
- Elmish Model/Update/View for workout state
- Today's workout detection

**Rationale:** Primary value proposition, no external dependencies beyond auth + DB

**Validation:** Toggle workout for today, verify DB insert/delete, check RLS enforcement

---

### Phase 4: Storage + Edge Functions (Depends on: Auth, Workout table)
**Build fourth:** Photo upload pipeline
- Storage bucket setup + RLS
- Edge Function: process-image
- Client: file picker + upload UI
- Progress/error states

**Rationale:** Requires existing workout table (Edge Function creates workouts), auth (RLS on storage), complex async flow

**Validation:** Upload photo, verify Edge Function creates workout, check storage path RLS

---

### Phase 5: Viewing & Statistics (Depends on: Workout data exists)
**Build fifth:** Read-only views
- My workouts: calendar + list view
- My stats: monthly count
- Team stats: aggregated view

**Rationale:** Requires existing workout data to display, no complex writes, pure read operations

**Validation:** Create test workouts manually, verify views render correctly, test with multiple users

---

### Phase 6: Admin Features (Depends on: Auth, all other features stable)
**Build last:** Admin panel
- Admin role detection (check email)
- User management: delete user + cascade workouts/photos

**Rationale:** Non-critical for MVP, depends on stable auth system, destructive operations need careful testing

**Validation:** Test user deletion, verify cascade to workouts and storage cleanup

---

### Dependency Graph

```
Database Schema (RLS)
        ↓
    Auth System
        ↓
   ┌────┴────┐
   ↓         ↓
Workout   Storage + Edge Fn
 Toggle       ↓
   ↓         ↓
   └─→ Views/Stats ←┘
        ↓
    Admin Panel
```

**Critical path:** Database → Auth → Workout Toggle (core loop functional at Phase 3)

**Parallel work:** After Phase 3, Storage/Edge Fn and Views can be built concurrently by different developers

**Testing order:**
1. Backend (SQL) → Auth (manual) → Workout (E2E)
2. Photo upload (E2E) → Views (integration) → Admin (manual + destructive tests isolated)

## Scalability Considerations

| Concern | At 20 users (MVP) | At 200 users | At 2000 users |
|---------|-------------------|--------------|---------------|
| **Database** | Postgres free tier (500MB) sufficient | Add indexes on (user_id, date) composite | Consider read replicas for team stats view |
| **Storage** | 1GB free tier (~200 photos/user = 1000 photos @ 500KB each) | 10GB (~10K photos), enable CDN caching | Implement image compression in Edge Function, consider lifecycle policies (archive old photos) |
| **Auth** | Unlimited MAU on free tier | Monitor email verification rates, add rate limiting | Consider OAuth (Google) to reduce email verification friction |
| **RLS Performance** | Negligible overhead (simple user_id checks) | Add `CREATE INDEX ON workouts(user_id)` | Benchmark complex policies, consider materialized views for team stats |
| **Edge Functions** | <100 invocations/day (photo uploads) | Optimize cold start time, consider dedicated instance | Add request queuing, implement retry logic |
| **Client Bundle** | Fable output ~500KB gzipped | Code-split by route (lazy load admin panel) | Evaluate Feliz.UseElmish for component-level optimization |

**Current bottleneck:** Photo upload rate (limited by client bandwidth, not server)

**Future bottleneck:** Team stats view if hundreds of users (thousands of workout records to aggregate)

**Mitigation:** Materialized view refreshed daily for team stats instead of real-time aggregation

## Security Architecture Notes

### Defense-in-Depth Layers

1. **Client (Fable/Elmish):** Input validation for UX only, NOT security
2. **API Gateway (Supabase):** Rate limiting, JWT validation
3. **RLS Policies (Postgres):** Row-level access control, enforced on all queries
4. **Edge Functions:** Server-side business logic validation
5. **Storage RLS:** Path-based access control for files

**Key principle:** Even if client is fully compromised (malicious JS injected), RLS policies prevent unauthorized data access.

### Threat Model Coverage

| Threat | Mitigation | Layer |
|--------|-----------|-------|
| Unauthorized workout access | RLS: `user_id = auth.uid()` | Database |
| Photo access by other users | Storage RLS: path contains `auth.uid()` | Storage |
| Malicious file upload | Edge Function validates format/size | Edge Function |
| SQL injection | PostgREST parameterizes queries | API Gateway |
| XSS via photo metadata | Edge Function sanitizes EXIF, client escapes HTML | Client + Edge Function |
| CSRF | JWT in Authorization header (not cookie) | Auth |
| Brute-force login | Rate limiting on auth endpoints | API Gateway |
| Admin privilege escalation | Admin check in RLS policy: `email IN ('admin@example.com')` | Database |

### RLS Policy Examples

```sql
-- Workout table: users can only manage their own records
CREATE POLICY "workout_isolation"
ON workouts
FOR ALL
USING (user_id = auth.uid());

-- Workout stats view: team-visible (no RLS)
-- Privacy preserved by aggregation, not row-level filtering

-- Storage: users can only access their own folder
CREATE POLICY "photo_isolation"
ON storage.objects
FOR ALL
USING (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin: delete any user (only if requester is admin)
CREATE POLICY "admin_user_management"
ON auth.users
FOR DELETE
USING (
    auth.jwt() ->> 'email' IN ('admin@example.com', 'another-admin@example.com')
);
```

## Technology-Specific Guidance

### Fable/F# Interop with Supabase JS SDK

**Challenge:** Supabase SDK is JavaScript, Fable is F#. Need type-safe bindings.

**Recommended approach:**

1. **Manual bindings for core API:**
```fsharp
module Supabase =
    open Fable.Core
    open Fable.Core.JsInterop

    [<Import("createClient", from="@supabase/supabase-js")>]
    let createClient (url: string) (key: string) : obj = jsNative

    type SupabaseClient =
        abstract member auth: Auth
        abstract member from: table: string -> QueryBuilder
        abstract member storage: Storage
        abstract member functions: Functions

    and Auth =
        abstract member signUp: email: string * password: string -> JS.Promise<AuthResponse>
        abstract member signIn: email: string * password: string -> JS.Promise<AuthResponse>
        abstract member signOut: unit -> JS.Promise<unit>
        abstract member getSession: unit -> JS.Promise<Session option>
```

2. **Helper for Promise→Async:**
```fsharp
module Async =
    let AwaitPromise (promise: JS.Promise<'T>) : Async<'T> =
        Async.AwaitTask(promise |> Promise.toTask)
```

3. **Result-based error handling:**
```fsharp
let tryAsync (asyncOp: Async<'T>) : Async<Result<'T, string>> = async {
    try
        let! result = asyncOp
        return Ok result
    with ex ->
        return Error ex.Message
}

// Usage in Update
let cmd = Cmd.OfAsync.perform tryAsync (async {
    let! response = supabase.auth.signUp(email, password) |> Async.AwaitPromise
    return response
}) SignUpCompleted
```

### Elmish Architecture Fit with Supabase Realtime

**Note:** Rollbook v1 does NOT use Supabase Realtime (out of scope), but for future reference:

**Pattern:** Realtime subscriptions as Elmish subscriptions (not Commands)

```fsharp
// If adding real-time team stats updates in v2
let subscription model =
    if model.isOnTeamPage then
        let sub dispatch =
            let channel =
                supabase
                    .channel("team-stats")
                    .on("postgres_changes", {| event = "*"; schema = "public"; table = "workouts" |}, fun payload ->
                        dispatch (TeamStatsChanged payload)
                    )
                    .subscribe()

            // Return IDisposable for cleanup
            { new System.IDisposable with
                member _.Dispose() = channel.unsubscribe() |> ignore }

        Cmd.ofSub sub
    else
        Cmd.none
```

**Rationale:** Subscriptions are long-lived, Commands are one-shot. Elmish 4 supports IDisposable subscriptions for cleanup on navigation.

## References and Sources

### Fable/Elmish Architecture
- [Elmish official documentation](https://elmish.github.io/)
- [Model-View-Update (MVU) architecture guide](https://thomasbandt.com/model-view-update)
- [F# MVU pattern in Software Patterns Lexicon](https://softwarepatternslexicon.com/patterns-f-sharp/12/1/)
- [Fable blog: Elmish Components with Elmish 4](https://fable.io/blog/2022/2022-10-13-use-elmish.html)

### Supabase Architecture
- [Supabase Row Level Security documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Auth architecture](https://supabase.com/docs/guides/auth/architecture)
- [Supabase JWT documentation](https://supabase.com/docs/guides/auth/jwts)
- [Multi-tenant applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
- [Best Practices for Supabase](https://www.leanware.co/insights/supabase-best-practices)

### Edge Functions and Storage
- [Supabase Edge Functions architecture](https://supabase.com/docs/guides/functions/architecture)
- [Supabase Storage documentation](https://supabase.com/docs/guides/storage)
- [Image upload with Edge Functions example](https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/file-upload-storage/index.ts)

### Workout App Domain
- [Designing a Scalable Fitness Tracking App](https://medium.com/@ankitviddya/designing-a-scalable-fitness-tracking-app-for-100m-users-a16f7cde4240)
- [Fitness App UX Design Principles](https://stormotion.io/blog/fitness-app-ux/)
- [File Upload UX Best Practices](https://uploadcare.com/blog/file-uploader-ux-best-practices/)

### Offline-First and Sync Patterns
- [Offline-First Architecture Guide](https://medium.com/@jusuftopic/offline-first-architecture-designing-for-reality-not-just-the-cloud-e5fd18e50a79)
- [Offline-First Frontend Apps in 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)

---

**Next Steps for Roadmap:**
1. Use component boundaries to define phase boundaries (Database → Auth → Core Feature)
2. Use build order dependencies to sequence phases
3. Use data flow diagrams to identify integration points needing tests
4. Use anti-patterns to flag "deeper research needed" phases (e.g., RLS policy testing)
