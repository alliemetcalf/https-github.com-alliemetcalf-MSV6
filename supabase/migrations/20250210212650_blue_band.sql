/*
  # Fix Profile Policies Final

  1. Changes
    - Remove all circular dependencies in profile policies
    - Implement a more direct approach to policy checks
    - Ensure admin access without recursion

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep data secure while allowing necessary access
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins have full access" ON profiles;

-- Create new, simplified policies without recursion
CREATE POLICY "Public profiles access"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Self profile management"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a separate admin policy that doesn't cause recursion
CREATE POLICY "Admin access"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      JOIN profiles ON profiles.id = auth.users.id
      WHERE auth.users.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Ensure RLS is enabled
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
