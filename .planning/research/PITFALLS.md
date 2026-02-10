# Domain Pitfalls: Fable + Supabase Workout Tracking App

**Domain:** Workout tracking app with photo upload and automated exercise logging
**Stack:** Fable (F#/Elmish/Feliz) + Supabase (Auth, DB, Storage, Edge Functions)
**Researched:** 2026-02-10

## Critical Pitfalls

Mistakes that cause rewrites, security breaches, or major production issues.

### Pitfall 1: Row-Level Security (RLS) Disabled or Misconfigured

**What goes wrong:** Database tables and Storage buckets are publicly accessible, exposing all user data. In January 2025, 170+ apps built with Lovable had exposed databases (CVE-2025-48757). In January 2026, Moltbook leaked 1.5 million API keys and 35,000+ email addresses due to disabled RLS. 83% of exposed Supabase databases involve RLS misconfigurations.

**Why it happens:**
- RLS is disabled by default when creating tables
- Developers skip RLS during prototyping and forget to enable before launch
- Enabling RLS without creating policies results in "deny all" (no one can access data)
- Creating policies without enabling RLS does nothing

**Consequences:**
- Complete data breach - anyone with your anon key can read/write all data
- User privacy violations
- Potential legal liability
- Reputational damage

**Prevention:**
```sql
-- Enable RLS from day one on EVERY table
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Create policies immediately
CREATE POLICY "Users can view their own workouts"
  ON workouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
  ON workouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

For Storage:
```sql
-- Storage bucket policies
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Turn OFF "Public" access on bucket
```

**Detection:**
- Run Supabase Security Advisor in dashboard before every deployment
- Test with different user accounts - can User A see User B's data?
- Check `SELECT * FROM pg_policies WHERE tablename = 'workouts'` returns policies
- Verify Storage buckets show "Private" not "Public"

**Phase to address:** Phase 1 (Database setup) - RLS must be enabled before ANY data is inserted.

### Pitfall 2: Service Role Key Exposed in Client Code

**What goes wrong:** The service_role key bypasses RLS and grants full database access. Exposing it in client-side Fable code gives attackers complete control over your database.

**Why it happens:**
- Confusion between anon key (safe for client) and service_role key (server-only)
- Copying example code that uses service_role for convenience
- Committing .env files with keys to version control

**Consequences:**
- Attacker can read/write/delete all data regardless of RLS
- Complete database compromise
- Impossible to recover without database migration

**Prevention:**
```fsharp
// ✅ CORRECT: Use anon key in Fable client
let supabaseClient =
    Supabase.createClient
        "https://project.supabase.co"
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // anon key

// ❌ WRONG: Never use service_role in client
// let supabaseClient =
//     Supabase.createClient url serviceRoleKey
```

- Store service_role key in Edge Functions environment variables only
- Add .env to .gitignore immediately
- Use separate keys for dev/staging/prod environments

**Detection:**
- Search codebase for `service_role` string in client files
- Check git history: `git log -p | grep service_role`
- Use GitHub secret scanning
- Review all environment variable references

**Phase to address:** Phase 1 (Initial setup) - Must be correct from first commit.

### Pitfall 3: Manual Schema Changes via Supabase Studio

**What goes wrong:** Schema changes made in UI cannot be replicated across environments, making it impossible to maintain dev/staging/prod consistency. Team members work with different schemas.

**Why it happens:**
- Supabase Studio UI is convenient for quick changes
- Teams don't set up migrations early
- "Just this one quick change" mindset

**Consequences:**
- Cannot reproduce production schema in local environment
- Deployments break because schema doesn't match code expectations
- Impossible to roll back bad schema changes
- Team members have divergent local schemas

**Prevention:**
```bash
# Use Supabase CLI for ALL schema changes
supabase init  # Set up migrations from day one

# Create migration instead of using Studio
supabase db diff -f add_workouts_table
supabase db push  # Apply to remote

# Version control ALL migrations
git add supabase/migrations/
git commit -m "Add workouts table"
```

**Never:**
- Create tables in Supabase Studio UI (production)
- Run raw SQL in SQL Editor (production)
- Click "Save" on schema changes in UI

**Detection:**
- Compare local and remote schemas: `supabase db diff`
- Check if supabase/migrations/ directory has recent files matching production schema
- Review team workflow - are people using Studio for schema changes?

**Phase to address:** Phase 0 (Project setup) - Initialize migrations before creating first table.

### Pitfall 4: Edge Functions Written in F# (Not Possible)

**What goes wrong:** Developers attempt to write Edge Functions in F#, but Edge Functions run on Deno which only executes TypeScript/JavaScript.

**Why it happens:**
- Assumption that F# can be used everywhere since frontend is Fable
- Unclear documentation about Edge Function requirements
- Desire for type safety across entire stack

**Consequences:**
- Wasted development time trying to get F# working
- Forced context switch between F# (frontend) and TS (backend)
- Need to maintain separate type definitions

**Prevention:**
```typescript
// Edge Functions MUST be TypeScript/JavaScript
// supabase/functions/analyze-workout-photo/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { imageUrl } = await req.json()
  // Call ML model, process image, etc.
  return new Response(JSON.stringify({ exercises }))
})
```

Alternative: Use Fable to transpile F# to JS/TS for Edge Functions
```bash
# This would require custom build pipeline
dotnet fable src/EdgeFunctions --outDir supabase/functions
```

**Detection:**
- Review Edge Functions directory - are there .fs or .fsproj files?
- Attempt to deploy - will fail with "unable to bundle" errors
- Check Supabase Edge Functions docs - only shows TS/JS examples

**Phase to address:** Phase 2 (Edge Function architecture planning) - Decide on TypeScript from the start.

### Pitfall 5: Photo Upload Without Storage RLS Policies

**What goes wrong:** Users can view/delete other users' workout photos, or upload unlimited files causing storage cost explosion.

**Why it happens:**
- Storage RLS is separate from database RLS - easy to forget
- Default bucket configuration doesn't enforce user isolation
- File size/type validation not implemented

**Consequences:**
- Privacy breach - users see each other's photos
- Malicious users can delete others' photos
- Storage costs spiral from spam uploads
- GDPR/privacy violations

**Prevention:**
```sql
-- Storage policies for workout photos bucket
CREATE POLICY "Users can only upload their own photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can only view their own photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can only delete their own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'workout-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

