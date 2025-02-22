/*
  # Update video columns in profiles table

  1. Changes
    - Add new_video_url column if it doesn't exist
    - Add previous_video_url column if it doesn't exist
    - Migrate existing video_url data to new_video_url
    - Drop video_url column after migration

  2. Notes
    - Preserves existing video data
    - Supports video replacement functionality
*/

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'new_video_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN new_video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'previous_video_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN previous_video_url text;
  END IF;
END $$;

-- Migrate existing video_url data to new_video_url if it hasn't been done
UPDATE profiles
SET new_video_url = video_url
WHERE video_url IS NOT NULL
  AND new_video_url IS NULL;

-- Drop the old video_url column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'video_url'
  ) THEN
    ALTER TABLE profiles DROP COLUMN video_url;
  END IF;
END $$;
