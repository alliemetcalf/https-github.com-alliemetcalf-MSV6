-- Add suspension status columns
ALTER TABLE rooms
ADD COLUMN is_suspended boolean DEFAULT false;

ALTER TABLE properties 
ADD COLUMN is_suspended boolean DEFAULT false;

-- Create indexes for better performance
CREATE INDEX idx_rooms_is_suspended ON rooms(is_suspended);
CREATE INDEX idx_properties_is_suspended ON properties(is_suspended);
