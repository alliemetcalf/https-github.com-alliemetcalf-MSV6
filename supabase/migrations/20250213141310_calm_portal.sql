-- Update all profiles with complete information
UPDATE profiles
SET
  -- Contact preferences
  allow_calls = COALESCE(allow_calls, false),
  allow_texts = COALESCE(allow_texts, false),
  
  -- Location information
  current_state = COALESCE(current_state, 
    CASE 
      WHEN current_city ILIKE '%San Francisco%' THEN 'CA'
      WHEN current_city ILIKE '%New York%' THEN 'NY'
      ELSE NULL
    END
  ),
  
  -- Employment information
  employer = COALESCE(employer, 
    CASE 
      WHEN user_type = 'tenant' THEN 'Unspecified Employer'
      ELSE NULL
    END
  ),
  occupation = COALESCE(occupation,
    CASE 
      WHEN user_type = 'tenant' THEN 'Unspecified Occupation'
      ELSE NULL
    END
  ),
  
  -- Profile status
  is_active = COALESCE(is_active, true),
  
  -- Ensure preferred name exists
  preferred_name = COALESCE(preferred_name, first_name),
  
  -- Update timestamps
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT id FROM profiles
  WHERE user_type IS NOT NULL
);

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_allow_calls ON profiles(allow_calls);
CREATE INDEX IF NOT EXISTS idx_profiles_allow_texts ON profiles(allow_texts);
CREATE INDEX IF NOT EXISTS idx_profiles_employer ON profiles(employer);
CREATE INDEX IF NOT EXISTS idx_profiles_occupation ON profiles(occupation);
CREATE INDEX IF NOT EXISTS idx_profiles_current_state ON profiles(current_state);
