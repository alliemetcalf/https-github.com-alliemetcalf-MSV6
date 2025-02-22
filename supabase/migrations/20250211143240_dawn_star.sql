/*
  # Fix RLS policies for properties table

  1. Changes
    - Drop existing RLS policies
    - Create new comprehensive RLS policies for properties table
    - Add proper security checks for all operations

  2. Security
    - Allow authenticated users to create properties
    - Allow property owners to manage their properties
    - Maintain public read access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Hosts can insert own properties" ON properties;
DROP POLICY IF EXISTS "Hosts can update own properties" ON properties;
DROP POLICY IF EXISTS "Admins can manage all properties" ON properties;

-- Create new policies
CREATE POLICY "Anyone can view properties"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Property owners can update their properties"
  ON properties FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Property owners can delete their properties"
  ON properties FOR DELETE
  USING (auth.uid() = owner_id);

-- Ensure RLS is enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
