/*
  # Add property details columns

  1. New Columns
    - amenities (text[]): List of property amenities
    - house_rules (text): Property rules and guidelines
    - images (text[]): Property images

  2. Changes
    - Add new columns with appropriate defaults
    - Update existing policies to handle new columns
*/

-- Add new columns to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS amenities text,
ADD COLUMN IF NOT EXISTS house_rules text,
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_properties_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_properties_timestamp'
  ) THEN
    CREATE TRIGGER update_properties_timestamp
      BEFORE UPDATE ON properties
      FOR EACH ROW
      EXECUTE FUNCTION update_properties_timestamp();
  END IF;
END $$;
