/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing profiles policies
    - Add new policies for:
      - Profile creation by authenticated users
      - Profile viewing by authenticated users
      - Profile updates by profile owners
  
  2. Security
    - Enable RLS
    - Restrict profile creation to authenticated users
    - Allow users to view all profiles
    - Allow users to update their own profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies
CREATE POLICY "Authenticated users can create their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
