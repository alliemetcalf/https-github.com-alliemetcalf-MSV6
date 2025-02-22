/*
  # Initial Schema for Room Rental App

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - matches auth.users id
      - `email` (text)
      - `full_name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `properties`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references profiles)
      - `address` (text)
      - `total_rooms` (integer)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `rooms`
      - `id` (uuid, primary key)
      - `property_id` (uuid, references properties)
      - `title` (text)
      - `description` (text)
      - `price` (decimal)
      - `images` (text[])
      - `min_income` (decimal)
      - `requires_background_check` (boolean)
      - `available_from` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `applications`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `applicant_id` (uuid, references profiles)
      - `monthly_income` (decimal)
      - `employment_status` (text)
      - `current_address` (text)
      - `phone` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create properties table
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) NOT NULL,
  address text NOT NULL,
  total_rooms integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rooms table
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price decimal NOT NULL,
  images text[] DEFAULT '{}',
  min_income decimal,
  requires_background_check boolean DEFAULT false,
  available_from date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create applications table
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) NOT NULL,
  applicant_id uuid REFERENCES profiles(id) NOT NULL,
  monthly_income decimal NOT NULL,
  employment_status text NOT NULL,
  current_address text NOT NULL,
  phone text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Properties policies
CREATE POLICY "Properties are viewable by everyone"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = owner_id);

-- Rooms policies
CREATE POLICY "Rooms are viewable by everyone"
  ON rooms FOR SELECT
  USING (true);

CREATE POLICY "Property owners can manage rooms"
  ON rooms FOR ALL
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = rooms.property_id
    AND properties.owner_id = auth.uid()
  ));

-- Applications policies
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = applicant_id);

CREATE POLICY "Property owners can view applications for their rooms"
  ON applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rooms
    JOIN properties ON rooms.property_id = properties.id
    WHERE rooms.id = applications.room_id
    AND properties.owner_id = auth.uid()
  ));

CREATE POLICY "Users can submit applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);
