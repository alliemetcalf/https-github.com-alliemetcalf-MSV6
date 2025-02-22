/*
  # Fix storage policies for room images

  1. Changes
    - Drop existing policies for room-images bucket
    - Create new policies with proper authentication checks
    - Add proper path validation for uploads
  
  2. Security
    - Enable public read access for room images
    - Restrict uploads to authenticated users only
    - Ensure users can only upload to their own folders
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Room images are publicly accessible'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Room images are publicly accessible" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can upload room images'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Users can upload room images" ON storage.objects;
  END IF;
END $$;

-- Create new policies with proper authentication and path validation
CREATE POLICY "Room images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

CREATE POLICY "Users can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'room-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own room images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'room-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own room images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'room-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
