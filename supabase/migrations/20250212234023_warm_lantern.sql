-- Split full_name into first_name and last_name
ALTER TABLE profiles
ADD COLUMN first_name text,
ADD COLUMN last_name text;

-- Update existing records to split full_name into first_name and last_name
UPDATE profiles
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
WHERE full_name IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX idx_profiles_first_name ON profiles(first_name);
CREATE INDEX idx_profiles_last_name ON profiles(last_name);
