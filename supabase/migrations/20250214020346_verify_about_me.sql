-- First, let's verify the current profile structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles';

-- Check if about_me column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'about_me'
  ) THEN
    -- Add the column if it's missing
    ALTER TABLE profiles ADD COLUMN about_me text;
    
    -- Create index for better performance
    CREATE INDEX idx_profiles_about_me ON profiles USING gin(to_tsvector('english', about_me));
    
    -- Add comment
    COMMENT ON COLUMN profiles.about_me IS 'User''s personal description or biography';
  END IF;
END $$;

-- Verify RLS policies allow updating the field
CREATE POLICY "Users can update about_me"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
