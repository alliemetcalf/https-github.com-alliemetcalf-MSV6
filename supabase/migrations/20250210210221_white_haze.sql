/*
  # Fix Profile Page Access

  1. Changes
    - Add missing columns if they don't exist
    - Update RLS policies for better profile access
    - Add indexes for performance

  2. Security
    - Ensure proper RLS policies for profile access
    - Allow users to view and update their own profiles
*/

-- Ensure all required columns exist
DO $$ 
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can create their own profile" ON profiles;

-- Create comprehensive policies
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(id);
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx ON profiles(updated_at);
