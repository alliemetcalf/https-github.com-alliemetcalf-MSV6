-- Add vibes column to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS vibes text[] DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_vibes ON properties USING gin(vibes);

-- Update existing properties to have empty vibes list
UPDATE properties
SET vibes = '{}'
WHERE vibes IS NULL;

-- Add comment to explain column usage
COMMENT ON COLUMN properties.vibes IS 'Array of property vibes (e.g., Chill, Party, LGBT+ Inclusive, etc.)';