Client-side validation:
```fsharp
// Validate file before upload
let validateWorkoutPhoto (file: Browser.Types.File) =
    let maxSize = 10_000_000 // 10MB
    let allowedTypes = ["image/jpeg"; "image/png"; "image/webp"]

    if file.size > maxSize then
        Error "Photo must be under 10MB"
    elif not (List.contains file.``type`` allowedTypes) then
        Error "Photo must be JPEG, PNG, or WebP"
    else
        Ok file
```

**Detection:**
- Try uploading photo as User A, then accessing as User B
- Check Storage policies: `SELECT * FROM storage.policies WHERE bucket_id = 'workout-photos'`
- Test with oversized/invalid file types
- Review bucket configuration in Supabase Studio

**Phase to address:** Phase 3 (Photo upload feature) - Implement Storage RLS before enabling uploads.

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or degraded performance.

### Pitfall 6: Excessive Re-rendering in Elmish State Management

**What goes wrong:** Every state change triggers full app re-render, causing performance issues as app grows. One input field change re-renders entire component tree.

**Why it happens:**
- Global Elmish state at top level forces all components to re-render
- Passing entire model down component hierarchy
- Not using React.memo or selective subscriptions

**Consequences:**
- Sluggish UI as workout list grows
- Poor user experience on mobile
- Battery drain from unnecessary renders

**Prevention:**
```fsharp
// ❌ BAD: Global state causes full re-renders
let view model dispatch =
    div [] [
        workoutList model dispatch  // Re-renders on ANY model change
        profileSettings model dispatch  // Re-renders even when workouts change
    ]

// ✅ GOOD: Use Feliz.UseElmish for component-level state
let workoutList () =
    let state, dispatch = React.useElmish(WorkoutList.init, WorkoutList.update, [||])
    // Only this component re-renders on workout changes

// ✅ GOOD: Use Elmish.Store for selective subscriptions
let workoutList = React.functionComponent(fun () ->
    let workouts = Store.useSelector(fun model -> model.workouts)
    // Only re-renders when workouts change
)
```

