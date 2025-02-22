-- Drop existing policies
DROP POLICY IF EXISTS "public_profiles_access" ON profiles;
DROP POLICY IF EXISTS "self_profile_insert" ON profiles;
DROP POLICY IF EXISTS "self_profile_update" ON profiles;
DROP POLICY IF EXISTS "self_profile_delete" ON profiles;

-- Create new policies with proper access control
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
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create or update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_name ON profiles(preferred_name);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Update existing profiles to set preferred name if not set
UPDATE profiles 
SET preferred_name = first_name 
WHERE preferred_name IS NULL AND first_name IS NOT NULL;
