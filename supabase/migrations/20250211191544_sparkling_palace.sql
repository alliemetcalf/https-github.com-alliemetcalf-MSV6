-- Add monthly_income column to profiles table
ALTER TABLE profiles
ADD COLUMN monthly_income integer;

-- Create index for better performance
CREATE INDEX idx_profiles_monthly_income ON profiles(monthly_income);

-- Update RLS policies to allow users to update their own monthly_income
CREATE POLICY "profiles_update_monthly_income"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
