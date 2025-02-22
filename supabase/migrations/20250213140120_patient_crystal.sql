-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Active users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can edit all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Anyone can view active profiles"
ON profiles FOR SELECT
USING (
  is_active = true
  OR auth.uid() = id
);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin full access"
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
