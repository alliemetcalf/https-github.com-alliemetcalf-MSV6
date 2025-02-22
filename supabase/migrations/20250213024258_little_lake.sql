-- Add is_active column to profiles table with default value of true
ALTER TABLE profiles
ADD COLUMN is_active boolean DEFAULT true;

-- Create index for better performance
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- Update RLS policies to consider is_active status
CREATE POLICY "Active users can view profiles"
ON profiles FOR SELECT
USING (
  is_active = true
  OR auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  )
);
