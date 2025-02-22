/*
  # Add Sample Users

  1. New Users
    - One host user
    - Two tenant users
  
  2. Changes
    - Create auth users first
    - Insert corresponding profiles with appropriate roles
*/

-- Create auth users first using auth.users table
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES
  -- Host user
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'sarah.host@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  ),
  -- First tenant
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'mike.tenant@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  ),
  -- Second tenant
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    'emily.tenant@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  );

-- Now insert the corresponding profiles
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  full_name,
  user_type,
  about_host,
  created_at,
  updated_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'sarah.host@example.com',
  'Sarah',
  'Johnson',
  'Sarah Johnson',
  'host',
  'I''m a friendly and responsible property manager with over 5 years of experience. I maintain my properties to high standards and respond quickly to tenant needs.',
  now(),
  now()
);

-- Insert first tenant profile
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  full_name,
  user_type,
  current_city,
  monthly_income,
  created_at,
  updated_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d480',
  'mike.tenant@example.com',
  'Mike',
  'Smith',
  'Mike Smith',
  'tenant',
  'San Francisco',
  6500,
  now(),
  now()
);

-- Insert second tenant profile
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  full_name,
  user_type,
  current_city,
  monthly_income,
  created_at,
  updated_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d481',
  'emily.tenant@example.com',
  'Emily',
  'Davis',
  'Emily Davis',
  'tenant',
  'San Francisco',
  5800,
  now(),
  now()
);
