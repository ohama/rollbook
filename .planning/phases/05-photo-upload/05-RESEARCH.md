# Phase 5: Photo Upload - Research

**Researched:** 2026-02-10
**Domain:** Supabase Storage + File Upload + Fable/F# Interop
**Confidence:** HIGH

## Summary

This research covers implementing photo-based workout logging in a Fable/Feliz application with Supabase Storage backend. The core requirements are: (1) photo upload creates workout record automatically, (2) private storage with user-specific access via RLS, (3) progress indicator during upload.

The standard approach uses a **private storage bucket** with RLS policies that restrict access to user-specific folders (using `{user_id}/` path prefix). Photo uploads are handled client-side with the existing `@supabase/supabase-js` SDK, which supports `onUploadProgress` for tracking. The workout record creation happens client-side immediately after successful upload (Option A from research questions), as database triggers on `storage.objects` are officially unsupported and unreliable.

**Primary recommendation:** Use client-side workflow: validate file -> compress if needed -> upload to `workout-photos/{user_id}/{date}.jpg` -> upsert workout record -> show success. Keep it simple with no Edge Functions or database triggers.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.48.1 | Storage upload/download API | Already in project, official SDK |
| Fable.Browser.Dom | 2.17.0 | File/Blob types for F# | Already in project, includes HTMLInputElement |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| browser-image-compression | 2.0.2 | Client-side image compression | Photos > 1MB from mobile cameras |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side compression | Server-side (Edge Function) | Client-side is simpler, no cold start latency |
| Client-side workout create | Database trigger on storage.objects | Triggers on storage schema are **unsupported and unreliable** - avoid |
| Private bucket + signed URLs | Public bucket | Privacy violation - users could see each other's photos |

**Installation:**
```bash
npm install browser-image-compression
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  Supabase/
    Storage.fs          # NEW: Storage upload/download bindings
    Types.fs            # ADD: PhotoUploadProgress, StorageError types
  Components/
    PhotoUpload.fs      # NEW: File input + camera capture UI
    PhotoGallery.fs     # NEW: Display user's workout photos
  Pages/
    Dashboard.fs        # MODIFY: Add photo upload to Home tab
```

### Pattern 1: Client-Side Upload with Progress
**What:** Upload file directly from browser using Supabase JS SDK with progress callback
**When to use:** All file uploads under 50MB (our limit)
**Example:**
```fsharp
// Source: https://supabase.com/docs/reference/javascript/storage-from-upload
let uploadPhoto (userId: string) (date: string) (file: Browser.Types.File) (onProgress: float -> unit) =
    promise {
        let path = sprintf "%s/%s.jpg" userId date
        let options = createObj [
            "cacheControl" ==> "3600"
            "upsert" ==> true
            "onUploadProgress" ==> (fun progress ->
                let percent = (float progress?loaded / float progress?total) * 100.0
                onProgress percent
            )
        ]
        let! result = supabase?storage?from("workout-photos")?upload(path, file, options)
        return result
    }
```

### Pattern 2: User-Folder Path Convention
**What:** Store all user files under `{user_id}/` prefix for RLS enforcement
**When to use:** Any private storage needing per-user isolation
**Example:**
```
workout-photos/
  a1b2c3d4-uuid/           # user_id folder
    2026-02-10.jpg         # workout date as filename
    2026-02-11.jpg
  e5f6g7h8-uuid/           # another user
    2026-02-10.jpg
```

### Pattern 3: Mobile Camera Capture via HTML5
**What:** Use `<input type="file" accept="image/*" capture="environment">` for camera access
**When to use:** Mobile photo capture without native app
**Example:**
```fsharp
// Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture
Html.input [
    prop.type' "file"
    prop.accept "image/*"
    prop.capture "environment"  // rear camera
    prop.onChange (fun (e: Browser.Types.Event) ->
        let input = e.target :?> Browser.Types.HTMLInputElement
        if input.files.length > 0 then
            let file = input.files.[0]
            onFileSelected file
    )
]
```

