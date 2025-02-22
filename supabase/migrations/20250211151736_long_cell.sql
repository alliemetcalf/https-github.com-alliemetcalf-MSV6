-- Drop existing policies
DROP POLICY IF EXISTS "Property owners can update their properties" ON properties;
DROP POLICY IF EXISTS "Property owners can delete their properties" ON properties;
DROP POLICY IF EXISTS "Hosts can manage own rooms" ON rooms;

-- Create new policies that include admin access
CREATE POLICY "Users can update properties"
  ON properties FOR UPDATE
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Users can delete properties"
  ON properties FOR DELETE
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Users can manage rooms"
  ON rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = rooms.property_id
      AND (
        properties.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'admin'
        )
      )
    )
  );

-- Update applications policies to allow admin access
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Property owners can view applications for their rooms" ON applications;

CREATE POLICY "Users can view applications"
  ON applications FOR SELECT
  USING (
    auth.uid() = applicant_id
    OR EXISTS (
      SELECT 1 FROM rooms
      JOIN properties ON rooms.property_id = properties.id
      WHERE rooms.id = applications.room_id
      AND (
        properties.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'admin'
        )
      )
    )
  );

-- Update pre_approvals policies to allow admin access
DROP POLICY IF EXISTS "Users can view their own pre-approvals" ON pre_approvals;
DROP POLICY IF EXISTS "Room owners can view pre-approvals for their rooms" ON pre_approvals;

CREATE POLICY "Users can view pre-approvals"
  ON pre_approvals FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM rooms
      JOIN properties ON rooms.property_id = properties.id
      WHERE rooms.id = pre_approvals.room_id
      AND (
        properties.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'admin'
        )
      )
    )
  );

-- Update profiles policies to allow admin access
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );
