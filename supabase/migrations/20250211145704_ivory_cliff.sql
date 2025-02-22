/*
  # Fix storage policies for room images

  1. Changes
    - Drop existing policies
    - Create new policies with proper authentication checks
    - Add policies for managing own images
  
  2. Security
    - Enable public read access for room images
    - Restrict uploads to authenticated users only
    - Ensure users can only manage their own images
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname IN (
      'Room images are publicly accessible',
      'Users can upload room images',
      'Users can update own room images',
      'Users can delete own room images'
    )
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY IF EXISTS "Room images are publicly accessible" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload room images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own room images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own room images" ON storage.objects;
  END IF;
END $$;

-- Create comprehensive policies for room images
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