**Detection:**
- Use React DevTools Profiler
- Add console.log in render functions - how often called?
- Monitor frame rate during state updates
- User reports of "laggy" or "slow" UI

**Phase to address:** Phase 4 (State management refactor) - Address when component tree grows complex.

### Pitfall 7: Gmail SMTP Configuration Fails Silently

**What goes wrong:** Authentication emails (signup, magic link, password reset) timeout or never arrive. Users cannot sign up or log in.

**Why it happens:**
- Gmail requires App Password (not regular password) with 2-Step Verification enabled
- HELO localhost message rejected by Gmail relay service
- Wrong SMTP port (465 required for Gmail relay)
- Sender email doesn't match SMTP username

**Consequences:**
- Users cannot complete signup flow
- Password reset broken
- Support tickets flood in
- Poor first impression

**Prevention:**
```bash
# Supabase Dashboard → Authentication → Email Settings

SMTP Host: smtp-relay.gmail.com
SMTP Port: 465  # NOT 587 for Gmail relay
SMTP Username: your-workspace-admin@yourdomain.com
SMTP Password: xxxx-xxxx-xxxx-xxxx  # App Password, not regular password
Sender Email: your-workspace-admin@yourdomain.com  # Must match username
```

Setup steps:
1. Enable 2-Step Verification on Google Account
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Use App Password (16 characters with hyphens) in Supabase
4. Sender email MUST equal SMTP username
5. Configure SPF, DKIM, DMARC records for domain

**Detection:**
- Test signup flow immediately after SMTP config
- Check Supabase logs for email sending errors
- Monitor email deliverability rates
- Check spam folder for test emails

**Phase to address:** Phase 1 (Auth setup) - Configure and test before user testing.

### Pitfall 8: Fable Promise/Async Interop Confusion

**What goes wrong:** JavaScript Promise-based APIs (Supabase client) don't work cleanly with F# async workflows. Type mismatches, error handling breaks, or code won't compile.

**Why it happens:**
- F# async != JavaScript Promise
- Fable.Promise library needed for interop
- Error handling differs (Exception vs Promise rejection)
- Async.RunSynchronously not available in Fable

**Consequences:**
- Runtime errors from improper promise handling
- Unhandled promise rejections crash app
- Difficult to debug async issues
- Inconsistent error handling across codebase

**Prevention:**
```fsharp
// ✅ Use Fable.Promise for Supabase calls
open Fable.Core
open Fable.Promise

// Supabase client returns JS Promise
let fetchWorkouts userId =
    promise {
        let! response =
            supabase
                .From("workouts")
                .Select("*")
                .Eq("user_id", userId)
                .AsTask()  // Convert to Promise

        return! response.Data
    }
    |> Promise.catch (fun error ->
        console.error("Failed to fetch workouts", error)
        Promise.lift []
    )

// ❌ WRONG: Using F# async with Promise-based API
// let fetchWorkouts userId = async {
//     let! response = supabase.From(...) // Type error!
//     return response
// }
```

Error handling pattern:
```fsharp
// Define Result-based wrapper
let supabaseCall<'T> (promise: JS.Promise<'T>) : JS.Promise<Result<'T, string>> =
    promise
    |> Promise.map Ok
    |> Promise.catch (fun error ->
        Error (sprintf "Supabase error: %A" error)
    )

// Use consistently
let! workoutsResult =
    supabase.From("workouts").Select("*").AsTask()
    |> supabaseCall

match workoutsResult with
| Ok workouts -> // Handle success
| Error msg -> // Handle error
```

**Detection:**
- Compiler errors about Promise vs Async
- Runtime errors: "Promise is not a function"
- Unhandled promise rejections in browser console
- Type mismatches in Supabase API calls

**Phase to address:** Phase 1 (Setup) - Establish pattern before writing async code.

### Pitfall 9: No Database Migration Testing in CI/CD

**What goes wrong:** Migrations work locally but fail in staging/production due to data differences, causing deployment failures and potential downtime.

**Why it happens:**
- Migrations only tested against empty local database
- Production data has edge cases local data doesn't
- No staging environment to test migrations
- CI/CD pipeline doesn't run migration tests

**Consequences:**
- Failed deployments to production
- Downtime while fixing migrations
- Data corruption from partial migrations
- Need to manually fix production database

