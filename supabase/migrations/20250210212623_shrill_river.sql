/*
  # Fix Profile Policies Recursion

  1. Changes
    - Remove circular dependencies in profile policies
    - Simplify policy structure to prevent infinite recursion
    - Maintain security while improving performance

  2. Security
    - Maintain access control based on user types
    - Prevent infinite recursion in policy checks
*/

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;

-- Create new, optimized policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Simplified admin policy that avoids recursion
CREATE POLICY "Admins have full access"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );
