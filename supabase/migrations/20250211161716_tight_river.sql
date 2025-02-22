-- Add property_id column to rooms table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rooms' 
    AND column_name = 'property_id'
  ) THEN
    ALTER TABLE rooms ADD COLUMN property_id uuid REFERENCES properties(id);
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON rooms(property_id);

-- Update RLS policies to ensure property access
CREATE POLICY "Anyone can view property details"
  ON properties FOR SELECT
  USING (true);

-- Ensure property_id is properly linked for all rooms
UPDATE rooms
SET property_id = properties.id
FROM properties
WHERE rooms.property_id IS NULL
AND rooms.id IN (
  SELECT rooms.id
  FROM rooms
  JOIN properties ON rooms.property_id = properties.id
);