### Anti-Patterns to Avoid
- **Database trigger on storage.objects:** Officially unsupported, behavior changes between Supabase versions, can fire on delete instead of insert
- **Storing files without user_id prefix:** Cannot enforce RLS without folder-based isolation
- **Uploading uncompressed mobile photos:** 10MB+ files hurt UX, waste bandwidth
- **Using public bucket for workout photos:** Privacy violation, team visibility doesn't mean public photos

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression | Canvas resize code | browser-image-compression | Handles EXIF rotation, quality, format conversion |
| Progress tracking | XHR with onprogress | supabase-js onUploadProgress | Built into SDK, cleaner API |
| Signed URL generation | Manual token creation | supabase.storage.createSignedUrl() | Handles auth, expiry, security |
| File type validation | Manual MIME check | `accept="image/*"` + server validation | Browser enforces, Storage double-checks |

**Key insight:** The Supabase Storage JS SDK handles all the complex parts (auth headers, progress events, signed URLs). Focus on F# bindings and UI, not reimplementing upload logic.

## Common Pitfalls

### Pitfall 1: Storage Bucket Not Configured
**What goes wrong:** Uploads fail with 404 or permission errors
**Why it happens:** Bucket must be created in migration/seed AND RLS policies added
**How to avoid:** Add bucket creation to seed.sql or config.toml, add storage.objects policies in migration
**Warning signs:** "Bucket not found" or "new row violates RLS" errors

### Pitfall 2: RLS Policies Missing for Storage
**What goes wrong:** Users can see/download all photos or uploads silently fail
**Why it happens:** storage.objects table needs explicit RLS policies like any other table
**How to avoid:** Create INSERT, SELECT, DELETE policies using `storage.foldername(name)[1] = auth.uid()::text`
**Warning signs:** Empty photo gallery, or seeing other users' photos

### Pitfall 3: Mobile Camera Photos Too Large
**What goes wrong:** Upload takes 30+ seconds, times out, or runs out of memory
**Why it happens:** Modern phones take 12MP+ photos (5-15MB each)
**How to avoid:** Compress to max 1920px width, 0.8 quality before upload
**Warning signs:** Progress bar stuck at 0%, browser freezes, timeout errors

### Pitfall 4: File Extension Mismatch
**What goes wrong:** Photos appear broken or wrong content-type
**Why it happens:** Saving as `.jpg` but file is actually PNG or HEIC
**How to avoid:** Use browser-image-compression to normalize to JPEG, or preserve original extension
**Warning signs:** Broken image icons, "unsupported format" errors

### Pitfall 5: Workout Record Not Created After Upload
**What goes wrong:** Photo exists in storage but no workout record in database
**Why it happens:** Upload succeeded but upsertWorkout failed (network error, RLS issue)
**How to avoid:** Use transaction-like pattern: upload -> upsertWorkout -> if workout fails, delete photo
**Warning signs:** Photos in storage without corresponding workout dates

## Code Examples

Verified patterns from official sources:

### Storage Module Bindings (Storage.fs)
```fsharp
// Source: https://supabase.com/docs/reference/javascript/storage-from-upload
module Supabase.Storage

open Fable.Core
open Fable.Core.JsInterop
open Supabase.Client
open Browser.Types

/// Upload options for progress tracking
type UploadOptions = {
    cacheControl: string
    upsert: bool
    onUploadProgress: (obj -> unit) option
}

/// Upload a file to storage bucket
let upload (bucket: string) (path: string) (file: File) (onProgress: float -> unit) : JS.Promise<obj> =
    promise {
        let options = createObj [
            "cacheControl" ==> "3600"
            "upsert" ==> true
            "onUploadProgress" ==> (fun progress ->
                let loaded = progress?loaded |> unbox<float>
                let total = progress?total |> unbox<float>
                if total > 0.0 then onProgress (loaded / total * 100.0)
            )
        ]
        let! result = supabase?storage?from(bucket)?upload(path, file, options)
        return result
    }

/// Create signed URL for private file
let createSignedUrl (bucket: string) (path: string) (expiresIn: int) : JS.Promise<string option> =
    promise {
        let! result = supabase?storage?from(bucket)?createSignedUrl(path, expiresIn)
        let error = result?error
        if isNull error then
            return Some (result?data?signedUrl |> unbox<string>)
        else
            return None
    }

/// Delete a file from storage
let remove (bucket: string) (paths: string array) : JS.Promise<obj> =
    promise {
        let! result = supabase?storage?from(bucket)?remove(paths)
        return result
    }
```

