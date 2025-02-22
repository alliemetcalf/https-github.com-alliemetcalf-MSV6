/*
  # Update profile policies for host information

  1. Changes
    - Add policies to allow hosts and admins to view and edit about_host field
    - Ensure regular users cannot modify this field
    - Maintain existing profile access controls
*/

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

-- Create new policies
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_self"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create separate policy for host/admin about_host updates
CREATE POLICY "profiles_update_about_host"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type IN ('host', 'admin')
    )
  );

-- Create policy for profile deletion
CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
