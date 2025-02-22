/*
  # Add room-specific pre-approvals

  1. Changes
    - Add `room_id` column to `pre_approvals` table
    - Add foreign key constraint to `rooms` table
    - Add index for faster lookups
    - Update RLS policies to handle room-specific access

  2. Security
    - Maintain existing RLS policies
    - Add new policy for room owners to view pre-approvals
*/

-- Add room_id column
ALTER TABLE pre_approvals
ADD COLUMN room_id uuid REFERENCES rooms(id);

-- Add index for faster lookups
CREATE INDEX pre_approvals_room_id_idx ON pre_approvals(room_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own pre-approvals" ON pre_approvals;
DROP POLICY IF EXISTS "Users can create their own pre-approvals" ON pre_approvals;

-- Create new policies
CREATE POLICY "Users can view their own pre-approvals"
  ON pre_approvals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Room owners can view pre-approvals for their rooms"
  ON pre_approvals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rooms
    JOIN properties ON rooms.property_id = properties.id
    WHERE rooms.id = pre_approvals.room_id
    AND properties.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create their own pre-approvals"
  ON pre_approvals FOR INSERT
  WITH CHECK (auth.uid() = user_id);
