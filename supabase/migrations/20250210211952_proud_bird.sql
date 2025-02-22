/*
  # Add user types and update permissions

  1. Changes
    - Add user_type enum and column to profiles table
    - Update RLS policies for rooms and properties to restrict posting to hosts and admins
    - Add policies for admins to manage all resources

  2. Security
    - Only hosts and admins can post rooms
    - Admins have full access to all resources
    - Regular users and tenants can only view rooms and submit applications
*/

-- Create user type enum
CREATE TYPE user_type AS ENUM ('user', 'tenant', 'host', 'admin');

-- Add user_type column to profiles with default value
ALTER TABLE profiles 
ADD COLUMN user_type user_type NOT NULL DEFAULT 'user';

-- Update existing policies for properties
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;

-- Create new policies for properties
CREATE POLICY "Properties are viewable by everyone"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Hosts can insert own properties"
  ON properties FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type IN ('host', 'admin')
    )
  );

CREATE POLICY "Hosts can update own properties"
  ON properties FOR UPDATE
  USING (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type IN ('host', 'admin')
    )
  );

CREATE POLICY "Admins can manage all properties"
  ON properties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Update existing policies for rooms
DROP POLICY IF EXISTS "Property owners can manage rooms" ON rooms;

-- Create new policies for rooms
CREATE POLICY "Hosts can manage own rooms"
  ON rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties
      JOIN profiles ON properties.owner_id = profiles.id
      WHERE properties.id = rooms.property_id
      AND properties.owner_id = auth.uid()
      AND profiles.user_type IN ('host', 'admin')
    )
  );

CREATE POLICY "Admins can manage all rooms"
  ON rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Add admin management policies for all tables
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage all applications"
  ON applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage all pre_approvals"
  ON pre_approvals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Create function to update user type
CREATE OR REPLACE FUNCTION update_user_type(user_id uuid, new_type user_type)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can update user types';
  END IF;

  -- Update the user type
  UPDATE profiles
  SET user_type = new_type
  WHERE id = user_id;
END;
$$;