**Prevention:**
```yaml
# .github/workflows/test-migrations.yml
name: Test Database Migrations

on: [pull_request]

jobs:
  test-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Start local Supabase
        run: supabase start

      - name: Run migrations
        run: supabase db push

      - name: Test migration rollback
        run: supabase db reset

      - name: Re-apply migrations
        run: supabase db push

      - name: Run database tests
        run: npm run test:db
```

Best practices:
- Test migrations on copy of production data (anonymized)
- Write idempotent migrations (can run multiple times safely)
- Test rollback/down migrations
- Use staging environment that mirrors production
- Add database seeds for common scenarios

**Detection:**
- Monitor deployment failure rates
- Check for production hotfixes to migrations
- Review migration complexity - are they tested?
- Look for manual SQL run in production

**Phase to address:** Phase 0 (CI/CD setup) - Configure before first migration to production.

### Pitfall 10: OCR/ML Model Output Not Validated

**What goes wrong:** Edge Function blindly trusts OCR output, inserting nonsense exercise data. User uploads photo of cat, app logs "3 sets of 猫 meow meow".

**Why it happens:**
- Overconfidence in ML model accuracy
- No validation of OCR output structure
- Missing business logic constraints
- Poor error handling for malformed data

**Consequences:**
- Garbage data in workout logs
- User confusion and frustration
- Need to manually clean database
- Loss of user trust

**Prevention:**
```typescript
// Edge Function: analyze-workout-photo/index.ts
interface OcrOutput {
  text: string;
  confidence: number;
}

interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
}

async function validateAndParseOcr(ocrOutput: OcrOutput): Promise<WorkoutExercise[]> {
  // Confidence threshold
  if (ocrOutput.confidence < 0.7) {
    throw new Error("OCR confidence too low - please retake photo");
  }

  // Parse exercises from text
  const exercises = parseExercises(ocrOutput.text);

  // Validate each exercise
  const validExercises = exercises.filter(ex => {
    return (
      ex.name.length > 2 &&           // Reasonable name length
      ex.name.length < 50 &&
      ex.sets > 0 && ex.sets < 20 &&  // Reasonable sets (1-20)
      ex.reps > 0 && ex.reps < 500 && // Reasonable reps (1-500)
      (!ex.weight || ex.weight < 1000) // Reasonable weight
    );
  });

  if (validExercises.length === 0) {
    throw new Error("No valid exercises found in photo");
  }

  return validExercises;
}

// Always store raw OCR output for debugging
await supabase.from('workout_photos').insert({
  user_id: userId,
  photo_url: photoUrl,
  ocr_raw: ocrOutput.text,           // Store for reprocessing
  ocr_confidence: ocrOutput.confidence,
  parsed_exercises: validExercises,
  created_at: new Date().toISOString()
});
```

Fable client-side validation:
```fsharp
type ExerciseValidationError =
    | EmptyName
    | InvalidSets of int
    | InvalidReps of int
    | InvalidWeight of float

let validateExercise exercise =
    [
        if String.IsNullOrWhiteSpace exercise.Name then
            Some EmptyName
        if exercise.Sets < 1 || exercise.Sets > 20 then
            Some (InvalidSets exercise.Sets)
        if exercise.Reps < 1 || exercise.Reps > 500 then
            Some (InvalidReps exercise.Reps)
        match exercise.Weight with
        | Some w when w <= 0.0 || w >= 1000.0 ->
            Some (InvalidWeight w)
        | _ -> None
    ]
    |> List.choose id
```

**Detection:**
- Review logged workouts for nonsense data
- Monitor OCR confidence scores
- Check user feedback/support tickets about bad data
- Test with variety of photos (good and bad quality)

**Phase to address:** Phase 5 (Photo OCR feature) - Implement validation before deploying OCR.

### Pitfall 11: Fable Bundle Size Not Optimized

**What goes wrong:** Initial JavaScript bundle is 5MB+, causing slow load times, especially on mobile networks. Users abandon app before it loads.

**Why it happens:**
- Including entire F# standard library
- Not using [<Erase>] attribute on types
- Importing large libraries (Feliz, Elmish) without tree-shaking
- No bundle size monitoring

**Consequences:**
- Poor Time to Interactive (TTI)
- High bounce rate on slow connections
- Bad mobile experience
- Poor Core Web Vitals scores

**Prevention:**
```fsharp
// Use [<Erase>] for type-only constructs
[<Erase>]
type WorkoutId = WorkoutId of string

[<Erase>]
type UserId = UserId of string

// These compile to plain JavaScript strings (zero runtime cost)

// Prefer ofArray over ofList (arrays are native JS)
let workouts = [| workout1; workout2; workout3 |]  // ✅
// Not: let workouts = [ workout1; workout2; workout3 ]  // ❌

// Use Feliz components (optimized for bundle size)
let button = Feliz.Html.button [  // Erased attributes, minimal JS
    prop.text "Submit"
    prop.onClick handleClick
]

// Code splitting for large features
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
    }
  }
}
```

Bundle analysis:
```bash
# Add webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer

# Build and analyze
npm run build
npx webpack-bundle-analyzer dist/stats.json
```

**Detection:**
- Run Lighthouse audit - check bundle size warnings
- Monitor bundle size in CI: `bundlesize` package
- Check Network tab in DevTools
- Measure Time to Interactive (TTI)

**Phase to address:** Phase 6 (Performance optimization) - Optimize before launch.

## Minor Pitfalls

Mistakes that cause annoyance but are fixable without major rework.

### Pitfall 12: Hardcoded Supabase URL in Multiple Files

**What goes wrong:** Need to update Supabase URL in 5+ files when moving to production or creating staging environment.

**Why it happens:**
- Copy-pasting initialization code
- No centralized configuration
- Environment variables not set up

**Prevention:**
```fsharp
// src/Config.fs - Single source of truth
module Config

open Fable.Core

[<Emit("process.env.VITE_SUPABASE_URL")>]
let supabaseUrl: string = jsNative

[<Emit("process.env.VITE_SUPABASE_ANON_KEY")>]
let supabaseAnonKey: string = jsNative

// src/Supabase.fs
module Supabase

let client =
    Supabase.createClient Config.supabaseUrl Config.supabaseAnonKey
```

Environment files:
```bash
# .env.local
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...

# .env.production
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

**Detection:**
- Search for hardcoded URLs: `grep -r "supabase.co" src/`
- Try changing environment - how many files need updates?

**Phase to address:** Phase 0 (Project setup) - Set up environment config immediately.

### Pitfall 13: Email Verification Not Required

**What goes wrong:** Users can sign up with fake emails and immediately use the app. Account enumeration possible. Spam accounts created.

**Why it happens:**
- Supabase allows unverified users by default
- Convenience during development
- Forgetting to enable before launch

**Prevention:**
```sql
-- Require email verification
-- Supabase Dashboard → Authentication → Settings
-- Enable "Enable email confirmations"

-- Or via SQL
UPDATE auth.config
SET email_confirmations_enabled = true;
```

Fable client checks:
```fsharp
let checkEmailVerified (user: Supabase.Auth.User) =
    if not user.EmailConfirmedAt.HasValue then
        // Show "Please verify your email" message
        Router.navigate("verify-email")
```

**Detection:**
- Check auth settings in Supabase Dashboard
- Test signup flow - can you use app before verifying?
- Look for unverified users in database

**Phase to address:** Phase 1 (Auth setup) - Enable before user testing.

### Pitfall 14: No User Feedback During Photo Upload

**What goes wrong:** User uploads photo, no indication of progress. User clicks "Upload" again, creating duplicates. Edge Function takes 30 seconds but user sees nothing.

**Why it happens:**
- Async upload without progress tracking
- No loading states in UI
- Edge Function processing time not communicated

**Prevention:**
```fsharp
type UploadState =
    | Idle
    | Uploading of progress: int  // 0-100
    | Processing                   // Edge Function analyzing
    | Success of exercises: Exercise list
    | Failed of error: string

let uploadPhoto model file dispatch =
    promise {
        dispatch (SetUploadState (Uploading 0))

        // Upload with progress tracking
        let! uploadResult =
            supabase.Storage
                .From("workout-photos")
                .Upload(file.name, file, {|
                    onProgress = fun progress ->
                        let percent = int (progress.Loaded / progress.Total * 100.0)
                        dispatch (SetUploadState (Uploading percent))
                |})

        match uploadResult with
        | Ok data ->
            dispatch (SetUploadState Processing)

            // Call Edge Function
            let! analyzeResult = callAnalyzeFunction data.Key

            match analyzeResult with
            | Ok exercises ->
                dispatch (SetUploadState (Success exercises))
            | Error err ->
                dispatch (SetUploadState (Failed err))

        | Error err ->
            dispatch (SetUploadState (Failed err))
    }

