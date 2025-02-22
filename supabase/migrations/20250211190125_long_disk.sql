-- Add about_host column to profiles table
ALTER TABLE profiles
ADD COLUMN about_host text;

-- Create index for better performance
CREATE INDEX idx_profiles_about_host ON profiles(about_host);
