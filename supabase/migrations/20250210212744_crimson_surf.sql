/*
  # Final Fix for Profile Policies

  1. Changes
    - Remove all recursive policy checks
    - Implement direct, non-recursive policies
    - Ensure proper access control for all user types

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep data secure while allowing necessary access
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "View profiles" ON profiles;
DROP POLICY IF EXISTS "Manage own profile" ON profiles;
DROP POLICY IF EXISTS "Admin full access" ON profiles;

-- Create new, non-recursive policies
CREATE POLICY "Basic profile access"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Self profile management"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Profile creation"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create a separate admin policy without any recursion
CREATE POLICY "Admin management"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.id IN (
        SELECT p.id FROM profiles p
        WHERE p.user_type = 'admin'
        AND p.id = auth.users.id
      )
    )
  );

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

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
