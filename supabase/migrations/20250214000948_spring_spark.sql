-- Create property_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
    CREATE TYPE property_type AS ENUM (
      'House',
      'Duplex/Triplex/Fourplex',
      'Townhouse',
      'Apartment',
      'Manufactured Home',
      'Sober Living Home',
      'Boarding House',
      'Dormitory',
      'Hostel'
    );
  END IF;
END $$;

-- Add property_type column to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS property_type property_type;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);

-- Update existing properties to have a default type
UPDATE properties
SET property_type = 'House'
WHERE property_type IS NULL;
