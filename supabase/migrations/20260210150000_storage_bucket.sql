-- ============================================
-- Phase 5: Storage Bucket for Workout Photos
-- Private bucket with user-folder isolation via RLS
-- Path convention: {user_id}/{date}.jpg
-- ============================================

-- Create private storage bucket for workout photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workout-photos',
  'workout-photos',
  false,                          -- Private bucket
  5242880,                        -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
);

-- ============================================
-- RLS Policies for storage.objects
-- Uses storage.foldername(name)[1] to extract user_id from path
-- Path format: {user_id}/{date}.jpg
-- ============================================

-- Policy: Users can upload photos to their own folder only
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workout-photos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- Policy: Users can view photos from their own folder only
CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'workout-photos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- Policy: Users can delete photos from their own folder only
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'workout-photos' AND
  (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
