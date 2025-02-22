-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Basic information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_name') THEN
    ALTER TABLE profiles ADD COLUMN preferred_name text;
  END IF;
  
  -- Contact information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'allow_calls') THEN
    ALTER TABLE profiles ADD COLUMN allow_calls boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'allow_texts') THEN
    ALTER TABLE profiles ADD COLUMN allow_texts boolean DEFAULT false;
  END IF;
  
  -- Location information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_city') THEN
    ALTER TABLE profiles ADD COLUMN current_city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_state') THEN
    ALTER TABLE profiles ADD COLUMN current_state text;
  END IF;
  
  -- Employment information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'monthly_income') THEN
    ALTER TABLE profiles ADD COLUMN monthly_income integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'employer') THEN
    ALTER TABLE profiles ADD COLUMN employer text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'occupation') THEN
    ALTER TABLE profiles ADD COLUMN occupation text;
  END IF;
  
  -- Moving preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'desired_move_date') THEN
    ALTER TABLE profiles ADD COLUMN desired_move_date date;
  END IF;
  
  -- Host information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'about_host') THEN
    ALTER TABLE profiles ADD COLUMN about_host text;
  END IF;
  
  -- Status and type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_type') THEN
    ALTER TABLE profiles ADD COLUMN user_type text DEFAULT 'user';
  END IF;
END $$;

-- Update RLS policies to allow users to update all their profile fields
DROP POLICY IF EXISTS "profiles_update" ON profiles;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_name ON profiles(preferred_name);
CREATE INDEX IF NOT EXISTS idx_profiles_current_city ON profiles(current_city);
CREATE INDEX IF NOT EXISTS idx_profiles_current_state ON profiles(current_state);
CREATE INDEX IF NOT EXISTS idx_profiles_employer ON profiles(employer);
CREATE INDEX IF NOT EXISTS idx_profiles_occupation ON profiles(occupation);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Make first_name required for all profiles
ALTER TABLE profiles ALTER COLUMN first_name SET NOT NULL;
