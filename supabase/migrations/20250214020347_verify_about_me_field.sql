-- First verify if field exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'about_me'
  ) THEN
    -- Add the column if missing
    ALTER TABLE profiles ADD COLUMN about_me text;
    
    -- Add index for performance
    CREATE INDEX IF NOT EXISTS idx_profiles_about_me 
    ON profiles USING gin(to_tsvector('english', about_me));
  END IF;
END $$;

-- Verify RLS policies
DROP POLICY IF EXISTS "Users can update about_me" ON profiles;

CREATE POLICY "Users can update about_me"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
