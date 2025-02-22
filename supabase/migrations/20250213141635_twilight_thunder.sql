-- Update all profiles to ensure preferred_name is set
UPDATE profiles
SET
  preferred_name = COALESCE(
    preferred_name,  -- Keep existing preferred_name if it exists
    first_name      -- Otherwise use first_name
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE preferred_name IS NULL
  AND first_name IS NOT NULL;

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_name ON profiles(preferred_name);
