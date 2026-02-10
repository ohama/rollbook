---
phase: 05-photo-upload
plan: 01
subsystem: storage
tags: [supabase-storage, rls, security, private-bucket]
requires: [01-foundation, 02-core-loop]
provides: [workout-photos-bucket, storage-rls-policies]
affects: [05-02, 05-03, 05-04]
tech-stack:
  added: []
  patterns: [storage-folder-isolation, path-based-rls]
key-files:
  created: [supabase/migrations/20260210150000_storage_bucket.sql]
  modified: []
decisions:
  - id: STOR-01
    decision: Private bucket with user folder isolation
    rationale: Privacy requirement - users cannot access other users' photos
    alternatives: [public-bucket-with-rls, team-visible-bucket]
  - id: STOR-02
    decision: Path pattern {user_id}/{date}.jpg
    rationale: Enables RLS enforcement via storage.foldername()[1]
    alternatives: [flat-structure-with-metadata, uuid-filenames]
  - id: STOR-03
    decision: 5MB file size limit
    rationale: Balance between quality and storage costs; mobile photos average 3-5MB
    alternatives: [10MB, 2MB]
  - id: STOR-04
    decision: Three separate policies (INSERT/SELECT/DELETE)
    rationale: Follows Phase 2 pattern; clearer intent than FOR ALL
    alternatives: [single-for-all-policy]
metrics:
  duration: 2min
  completed: 2026-02-10
---

# Phase 5 Plan 1: Storage Bucket with RLS Summary

**One-liner:** Created private workout-photos bucket with folder-based RLS using storage.foldername() for user isolation

## What Was Built

### Storage Infrastructure
- **Bucket:** workout-photos (private, not public)
- **File size limit:** 5MB per file
- **MIME types:** image/jpeg, image/png, image/webp
- **Path convention:** `{user_id}/{date}.jpg`

### RLS Policies (storage.objects)
1. **INSERT policy:** Users can upload photos to their own folder only
   - Check: `bucket_id = 'workout-photos' AND (storage.foldername(name))[1] = auth.uid()::text`
2. **SELECT policy:** Users can view photos from their own folder only
   - Check: `bucket_id = 'workout-photos' AND (storage.foldername(name))[1] = auth.uid()::text`
3. **DELETE policy:** Users can delete photos from their own folder only
   - Check: `bucket_id = 'workout-photos' AND (storage.foldername(name))[1] = auth.uid()::text`

## Technical Decisions

### Decision: Private Bucket (STOR-01)
**Chosen:** Private bucket with `public = false`
**Why:** Privacy requirement from PROJECT.md - "사진은 private — 본인 폴더만 접근 가능"
**Impact:** Client-side will need signed URLs to display photos (covered in 05-02/05-03)

### Decision: Folder-Based Isolation (STOR-02)
**Chosen:** Path pattern `{user_id}/{date}.jpg` with `storage.foldername(name)[1]` check
**Why:** Standard Supabase pattern for user isolation; enables RLS enforcement at path level
**Impact:** Upload code must construct correct path format

### Decision: File Size and Type Limits (STOR-03)
**Chosen:** 5MB limit, MIME types restricted to jpeg/png/webp
**Why:**
- Modern phones take 3-5MB photos on average
- Prevents abuse (very large files, non-image uploads)
- Cost control for storage
**Impact:** Client-side should compress photos over 5MB before upload

### Decision: Separate Policies (STOR-04)
**Chosen:** Three separate policies for INSERT/SELECT/DELETE
**Why:**
- Follows Phase 2 decision pattern (separate policies vs FOR ALL)
- Clearer intent, easier debugging
- Consistent with existing workouts/profiles policies
**Impact:** Easier to audit and modify individual operations

## Implementation Notes

### Migration Pattern
- **Timestamp:** 20260210150000 (full HHMMSS format for proper ordering)
- **Structure:** Follows Phase 4 pattern with clear section headers
- **Comments:** Inline documentation for each policy

### RLS Pattern from Research
- Uses `(SELECT auth.uid()::text)` for optimized performance (from Phase 2 decision)
- Uses `storage.foldername(name)[1]` to extract first path segment
- Three separate policies for INSERT/SELECT/DELETE (not FOR ALL)

### Removed from Original Plan
- **COMMENT statement:** Removed due to permissions error on storage.buckets table
  - Not critical for functionality
  - Documentation captured in inline SQL comments instead

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed COMMENT ON COLUMN statement**
- **Found during:** Task 1 verification
- **Issue:** Migration failed with "must be owner of relation buckets" error on COMMENT statement
- **Fix:** Removed COMMENT statement as it's non-critical documentation
- **Files modified:** supabase/migrations/20260210150000_storage_bucket.sql
- **Commit:** c52110e
- **Rationale:** storage.buckets is a Supabase system table with restricted permissions; inline SQL comments provide sufficient documentation

## Verification

### Migration Applied Successfully
```bash
npx supabase db reset
# Result: Finished supabase db reset on branch master
```

### No Pending Changes
```bash
npx supabase db diff
# Result: No schema changes found
```

### Bucket Created
- workout-photos bucket exists in storage.buckets
- public = false (confirmed private)
- file_size_limit = 5242880 bytes (5MB)
- allowed_mime_types = ['image/jpeg', 'image/png', 'image/webp']

### RLS Policies Applied
Three policies on storage.objects:
1. "Users can upload own photos" (INSERT)
2. "Users can view own photos" (SELECT)
3. "Users can delete own photos" (DELETE)

All policies check:
- bucket_id = 'workout-photos'
- (storage.foldername(name))[1] = (SELECT auth.uid()::text)

## Files Changed

### Created
- `supabase/migrations/20260210150000_storage_bucket.sql` (48 lines)
  - INSERT INTO storage.buckets
  - CREATE POLICY × 3 for storage.objects

### Modified
- None

## Next Phase Readiness

### Ready to Proceed
- ✅ Storage bucket infrastructure complete
- ✅ RLS policies enforce user folder isolation
- ✅ Migration applied and verified

### For 05-02 (Storage F# Bindings)
- Bucket name: `workout-photos`
- Path pattern: `{user_id}/{date}.jpg`
- Private bucket requires signed URLs for display

### For 05-03 (Photo Upload Component)
- File size limit: 5MB
- Allowed types: jpeg, png, webp
- Client-side should compress before upload

### For Future Plans
- Photo gallery (05-04) will need signed URL generation
- Consider storage cleanup/retention in Phase 6

## Lessons Learned

### What Went Well
- Migration pattern from Phases 1-4 made this straightforward
- RLS policy pattern (separate INSERT/SELECT/DELETE) is consistent
- Research document (05-RESEARCH.md) accurately predicted the implementation

### What Was Tricky
- COMMENT ON COLUMN for storage.buckets fails due to system table permissions
- Inline SQL comments sufficient for documentation

### For Next Time
- Storage system tables have different permissions than application tables
- Test migration with `npx supabase db reset` before committing

## Performance Characteristics

### Storage Operations
- **Upload:** O(1) - Direct file upload to bucket
- **Signed URL generation:** O(1) - Token-based
- **RLS check:** O(1) - Path string comparison

### Scalability
- 5MB per photo × 30 days/month × 20 users = 3GB/month max
- Supabase free tier: 1GB storage (will need paid plan for production)

---

**Duration:** 2 minutes
**Completed:** 2026-02-10
**Commit:** c52110e
