-- Add utilities_included column to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS utilities_included text[] DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_utilities_included ON properties USING gin(utilities_included);

-- Update existing properties to have empty utilities list
UPDATE properties
SET utilities_included = '{}'
WHERE utilities_included IS NULL;

-- Add comment to explain column usage
COMMENT ON COLUMN properties.utilities_included IS 'Array of included utilities (e.g., electricity, water, gas, etc.)';
