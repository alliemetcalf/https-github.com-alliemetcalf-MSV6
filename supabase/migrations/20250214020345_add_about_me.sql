/*
  # Add about_me field to profiles table

  1. Changes
    - Add nullable about_me text column to profiles table
    - Create index for better performance
    - Preserve all existing data and structure
*/

-- Add about_me column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS about_me text;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_about_me ON profiles USING gin(to_tsvector('english', about_me));

-- Add comment to explain column usage
COMMENT ON COLUMN profiles.about_me IS 'User''s personal description or biography';
