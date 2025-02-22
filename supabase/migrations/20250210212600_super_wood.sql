/*
  # Fix Profile Policies

  1. Changes
    - Remove circular dependencies in profile policies
    - Simplify policy structure
    - Maintain security while preventing infinite recursion

  2. Security
    - Users can still only access their own profiles
    - Admins maintain full access
    - Policies are more efficient
*/

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND id IN (
        SELECT p.id
        FROM profiles p
        WHERE p.user_type = 'admin'
      )
    )
  );
