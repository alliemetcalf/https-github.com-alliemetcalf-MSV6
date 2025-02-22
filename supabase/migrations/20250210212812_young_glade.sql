/*
  # Simplified Profile Policies

  1. Changes
    - Remove all complex policy checks
    - Implement simple, direct policies
    - Use basic auth.uid() checks only

  2. Security
    - Maintain basic access control
    - Eliminate recursion completely
    - Keep data secure with simple rules
*/

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Basic profile access" ON profiles;
DROP POLICY IF EXISTS "Self profile management" ON profiles;
DROP POLICY IF EXISTS "Profile creation" ON profiles;
DROP POLICY IF EXISTS "Admin management" ON profiles;

-- Simple select policy - everyone can view profiles
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (true);

-- Simple insert policy - users can only insert their own profile
CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Simple update policy - users can only update their own profile
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Simple delete policy - users can only delete their own profile
CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Ensure user_type column exists with proper default
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'user_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_type user_type NOT NULL DEFAULT 'user';
  END IF;
END $$;
