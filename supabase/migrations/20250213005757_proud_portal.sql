-- Add occupation column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS occupation text;

-- Add allow_calls and allow_texts columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS allow_calls boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_texts boolean DEFAULT false;

-- Add current_state column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_state text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_occupation ON profiles(occupation);
CREATE INDEX IF NOT EXISTS idx_profiles_current_state ON profiles(current_state);

-- Update RLS policies to allow admin access
CREATE POLICY "Admins can edit all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  )
);
