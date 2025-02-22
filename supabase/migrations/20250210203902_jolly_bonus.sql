/*
  # Add profile pictures support

  1. Changes
    - Create profile-pictures storage bucket
    - Add picture_url column to profiles table
    - Set up storage policies for profile pictures

  2. Security
    - Enable public access to view profile pictures
    - Allow authenticated users to upload their own profile pictures
*/

-- Create storage bucket for profile pictures if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop the "Profile pictures are publicly accessible" policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Profile pictures are publicly accessible'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Profile pictures are publicly accessible" ON storage.objects;
  END IF;

  -- Drop the "Users can upload their profile picture" policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can upload their profile picture'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    DROP POLICY "Users can upload their profile picture" ON storage.objects;
  END IF;
END $$;

-- Create storage policies
CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their profile picture"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add picture_url column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'picture_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN picture_url text;
  END IF;
END $$;
