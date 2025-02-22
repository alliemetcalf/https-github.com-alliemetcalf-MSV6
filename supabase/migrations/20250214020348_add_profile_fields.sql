/*
  # Add missing profile fields and fix indexes

  1. Changes
    - Add missing profile fields
    - Create proper indexes for performance
    - Update existing data with defaults
*/

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Contact preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'allow_calls') THEN
    ALTER TABLE profiles ADD COLUMN allow_calls boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'allow_texts') THEN
    ALTER TABLE profiles ADD COLUMN allow_texts boolean DEFAULT false;
  END IF;

  -- Profile fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'about_me') THEN
    ALTER TABLE profiles ADD COLUMN about_me text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'about_host') THEN
    ALTER TABLE profiles ADD COLUMN about_host text;
  END IF;

  -- Location fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_state') THEN
    ALTER TABLE profiles ADD COLUMN current_state text;
  END IF;

  -- Employment fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'employer') THEN
    ALTER TABLE profiles ADD COLUMN employer text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'occupation') THEN
    ALTER TABLE profiles ADD COLUMN occupation text;
  END IF;
END $$;

-- Create or update indexes for better performance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_about_me') THEN
    CREATE INDEX idx_profiles_about_me ON profiles USING gin(to_tsvector('english', about_me));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_about_host') THEN
    CREATE INDEX idx_profiles_about_host ON profiles USING gin(to_tsvector('english', about_host));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_employer') THEN
    CREATE INDEX idx_profiles_employer ON profiles(employer);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_occupation') THEN
    CREATE INDEX idx_profiles_occupation ON profiles(occupation);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN profiles.about_me IS 'User''s personal description or biography';
COMMENT ON COLUMN profiles.about_host IS 'Host''s description and hosting style';
COMMENT ON COLUMN profiles.employer IS 'Current employer name';
COMMENT ON COLUMN profiles.occupation IS 'Current job title or occupation';

-- Update RLS policies to ensure proper access
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "profiles_update" ON profiles;
  
  -- Create new comprehensive update policy
  CREATE POLICY "profiles_update"
    ON profiles FOR UPDATE
    USING (
      auth.uid() = id
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND user_type = 'admin'
      )
    );
END $$;
