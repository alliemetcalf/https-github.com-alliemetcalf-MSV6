-- Add amenities_list column to properties table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'amenities_list'
  ) THEN
    ALTER TABLE properties ADD COLUMN amenities_list text[] DEFAULT '{}';
  END IF;
END $$;

-- Create index for better performance if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'properties' 
    AND indexname = 'idx_properties_amenities_list'
  ) THEN
    CREATE INDEX idx_properties_amenities_list ON properties USING gin(amenities_list);
  END IF;
END $$;

-- Update existing properties to have empty amenities list if null
UPDATE properties
SET amenities_list = '{}'
WHERE amenities_list IS NULL;
