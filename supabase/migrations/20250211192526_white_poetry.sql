-- Add employer column to profiles table
ALTER TABLE profiles
ADD COLUMN employer text;

-- Create index for better performance
CREATE INDEX idx_profiles_employer ON profiles(employer);

-- Update RLS policies to allow users to update their own employer info
CREATE POLICY "profiles_update_employer"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
