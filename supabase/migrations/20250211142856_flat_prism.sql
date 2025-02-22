/*
  # Add property listing type

  1. Changes
    - Add listing_type to properties table
    - Add listing_price to properties table
    - Add listing_description to properties table
    - Add listing_images to properties table
    - Add listing_available_from to properties table
    - Add listing_status to properties table

  2. Security
    - Update RLS policies to handle property listings
*/

-- Add new columns to properties table
ALTER TABLE properties
ADD COLUMN listing_type text CHECK (listing_type IN ('room', 'property', 'both')),
ADD COLUMN listing_price decimal,
ADD COLUMN listing_description text,
ADD COLUMN listing_images text[] DEFAULT '{}',
ADD COLUMN listing_available_from date,
ADD COLUMN listing_status text DEFAULT 'available' CHECK (listing_status IN ('available', 'pending', 'rented'));

-- Update existing properties to have 'room' listing type
UPDATE properties
SET listing_type = 'room'
WHERE listing_type IS NULL;

-- Make listing_type non-nullable after setting default
ALTER TABLE properties
ALTER COLUMN listing_type SET NOT NULL;

-- Create index for better performance
CREATE INDEX idx_properties_listing_type ON properties(listing_type);
CREATE INDEX idx_properties_listing_status ON properties(listing_status);

-- Update RLS policies
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;

CREATE POLICY "Properties are viewable by everyone"
  ON properties FOR SELECT
  USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_timestamp
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_properties_updated_at();
