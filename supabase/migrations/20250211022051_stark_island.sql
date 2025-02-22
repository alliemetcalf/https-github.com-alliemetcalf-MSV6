-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN preferred_name text,
ADD COLUMN price_range_min integer DEFAULT 600,
ADD COLUMN price_range_max integer DEFAULT 1800,
ADD COLUMN current_city text,
ADD COLUMN phone text,
ADD COLUMN desired_move_date date;
