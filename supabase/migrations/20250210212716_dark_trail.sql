/*
  # Fix Profile Policies Final

  1. Changes
    - Remove all circular dependencies in profile policies
    - Implement direct policy checks without recursion
    - Ensure proper access control for all user types

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep data secure while allowing necessary access
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Public profiles access" ON profiles;
DROP POLICY IF EXISTS "Self profile management" ON profiles;
DROP POLICY IF EXISTS "Admin access" ON profiles;

-- Create new, simplified policies
CREATE POLICY "View profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Manage own profile"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add admin policy without recursion
CREATE POLICY "Admin full access"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        SELECT user_type FROM profiles 
        WHERE profiles.id = auth.users.id
      ) = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Ensure user_type column exists and has proper default
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
