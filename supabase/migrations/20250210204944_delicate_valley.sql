/*
  # Update video storage in profiles

  1. Changes
    - Add previous_video_url column to profiles table
    - Add new_video_url column to profiles table
    - Migrate existing video_url data to new_video_url

  2. Notes
    - Keeps track of one previous video for reversion
    - Supports showing new video while uploading
*/

-- Add columns for video management
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS previous_video_url text,
ADD COLUMN IF NOT EXISTS new_video_url text;

-- Migrate existing video_url data to new_video_url
UPDATE profiles
SET new_video_url = video_url
WHERE video_url IS NOT NULL;
