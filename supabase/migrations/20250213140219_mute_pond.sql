/*
  # Fix Profile Policies

  This migration fixes the infinite recursion issues in profile policies by:
  1. Dropping all existing policies
  2. Creating new, simplified non-recursive policies
  3. Adding proper indexes for performance
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view active profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admin full access" ON profiles;

-- Create new, simplified policies
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.id IN (
        SELECT id FROM profiles
        WHERE user_type = 'admin'
      )
    )
  );

CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.id IN (
        SELECT id FROM profiles
        WHERE user_type = 'admin'
      )
    )
  );

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create or update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
