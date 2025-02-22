-- Add amenities_list column to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS amenities_list text[] DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_amenities_list ON properties USING gin(amenities_list);

-- Update existing properties to have empty amenities list
UPDATE properties
SET amenities_list = '{}'
WHERE amenities_list IS NULL;