let view model dispatch =
    match model.UploadState with
    | Idle -> uploadButton
    | Uploading progress ->
        Html.div [
            prop.text (sprintf "Uploading... %d%%" progress)
            progressBar progress
        ]
    | Processing ->
        Html.div [
            prop.text "Analyzing workout photo..."
            spinner
        ]
    | Success exercises -> showExercises exercises
    | Failed error -> showError error
```

**Detection:**
- Test upload with slow network (Chrome DevTools throttling)
- Monitor user behavior - do they click upload multiple times?
- Check for duplicate uploads in database

**Phase to address:** Phase 3 (Photo upload UI) - Implement with upload feature.

### Pitfall 15: Workout Data Not Normalized in Database

**What goes wrong:** Exercise names stored inconsistently: "Bench Press", "bench press", "BenchPress", making analytics and search impossible.

**Why it happens:**
- No exercise reference table
- Free-text input without validation
- OCR output not normalized

**Prevention:**
```sql
-- Create exercise reference table
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL UNIQUE, -- lowercase, no spaces
  category TEXT NOT NULL, -- 'strength', 'cardio', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout sets reference exercise table
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id), -- Foreign key
  sets INT NOT NULL,
  reps INT NOT NULL,
  weight DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_exercises_normalized_name ON exercises(normalized_name);
```

Edge Function normalization:
```typescript
// Normalize exercise name before lookup/insert
function normalizeExerciseName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
    .trim();
}

