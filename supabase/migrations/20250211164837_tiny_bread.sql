/*
  # Add is_advertised column to rooms table

  1. Changes
    - Add is_advertised boolean column to rooms table with default value false
    - Add index for better query performance
*/

-- Add is_advertised column with default value
ALTER TABLE rooms
ADD COLUMN is_advertised boolean DEFAULT false;

-- Create index for better performance
CREATE INDEX idx_rooms_is_advertised ON rooms(is_advertised);