### HTML5 File Input with Camera (PhotoUpload.fs)
```fsharp
// Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture
[<ReactComponent>]
let PhotoUploadButton (onFileSelected: File -> unit) =
    Html.div [
        prop.className "relative"
        prop.children [
            Html.input [
                prop.id "photo-input"
                prop.type' "file"
                prop.accept "image/*"
                prop.capture "environment"  // Mobile: open rear camera
                prop.className "absolute inset-0 opacity-0 cursor-pointer"
                prop.onChange (fun (e: Event) ->
                    let input = e.target :?> HTMLInputElement
                    if not (isNull input.files) && input.files.length > 0 then
                        onFileSelected (input.files.[0])
                )
            ]
            Html.label [
                prop.htmlFor "photo-input"
                prop.className "px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer"
                prop.text "사진 올리기"
            ]
        ]
    ]
```

### Image Compression Before Upload
```fsharp
// Source: https://www.npmjs.com/package/browser-image-compression
// Requires: npm install browser-image-compression

[<Import("default", "browser-image-compression")>]
let imageCompression: File -> obj -> JS.Promise<File> = jsNative

let compressImage (file: File) : JS.Promise<File> =
    let options = createObj [
        "maxSizeMB" ==> 1.0
        "maxWidthOrHeight" ==> 1920
        "useWebWorker" ==> true
    ]
    imageCompression file options
```

### Storage RLS Migration (SQL)
```sql
-- Source: https://supabase.com/docs/guides/storage/security/access-control

-- Create private bucket for workout photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('workout-photos', 'workout-photos', false);

-- RLS Policy: Users can upload to their own folder
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workout-photos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- RLS Policy: Users can view own photos
CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'workout-photos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- RLS Policy: Users can delete own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'workout-photos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multipart form upload | Direct SDK upload with progress | supabase-js 2.x | Simpler API, built-in progress |
| Base64 encoding photos | File/Blob upload | Always | 33% smaller payload, faster |
| Server-side image processing | Client-side compression | 2024 | Better UX, no Edge Function needed |
| storage.objects triggers | Client-side workflow | Supabase v2 | More reliable, officially supported |

**Deprecated/outdated:**
- supabase-js v1 upload API: v2 has different return types, use latest docs
- storage.objects database triggers: Explicitly unsupported, behavior changes between versions

## Open Questions

Things that couldn't be fully resolved:

1. **HEIC Format Support**
   - What we know: iPhone photos may be HEIC format, not all browsers display HEIC
   - What's unclear: browser-image-compression HEIC support varies
   - Recommendation: Convert to JPEG during compression, test on iOS Safari

2. **Team Photo Visibility (Future)**
   - What we know: Current phase requires photos to be private (user can only see own)
   - What's unclear: If future phases need team photo visibility, RLS must change
   - Recommendation: Design RLS to be extensible, but implement private-only for Phase 5

3. **Photo Retention/Cleanup**
   - What we know: Storage costs money, old photos accumulate
   - What's unclear: Business requirement for photo retention period
   - Recommendation: Defer to Phase 6, add admin tools for storage management

## Sources

### Primary (HIGH confidence)
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) - RLS policies for storage.objects
- [Supabase Storage Upload API](https://supabase.com/docs/reference/javascript/storage-from-upload) - JS SDK upload with progress
- [Supabase Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) - Private vs public buckets
- [Supabase Storage Helper Functions](https://supabase.com/docs/guides/storage/schema/helper-functions) - storage.foldername(), storage.filename()
- [MDN HTML capture attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture) - Mobile camera access

### Secondary (MEDIUM confidence)
- [browser-image-compression npm](https://www.npmjs.com/package/browser-image-compression) - Client-side compression library
- [Supabase GitHub Discussion #19017](https://github.com/orgs/supabase/discussions/19017) - storage.objects trigger limitations
- [Supabase GitHub Discussion #6540](https://github.com/orgs/supabase/discussions/6540) - File upload trigger patterns

### Tertiary (LOW confidence)
- Community examples of Fable/Feliz file upload patterns (limited official documentation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing supabase-js SDK, well-documented APIs
- Architecture: HIGH - Client-side upload is officially recommended pattern
- Pitfalls: HIGH - Storage RLS is documented, trigger issues confirmed in GitHub discussions

**Research date:** 2026-02-10
**Valid until:** 2026-04-10 (90 days - Supabase Storage API is stable)