async function getOrCreateExercise(name: string) {
  const normalized = normalizeExerciseName(name);

  // Try to find existing
  const { data: existing } = await supabase
    .from('exercises')
    .select('id')
    .eq('normalized_name', normalized)
    .single();

  if (existing) return existing.id;

  // Create new
  const { data: created } = await supabase
    .from('exercises')
    .insert({
      name: name,
      normalized_name: normalized,
      category: inferCategory(name)
    })
    .select('id')
    .single();

  return created.id;
}
```

**Detection:**
- Query distinct exercise names: `SELECT DISTINCT name FROM workout_sets`
- Check for duplicates with different casing
- Test search/analytics features - do they work?

**Phase to address:** Phase 2 (Database schema design) - Design normalized schema from start.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Phase 0: Project Setup** | No migration system initialized | Run `supabase init` before creating any tables |
| **Phase 1: Database & Auth** | RLS not enabled on tables/storage | Enable RLS immediately, test with Security Advisor |
| **Phase 1: Auth Setup** | Gmail SMTP misconfigured | Use App Password, test email delivery before proceeding |
| **Phase 2: Schema Design** | Manual schema changes in UI | Use migrations only, check into git |
| **Phase 2: Schema Design** | Workout data not normalized | Create exercise reference table, use foreign keys |
| **Phase 3: Photo Upload** | Storage RLS missing | Implement Storage policies before enabling uploads |
| **Phase 3: Upload UI** | No progress feedback | Add upload progress and processing states |
| **Phase 4: State Management** | Excessive re-renders | Use Feliz.UseElmish or Elmish.Store for component state |
| **Phase 4: API Integration** | Promise/Async interop issues | Use Fable.Promise consistently, establish error handling pattern |
| **Phase 5: Edge Functions** | Trying to use F# for Edge Functions | Write Edge Functions in TypeScript from the start |
| **Phase 5: OCR Integration** | Trusting OCR output blindly | Validate all OCR output, store raw data for reprocessing |
| **Phase 6: Production Prep** | Service role key in client | Audit codebase for exposed secrets before deploy |
| **Phase 6: Performance** | Large bundle size | Optimize with [<Erase>], code splitting, bundle analysis |
| **Phase 7: CI/CD** | Migrations not tested | Add migration testing to CI pipeline |

## Sources

### Supabase Security and RLS
- [Supabase Row Level Security (RLS): Complete Guide 2026](https://vibeappscanner.com/supabase-row-level-security)
- [Supabase Security Flaw: 170+ Apps Exposed by Missing RLS](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/)
- [Moltbook Data Breach: Supabase RLS Security Lessons](https://bastion.tech/blog/moltbook-security-lessons-ai-agents)
- [Supabase Pitfalls: Avoid These Common Mistakes for a Robust Backend](https://hrekov.com/blog/supabase-common-mistakes)
- [Best Practices for Supabase | Security, Scaling & Maintainability](https://www.leanware.co/insights/supabase-best-practices)
- [10 Common Supabase Security Misconfigurations](https://modernpentest.com/blog/supabase-security-misconfigurations)

### Supabase Storage
- [Storage Access Control | Supabase Docs](https://supabase.com/docs/guides/storage/security/access-control)
- [How to secure file uploads in Supabase storage?](https://bootstrapped.app/guide/how-to-secure-file-uploads-in-supabase-storage)
- [Supabase Storage: How to Implement File Upload Properly](https://nikofischer.com/supabase-storage-file-upload-guide)

### Supabase Email/SMTP
- [Using Google SMTP with Supabase Custom SMTP](https://supabase.com/docs/guides/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y)
- [Supabase Auth Email Sending Failed](https://drdroid.io/stack-diagnosis/supabase-auth-email-sending-failed)

### Supabase Migrations
- [Database Migrations | Supabase Docs](https://supabase.com/docs/guides/deployment/database-migrations)
- [Declarative database schemas | Supabase Docs](https://supabase.com/docs/guides/local-development/declarative-database-schemas)
- [Supabase CLI Best Practices](https://bix-tech.com/supabase-cli-best-practices-how-to-boost-security-and-control-in-your-development-workflow/)
- [How to handle Supabase schema versioning?](https://bootstrapped.app/guide/how-to-handle-supabase-schema-versioning)

### Supabase Edge Functions
- [Edge Functions Troubleshooting](https://supabase.com/docs/guides/functions/troubleshooting)
- [Getting Started with Edge Functions](https://supabase.com/docs/guides/functions/quickstart)

### Fable/Elmish State Management
- [Excessive re-rerendering · Issue #55 · elmish/react](https://github.com/elmish/react/issues/55)
- [Optimizing F# and React Integration with Elmish Store](https://dev.to/lkrzywizna/optimizing-f-and-react-integration-with-elmish-store-a-guide-to-efficient-state-management-316m)
- [Elmish Components with Elmish 4 and UseElmish](https://fable.io/blog/2022/2022-10-13-use-elmish.html)
- [Pros/cons of Elmish vs plain React components · Issue #154](https://github.com/elmish/elmish/issues/154)

### Fable Promise/Async Interop
- [async best practice with fable calling 'traditional callback' apis · Issue #146](https://github.com/fable-compiler/Fable/issues/146)
- [Task vs Promise · Issue #3672](https://github.com/fable-compiler/Fable/issues/3672)
- [Fable.Promise Documentation](https://fable.io/fable-promise/reference/Fable.Promise/global-promise.html)

### Fable Performance
- [React performance in a fable world](https://vbfox.github.io/FableConf2018ReactPerf/)
- [Road to Fable 2.0: Lightweight types? · Issue #1318](https://github.com/fable-compiler/Fable/issues/1318)
- [Fable 2 Interview with Alfonso García-Caro](https://www.infoq.com/news/2019/01/fable-2-release-interview/)

### OCR/ML Integration
- [State of OCR technology in 2026](https://research.aimultiple.com/ocr-technology/)
- [Building Deep Learning-Based OCR Model: Lessons Learned](https://neptune.ai/blog/building-deep-learning-based-ocr-model)
- [Best OCR Models Comparison Guide in 2026](https://www.f22labs.com/blogs/ocr-models-comparison/)

### Workout App Database Design
- [How to Build a Database Schema for a Fitness Tracking Application?](https://www.back4app.com/tutorials/how-to-build-a-database-schema-for-a-fitness-tracking-application)
- [Designing a data structure to track workouts](https://1df.co/designing-data-structure-to-track-workouts/)
- [How to design a scalable data model for a personalized workout tracking app](https://www.dittofi.com/learn/how-to-design-a-data-model-for-a-workout-tracking-app)
