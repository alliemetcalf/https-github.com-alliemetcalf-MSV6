-- Add vibe_list column to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS vibe_list text[] DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_vibe_list ON properties USING gin(vibe_list);

-- Update existing properties to have empty vibe list
UPDATE properties
SET vibe_list = '{}'
WHERE vibe_list IS NULL;

-- Add comment to explain column usage
COMMENT ON COLUMN properties.vibe_list IS 'Array of property vibes (e.g., Chill, Party, LGBT+ Inclusive, etc.)';
