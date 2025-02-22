-- Drop existing foreign key constraint
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_property_id_fkey;

-- Re-create foreign key constraint with ON DELETE CASCADE
ALTER TABLE rooms
ADD CONSTRAINT rooms_property_id_fkey
FOREIGN KEY (property_id)
REFERENCES properties(id)
ON DELETE CASCADE;

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON rooms(property_id);
